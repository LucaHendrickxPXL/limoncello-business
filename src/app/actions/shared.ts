import "server-only";

import { PoolClient } from "pg";

import { OrderStatus } from "@/lib/types";
import {
  canBookRequestedLiters,
  buildBatchCommitmentErrorMessage,
  formatLitersValue,
} from "@/lib/server/domain/inventory";
import { deriveBatchPrefix, formatBatchNumber, formatOrderNumber } from "@/lib/server/domain/documents";

export function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function assertString(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} is verplicht.`);
  }

  return value.trim();
}

export function assertPositiveNumber(value: number, label: string, allowZero = false) {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} moet een geldig getal zijn.`);
  }

  if (allowZero ? value < 0 : value <= 0) {
    throw new Error(`${label} moet ${allowZero ? "nul of positief" : "groter dan nul"} zijn.`);
  }

  return value;
}

export function calculateSteepingUntil(startedSteepingAt: string, steepDays: number) {
  const base = new Date(`${startedSteepingAt}T00:00:00`);
  const next = new Date(base);
  next.setDate(next.getDate() + steepDays);

  return next.toISOString().slice(0, 10);
}

async function getNextDocumentSequence(
  client: PoolClient,
  scope: string,
  sequenceKey: string,
  baseline = 0,
) {
  const nextValue = baseline + 1;
  const result = await client.query<{ last_value: number }>(
    `insert into document_sequences (scope, sequence_key, last_value)
     values ($1, $2, $3)
     on conflict (scope, sequence_key) do update
       set last_value = greatest(document_sequences.last_value, excluded.last_value - 1) + 1,
           updated_at = now()
     returning last_value`,
    [scope, sequenceKey, nextValue],
  );

  return result.rows[0]?.last_value ?? nextValue;
}

export async function generateBatchNumber(
  client: PoolClient,
  startedSteepingAt: string,
  finishedGoodName: string,
  finishedGoodSku: string | null,
) {
  const prefix = deriveBatchPrefix(finishedGoodName, finishedGoodSku);
  const yearPart = startedSteepingAt.slice(0, 4);
  const result = await client.query<{ highest_sequence: number }>(
    `select coalesce(max(substring(batch_number from '([0-9]+)$')::integer), 0) as highest_sequence
     from batches
     where batch_number like $1
       and batch_number ~ $2`,
    [`${prefix}-${yearPart}-%`, `^${prefix}-${yearPart}-[0-9]+$`],
  );
  const sequence = await getNextDocumentSequence(
    client,
    "batch",
    `${prefix}-${yearPart}`,
    result.rows[0]?.highest_sequence ?? 0,
  );

  return formatBatchNumber(prefix, yearPart, sequence);
}

export async function generateOrderNumber(client: PoolClient, orderedAt: string) {
  const yearPart = orderedAt.slice(0, 4);
  const result = await client.query<{ highest_sequence: number }>(
    `select coalesce(max(substring(order_number from '([0-9]+)$')::integer), 0) as highest_sequence
     from orders
     where order_number like $1`,
    [`ORD-${yearPart}-%`],
  );
  const sequence = await getNextDocumentSequence(
    client,
    "order",
    yearPart,
    result.rows[0]?.highest_sequence ?? 0,
  );

  return formatOrderNumber(yearPart, sequence);
}

export async function getRatioTemplateRecord(client: PoolClient, ratioTemplateId: string) {
  const result = await client.query<{
    id: string;
    name: string;
    finished_good_article_id: string;
    finished_good_article_name: string;
    finished_good_article_sku: string | null;
  }>(
    `select
       rt.id,
       rt.name,
       rt.finished_good_article_id,
       a.name as finished_good_article_name,
       a.sku as finished_good_article_sku
     from ratio_templates rt
     join articles a on a.id = rt.finished_good_article_id
     where rt.id = $1`,
    [ratioTemplateId],
  );

  const template = result.rows[0];

  if (!template) {
    throw new Error("De gekozen ratio template bestaat niet meer.");
  }

  return template;
}

export async function getBatchRecord(client: PoolClient, batchId: string) {
  const result = await client.query<{
    id: string;
    status: string;
    unit_price_per_liter: number;
    finished_good_article_id: string;
  }>(
    `select id, status, unit_price_per_liter, finished_good_article_id
     from batches
     where id = $1`,
    [batchId],
  );

  const batch = result.rows[0];

  if (!batch) {
    throw new Error("De gekozen batch bestaat niet meer.");
  }

  return batch;
}

