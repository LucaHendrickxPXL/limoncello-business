import {
  AppView,
  ArticleCategory,
  BatchStatus,
  OrderStatus,
  PaymentMethod,
  Unit,
} from "./types";

export const PRIMARY_VIEWS: Array<{ value: AppView; label: string }> = [
  { value: "home", label: "Home" },
  { value: "batches", label: "Batches" },
  { value: "orders", label: "Orders" },
  { value: "expenses", label: "Kosten" },
  { value: "revenue", label: "Opbrengsten" },
  { value: "dashboard", label: "Dashboard" },
];

export const SECONDARY_VIEWS: Array<{ value: AppView; label: string }> = [
  { value: "customers", label: "Klanten" },
  { value: "ratios", label: "Ratio templates" },
  { value: "articles", label: "Artikelen" },
];

export const ARTICLE_CATEGORY_OPTIONS: Array<{ value: ArticleCategory; label: string }> = [
  { value: "ingredient", label: "Ingredient" },
  { value: "packaging", label: "Verpakking" },
  { value: "finished_good", label: "Afgewerkt product" },
  { value: "other", label: "Overig" },
];

export const UNIT_OPTIONS: Array<{ value: Unit; label: string }> = [
  { value: "l", label: "L" },
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "st", label: "st" },
];

export const BATCH_STATUS_OPTIONS: Array<{ value: BatchStatus; label: string }> = [
  { value: "draft", label: "Concept" },
  { value: "steeping", label: "Aan het trekken" },
  { value: "ready", label: "Klaar" },
  { value: "sold_out", label: "Uitverkocht" },
  { value: "archived", label: "Archief" },
];

export const ORDER_STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: "besteld", label: "Besteld" },
  { value: "in_verwerking", label: "In verwerking" },
  { value: "klaar_voor_uitlevering", label: "Klaar voor uitlevering" },
  { value: "afgerond", label: "Afgerond" },
  { value: "geannuleerd", label: "Geannuleerd" },
];

export const PAYMENT_METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "cash", label: "Cash" },
  { value: "overschrijving", label: "Overschrijving" },
];

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatLiters(value: number) {
  return `${new Intl.NumberFormat("nl-BE", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  }).format(value)} L`;
}

export function formatShortDate(value: string | null | undefined) {
  if (!value) {
    return "Niet ingevuld";
  }

  const normalizedDatePart = value.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  const date = normalizedDatePart ? new Date(`${normalizedDatePart}T00:00:00Z`) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Niet ingevuld";
  }

  return new Intl.DateTimeFormat("nl-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function getDaysUntil(value: string) {
  const start = new Date();
  const current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const target = new Date(`${value}T00:00:00Z`);
  const diff = target.getTime() - current.getTime();

  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export function getBatchStatusColor(status: BatchStatus) {
  switch (status) {
    case "draft":
      return "gray";
    case "steeping":
      return "yellow";
    case "ready":
      return "teal";
    case "sold_out":
      return "orange";
    case "archived":
      return "grape";
    default:
      return "gray";
  }
}

export function getOrderStatusColor(status: OrderStatus) {
  switch (status) {
    case "besteld":
      return "gray";
    case "in_verwerking":
      return "yellow";
    case "klaar_voor_uitlevering":
      return "blue";
    case "afgerond":
      return "teal";
    case "geannuleerd":
      return "red";
    default:
      return "gray";
  }
}

export function formatBatchStatus(status: BatchStatus) {
  return BATCH_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status;
}

export function formatOrderStatus(status: OrderStatus) {
  return ORDER_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status;
}

export function formatArticleCategory(category: ArticleCategory) {
  return ARTICLE_CATEGORY_OPTIONS.find((item) => item.value === category)?.label ?? category;
}

export function formatPaymentMethod(paymentMethod: PaymentMethod) {
  return PAYMENT_METHOD_OPTIONS.find((item) => item.value === paymentMethod)?.label ?? paymentMethod;
}
