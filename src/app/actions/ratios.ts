"use server";

import { revalidatePath } from "next/cache";

import {
  CreateRatioTemplateInput,
  CreateRatioTemplateLineInput,
  UpdateRatioTemplateInput,
} from "@/lib/types";
import { withTransaction } from "@/lib/server/db";
import { assertPositiveNumber, assertString, normalizeOptionalText } from "./shared";

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

export async function updateRatioTemplateAction(input: UpdateRatioTemplateInput) {
  await withTransaction(async (client) => {
    const result = await client.query<{ id: string }>(
      `update ratio_templates
       set name = $2,
           finished_good_article_id = $3,
           base_alcohol_liters = $4,
           expected_output_liters_per_base_alcohol_liter = $5,
           notes = $6,
           updated_at = now()
       where id = $1
       returning id`,
      [
        assertString(input.ratioTemplateId, "Ratio template"),
        assertString(input.name, "Naam"),
        assertString(input.finishedGoodArticleId, "Afgewerkt product"),
        assertPositiveNumber(input.baseAlcoholLiters, "Basis alcohol liters"),
        assertPositiveNumber(
          input.expectedOutputLitersPerBaseAlcoholLiter,
          "Verwachte output per liter alcohol",
        ),
        normalizeOptionalText(input.notes),
      ],
    );

    if (!result.rows[0]) {
      throw new Error("Ratio template niet gevonden.");
    }
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

    await client.query(`update ratio_templates set updated_at = now() where id = $1`, [input.ratioTemplateId]);
  });

  revalidatePath("/");
}

export async function deleteRatioTemplateLineAction(ratioTemplateLineId: string) {
  await withTransaction(async (client) => {
    const removed = await client.query<{
      ratio_template_id: string;
      sort_order: number;
    }>(
      `delete from ratio_template_lines
       where id = $1
       returning ratio_template_id, sort_order`,
      [assertString(ratioTemplateLineId, "Receptregel")],
    );

    const line = removed.rows[0];

    if (!line) {
      throw new Error("Receptregel niet gevonden.");
    }

    await client.query(
      `update ratio_template_lines
       set sort_order = sort_order - 1
       where ratio_template_id = $1
         and sort_order > $2`,
      [line.ratio_template_id, line.sort_order],
    );

    await client.query(`update ratio_templates set updated_at = now() where id = $1`, [line.ratio_template_id]);
  });

  revalidatePath("/");
}