export async function assertBookableLiters(
  client: PoolClient,
  batchId: string,
  liters: number,
  excludeOrderId?: string,
) {
  const result = await client.query<{ bookable_liters: number }>(
    `with target_batch as (
       select
         b.id,
         case
           when b.actual_produced_liters is not null then b.actual_produced_liters
           else b.expected_output_liters
         end as source_liters
       from batches b
       where b.id = $1
     ),
     ordered as (
       select coalesce(sum(o.ordered_liters), 0) as ordered_liters
       from orders o
       where o.batch_id = $1
         and o.status in ('besteld', 'in_verwerking', 'klaar_voor_uitlevering')
         and ($2::uuid is null or o.id <> $2::uuid)
     ),
     sold as (
       select coalesce(sum(r.liters_sold), 0) as sold_liters
       from revenue_entries r
       where r.batch_id = $1
         and ($2::uuid is null or r.order_id <> $2::uuid)
     )
     select
       (tb.source_liters - ordered.ordered_liters - sold.sold_liters) as bookable_liters
     from target_batch tb
     cross join ordered
     cross join sold`,
    [batchId, excludeOrderId ?? null],
  );

  const bookableLiters = result.rows[0]?.bookable_liters ?? 0;

  if (!canBookRequestedLiters(bookableLiters, liters)) {
    throw new Error(
      "Er kan niet meer besteld of gereserveerd worden dan de verwachte output van deze batch.",
    );
  }
}

export async function assertBatchSourceLitersCanCoverCommitments(
  client: PoolClient,
  batchId: string,
  sourceLiters: number,
) {
  const result = await client.query<{
    ordered_liters: number;
    sold_liters: number;
  }>(
    `with ordered as (
       select coalesce(sum(o.ordered_liters), 0) as ordered_liters
       from orders o
       where o.batch_id = $1
         and o.status in ('besteld', 'in_verwerking', 'klaar_voor_uitlevering')
     ),
     sold as (
       select coalesce(sum(r.liters_sold), 0) as sold_liters
       from revenue_entries r
       where r.batch_id = $1
     )
     select
       ordered.ordered_liters,
       sold.sold_liters
     from ordered
     cross join sold`,
    [batchId],
  );

  const orderedLiters = result.rows[0]?.ordered_liters ?? 0;
  const soldLiters = result.rows[0]?.sold_liters ?? 0;
  const committedLiters = orderedLiters + soldLiters;

  if (sourceLiters >= committedLiters) {
    return;
  }

  throw new Error(buildBatchCommitmentErrorMessage(orderedLiters, soldLiters, committedLiters));
}

export async function writeRevenueEntryForOrder(client: PoolClient, orderId: string) {
  const order = await client.query<{
    id: string;
    batch_id: string;
    customer_id: string;
    ordered_liters: number;
    unit_price_per_liter: number;
    completed_at: string | null;
    ordered_at: string;
    finished_good_article_id: string;
  }>(
    `select
       o.id,
       o.batch_id,
       o.customer_id,
       o.ordered_liters,
       o.unit_price_per_liter,
       o.completed_at::text,
       o.ordered_at::text,
       b.finished_good_article_id
     from orders o
     join batches b on b.id = o.batch_id
     where o.id = $1`,
    [orderId],
  );

  const row = order.rows[0];

  if (!row) {
    throw new Error("Order niet gevonden voor opbrengstregistratie.");
  }

  await client.query(
    `insert into revenue_entries (
       order_id,
       batch_id,
       customer_id,
       finished_good_article_id,
       liters_sold,
       unit_price_per_liter,
       recognized_at
     )
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (order_id) do update
       set batch_id = excluded.batch_id,
           customer_id = excluded.customer_id,
           finished_good_article_id = excluded.finished_good_article_id,
           liters_sold = excluded.liters_sold,
           unit_price_per_liter = excluded.unit_price_per_liter,
           recognized_at = excluded.recognized_at`,
    [
      row.id,
      row.batch_id,
      row.customer_id,
      row.finished_good_article_id,
      row.ordered_liters,
      row.unit_price_per_liter,
      row.completed_at ?? row.ordered_at,
    ],
  );
}

export async function deleteRevenueEntryForOrder(client: PoolClient, orderId: string) {
  await client.query(`delete from revenue_entries where order_id = $1`, [orderId]);
}

export function statusConsumesOutput(status: OrderStatus) {
  return status !== "geannuleerd";
}

export { formatLitersValue };
