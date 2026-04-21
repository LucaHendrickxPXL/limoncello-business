import test from "node:test";
import assert from "node:assert/strict";

import { buildDashboardSummary, emptyDashboard } from "../src/lib/server/domain/dashboard.ts";
import type { Batch, Order } from "../src/lib/types.ts";

test("emptyDashboard returns a zeroed summary", () => {
  assert.deepEqual(emptyDashboard(), {
    activeBatchCount: 0,
    readyBatchCount: 0,
    totalAvailableLiters: 0,
    totalReservedLiters: 0,
    totalSoldLiters: 0,
    totalRevenueAmount: 0,
    totalCostAmount: 0,
    totalMarginAmount: 0,
    ordersInProgressCount: 0,
    ordersReadyCount: 0,
    completedOrderCount: 0,
  });
});

test("buildDashboardSummary aggregates stock, money and order statuses", () => {
  const batches = [
    {
      status: "ready",
      availableLiters: 12,
      reservedLiters: 4,
      soldLiters: 6,
      revenueAmount: 180,
      costAmount: 90,
      marginAmount: 90,
    },
    {
      status: "steeping",
      availableLiters: 8,
      reservedLiters: 1,
      soldLiters: 0,
      revenueAmount: 0,
      costAmount: 25,
      marginAmount: -25,
    },
    {
      status: "archived",
      availableLiters: 0,
      reservedLiters: 0,
      soldLiters: 3,
      revenueAmount: 75,
      costAmount: 35,
      marginAmount: 40,
    },
  ] as unknown as Batch[];

  const orders = [
    { status: "in_verwerking" },
    { status: "klaar_voor_uitlevering" },
    { status: "afgerond" },
    { status: "besteld" },
  ] as unknown as Order[];

  assert.deepEqual(buildDashboardSummary(batches, orders), {
    activeBatchCount: 2,
    readyBatchCount: 1,
    totalAvailableLiters: 20,
    totalReservedLiters: 5,
    totalSoldLiters: 9,
    totalRevenueAmount: 255,
    totalCostAmount: 150,
    totalMarginAmount: 105,
    ordersInProgressCount: 1,
    ordersReadyCount: 1,
    completedOrderCount: 1,
  });
});
