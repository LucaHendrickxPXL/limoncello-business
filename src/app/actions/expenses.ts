"use server";

import { revalidatePath } from "next/cache";

import { CreateExpenseInput } from "@/lib/types";
import { withTransaction } from "@/lib/server/db";
import { assertPositiveNumber, assertString, normalizeOptionalText } from "./shared";

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
