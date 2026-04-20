"use server";

import { revalidatePath } from "next/cache";
import { PoolClient } from "pg";

import {
  CreateArticleInput,
  CreateBatchInput,
  CreateCustomerInput,
  CreateExpenseInput,
  CreateOrderInput,
  CreateRatioTemplateInput,
  CreateRatioTemplateLineInput,
  OrderStatus,
  UpdateBatchActualProducedInput,
  UpdateBatchStatusInput,
  UpdateOrderStatusInput,
} from "@/lib/types";
import { withTransaction } from "@/lib/server/db";

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function assertString(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} is verplicht.`);
  }

  return value.trim();
}

function assertPositiveNumber(value: number, label: string, allowZero = false) {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} moet een geldig getal zijn.`);
  }

  if (allowZero ? value < 0 : value <= 0) {
    throw new Error(`${label} moet ${allowZero ? "nul of positief" : "groter dan nul"} zijn.`);
  }

  return value;
}

function calculateSteepingUntil(startedSteepingAt: string, steepDays: number) {
  const base = new Date(`${startedSteepingAt}T00:00:00`);
  const next = new Date(base);
  next.setDate(next.getDate() + steepDays);

  return next.toISOString().slice(0, 10);
}

function deriveBatchPrefix(name: string, sku: string | null) {
  const skuCandidate = sku
    ?.split("-")
    .find((part) => /^[a-z]{3,}$/i.test(part) && !/^fg$/i.test(part))
    ?.slice(0, 3)
    .toUpperCase();

  if (skuCandidate) {
    return skuCandidate;
  }

  const normalizedName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const lettersOnly = normalizedName.replace(/[^a-z]/gi, "");

  if (lettersOnly.length >= 3) {
    return lettersOnly.slice(0, 3).toUpperCase();
  }

  return "BAT";
}

async function generateBatchNumber(
  client: PoolClient,
  startedSteepingAt: string,
  finishedGoodName: string,
  finishedGoodSku: string | null,
) {
  const prefix = deriveBatchPrefix(finishedGoodName, finishedGoodSku);
  const yearPart = startedSteepingAt.slice(0, 4);
  const result = await client.query<{ batch_number: string }>(
    `select batch_number
     from batches
     where batch_number like $1`,
    [`${prefix}-${yearPart}-%`],
  );

  const highestSequence = result.rows.reduce((highest, row) => {
    const match = row.batch_number.match(new RegExp(`^${prefix}-${yearPart}-(\\d+)$`, "i"));
    const sequence = match ? Number(match[1]) : 0;
    return Math.max(highest, sequence);
  }, 0);

  return `${prefix}-${yearPart}-${String(highestSequence + 1).padStart(3, "0")}`;
}

