"use server";

import { revalidatePath } from "next/cache";

import { CreateCustomerInput, UpdateCustomerInput } from "@/lib/types";
import { withTransaction } from "@/lib/server/db";
import { assertString, normalizeOptionalText } from "./shared";

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

export async function updateCustomerAction(input: UpdateCustomerInput) {
  await withTransaction(async (client) => {
    const result = await client.query<{ id: string }>(
      `update customers
       set first_name = $2,
           last_name = $3,
           email = $4,
           phone = $5,
           notes = $6,
           updated_at = now()
       where id = $1
       returning id`,
      [
        assertString(input.customerId, "Klant"),
        assertString(input.firstName, "Voornaam"),
        assertString(input.lastName, "Achternaam"),
        normalizeOptionalText(input.email),
        normalizeOptionalText(input.phone),
        normalizeOptionalText(input.notes),
      ],
    );

    if (!result.rows[0]) {
      throw new Error("Klant niet gevonden.");
    }
  });

  revalidatePath("/");
}
