import "server-only";

import {
  Article,
  ArticleReport,
  Batch,
  BatchStatusHistoryItem,
  Customer,
  DashboardSummary,
  Expense,
  Order,
  OrderStatusHistoryItem,
  RatioTemplate,
  RatioTemplateLine,
  RevenueEntry,
  WorkspaceData,
} from "@/lib/types";
import { queryRows } from "./db";

function emptyDashboard(): DashboardSummary {
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

function buildDashboardSummary(batches: Batch[], orders: Order[]): DashboardSummary {
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

function toConnectionMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Onbekende databasefout.";
}

export async function getWorkspaceData(): Promise<WorkspaceData> {
  try {
    const [
      articles,
      ratioTemplates,
      ratioTemplateLines,
      batches,
      batchStatusHistory,
      customers,
      orders,
      orderStatusHistory,
      revenueEntries,
      expenses,
      articleReports,
    ] = await Promise.all([
      queryRows<Article>(
        `select
           id,
           name,
           sku,
           category,
           default_unit as "defaultUnit",
           is_active as "isActive",
           created_at::text as "createdAt",
           updated_at::text as "updatedAt"
         from articles
         order by
           case category
             when 'finished_good' then 0
             when 'ingredient' then 1
             when 'packaging' then 2
             else 3
           end,
           lower(name)`,
      ),
      queryRows<RatioTemplate>(
        `select
           rt.id,
           rt.name,
           rt.finished_good_article_id as "finishedGoodArticleId",
           a.name as "finishedGoodArticleName",
           rt.base_alcohol_liters as "baseAlcoholLiters",
           rt.expected_output_liters_per_base_alcohol_liter as "expectedOutputLitersPerBaseAlcoholLiter",
           rt.notes,
           rt.is_active as "isActive",
           rt.created_at::text as "createdAt",
           rt.updated_at::text as "updatedAt"
         from ratio_templates rt
         join articles a on a.id = rt.finished_good_article_id
         order by lower(rt.name)`,
      ),
      queryRows<RatioTemplateLine>(
        `select
           rtl.id,
           rtl.ratio_template_id as "ratioTemplateId",
           rtl.article_id as "articleId",
           a.name as "articleName",
           rtl.quantity,
           rtl.unit,
           rtl.sort_order as "sortOrder",
           rtl.created_at::text as "createdAt",
           rtl.updated_at::text as "updatedAt"
         from ratio_template_lines rtl
         join articles a on a.id = rtl.article_id
         order by rtl.ratio_template_id, rtl.sort_order asc`,
      ),
      queryRows<Batch>(
        `select
           b.id,
           b.batch_number as "batchNumber",
           b.started_steeping_at::text as "startedSteepingAt",
           b.steep_days as "steepDays",
           b.steeping_until::text as "steepingUntil",
           b.ready_at::text as "readyAt",
           b.status,
           b.finished_good_article_id as "finishedGoodArticleId",
           fg.name as "finishedGoodArticleName",
           b.ratio_template_id as "ratioTemplateId",
           rt.name as "ratioTemplateName",
           b.alcohol_input_liters as "alcoholInputLiters",
           b.expected_output_liters as "expectedOutputLiters",
           b.actual_produced_liters as "actualProducedLiters",
           b.unit_price_per_liter as "unitPricePerLiter",
           bm.reserved_liters as "reservedLiters",
           bm.sold_liters as "soldLiters",
           bm.available_liters as "availableLiters",
           bm.revenue_amount as "revenueAmount",
           bm.cost_amount as "costAmount",
           bm.margin_amount as "marginAmount",
           b.notes,
           b.created_at::text as "createdAt",
           b.updated_at::text as "updatedAt"
         from batches b
         join articles fg on fg.id = b.finished_good_article_id
         join ratio_templates rt on rt.id = b.ratio_template_id
         join batch_metrics_v1 bm on bm.batch_id = b.id
         order by b.created_at desc, b.batch_number desc`,
      ),
      queryRows<BatchStatusHistoryItem>(
        `select
           id,
           batch_id as "batchId",
           from_status as "fromStatus",
           to_status as "toStatus",
           changed_at::text as "changedAt",
           note
         from batch_status_history
         order by changed_at desc`,
      ),
      queryRows<Customer>(
        `select
           id,
           first_name as "firstName",
           last_name as "lastName",
           email,
           phone,
           notes,
           created_at::text as "createdAt",
           updated_at::text as "updatedAt"
         from customers
         order by lower(last_name), lower(first_name)`,
      ),
      queryRows<Order>(
        `select
           o.id,
           o.order_number as "orderNumber",
           o.customer_id as "customerId",
           trim(concat(c.first_name, ' ', c.last_name)) as "customerName",
           o.batch_id as "batchId",
           b.batch_number as "batchNumber",
           fg.name as "finishedGoodArticleName",
           o.ordered_liters as "orderedLiters",
           o.unit_price_per_liter as "unitPricePerLiter",
           o.total_amount as "totalAmount",
           o.status,
           o.ordered_at::text as "orderedAt",
           o.completed_at::text as "completedAt",
           o.notes,
           o.created_at::text as "createdAt",
           o.updated_at::text as "updatedAt"
         from orders o
         join customers c on c.id = o.customer_id
         join batches b on b.id = o.batch_id
         join articles fg on fg.id = b.finished_good_article_id
         order by o.created_at desc, o.order_number desc`,
      ),
      queryRows<OrderStatusHistoryItem>(
        `select
           id,
           order_id as "orderId",
           from_status as "fromStatus",
           to_status as "toStatus",
           changed_at::text as "changedAt",
           note
         from order_status_history
         order by changed_at desc`,
      ),
      queryRows<RevenueEntry>(
        `select
           r.id,
           r.order_id as "orderId",
           o.order_number as "orderNumber",
           r.batch_id as "batchId",
           b.batch_number as "batchNumber",
           r.customer_id as "customerId",
           trim(concat(c.first_name, ' ', c.last_name)) as "customerName",
           r.finished_good_article_id as "finishedGoodArticleId",
           a.name as "finishedGoodArticleName",
           r.liters_sold as "litersSold",
           r.unit_price_per_liter as "unitPricePerLiter",
           r.total_amount as "totalAmount",
           r.recognized_at::text as "recognizedAt",
           r.notes,
           r.created_at::text as "createdAt"
         from revenue_entries r
         join orders o on o.id = r.order_id
         join batches b on b.id = r.batch_id
         join customers c on c.id = r.customer_id
         join articles a on a.id = r.finished_good_article_id
         order by r.recognized_at desc, r.created_at desc`,
      ),
      queryRows<Expense>(
        `select
           e.id,
           e.batch_id as "batchId",
           b.batch_number as "batchNumber",
           e.article_id as "articleId",
           a.name as "articleName",
           e.expense_date::text as "expenseDate",
           e.quantity,
           e.unit,
           e.amount,
           e.payment_method as "paymentMethod",
           e.supplier_name as "supplierName",
           e.notes,
           e.created_at::text as "createdAt",
           e.updated_at::text as "updatedAt"
         from expenses e
         join batches b on b.id = e.batch_id
         join articles a on a.id = e.article_id
         order by e.expense_date desc, e.created_at desc`,
      ),
      queryRows<ArticleReport>(
        `select
           article_id as "articleId",
           name,
           category,
           default_unit as "defaultUnit",
           total_purchased_quantity as "totalPurchasedQuantity",
           total_purchase_amount as "totalPurchaseAmount",
           total_sold_quantity as "totalSoldQuantity",
           total_sales_amount as "totalSalesAmount"
         from article_reporting_v1
         order by
           case category
             when 'finished_good' then 0
             when 'ingredient' then 1
             when 'packaging' then 2
             else 3
           end,
           lower(name)`,
      ),
    ]);

    return {
      connectionError: null,
      articles,
      ratioTemplates,
      ratioTemplateLines,
      batches,
      batchStatusHistory,
      customers,
      orders,
      orderStatusHistory,
      revenueEntries,
      expenses,
      articleReports,
      dashboard: buildDashboardSummary(batches, orders),
    };
  } catch (error) {
    return {
      connectionError: toConnectionMessage(error),
      articles: [],
      ratioTemplates: [],
      ratioTemplateLines: [],
      batches: [],
      batchStatusHistory: [],
      customers: [],
      orders: [],
      orderStatusHistory: [],
      revenueEntries: [],
      expenses: [],
      articleReports: [],
      dashboard: emptyDashboard(),
    };
  }
}
