"use client";

import {
  Batch,
  BatchStatus,
  CreateArticleInput,
  CreateBatchInput,
  OrderStatus,
  PaymentMethod,
  Unit,
  WorkspaceData,
} from "@/lib/types";
import { formatBatchStatus, formatLiters } from "@/lib/ui";

export type ArticleFormState = {
  name: string;
  sku: string;
  category: CreateArticleInput["category"];
  defaultUnit: CreateArticleInput["defaultUnit"];
};

export type EditorMode = "create" | "edit";

export type CustomerFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
};

export type RatioFormState = {
  name: string;
  finishedGoodArticleId: string;
  baseAlcoholLiters: string;
  expectedOutputLitersPerBaseAlcoholLiter: string;
  notes: string;
};

export type RatioLineFormState = {
  ratioTemplateId: string;
  articleId: string;
  quantity: string;
  unit: Unit;
};

export type RevenueInsightsPanel = "analysis" | "batch_breakdown";

export type BatchFormState = {
  startedSteepingAt: string;
  steepDays: string;
  status: BatchStatus;
  ratioTemplateId: string;
  alcoholInputLiters: string;
  expectedOutputLiters: string;
  unitPricePerLiter: string;
  notes: string;
};

export type OrderFormState = {
  orderNumber: string;
  customerId: string;
  batchId: string;
  orderedLiters: string;
  status: OrderStatus;
  orderedAt: string;
  notes: string;
};

export type ExpenseFormState = {
  batchId: string;
  articleId: string;
  expenseDate: string;
  quantity: string;
  unit: Unit;
  amount: string;
  paymentMethod: PaymentMethod;
  supplierName: string;
  notes: string;
};

export type BatchWorkspaceMode = "overview" | "create" | "detail";
export type OrderWorkspaceMode = "overview" | "create" | "detail";
export type ArticleWorkspaceMode = "overview" | "detail";
export type ArticleDetailPanel = "recipe_usage" | "expense_registrations";
export type CustomerWorkspaceMode = "overview" | "detail";
export type RatioWorkspaceMode = "overview" | "detail";

export type EditorCopy = {
  title: Record<EditorMode, string>;
  submit: Record<EditorMode, string>;
  success: Record<EditorMode, string>;
  subtitle?: Record<EditorMode, string>;
};

export type CustomerSummary = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  updatedAt: string;
  latestActivityAt: string;
  orderCount: number;
  completedOrderCount: number;
  openOrderCount: number;
  reservedOrderCount: number;
  totalOrderedLiters: number;
  totalOrderedAmount: number;
  revenueAmount: number;
  marginAmount: number;
  litersSold: number;
  revenueBookingCount: number;
};

export const ARTICLE_EDITOR_COPY: EditorCopy = {
  title: { create: "Nieuw artikel", edit: "Artikel aanpassen" },
  submit: { create: "Artikel aanmaken", edit: "Artikel opslaan" },
  success: { create: "Artikel opgeslagen", edit: "Artikel bijgewerkt" },
};

export const CUSTOMER_EDITOR_COPY: EditorCopy = {
  title: { create: "Nieuwe klant", edit: "Klant aanpassen" },
  submit: { create: "Klant aanmaken", edit: "Klant opslaan" },
  success: { create: "Klant opgeslagen", edit: "Klant bijgewerkt" },
};

export const RATIO_EDITOR_COPY: EditorCopy = {
  title: { create: "Nieuw ratio template", edit: "Ratio template aanpassen" },
  submit: { create: "Template aanmaken", edit: "Template opslaan" },
  success: { create: "Ratio template opgeslagen", edit: "Ratio template bijgewerkt" },
};

export const BATCH_EDITOR_COPY: EditorCopy = {
  title: { create: "Nieuwe batch", edit: "Batch aanpassen" },
  submit: { create: "Batch aanmaken", edit: "Batch opslaan" },
  success: { create: "Batch opgeslagen", edit: "Batch bijgewerkt" },
  subtitle: {
    create: "Batchnummer volgt automatisch. Kies recept, output en startmoment.",
    edit: "Werk recept, output of planning bij zonder de batchhistoriek te verliezen.",
  },
};

export const ORDER_EDITOR_COPY: EditorCopy = {
  title: { create: "Nieuw order", edit: "Order aanpassen" },
  submit: { create: "Order aanmaken", edit: "Order opslaan" },
  success: { create: "Order opgeslagen", edit: "Order bijgewerkt" },
  subtitle: {
    create: "Kies klant, batch, volume en status.",
    edit: "Corrigeer klant, batch, volume of status zonder de orderhistoriek te verliezen.",
  },
};

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function firstOrEmpty<T extends { id: string }>(items: T[]) {
  return items[0]?.id ?? "";
}

export function buildEmptyArticleForm(): ArticleFormState {
  return {
    name: "",
    sku: "",
    category: "ingredient",
    defaultUnit: "l",
  };
}

export function buildEmptyCustomerForm(): CustomerFormState {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  };
}

export function buildEmptyRatioForm(data: WorkspaceData): RatioFormState {
  return {
    name: "",
    finishedGoodArticleId:
      data.articles.find((article) => article.category === "finished_good")?.id ?? "",
    baseAlcoholLiters: "1",
    expectedOutputLitersPerBaseAlcoholLiter: "2.8",
    notes: "",
  };
}

