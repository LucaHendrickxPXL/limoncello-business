"use server";

import { revalidatePath } from "next/cache";

import { CreateArticleInput, UpdateArticleInput } from "@/lib/types";
import { withTransaction } from "@/lib/server/db";
import { assertString, normalizeOptionalText } from "./shared";

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

export async function updateArticleAction(input: UpdateArticleInput) {
  await withTransaction(async (client) => {
    const result = await client.query<{ id: string }>(
      `update articles
       set name = $2,
           sku = $3,
           category = $4,
           default_unit = $5,
           updated_at = now()
       where id = $1
       returning id`,
      [
        assertString(input.articleId, "Artikel"),
        assertString(input.name, "Naam"),
        normalizeOptionalText(input.sku),
        input.category,
        input.defaultUnit,
      ],
    );

    if (!result.rows[0]) {
      throw new Error("Artikel niet gevonden.");
    }
  });

  revalidatePath("/");
}