async function getRatioTemplateRecord(client: PoolClient, ratioTemplateId: string) {
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

async function getBatchRecord(client: PoolClient, batchId: string) {
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

async function assertAvailableLiters(client: PoolClient, batchId: string, liters: number, excludeOrderId?: string) {
  const result = await client.query<{ available_liters: number }>(
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
     reserved as (
       select coalesce(sum(o.ordered_liters), 0) as reserved_liters
       from orders o
       where o.batch_id = $1
         and o.status in ('in_verwerking', 'klaar_voor_uitlevering')
         and ($2::uuid is null or o.id <> $2::uuid)
     ),
     sold as (
       select coalesce(sum(r.liters_sold), 0) as sold_liters
       from revenue_entries r
       where r.batch_id = $1
         and ($2::uuid is null or r.order_id <> $2::uuid)
     )
     select
       (tb.source_liters - reserved.reserved_liters - sold.sold_liters) as available_liters
     from target_batch tb
     cross join reserved
     cross join sold`,
    [batchId, excludeOrderId ?? null],
  );

  const availableLiters = result.rows[0]?.available_liters ?? 0;

  if (availableLiters < liters) {
    throw new Error("Er is niet genoeg beschikbaar volume in deze batch voor deze status.");
  }
}

async function writeRevenueEntryForOrder(client: PoolClient, orderId: string) {
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

async function deleteRevenueEntryForOrder(client: PoolClient, orderId: string) {
  await client.query(`delete from revenue_entries where order_id = $1`, [orderId]);
}

function statusNeedsCapacity(status: OrderStatus) {
  return status === "in_verwerking" || status === "klaar_voor_uitlevering" || status === "afgerond";
}

export async function createArticleAction(input: CreateArticleInput) {
  await withTransaction(async (client) => {
    await client.query(
      `insert into articles (name, sku, category, default_unit)
       values ($1, $2, $3, $4)`,
      [
        assertString(input.name, "Naam"),
        normalizeOptionalText(input.sku),
        input.category,
        input.defaultUnit,
      ],
    );
  });

  revalidatePath("/");
}

export async function createRatioTemplateAction(input: CreateRatioTemplateInput) {
  await withTransaction(async (client) => {
    await client.query(
      `insert into ratio_templates (
         name,
         finished_good_article_id,
         base_alcohol_liters,
         expected_output_liters_per_base_alcohol_liter,
         notes
       )
       values ($1, $2, $3, $4, $5)`,
      [
        assertString(input.name, "Naam"),
        input.finishedGoodArticleId,
        assertPositiveNumber(input.baseAlcoholLiters, "Basis alcohol liters"),
        assertPositiveNumber(
          input.expectedOutputLitersPerBaseAlcoholLiter,
          "Verwachte output per liter alcohol",
        ),
        normalizeOptionalText(input.notes),
      ],
    );
  });

  revalidatePath("/");
}

export async function createRatioTemplateLineAction(input: CreateRatioTemplateLineInput) {
  await withTransaction(async (client) => {
    const existingSortOrder = await client.query<{ next_sort_order: number }>(
      `select coalesce(max(sort_order), -1) + 1 as next_sort_order
       from ratio_template_lines
       where ratio_template_id = $1`,
      [input.ratioTemplateId],
    );

    await client.query(
      `insert into ratio_template_lines (
         ratio_template_id,
         article_id,
         quantity,
         unit,
         sort_order
       )
       values ($1, $2, $3, $4, $5)`,
      [
        input.ratioTemplateId,
        input.articleId,
        assertPositiveNumber(input.quantity, "Hoeveelheid"),
        input.unit,
        existingSortOrder.rows[0]?.next_sort_order ?? 0,
      ],
    );
  });

  revalidatePath("/");
}

export async function createBatchAction(input: CreateBatchInput) {
  const startedSteepingAt = assertString(input.startedSteepingAt, "Startdatum");
  const steepDays = assertPositiveNumber(input.steepDays, "Trekdagen", true);
  const steepingUntil = calculateSteepingUntil(startedSteepingAt, steepDays);

  await withTransaction(async (client) => {
    const template = await getRatioTemplateRecord(client, input.ratioTemplateId);
    const readyAt = input.status === "ready" ? steepingUntil : null;
    const batchNumber = await generateBatchNumber(
      client,
      startedSteepingAt,
      template.finished_good_article_name,
      template.finished_good_article_sku,
    );

    const created = await client.query<{ id: string }>(
      `insert into batches (
         batch_number,
         started_steeping_at,
         steep_days,
         steeping_until,
         ready_at,
         status,
         finished_good_article_id,
         ratio_template_id,
         ratio_template_name_snapshot,
         alcohol_input_liters,
         expected_output_liters,
         actual_produced_liters,
         unit_price_per_liter,
         notes
       )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, null, $12, $13)
       returning id`,
      [
        batchNumber,
        startedSteepingAt,
        steepDays,
        steepingUntil,
        readyAt,
        input.status,
        template.finished_good_article_id,
        template.id,
        template.name,
        assertPositiveNumber(input.alcoholInputLiters, "Alcohol input"),
        assertPositiveNumber(input.expectedOutputLiters, "Verwachte output"),
        assertPositiveNumber(input.unitPricePerLiter, "Prijs per liter", true),
        normalizeOptionalText(input.notes),
      ],
    );

    await client.query(
      `insert into batch_status_history (batch_id, from_status, to_status, note)
       values ($1, null, $2, $3)`,
      [created.rows[0].id, input.status, "Batch aangemaakt"],
    );
  });

  revalidatePath("/");
}

export async function deleteBatchAction(batchId: string) {
  await withTransaction(async (client) => {
    const linkedOrders = await client.query<{ count: string }>(
      `select count(*)::text as count
       from orders
       where batch_id = $1`,
      [batchId],
    );

    if (Number(linkedOrders.rows[0]?.count ?? 0) > 0) {
      throw new Error("Je kan deze batch niet verwijderen zolang er orders aan gekoppeld zijn.");
    }

    const deleted = await client.query<{ id: string }>(
      `delete from batches
       where id = $1
       returning id`,
      [batchId],
    );

    if (!deleted.rows[0]) {
      throw new Error("Batch niet gevonden.");
    }
  });

  revalidatePath("/");
}

export async function updateBatchStatusAction(input: UpdateBatchStatusInput) {
  await withTransaction(async (client) => {
    const current = await client.query<{ status: string }>(
      `select status from batches where id = $1`,
      [input.batchId],
    );

    const batch = current.rows[0];

    if (!batch) {
      throw new Error("Batch niet gevonden.");
    }

    if (batch.status === input.status) {
      return;
    }

    await client.query(
      `update batches
       set status = $2,
           ready_at = case
             when $2 = 'ready' and ready_at is null then current_date
             else ready_at
           end,
           updated_at = now()
       where id = $1`,
      [input.batchId, input.status],
    );

    await client.query(
      `insert into batch_status_history (batch_id, from_status, to_status, note)
       values ($1, $2, $3, $4)`,
      [input.batchId, batch.status, input.status, normalizeOptionalText(input.note)],
    );
  });

  revalidatePath("/");
}

export async function updateBatchActualProducedAction(input: UpdateBatchActualProducedInput) {
  await withTransaction(async (client) => {
    await client.query(
      `update batches
       set actual_produced_liters = $2,
           updated_at = now()
       where id = $1`,
      [input.batchId, assertPositiveNumber(input.actualProducedLiters, "Effectieve output", true)],
    );
  });

  revalidatePath("/");
}

export async function createCustomerAction(input: CreateCustomerInput) {
  await withTransaction(async (client) => {
    await client.query(
      `insert into customers (first_name, last_name, email, phone, notes)
       values ($1, $2, $3, $4, $5)`,
      [
        assertString(input.firstName, "Voornaam"),
        assertString(input.lastName, "Achternaam"),
        normalizeOptionalText(input.email),
        normalizeOptionalText(input.phone),
        normalizeOptionalText(input.notes),
      ],
    );
  });

  revalidatePath("/");
}

export async function createOrderAction(input: CreateOrderInput) {
  await withTransaction(async (client) => {
    const batch = await getBatchRecord(client, input.batchId);
    const orderedLiters = assertPositiveNumber(input.orderedLiters, "Bestelde liters");

    if (statusNeedsCapacity(input.status)) {
      await assertAvailableLiters(client, input.batchId, orderedLiters);
    }

    const created = await client.query<{ id: string }>(
      `insert into orders (
         order_number,
         customer_id,
         batch_id,
         ordered_liters,
         unit_price_per_liter,
         status,
         ordered_at,
         completed_at,
         notes
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       returning id`,
      [
        assertString(input.orderNumber, "Ordernummer"),
        input.customerId,
        input.batchId,
        orderedLiters,
        batch.unit_price_per_liter,
        input.status,
        assertString(input.orderedAt, "Orderdatum"),
        input.status === "afgerond" ? input.orderedAt : null,
        normalizeOptionalText(input.notes),
      ],
    );

    await client.query(
      `insert into order_status_history (order_id, from_status, to_status, note)
       values ($1, null, $2, $3)`,
      [created.rows[0].id, input.status, "Order aangemaakt"],
    );

    if (input.status === "afgerond") {
      await writeRevenueEntryForOrder(client, created.rows[0].id);
    }
  });

  revalidatePath("/");
}

export async function updateOrderStatusAction(input: UpdateOrderStatusInput) {
  await withTransaction(async (client) => {
    const current = await client.query<{
      id: string;
      status: OrderStatus;
      batch_id: string;
      ordered_liters: number;
    }>(
      `select id, status, batch_id, ordered_liters
       from orders
       where id = $1`,
      [input.orderId],
    );

    const order = current.rows[0];

    if (!order) {
      throw new Error("Order niet gevonden.");
    }

    if (order.status === input.status) {
      return;
    }

    if (statusNeedsCapacity(input.status)) {
      await assertAvailableLiters(client, order.batch_id, order.ordered_liters, order.id);
    }

    await client.query(
      `update orders
       set status = $2,
           completed_at = case when $2 = 'afgerond' then current_date else null end,
           updated_at = now()
       where id = $1`,
      [order.id, input.status],
    );

    await client.query(
      `insert into order_status_history (order_id, from_status, to_status, note)
       values ($1, $2, $3, $4)`,
      [order.id, order.status, input.status, normalizeOptionalText(input.note)],
    );

    if (order.status === "afgerond" && input.status !== "afgerond") {
      await deleteRevenueEntryForOrder(client, order.id);
    }

    if (input.status === "afgerond") {
      await writeRevenueEntryForOrder(client, order.id);
    }
  });

  revalidatePath("/");
}

export async function createExpenseAction(input: CreateExpenseInput) {
  await withTransaction(async (client) => {
    const quantity = input.quantity ?? null;
    const unit = input.unit ?? null;

    if ((quantity === null) !== (unit === null)) {
      throw new Error("Hoeveelheid en eenheid moeten samen ingevuld worden.");
    }

    await client.query(
      `insert into expenses (
         batch_id,
         article_id,
         expense_date,
         quantity,
         unit,
         amount,
         payment_method,
         supplier_name,
         notes
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        input.batchId,
        input.articleId,
        assertString(input.expenseDate, "Kostdatum"),
        quantity === null ? null : assertPositiveNumber(quantity, "Hoeveelheid"),
        unit,
        assertPositiveNumber(input.amount, "Bedrag"),
        input.paymentMethod,
        normalizeOptionalText(input.supplierName),
        normalizeOptionalText(input.notes),
      ],
    );
  });

  revalidatePath("/");
}
