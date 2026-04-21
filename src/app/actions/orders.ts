"use server";

import { revalidatePath } from "next/cache";

import {
  CreateOrderInput,
  OrderStatus,
  UpdateOrderInput,
  UpdateOrderStatusInput,
} from "@/lib/types";
import { withTransaction } from "@/lib/server/db";
import {
  assertBookableLiters,
  assertPositiveNumber,
  assertString,
  deleteRevenueEntryForOrder,
  generateOrderNumber,
  getBatchRecord,
  normalizeOptionalText,
  statusConsumesOutput,
  writeRevenueEntryForOrder,
} from "./shared";

export async function createOrderAction(input: CreateOrderInput) {
  const customerId = assertString(input.customerId, "Klant");
  const batchId = assertString(input.batchId, "Batch");
  const orderedAt = assertString(input.orderedAt, "Orderdatum");

  await withTransaction(async (client) => {
    const batch = await getBatchRecord(client, batchId);
    const orderedLiters = assertPositiveNumber(input.orderedLiters, "Bestelde liters");
    const orderNumber = await generateOrderNumber(client, orderedAt);

    if (statusConsumesOutput(input.status)) {
      await assertBookableLiters(client, batchId, orderedLiters);
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
        orderNumber,
        customerId,
        batchId,
        orderedLiters,
        batch.unit_price_per_liter,
        input.status,
        orderedAt,
        input.status === "afgerond" ? orderedAt : null,
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

export async function updateOrderAction(input: UpdateOrderInput) {
  const orderId = assertString(input.orderId, "Order");
  const customerId = assertString(input.customerId, "Klant");
  const batchId = assertString(input.batchId, "Batch");
  const orderedAt = assertString(input.orderedAt, "Orderdatum");
  const orderNumber = assertString(input.orderNumber, "Ordernummer");

  await withTransaction(async (client) => {
    const currentResult = await client.query<{
      id: string;
      status: OrderStatus;
      batch_id: string;
      unit_price_per_liter: number;
    }>(
      `select
         id,
         status,
         batch_id,
         unit_price_per_liter
       from orders
       where id = $1`,
      [orderId],
    );

    const current = currentResult.rows[0];

    if (!current) {
      throw new Error("Order niet gevonden.");
    }

    const batch = await getBatchRecord(client, batchId);
    const orderedLiters = assertPositiveNumber(input.orderedLiters, "Bestelde liters");

    if (statusConsumesOutput(input.status)) {
      await assertBookableLiters(client, batchId, orderedLiters, orderId);
    }

    await client.query(
      `update orders
       set order_number = $2,
           customer_id = $3,
           batch_id = $4,
           ordered_liters = $5,
           unit_price_per_liter = $6,
           status = $7,
           ordered_at = $8,
           completed_at = case
             when $7 = 'afgerond' then coalesce(completed_at, current_date)
             else null
           end,
           notes = $9,
           updated_at = now()
       where id = $1`,
      [
        orderId,
        orderNumber,
        customerId,
        batchId,
        orderedLiters,
        current.batch_id === batchId ? current.unit_price_per_liter : batch.unit_price_per_liter,
        input.status,
        orderedAt,
        normalizeOptionalText(input.notes),
      ],
    );

    if (current.status !== input.status) {
      await client.query(
        `insert into order_status_history (order_id, from_status, to_status, note)
         values ($1, $2, $3, $4)`,
        [orderId, current.status, input.status, "Order aangepast"],
      );
    }

    if (current.status === "afgerond" && input.status !== "afgerond") {
      await deleteRevenueEntryForOrder(client, orderId);
    }

    if (input.status === "afgerond") {
      await writeRevenueEntryForOrder(client, orderId);
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

    if (statusConsumesOutput(input.status)) {
      await assertBookableLiters(client, order.batch_id, order.ordered_liters, order.id);
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
