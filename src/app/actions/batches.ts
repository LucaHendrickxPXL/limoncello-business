"use server";

import { revalidatePath } from "next/cache";

import {
  BatchStatus,
  CreateBatchInput,
  UpdateBatchActualProducedInput,
  UpdateBatchInput,
  UpdateBatchStatusInput,
} from "@/lib/types";
import { withTransaction } from "@/lib/server/db";
import {
  assertBatchSourceLitersCanCoverCommitments,
  assertPositiveNumber,
  assertString,
  calculateSteepingUntil,
  generateBatchNumber,
  getRatioTemplateRecord,
  normalizeOptionalText,
} from "./shared";

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

export async function updateBatchAction(input: UpdateBatchInput) {
  const batchId = assertString(input.batchId, "Batch");
  const startedSteepingAt = assertString(input.startedSteepingAt, "Startdatum");
  const steepDays = assertPositiveNumber(input.steepDays, "Trekdagen", true);
  const steepingUntil = calculateSteepingUntil(startedSteepingAt, steepDays);
  const ratioTemplateId = assertString(input.ratioTemplateId, "Ratio template");
  const expectedOutputLiters = assertPositiveNumber(input.expectedOutputLiters, "Verwachte output");
  const alcoholInputLiters = assertPositiveNumber(input.alcoholInputLiters, "Alcohol input");
  const unitPricePerLiter = assertPositiveNumber(input.unitPricePerLiter, "Prijs per liter", true);

  await withTransaction(async (client) => {
    const currentResult = await client.query<{
      id: string;
      status: BatchStatus;
      ratio_template_id: string;
      expected_output_liters: number;
      actual_produced_liters: number | null;
    }>(
      `select
         id,
         status,
         ratio_template_id,
         expected_output_liters,
         actual_produced_liters
       from batches
       where id = $1`,
      [batchId],
    );

    const current = currentResult.rows[0];

    if (!current) {
      throw new Error("Batch niet gevonden.");
    }

    const nextTemplate = await getRatioTemplateRecord(client, ratioTemplateId);
    const currentSourceLiters = current.actual_produced_liters ?? current.expected_output_liters;
    const nextSourceLiters = current.actual_produced_liters ?? expectedOutputLiters;

    if (nextSourceLiters < currentSourceLiters) {
      await assertBatchSourceLitersCanCoverCommitments(client, batchId, nextSourceLiters);
    }

    if (current.ratio_template_id !== ratioTemplateId) {
      const linkedOrders = await client.query<{ count: string }>(
        `select count(*)::text as count
         from orders
         where batch_id = $1`,
        [batchId],
      );

      if (Number(linkedOrders.rows[0]?.count ?? 0) > 0) {
        throw new Error(
          "Je kan het ratio template van een batch met gekoppelde orders niet meer aanpassen.",
        );
      }
    }

    await client.query(
      `update batches
       set started_steeping_at = $2,
           steep_days = $3,
           steeping_until = $4,
           ready_at = case
             when $5 = 'ready' then coalesce(ready_at, $4::date)
             else ready_at
           end,
           status = $5,
           finished_good_article_id = $6,
           ratio_template_id = $7,
           ratio_template_name_snapshot = $8,
           alcohol_input_liters = $9,
           expected_output_liters = $10,
           unit_price_per_liter = $11,
           notes = $12,
           updated_at = now()
       where id = $1`,
      [
        batchId,
        startedSteepingAt,
        steepDays,
        steepingUntil,
        input.status,
        nextTemplate.finished_good_article_id,
        nextTemplate.id,
        nextTemplate.name,
        alcoholInputLiters,
        expectedOutputLiters,
        unitPricePerLiter,
        normalizeOptionalText(input.notes),
      ],
    );

    if (current.status !== input.status) {
      await client.query(
        `insert into batch_status_history (batch_id, from_status, to_status, note)
         values ($1, $2, $3, $4)`,
        [batchId, current.status, input.status, "Batch aangepast"],
      );
    }
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
  const batchId = assertString(input.batchId, "Batch");
  const actualProducedLiters = assertPositiveNumber(input.actualProducedLiters, "Effectieve output", true);

  await withTransaction(async (client) => {
    const current = await client.query<{ id: string }>(
      `select id
       from batches
       where id = $1`,
      [batchId],
    );

    if (!current.rows[0]) {
      throw new Error("Batch niet gevonden.");
    }

    await assertBatchSourceLitersCanCoverCommitments(client, batchId, actualProducedLiters);

    await client.query(
      `update batches
       set actual_produced_liters = $2,
           updated_at = now()
       where id = $1`,
      [batchId, actualProducedLiters],
    );
  });

  revalidatePath("/");
}
