import type { Batch, DashboardSummary, Order } from "../../types.ts";

export function emptyDashboard(): DashboardSummary {
  return {
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
  };
}

export function buildDashboardSummary(batches: Batch[], orders: Order[]): DashboardSummary {
  return {
    activeBatchCount: batches.filter((batch) => batch.status !== "archived").length,
    readyBatchCount: batches.filter((batch) => batch.status === "ready").length,
    totalAvailableLiters: batches.reduce((sum, batch) => sum + batch.availableLiters, 0),
    totalReservedLiters: batches.reduce((sum, batch) => sum + batch.reservedLiters, 0),
    totalSoldLiters: batches.reduce((sum, batch) => sum + batch.soldLiters, 0),
    totalRevenueAmount: batches.reduce((sum, batch) => sum + batch.revenueAmount, 0),
    totalCostAmount: batches.reduce((sum, batch) => sum + batch.costAmount, 0),
    totalMarginAmount: batches.reduce((sum, batch) => sum + batch.marginAmount, 0),
    ordersInProgressCount: orders.filter((order) => order.status === "in_verwerking").length,
    ordersReadyCount: orders.filter((order) => order.status === "klaar_voor_uitlevering").length,
    completedOrderCount: orders.filter((order) => order.status === "afgerond").length,
  };
}