export function buildRatioFormStateFromTemplate(
  template: WorkspaceData["ratioTemplates"][number],
): RatioFormState {
  return {
    name: template.name,
    finishedGoodArticleId: template.finishedGoodArticleId,
    baseAlcoholLiters: String(template.baseAlcoholLiters),
    expectedOutputLitersPerBaseAlcoholLiter: String(
      template.expectedOutputLitersPerBaseAlcoholLiter,
    ),
    notes: template.notes ?? "",
  };
}

export function buildBatchFormState(data: WorkspaceData): BatchFormState {
  return {
    startedSteepingAt: getTodayIsoDate(),
    steepDays: "14",
    status: "steeping",
    ratioTemplateId: firstOrEmpty(data.ratioTemplates),
    alcoholInputLiters: "1",
    expectedOutputLiters: data.ratioTemplates[0]
      ? String(data.ratioTemplates[0].expectedOutputLitersPerBaseAlcoholLiter)
      : "",
    unitPricePerLiter: "24",
    notes: "",
  };
}

export function buildBatchFormStateFromBatch(batch: WorkspaceData["batches"][number]): BatchFormState {
  return {
    startedSteepingAt: batch.startedSteepingAt,
    steepDays: String(batch.steepDays),
    status: batch.status,
    ratioTemplateId: batch.ratioTemplateId,
    alcoholInputLiters: String(batch.alcoholInputLiters),
    expectedOutputLiters: String(batch.expectedOutputLiters),
    unitPricePerLiter: String(batch.unitPricePerLiter),
    notes: batch.notes ?? "",
  };
}

export function buildOrderFormState(data: WorkspaceData, preferredBatchId?: string | null): OrderFormState {
  return {
    orderNumber: "",
    customerId: firstOrEmpty(data.customers),
    batchId: preferredBatchId ?? getDefaultBatchId(data),
    orderedLiters: "1",
    status: "besteld",
    orderedAt: getTodayIsoDate(),
    notes: "",
  };
}

export function buildOrderFormStateFromOrder(order: WorkspaceData["orders"][number]): OrderFormState {
  return {
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    batchId: order.batchId,
    orderedLiters: String(order.orderedLiters),
    status: order.status,
    orderedAt: order.orderedAt,
    notes: order.notes ?? "",
  };
}

export function sortBatchesNewToOld(batches: Batch[]) {
  return [...batches].sort(
    (left, right) =>
      right.startedSteepingAt.localeCompare(left.startedSteepingAt) ||
      right.createdAt.localeCompare(left.createdAt) ||
      right.batchNumber.localeCompare(left.batchNumber),
  );
}

export function formatBatchSelectLabel(batch: Batch) {
  return `${batch.batchNumber} - ${formatBatchStatus(batch.status)} - ${batch.finishedGoodArticleName}`;
}

export function getDefaultBatchId(data: WorkspaceData) {
  return firstOrEmpty(sortBatchesNewToOld(data.batches));
}

export function orderStatusReservesBatchCapacity(status: OrderStatus) {
  return status === "in_verwerking" || status === "klaar_voor_uitlevering";
}

export function getOrderReservationCopy(status: OrderStatus, liters: number) {
  if (orderStatusReservesBatchCapacity(status)) {
    return `${formatLiters(liters)} gereserveerd`;
  }

  if (status === "afgerond") {
    return `${formatLiters(liters)} verkocht`;
  }

  if (status === "geannuleerd") {
    return "Reservatie vrijgegeven";
  }

  return "Nog niet gereserveerd";
}

export function buildExpenseFormState(
  data: WorkspaceData,
  preferredBatchId?: string | null,
): ExpenseFormState {
  const defaultArticleId = firstOrEmpty(data.articles);
  const defaultArticle = data.articles.find((article) => article.id === defaultArticleId);

  return {
    batchId: preferredBatchId ?? getDefaultBatchId(data),
    articleId: defaultArticleId,
    expenseDate: getTodayIsoDate(),
    quantity: "",
    unit: defaultArticle?.defaultUnit ?? "l",
    amount: "",
    paymentMethod: "cash",
    supplierName: "",
    notes: "",
  };
}

export function getEditorCopy(copy: EditorCopy, mode: EditorMode) {
  return {
    title: copy.title[mode],
    submit: copy.submit[mode],
    success: copy.success[mode],
    subtitle: copy.subtitle?.[mode],
  };
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Er ging iets mis.";
}

export function buildBatchRecommendations(batch: Batch) {
  if (batch.availableLiters <= 2) {
    return "Bijna leeg";
  }

  if (!batch.actualProducedLiters) {
    return "Output open";
  }

  if (batch.status === "ready") {
    return "Klaar voor orders";
  }

  return "Rustig";
}

export function getMarginToneColor(amount: number | null) {
  if (amount === null || Number.isNaN(amount)) {
    return "gray";
  }

  if (amount > 0) {
    return "teal";
  }

  if (amount < 0) {
    return "red";
  }

  return "gray";
}

export function getMarginToneClass(amount: number | null) {
  if (amount === null || Number.isNaN(amount) || amount === 0) {
    return "margin-tone-neutral";
  }

  return amount > 0 ? "margin-tone-positive" : "margin-tone-negative";
}

export function getCustomerSummaryTone(summary: CustomerSummary) {
  if (summary.revenueAmount > 0) {
    return "teal";
  }

  if (summary.openOrderCount > 0) {
    return "orange";
  }

  return "gray";
}
