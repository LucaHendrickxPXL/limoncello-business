"use client";

import {
  Alert,
  ActionIcon,
  AppShell,
  Box,
  Burger,
  Button,
  Card,
  Divider,
  Drawer,
  Grid,
  Group,
  NativeSelect,
  ScrollArea,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconChartBar,
  IconBottle,
  IconChevronDown,
  IconChevronUp,
  IconHome2,
  IconInfoCircle,
  IconReceipt2,
  IconShoppingBag,
  IconTrash,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  logoutAction,
} from "@/app/auth-actions";
import {
  createArticleAction,
  createBatchAction,
  createCustomerAction,
  deleteBatchAction,
  createExpenseAction,
  createOrderAction,
  createRatioTemplateAction,
  createRatioTemplateLineAction,
  updateBatchActualProducedAction,
  updateBatchStatusAction,
  updateOrderStatusAction,
} from "@/app/actions";
import {
  AppView,
  Batch,
  BatchStatus,
  CreateArticleInput,
  CreateBatchInput,
  CreateCustomerInput,
  CreateExpenseInput,
  CreateOrderInput,
  CreateRatioTemplateInput,
  CreateRatioTemplateLineInput,
  OrderStatus,
  PaymentMethod,
  Unit,
  WorkspaceData,
} from "@/lib/types";
import {
  ARTICLE_CATEGORY_OPTIONS,
  BATCH_STATUS_OPTIONS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  formatBatchStatus,
  formatArticleCategory,
  formatOrderStatus,
  formatPaymentMethod,
  PRIMARY_VIEWS,
  SECONDARY_VIEWS,
  UNIT_OPTIONS,
  formatCurrency,
  formatShortDate,
  formatLiters,
  getBatchStatusColor,
  getOrderStatusColor,
} from "@/lib/ui";
import {
  DetailRow,
  EmptyState,
  InfoLabel,
  MetricCard,
  SectionCard,
  SelectableCard,
  ToneBadge,
} from "./workspace-primitives";
import { useThemeMode } from "@/app/providers";

type ArticleFormState = {
  name: string;
  sku: string;
  category: CreateArticleInput["category"];
  defaultUnit: CreateArticleInput["defaultUnit"];
};

type CustomerFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
};

type RatioFormState = {
  name: string;
  finishedGoodArticleId: string;
  baseAlcoholLiters: string;
  expectedOutputLitersPerBaseAlcoholLiter: string;
  notes: string;
};

type RatioLineFormState = {
  ratioTemplateId: string;
  articleId: string;
  quantity: string;
  unit: Unit;
};

type RevenueInsightsPanel = "analysis" | "batch_breakdown";

type BatchFormState = {
  startedSteepingAt: string;
  steepDays: string;
  status: BatchStatus;
  ratioTemplateId: string;
  alcoholInputLiters: string;
  expectedOutputLiters: string;
  unitPricePerLiter: string;
  notes: string;
};

type OrderFormState = {
  orderNumber: string;
  customerId: string;
  batchId: string;
  orderedLiters: string;
  status: OrderStatus;
  orderedAt: string;
  notes: string;
};

type ExpenseFormState = {
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

type BatchWorkspaceMode = "overview" | "create" | "detail";
type OrderWorkspaceMode = "overview" | "create" | "detail";
type ArticleWorkspaceMode = "overview" | "detail";
type ArticleDetailPanel = "recipe_usage" | "expense_registrations";
type CustomerWorkspaceMode = "overview" | "detail";
type RatioWorkspaceMode = "overview" | "detail";

/* batch detail tabs removed
  details: {
    title: "Batchdetails",
    description: "Recept, timing en commerciële context van deze productie.",
  },
  orders: {
    title: "Gekoppelde orders",
    description: "Zie welke verkoop al op deze batch steunt en wat nog openstaat.",
  },
  costs: {
    title: "Batchkosten",
    description: "Alle kosten die deze batch dragen, van alcohol tot verpakking.",
  },
  revenue: {
    title: "Opbrengst",
    description: "Omzet die effectief op deze batch werd gerealiseerd.",
  },
  history: {
    title: "Historiek",
    description: "Belangrijkste statusmomenten en recente bewegingen op deze batch.",
  },
*/

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function firstOrEmpty<T extends { id: string }>(items: T[]) {
  return items[0]?.id ?? "";
}

function sortBatchesNewToOld(batches: Batch[]) {
  return [...batches].sort(
    (left, right) =>
      right.startedSteepingAt.localeCompare(left.startedSteepingAt) ||
      right.createdAt.localeCompare(left.createdAt) ||
      right.batchNumber.localeCompare(left.batchNumber),
  );
}

function formatBatchSelectLabel(batch: Batch) {
  return `${batch.batchNumber} · ${formatBatchStatus(batch.status)} · ${batch.finishedGoodArticleName}`;
}

function getDefaultBatchId(data: WorkspaceData) {
  return firstOrEmpty(sortBatchesNewToOld(data.batches));
}

function buildExpenseFormState(data: WorkspaceData, preferredBatchId?: string | null): ExpenseFormState {
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Er ging iets mis.";
}

function buildBatchRecommendations(batch: Batch) {
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

function getMarginToneColor(amount: number | null) {
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

function getMarginToneClass(amount: number | null) {
  if (amount === null || Number.isNaN(amount) || amount === 0) {
    return "margin-tone-neutral";
  }

  return amount > 0 ? "margin-tone-positive" : "margin-tone-negative";
}

export function LimoncelloWorkspace({
  data,
  initialView,
}: {
  data: WorkspaceData;
  initialView: AppView;
}) {
  const router = useRouter();
  const { colorScheme, setColorScheme } = useThemeMode();
  const databaseUnavailable = Boolean(data.connectionError);
  const [activeView, setActiveView] = useState<AppView>(initialView);
  const [mobileNavOpened, setMobileNavOpened] = useState(false);
  const [accountShelfOpened, setAccountShelfOpened] = useState(false);
  const [batchWorkspaceMode, setBatchWorkspaceMode] = useState<BatchWorkspaceMode>(
    data.batches.length > 0 ? "overview" : "create",
  );
  const [orderWorkspaceMode, setOrderWorkspaceMode] = useState<OrderWorkspaceMode>(
    data.orders.length > 0 ? "overview" : "create",
  );
  const [selectedBatchId, setSelectedBatchId] = useState(getDefaultBatchId(data));
  const [selectedOrderId, setSelectedOrderId] = useState(firstOrEmpty(data.orders));
  const [selectedExpenseId, setSelectedExpenseId] = useState(firstOrEmpty(data.expenses));
  const [selectedRevenueEntryId, setSelectedRevenueEntryId] = useState(firstOrEmpty(data.revenueEntries));
  const [revenueInsightsPanel, setRevenueInsightsPanel] = useState<RevenueInsightsPanel>("analysis");
  const [selectedArticleId, setSelectedArticleId] = useState(firstOrEmpty(data.articles));
  const [articleWorkspaceMode, setArticleWorkspaceMode] = useState<ArticleWorkspaceMode>("overview");
  const [articleDetailPanel, setArticleDetailPanel] = useState<ArticleDetailPanel>("recipe_usage");
  const [selectedCustomerId, setSelectedCustomerId] = useState(firstOrEmpty(data.customers));
  const [customerWorkspaceMode, setCustomerWorkspaceMode] = useState<CustomerWorkspaceMode>("overview");
  const [selectedRatioTemplateId, setSelectedRatioTemplateId] = useState(firstOrEmpty(data.ratioTemplates));
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [showArchivedBatches, setShowArchivedBatches] = useState(false);
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
  const [showCompletedOrders, setShowCompletedOrders] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [revenueSearchQuery, setRevenueSearchQuery] = useState("");
  const [ratioTemplateSearchQuery, setRatioTemplateSearchQuery] = useState("");
  const [articleSearchQuery, setArticleSearchQuery] = useState("");
  const [articleCreateOpened, setArticleCreateOpened] = useState(false);
  const [expenseCreateOpened, setExpenseCreateOpened] = useState(false);
  const [customerCreateOpened, setCustomerCreateOpened] = useState(false);
  const [ratioTemplateCreateOpened, setRatioTemplateCreateOpened] = useState(false);
  const [ratioLineCreateOpened, setRatioLineCreateOpened] = useState(false);
  const [ratioWorkspaceMode, setRatioWorkspaceMode] = useState<RatioWorkspaceMode>("overview");
  const [ordersBatchFilterId, setOrdersBatchFilterId] = useState<string | null>(null);
  const [expensesBatchFilterId, setExpensesBatchFilterId] = useState<string | null>(null);
  const [revenueBatchFilterId, setRevenueBatchFilterId] = useState<string | null>(null);
  const [articleForm, setArticleForm] = useState<ArticleFormState>({
    name: "",
    sku: "",
    category: "ingredient",
    defaultUnit: "l",
  });
  const [customerForm, setCustomerForm] = useState<CustomerFormState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [ratioForm, setRatioForm] = useState<RatioFormState>({
    name: "",
    finishedGoodArticleId:
      data.articles.find((article) => article.category === "finished_good")?.id ?? "",
    baseAlcoholLiters: "1",
    expectedOutputLitersPerBaseAlcoholLiter: "2.8",
    notes: "",
  });
  const [ratioLineForm, setRatioLineForm] = useState<RatioLineFormState>({
    ratioTemplateId: firstOrEmpty(data.ratioTemplates),
    articleId: firstOrEmpty(data.articles),
    quantity: "",
    unit: data.articles[0]?.defaultUnit ?? "l",
  });
  const [batchForm, setBatchForm] = useState<BatchFormState>({
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
  });
  const [orderForm, setOrderForm] = useState<OrderFormState>({
    orderNumber: "",
    customerId: firstOrEmpty(data.customers),
    batchId: getDefaultBatchId(data),
    orderedLiters: "1",
    status: "besteld",
    orderedAt: getTodayIsoDate(),
    notes: "",
  });
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(() => buildExpenseFormState(data));
  const [batchActualProducedInputs, setBatchActualProducedInputs] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        data.batches.map((batch) => [batch.id, batch.actualProducedLiters?.toString() ?? ""]),
      ),
  );

  useEffect(() => {
    if (!data.batches.some((batch) => batch.id === selectedBatchId)) {
      setSelectedBatchId(getDefaultBatchId(data));
    }
    if (!data.orders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(firstOrEmpty(data.orders));
    }
    if (!data.expenses.some((expense) => expense.id === selectedExpenseId)) {
      setSelectedExpenseId(firstOrEmpty(data.expenses));
    }
    if (!data.revenueEntries.some((entry) => entry.id === selectedRevenueEntryId)) {
      setSelectedRevenueEntryId(firstOrEmpty(data.revenueEntries));
    }
    if (!data.articles.some((article) => article.id === selectedArticleId)) {
      setSelectedArticleId(firstOrEmpty(data.articles));
    }
    if (!data.customers.some((customer) => customer.id === selectedCustomerId)) {
      setSelectedCustomerId(firstOrEmpty(data.customers));
    }
    if (!data.ratioTemplates.some((template) => template.id === selectedRatioTemplateId)) {
      setSelectedRatioTemplateId(firstOrEmpty(data.ratioTemplates));
    }
  }, [
    data,
    selectedArticleId,
    selectedBatchId,
    selectedCustomerId,
    selectedExpenseId,
    selectedOrderId,
    selectedRatioTemplateId,
    selectedRevenueEntryId,
  ]);

  useEffect(() => {
    if (data.batches.length === 0) {
      setBatchWorkspaceMode("create");
    }
  }, [data.batches.length]);

  useEffect(() => {
    if (data.orders.length === 0) {
      setOrderWorkspaceMode("create");
    }
  }, [data.orders.length]);

  useEffect(() => {
    const nextVisibleOrders = ordersBatchFilterId
      ? data.orders.filter((order) => order.batchId === ordersBatchFilterId)
      : data.orders;

    if (!nextVisibleOrders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(firstOrEmpty(nextVisibleOrders));
    }
  }, [data.orders, ordersBatchFilterId, selectedOrderId]);

  useEffect(() => {
    if (orderWorkspaceMode === "detail" && !data.orders.some((order) => order.id === selectedOrderId)) {
      setOrderWorkspaceMode(data.orders.length > 0 ? "overview" : "create");
    }
  }, [data.orders, orderWorkspaceMode, selectedOrderId]);

  useEffect(() => {
    setBatchActualProducedInputs(
      Object.fromEntries(
        data.batches.map((batch) => [batch.id, batch.actualProducedLiters?.toString() ?? ""]),
      ),
    );
  }, [data.batches]);

  useEffect(() => {
    if (!noticeMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setNoticeMessage(null);
    }, 5_000);

    return () => window.clearTimeout(timeout);
  }, [noticeMessage]);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setErrorMessage(null);
    }, 5_000);

    return () => window.clearTimeout(timeout);
  }, [errorMessage]);

  async function runAction(label: string, callback: () => Promise<void>, onSuccess?: () => void) {
    setPendingAction(label);
    setErrorMessage(null);
    setNoticeMessage(null);

    try {
      await callback();
      onSuccess?.();
      setNoticeMessage(label);
      router.refresh();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  function resetBatchActualProducedInput(batch: Batch) {
    setBatchActualProducedInputs((current) => ({
      ...current,
      [batch.id]: batch.actualProducedLiters?.toString() ?? "",
    }));
  }

  async function commitBatchActualProduced(batch: Batch) {
    const rawValue = (batchActualProducedInputs[batch.id] ?? "").trim().replace(",", ".");

    if (!rawValue) {
      resetBatchActualProducedInput(batch);
      return;
    }

    const parsedValue = Number(rawValue);

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      setErrorMessage("Effectieve output moet nul of positief zijn.");
      resetBatchActualProducedInput(batch);
      return;
    }

    if (batch.actualProducedLiters !== null && parsedValue === batch.actualProducedLiters) {
      resetBatchActualProducedInput(batch);
      return;
    }

    await runAction("Effectieve output bijgewerkt", () =>
      updateBatchActualProducedAction({
        batchId: batch.id,
        actualProducedLiters: parsedValue,
      }),
    );
  }

  const lowAvailabilityBatches = data.batches.filter((batch) => batch.availableLiters <= 2);
  const batchesMissingActualOutput = data.batches.filter((batch) => batch.actualProducedLiters === null);
  const archivedBatchCount = data.batches.filter((batch) => batch.status === "archived").length;
  const visibleBatches = sortBatchesNewToOld(
    showArchivedBatches
      ? data.batches
      : data.batches.filter((batch) => batch.status !== "archived"),
  );
  const batchSearchTerm = batchSearchQuery.trim().toLocaleLowerCase();
  const filteredVisibleBatches = batchSearchTerm
    ? visibleBatches.filter((batch) =>
        [
          batch.batchNumber,
          batch.finishedGoodArticleName,
          batch.ratioTemplateName,
          formatBatchStatus(batch.status),
          batch.notes ?? "",
        ]
          .join(" ")
          .toLocaleLowerCase()
          .includes(batchSearchTerm),
      )
    : visibleBatches;
  const visibleBatchesMissingActualOutput = batchesMissingActualOutput.filter(
    (batch) => showArchivedBatches || batch.status !== "archived",
  );
  const visibleAvailableLiters = visibleBatches.reduce(
    (sum, batch) => sum + batch.availableLiters,
    0,
  );
  const ordersReadyForDelivery = data.orders.filter((order) => order.status === "klaar_voor_uitlevering");
  const negativeMarginBatches = [...data.batches]
    .filter((batch) => batch.marginAmount < 0)
    .sort((left, right) => left.marginAmount - right.marginAmount);
  const dashboardSignals = [
    ...negativeMarginBatches.slice(0, 3).map((batch) => ({
      id: `signal-margin-${batch.id}`,
      title: `${batch.batchNumber} onder water`,
      subtitle: `${batch.finishedGoodArticleName} · ${formatCurrency(batch.marginAmount)}`,
      badge: <ToneBadge color="red" label="Marge" />,
      meta: `${formatCurrency(batch.costAmount)} kosten · ${formatCurrency(batch.revenueAmount)} omzet`,
      onClick: () => openBatch(batch.id),
    })),
    ...lowAvailabilityBatches.slice(0, 3).map((batch) => ({
      id: `signal-stock-${batch.id}`,
      title: `${batch.batchNumber} bijna leeg`,
      subtitle: `${batch.finishedGoodArticleName} · ${formatLiters(batch.availableLiters)} beschikbaar`,
      badge: <ToneBadge color="orange" label="Voorraad" />,
      meta: `${formatLiters(batch.soldLiters)} verkocht · ${formatCurrency(batch.revenueAmount)} omzet`,
      onClick: () => openBatch(batch.id),
    })),
    ...ordersReadyForDelivery.slice(0, 3).map((order) => ({
      id: `signal-order-${order.id}`,
      title: `${order.orderNumber} klaar voor uitlevering`,
      subtitle: `${order.customerName} · ${order.batchNumber}`,
      badge: <ToneBadge color="blue" label="Order" />,
      meta: `${formatLiters(order.orderedLiters)} · ${formatCurrency(order.totalAmount)}`,
      onClick: () => openOrder(order.id),
    })),
    ...batchesMissingActualOutput.slice(0, 3).map((batch) => ({
      id: `signal-output-${batch.id}`,
      title: `${batch.batchNumber} mist effectieve output`,
      subtitle: `${batch.finishedGoodArticleName} · ${formatLiters(batch.expectedOutputLiters)} verwacht`,
      badge: <ToneBadge color="yellow" label="Output" />,
      meta: "Werk de echte output bij om marges correct te lezen.",
      onClick: () => openBatch(batch.id),
    })),
  ].slice(0, 10);
  const selectedBatch = data.batches.find((item) => item.id === selectedBatchId) ?? null;
  const selectedBatchOrders = data.orders
    .filter((order) => order.batchId === selectedBatchId)
    .sort((left, right) => right.orderedAt.localeCompare(left.orderedAt));
  const selectedBatchExpenses = data.expenses
    .filter((expense) => expense.batchId === selectedBatchId)
    .sort((left, right) => right.expenseDate.localeCompare(left.expenseDate));
  const selectedBatchRevenue = data.revenueEntries
    .filter((entry) => entry.batchId === selectedBatchId)
    .sort((left, right) => right.recognizedAt.localeCompare(left.recognizedAt));
  const selectedBatchHistory = data.batchStatusHistory
    .filter((item) => item.batchId === selectedBatchId)
    .sort((left, right) => right.changedAt.localeCompare(left.changedAt));
  const filteredOrders = [
    ...(ordersBatchFilterId
      ? data.orders.filter((order) => order.batchId === ordersBatchFilterId)
      : data.orders),
  ].sort((left, right) => right.orderedAt.localeCompare(left.orderedAt));
  const orderSearchTerm = orderSearchQuery.trim().toLocaleLowerCase();
  const visibleOrders = filteredOrders.filter(
    (order) => showCompletedOrders || order.status !== "afgerond",
  );
  const searchedVisibleOrders = orderSearchTerm
    ? visibleOrders.filter((order) =>
        [
          order.orderNumber,
          order.customerName,
          order.batchNumber,
          order.finishedGoodArticleName,
          formatOrderStatus(order.status),
          order.notes ?? "",
        ]
          .join(" ")
          .toLocaleLowerCase()
          .includes(orderSearchTerm),
      )
    : visibleOrders;
  const filteredExpenses = [
    ...(expensesBatchFilterId
      ? data.expenses.filter((expense) => expense.batchId === expensesBatchFilterId)
      : data.expenses),
  ].sort((left, right) => right.expenseDate.localeCompare(left.expenseDate));
  const filteredRevenueEntries = [
    ...(revenueBatchFilterId
      ? data.revenueEntries.filter((entry) => entry.batchId === revenueBatchFilterId)
      : data.revenueEntries),
  ].sort((left, right) => right.recognizedAt.localeCompare(left.recognizedAt));
  const revenueSearchTerm = revenueSearchQuery.trim().toLocaleLowerCase();
  const searchedRevenueEntries = revenueSearchTerm
    ? filteredRevenueEntries.filter((entry) =>
        [entry.orderNumber, entry.batchNumber, entry.customerName]
          .join(" ")
          .toLocaleLowerCase()
          .includes(revenueSearchTerm),
      )
    : filteredRevenueEntries;
  const filteredRevenueAmount = filteredRevenueEntries.reduce((sum, entry) => sum + entry.totalAmount, 0);
  const filteredRevenueLiters = filteredRevenueEntries.reduce((sum, entry) => sum + entry.litersSold, 0);
  const filteredRevenueAverageOrderValue =
    filteredRevenueEntries.length > 0 ? filteredRevenueAmount / filteredRevenueEntries.length : null;
  const filteredRevenueAveragePricePerLiter =
    filteredRevenueLiters > 0 ? filteredRevenueAmount / filteredRevenueLiters : null;
  const revenueTotalsByBatch = Array.from(
    filteredRevenueEntries
      .reduce<
        Map<
          string,
          {
            batchId: string;
            batchNumber: string;
            finishedGoodArticleName: string;
            totalAmount: number;
            litersSold: number;
            bookings: number;
          }
        >
      >((totals, entry) => {
        const current = totals.get(entry.batchId);
        totals.set(entry.batchId, {
          batchId: entry.batchId,
          batchNumber: entry.batchNumber,
          finishedGoodArticleName: entry.finishedGoodArticleName,
          totalAmount: (current?.totalAmount ?? 0) + entry.totalAmount,
          litersSold: (current?.litersSold ?? 0) + entry.litersSold,
          bookings: (current?.bookings ?? 0) + 1,
        });

        return totals;
      }, new Map())
      .values(),
  ).sort((left, right) => right.totalAmount - left.totalAmount);
  const revenueTotalsByCustomer = Array.from(
    filteredRevenueEntries
      .reduce<
        Map<
          string,
          {
            customerId: string;
            customerName: string;
            totalAmount: number;
            litersSold: number;
            bookings: number;
          }
        >
      >((totals, entry) => {
        const current = totals.get(entry.customerId);
        totals.set(entry.customerId, {
          customerId: entry.customerId,
          customerName: entry.customerName,
          totalAmount: (current?.totalAmount ?? 0) + entry.totalAmount,
          litersSold: (current?.litersSold ?? 0) + entry.litersSold,
          bookings: (current?.bookings ?? 0) + 1,
        });

        return totals;
      }, new Map())
      .values(),
  ).sort((left, right) => right.totalAmount - left.totalAmount);
  const ordersFilterBatch =
    data.batches.find((batch) => batch.id === ordersBatchFilterId) ?? null;
  const expensesFilterBatch =
    data.batches.find((batch) => batch.id === expensesBatchFilterId) ?? null;
  const revenueFilterBatch =
    data.batches.find((batch) => batch.id === revenueBatchFilterId) ?? null;
  const topRevenueBatch = revenueTotalsByBatch[0] ?? null;
  const topRevenueCustomer = revenueTotalsByCustomer[0] ?? null;
  const customerOrderStats = data.orders.reduce<
    Map<
      string,
      {
        orderCount: number;
        completedOrderCount: number;
        openOrderCount: number;
        totalOrderedLiters: number;
        totalOrderedAmount: number;
        lastOrderAt: string | null;
      }
    >
  >((totals, order) => {
    const current = totals.get(order.customerId);
    const relevantMoment = order.completedAt ?? order.orderedAt;
    const currentLastOrderAt = current?.lastOrderAt ?? null;

    totals.set(order.customerId, {
      orderCount: (current?.orderCount ?? 0) + 1,
      completedOrderCount: (current?.completedOrderCount ?? 0) + (order.status === "afgerond" ? 1 : 0),
      openOrderCount:
        (current?.openOrderCount ?? 0) +
        (order.status !== "afgerond" && order.status !== "geannuleerd" ? 1 : 0),
      totalOrderedLiters: (current?.totalOrderedLiters ?? 0) + order.orderedLiters,
      totalOrderedAmount: (current?.totalOrderedAmount ?? 0) + order.totalAmount,
      lastOrderAt:
        currentLastOrderAt && currentLastOrderAt.localeCompare(relevantMoment) > 0
          ? currentLastOrderAt
          : relevantMoment,
    });

    return totals;
  }, new Map());
  const customerRevenueStats = data.revenueEntries.reduce<
    Map<
      string,
      {
        revenueAmount: number;
        litersSold: number;
        bookingCount: number;
        lastRecognizedAt: string | null;
      }
    >
  >((totals, entry) => {
    const current = totals.get(entry.customerId);
    const currentLastRecognizedAt = current?.lastRecognizedAt ?? null;

    totals.set(entry.customerId, {
      revenueAmount: (current?.revenueAmount ?? 0) + entry.totalAmount,
      litersSold: (current?.litersSold ?? 0) + entry.litersSold,
      bookingCount: (current?.bookingCount ?? 0) + 1,
      lastRecognizedAt:
        currentLastRecognizedAt && currentLastRecognizedAt.localeCompare(entry.recognizedAt) > 0
          ? currentLastRecognizedAt
          : entry.recognizedAt,
    });

    return totals;
  }, new Map());
  const customerSummaries = data.customers
    .map((customer) => {
      const orderStats = customerOrderStats.get(customer.id);
      const revenueStats = customerRevenueStats.get(customer.id);
      const fullName = `${customer.firstName} ${customer.lastName}`.trim();
      const latestActivityAt =
        [customer.updatedAt, orderStats?.lastOrderAt ?? null, revenueStats?.lastRecognizedAt ?? null]
          .filter((value): value is string => Boolean(value))
          .sort((left, right) => right.localeCompare(left))[0] ?? customer.updatedAt;

      return {
        id: customer.id,
        fullName,
        email: customer.email,
        phone: customer.phone,
        notes: customer.notes,
        updatedAt: customer.updatedAt,
        latestActivityAt,
        orderCount: orderStats?.orderCount ?? 0,
        completedOrderCount: orderStats?.completedOrderCount ?? 0,
        openOrderCount: orderStats?.openOrderCount ?? 0,
        totalOrderedLiters: orderStats?.totalOrderedLiters ?? 0,
        totalOrderedAmount: orderStats?.totalOrderedAmount ?? 0,
        revenueAmount: revenueStats?.revenueAmount ?? 0,
        litersSold: revenueStats?.litersSold ?? 0,
        revenueBookingCount: revenueStats?.bookingCount ?? 0,
      };
    })
    .sort(
      (left, right) =>
        right.latestActivityAt.localeCompare(left.latestActivityAt) ||
        right.revenueAmount - left.revenueAmount ||
        right.orderCount - left.orderCount ||
        left.fullName.localeCompare(right.fullName),
    );
  const customerSearchTerm = customerSearchQuery.trim().toLocaleLowerCase();
  const searchedCustomerSummaries = customerSearchTerm
    ? customerSummaries.filter((customer) => customer.fullName.toLocaleLowerCase().includes(customerSearchTerm))
    : customerSummaries;
  const selectedBatchTemplate =
    data.ratioTemplates.find((template) => template.id === batchForm.ratioTemplateId) ?? null;
  const selectedOrder = data.orders.find((item) => item.id === selectedOrderId) ?? null;
  const selectedOrderHistory = data.orderStatusHistory
    .filter((item) => item.orderId === selectedOrderId)
    .sort((left, right) => right.changedAt.localeCompare(left.changedAt));
  const selectedOrderBatch = data.batches.find((batch) => batch.id === orderForm.batchId) ?? null;
  const selectedOrderDetailBatch =
    data.batches.find((batch) => batch.id === selectedOrder?.batchId) ?? null;
  const selectedExpense = filteredExpenses.find((expense) => expense.id === selectedExpenseId) ?? null;
  const selectedRevenueEntry =
    searchedRevenueEntries.find((entry) => entry.id === selectedRevenueEntryId) ??
    filteredRevenueEntries.find((entry) => entry.id === selectedRevenueEntryId) ??
    null;
  const selectedRevenueOrder =
    data.orders.find((order) => order.id === selectedRevenueEntry?.orderId) ?? null;
  const selectedRevenueBatchDetail =
    data.batches.find((batch) => batch.id === selectedRevenueEntry?.batchId) ?? null;
  const selectedArticle = data.articles.find((item) => item.id === selectedArticleId) ?? null;
  const selectedArticleReport =
    data.articleReports.find((report) => report.articleId === selectedArticleId) ?? null;
  const selectedCustomer = data.customers.find((item) => item.id === selectedCustomerId) ?? null;
  const selectedCustomerSummary =
    customerSummaries.find((customer) => customer.id === selectedCustomerId) ?? null;
  const selectedRevenueCustomer =
    data.customers.find((customer) => customer.id === selectedRevenueEntry?.customerId) ?? null;
  const selectedCustomerOrders = data.orders
    .filter((order) => order.customerId === selectedCustomerId)
    .sort(
      (left, right) =>
        (right.completedAt ?? right.orderedAt).localeCompare(left.completedAt ?? left.orderedAt),
    );
  const selectedCustomerRevenueEntries = data.revenueEntries
    .filter((entry) => entry.customerId === selectedCustomerId)
    .sort((left, right) => right.recognizedAt.localeCompare(left.recognizedAt));
  const selectedArticleRatioLines = data.ratioTemplateLines
    .filter((line) => line.articleId === selectedArticleId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const selectedArticleExpenses = data.expenses
    .filter((expense) => expense.articleId === selectedArticleId)
    .sort((left, right) => right.expenseDate.localeCompare(left.expenseDate));
  const selectedArticleBatches = data.batches
    .filter((batch) => batch.finishedGoodArticleId === selectedArticleId)
    .sort((left, right) => right.startedSteepingAt.localeCompare(left.startedSteepingAt));
  const selectedArticleBatchIds = new Set(selectedArticleBatches.map((batch) => batch.id));
  const selectedArticleOrders = data.orders
    .filter((order) => selectedArticleBatchIds.has(order.batchId))
    .sort((left, right) => (right.completedAt ?? right.orderedAt).localeCompare(left.completedAt ?? left.orderedAt));
  const selectedArticleRevenueEntries = data.revenueEntries
    .filter((entry) => entry.finishedGoodArticleId === selectedArticleId)
    .sort((left, right) => right.recognizedAt.localeCompare(left.recognizedAt));
  const selectedRatioTemplate =
    data.ratioTemplates.find((item) => item.id === selectedRatioTemplateId) ?? null;
  const selectedRatioLines = data.ratioTemplateLines.filter(
    (line) => line.ratioTemplateId === selectedRatioTemplateId,
  );
  const ratioTemplateSummaries = data.ratioTemplates
    .map((template) => {
      const lines = data.ratioTemplateLines.filter((line) => line.ratioTemplateId === template.id);
      const latestActivityAt = [template.updatedAt, ...lines.map((line) => line.updatedAt)]
        .filter(Boolean)
        .sort((left, right) => right.localeCompare(left))[0] ?? template.updatedAt;

      return {
        ...template,
        lineCount: lines.length,
        latestActivityAt,
      };
    })
    .sort(
      (left, right) =>
        right.latestActivityAt.localeCompare(left.latestActivityAt) ||
        right.lineCount - left.lineCount ||
        left.name.localeCompare(right.name),
    );
  const ratioTemplateSearchTerm = ratioTemplateSearchQuery.trim().toLocaleLowerCase();
  const searchedRatioTemplateSummaries = ratioTemplateSearchTerm
    ? ratioTemplateSummaries.filter((template) => template.name.toLocaleLowerCase().includes(ratioTemplateSearchTerm))
    : ratioTemplateSummaries;
  const ratioArticleUsage = Array.from(
    data.ratioTemplateLines
      .reduce<Map<string, { articleId: string; articleName: string; usageCount: number }>>((totals, line) => {
        const current = totals.get(line.articleId);
        totals.set(line.articleId, {
          articleId: line.articleId,
          articleName: line.articleName,
          usageCount: (current?.usageCount ?? 0) + 1,
        });

        return totals;
      }, new Map())
      .values(),
  ).sort((left, right) => right.usageCount - left.usageCount);
  const averageRatioLinesPerTemplate =
    data.ratioTemplates.length > 0 ? data.ratioTemplateLines.length / data.ratioTemplates.length : null;
  const ratioFinishedGoodsCount = new Set(data.ratioTemplates.map((template) => template.finishedGoodArticleId)).size;
  const topRatioArticle = ratioArticleUsage[0] ?? null;
  const finishedGoodOptions = data.articles
    .filter((article) => article.category === "finished_good")
    .map((article) => ({
      value: article.id,
      label: article.name,
    }));
  const sortedBatches = sortBatchesNewToOld(data.batches);
  const batchSelectOptions = sortedBatches.map((batch) => ({
    value: batch.id,
    label: formatBatchSelectLabel(batch),
  }));
  const batchFilterOptions = [{ value: "", label: "Alle batches" }, ...batchSelectOptions];
  const allViews = [...PRIMARY_VIEWS, ...SECONDARY_VIEWS];

  useEffect(() => {
    if (!filteredExpenses.some((expense) => expense.id === selectedExpenseId)) {
      setSelectedExpenseId(firstOrEmpty(filteredExpenses));
    }
  }, [filteredExpenses, selectedExpenseId]);

  useEffect(() => {
    if (!searchedRevenueEntries.some((entry) => entry.id === selectedRevenueEntryId)) {
      setSelectedRevenueEntryId(firstOrEmpty(searchedRevenueEntries));
    }
  }, [searchedRevenueEntries, selectedRevenueEntryId]);

  useEffect(() => {
    if (articleWorkspaceMode === "detail" && !data.articles.some((article) => article.id === selectedArticleId)) {
      setArticleWorkspaceMode("overview");
    }
  }, [articleWorkspaceMode, data.articles, selectedArticleId]);

  useEffect(() => {
    if (customerWorkspaceMode === "detail" && !data.customers.some((customer) => customer.id === selectedCustomerId)) {
      setCustomerWorkspaceMode("overview");
    }
  }, [customerWorkspaceMode, data.customers, selectedCustomerId]);

  useEffect(() => {
    if (ratioWorkspaceMode === "detail" && !data.ratioTemplates.some((template) => template.id === selectedRatioTemplateId)) {
      setRatioWorkspaceMode("overview");
    }
  }, [data.ratioTemplates, ratioWorkspaceMode, selectedRatioTemplateId]);

  function openBatchCreator() {
    setBatchWorkspaceMode("create");
    setActiveView("batches");
  }

  function openBatchOverview() {
    setBatchWorkspaceMode(data.batches.length > 0 ? "overview" : "create");
    setActiveView("batches");
  }

  function openBatch(batchId: string) {
    setSelectedBatchId(batchId);
    setBatchWorkspaceMode("detail");
    setActiveView("batches");
  }

  function openOrderCreator() {
    setOrderWorkspaceMode("create");
    setActiveView("orders");
  }

  function openOrdersOverview() {
    setOrderWorkspaceMode(data.orders.length > 0 ? "overview" : "create");
    setActiveView("orders");
  }

  function openOrder(orderId: string) {
    setSelectedOrderId(orderId);
    setOrderWorkspaceMode("detail");
    setActiveView("orders");
  }

  function openOrdersForBatch(batchId: string) {
    setSelectedBatchId(batchId);
    setOrdersBatchFilterId(batchId);
    setOrderForm((current) => ({ ...current, batchId }));
    setOrderWorkspaceMode(
      data.orders.some((order) => order.batchId === batchId) ? "overview" : "create",
    );
    setActiveView("orders");
  }

  function openCustomer(customerId: string) {
    setSelectedCustomerId(customerId);
    setCustomerWorkspaceMode("detail");
    setActiveView("customers");
  }

  function openArticle(articleId: string) {
    setSelectedArticleId(articleId);
    setArticleWorkspaceMode("detail");
    setArticleDetailPanel("recipe_usage");
    setActiveView("articles");
  }

  function openArticlesOverview() {
    setArticleWorkspaceMode("overview");
    setActiveView("articles");
  }

  function openArticleCreator() {
    setArticleWorkspaceMode("overview");
    setActiveView("articles");
    setArticleCreateOpened(true);
  }

  function closeArticleCreator() {
    setArticleCreateOpened(false);
  }

  function openCustomersOverview() {
    setCustomerWorkspaceMode("overview");
    setActiveView("customers");
  }

  function openCustomerCreator() {
    setCustomerWorkspaceMode("overview");
    setActiveView("customers");
    setCustomerCreateOpened(true);
  }

  function closeCustomerCreator() {
    setCustomerCreateOpened(false);
  }

  function openRatioTemplateCreator() {
    setActiveView("ratios");
    setRatioTemplateCreateOpened(true);
  }

  function closeRatioTemplateCreator() {
    setRatioTemplateCreateOpened(false);
  }

  function openRatioOverview() {
    setRatioWorkspaceMode("overview");
    setActiveView("ratios");
  }

  function openRatioTemplate(templateId: string) {
    setSelectedRatioTemplateId(templateId);
    setRatioLineForm((current) => ({
      ...current,
      ratioTemplateId: templateId,
    }));
    setRatioWorkspaceMode("detail");
    setActiveView("ratios");
  }

  function openRatioLineCreator(templateId?: string) {
    const nextTemplateId = templateId ?? selectedRatioTemplateId;
    const article = data.articles.find((item) => item.id === ratioLineForm.articleId) ?? data.articles[0] ?? null;

    setSelectedRatioTemplateId(nextTemplateId);
    setRatioLineForm((current) => ({
      ...current,
      ratioTemplateId: nextTemplateId,
      articleId: current.articleId || article?.id || "",
      unit: article?.defaultUnit ?? current.unit,
    }));
    setRatioWorkspaceMode("detail");
    setActiveView("ratios");
    setRatioLineCreateOpened(true);
  }

  function closeRatioLineCreator() {
    setRatioLineCreateOpened(false);
  }

  function openRevenueEntry(revenueEntryId: string) {
    setSelectedRevenueEntryId(revenueEntryId);
    setActiveView("revenue");
  }

  function openExpensesForBatch(batchId: string) {
    setSelectedBatchId(batchId);
    setExpensesBatchFilterId(batchId);
    setExpenseForm((current) => ({ ...current, batchId }));
    setActiveView("expenses");
  }

  function openExpenseCreator(preferredBatchId?: string | null) {
    const nextBatchId = preferredBatchId ?? expensesBatchFilterId ?? getDefaultBatchId(data);

    setExpenseForm(buildExpenseFormState(data, nextBatchId));
    setActiveView("expenses");
    setExpenseCreateOpened(true);
  }

  function closeExpenseCreator() {
    setExpenseCreateOpened(false);
  }

  function openRevenueForBatch(batchId: string) {
    setSelectedBatchId(batchId);
    setRevenueBatchFilterId(batchId);
    setActiveView("revenue");
  }

  function switchView(view: AppView) {
    setActiveView(view);
    setMobileNavOpened(false);
    if (view !== "articles") {
      setArticleCreateOpened(false);
    }
    if (view !== "customers") {
      setCustomerCreateOpened(false);
    }
    if (view !== "ratios") {
      setRatioTemplateCreateOpened(false);
      setRatioLineCreateOpened(false);
    }

    if (view === "batches") {
      setBatchWorkspaceMode(data.batches.length === 0 ? "create" : "overview");
    }

    if (view === "orders") {
      setOrdersBatchFilterId(null);
      setOrderWorkspaceMode(data.orders.length === 0 ? "create" : "overview");
    }

    if (view === "expenses") {
      setExpensesBatchFilterId(null);
      setExpenseCreateOpened(false);
    }

    if (view === "revenue") {
      setRevenueBatchFilterId(null);
    }

    if (view === "articles") {
      setArticleWorkspaceMode("overview");
    }

    if (view === "ratios") {
      setRatioWorkspaceMode("overview");
    }

    if (view === "customers") {
      setCustomerWorkspaceMode("overview");
    }
  }

  const renderHome = () => {
    const homeQuickActions = [
      {
        key: "batch",
        label: "Nieuwe batch",
        description: "Start een nieuwe productieflow",
        icon: <IconBottle size={18} />,
        onClick: openBatchCreator,
      },
      {
        key: "order",
        label: "Nieuw order",
        description: "Boek verkoop op een batch",
        icon: <IconShoppingBag size={18} />,
        onClick: openOrderCreator,
      },
      {
        key: "expense",
        label: "Nieuwe kost",
        description: "Registreer aankoop of verpakking",
        icon: <IconReceipt2 size={18} />,
        onClick: () => openExpenseCreator(),
      },
      {
        key: "customer",
        label: "Nieuwe klant",
        description: "Voeg een nieuwe relatie toe",
        icon: <IconUsers size={18} />,
        onClick: openCustomerCreator,
      },
    ];
    const homeRecentBatches = sortBatchesNewToOld(data.batches).slice(0, 4);
    const homeRecentRevenueEntries = [...data.revenueEntries]
      .sort((left, right) => right.recognizedAt.localeCompare(left.recognizedAt))
      .slice(0, 3);

    return (
      <Box className="home-shell">
        <Stack gap="md" className="home-desktop-only">
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
            <MetricCard
              label="Beschikbaar volume"
              value={formatLiters(data.dashboard.totalAvailableLiters)}
              meta={`${data.dashboard.activeBatchCount} actieve batches`}
              infoDescription="Liters die nog niet verkocht of gereserveerd zijn."
            />
            <MetricCard
              label="Open orders"
              value={`${data.dashboard.ordersInProgressCount + data.dashboard.ordersReadyCount}`}
              meta={`${data.dashboard.ordersReadyCount} klaar voor levering`}
              infoDescription="Orders die nog opvolging vragen in de flow."
            />
            <MetricCard
              label="Output checks"
              value={`${batchesMissingActualOutput.length}`}
              meta="Batches zonder effectieve output"
              infoDescription="Werk deze batches bij om voorraad en marge correct te houden."
            />
            <MetricCard
              label="Bijna leeg"
              value={`${lowAvailabilityBatches.length}`}
              meta="Batches onder 2 liter beschikbaar"
              infoDescription="Helpt om tijdig nieuwe productie of opvolging te plannen."
            />
          </SimpleGrid>

          <Grid gutter="md" align="stretch" className="home-desktop-layout">
            <Grid.Col span={{ base: 12, xl: 3 }}>
              <SectionCard
                title="Snel starten"
                subtitle="De kortste weg naar wat je nu wilt registreren."
                className="workspace-card"
              >
                <Stack gap="xs" className="home-action-list">
                  {homeQuickActions.map((action) => (
                    <Button
                      key={action.key}
                      variant="subtle"
                      radius="xl"
                      size="md"
                      className="home-desktop-action-button"
                      leftSection={action.icon}
                      justify="space-between"
                      onClick={action.onClick}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Stack>
                <Button
                  variant="light"
                  radius="xl"
                  leftSection={<IconChartBar size={18} />}
                  onClick={() => switchView("dashboard")}
                >
                  Open dashboard
                </Button>
              </SectionCard>
            </Grid.Col>

            <Grid.Col span={{ base: 12, xl: 6 }}>
              <SectionCard
                title="Wat loopt nu"
                subtitle="Combineert operationele context met de recentste batches."
                className="workspace-card"
              >
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                  <Stack gap="xs">
                    <Text size="sm" tt="uppercase" fw={700} className="muted-copy">
                      Operatie
                    </Text>
                    <DetailRow label="Actieve batches" value={`${data.dashboard.activeBatchCount}`} />
                    <DetailRow label="Ready batches" value={`${data.dashboard.readyBatchCount}`} />
                    <DetailRow
                      label="Open orders"
                      value={`${data.dashboard.ordersInProgressCount + data.dashboard.ordersReadyCount}`}
                    />
                    <DetailRow label="Beschikbaar volume" value={formatLiters(data.dashboard.totalAvailableLiters)} />
                  </Stack>

                  <Stack gap="xs">
                    <Text size="sm" tt="uppercase" fw={700} className="muted-copy">
                      Commercieel
                    </Text>
                    <DetailRow label="Afgeronde orders" value={`${data.dashboard.completedOrderCount}`} />
                    <DetailRow label="Omzet" value={formatCurrency(data.dashboard.totalRevenueAmount)} />
                    <DetailRow
                      label="Marge"
                      value={formatCurrency(data.dashboard.totalMarginAmount)}
                      tone={data.dashboard.totalMarginAmount > 0 ? "#0f8a62" : data.dashboard.totalMarginAmount < 0 ? "#c2410c" : undefined}
                    />
                    <DetailRow label="Verkocht volume" value={formatLiters(data.dashboard.totalSoldLiters)} />
                  </Stack>
                </SimpleGrid>

                <Divider />

                <Stack gap="sm">
                  {homeRecentBatches.length > 0 ? (
                    homeRecentBatches.map((batch) => (
                      <SelectableCard
                        key={batch.id}
                        title={batch.batchNumber}
                        subtitle={`${batch.finishedGoodArticleName} · ${buildBatchRecommendations(batch)}`}
                        badge={
                          <ToneBadge
                            color={getBatchStatusColor(batch.status)}
                            label={formatBatchStatus(batch.status)}
                          />
                        }
                        meta={
                          <Text size="sm" className="muted-copy">
                            {formatLiters(batch.availableLiters)} beschikbaar · gestart op {formatShortDate(batch.startedSteepingAt)}
                          </Text>
                        }
                        onClick={() => openBatch(batch.id)}
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon={<IconHome2 size={20} />}
                      title="Nog geen operationele data"
                      description="Zodra batches, orders en kosten bestaan, zie je hier de actuele werking."
                    />
                  )}
                </Stack>
              </SectionCard>
            </Grid.Col>

            <Grid.Col span={{ base: 12, xl: 3 }}>
              <SectionCard
                title="Signal Center"
                subtitle="Wat eerst aandacht vraagt."
                className="workspace-card dashboard-scroll-card"
                contentClassName="dashboard-scroll-card-content"
              >
                <ScrollArea
                  type="always"
                  offsetScrollbars
                  scrollbars="y"
                  scrollbarSize={8}
                  className="dashboard-scroll-shell"
                >
                  <Stack gap="sm">
                  {dashboardSignals.length > 0 ? (
                    dashboardSignals.map((signal) => (
                      <SelectableCard
                        key={signal.id}
                        title={signal.title}
                        subtitle={signal.subtitle}
                        badge={signal.badge}
                        meta={<Text size="sm" className="muted-copy">{signal.meta}</Text>}
                        onClick={signal.onClick}
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon={<IconHome2 size={20} />}
                      title="Rustig moment"
                      description="Er staan momenteel geen dringende aandachtspunten open."
                    />
                  )}
                  </Stack>
                </ScrollArea>
              </SectionCard>
            </Grid.Col>
          </Grid>
        </Stack>

        <Stack gap="md" className="home-mobile-only">
          <SimpleGrid cols={2} spacing="md">
            {homeQuickActions.map((action) => (
              <Card
                key={action.key}
                radius="lg"
                padding="lg"
                className="workspace-card home-mobile-action-card"
                style={{ cursor: "pointer" }}
                onClick={action.onClick}
              >
                <Stack gap="sm" align="flex-start">
                  <ThemeIcon radius="md" size="lg" className="workspace-brand-icon">
                    {action.icon}
                  </ThemeIcon>
                  <Stack gap={2}>
                    <Text fw={700}>{action.label}</Text>
                    <Text size="sm" className="muted-copy">
                      {action.description}
                    </Text>
                  </Stack>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>

          <SectionCard title="Signal Center" subtitle="Eerst dit bekijken.">
            <Stack gap="sm">
              {dashboardSignals.length > 0 ? (
                dashboardSignals.slice(0, 4).map((signal) => (
                  <SelectableCard
                    key={signal.id}
                    title={signal.title}
                    subtitle={signal.subtitle}
                    badge={signal.badge}
                    meta={<Text size="sm" className="muted-copy">{signal.meta}</Text>}
                    onClick={signal.onClick}
                  />
                ))
              ) : (
                <EmptyState
                  icon={<IconHome2 size={20} />}
                  title="Rustig moment"
                  description="Er staan momenteel geen dringende aandachtspunten open."
                />
              )}
            </Stack>
          </SectionCard>

          <SectionCard title="Nu actief" subtitle="Compacte context voor onderweg.">
            <Stack gap="sm">
              <SimpleGrid cols={2} spacing="sm">
                <MetricCard label="Open orders" value={`${data.dashboard.ordersInProgressCount + data.dashboard.ordersReadyCount}`} />
                <MetricCard label="Beschikbaar" value={formatLiters(data.dashboard.totalAvailableLiters)} />
              </SimpleGrid>

              {homeRecentBatches.length > 0 ? (
                homeRecentBatches.slice(0, 3).map((batch) => (
                  <SelectableCard
                    key={batch.id}
                    title={batch.batchNumber}
                    subtitle={`${batch.finishedGoodArticleName} · ${formatLiters(batch.availableLiters)} beschikbaar`}
                    badge={
                      <ToneBadge
                        color={getBatchStatusColor(batch.status)}
                        label={formatBatchStatus(batch.status)}
                      />
                    }
                    onClick={() => openBatch(batch.id)}
                  />
                ))
              ) : null}

              {homeRecentRevenueEntries.length > 0 ? (
                homeRecentRevenueEntries.map((entry) => (
                  <SelectableCard
                    key={entry.id}
                    title={entry.orderNumber}
                    subtitle={`${entry.customerName} · ${entry.batchNumber}`}
                    badge={<ToneBadge color="teal" label={formatCurrency(entry.totalAmount)} />}
                    meta={
                      <Text size="sm" className="muted-copy">
                        {formatLiters(entry.litersSold)} · {formatShortDate(entry.recognizedAt)}
                      </Text>
                    }
                    onClick={() => openRevenueEntry(entry.id)}
                  />
                ))
              ) : null}
            </Stack>
          </SectionCard>
        </Stack>
      </Box>
    );
  };

  const renderDashboard = () => {
    const totalOpenOrderCount = data.dashboard.ordersInProgressCount + data.dashboard.ordersReadyCount;
    const marginPerSoldLiter =
      data.dashboard.totalSoldLiters > 0
        ? data.dashboard.totalMarginAmount / data.dashboard.totalSoldLiters
        : null;
    const profitableBatchesCount = data.batches.filter((batch) => batch.marginAmount > 0).length;
    const dashboardBatchRows = sortBatchesNewToOld(data.batches);
    const expenseTotalsByArticle = Array.from(
      data.expenses
        .reduce<
          Map<
            string,
            {
              articleId: string;
              articleName: string;
              totalAmount: number;
              registrations: number;
            }
          >
        >((totals, expense) => {
          const current = totals.get(expense.articleId);
          totals.set(expense.articleId, {
            articleId: expense.articleId,
            articleName: expense.articleName,
            totalAmount: (current?.totalAmount ?? 0) + expense.amount,
            registrations: (current?.registrations ?? 0) + 1,
          });

          return totals;
        }, new Map())
        .values(),
    ).sort((left, right) => right.totalAmount - left.totalAmount);

    return (
      <Box className="batch-workspace-shell">
        <Stack gap="md" className="batch-screen-shell dashboard-screen-shell">
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 6 }} spacing="md">
            <MetricCard
              label="Beschikbaar volume"
              value={formatLiters(data.dashboard.totalAvailableLiters)}
              meta={`${data.dashboard.activeBatchCount} actieve batches`}
              infoDescription="Volume dat nog niet verkocht of gereserveerd is in de huidige voorraad."
            />
            <MetricCard
              label="Gereserveerd"
              value={formatLiters(data.dashboard.totalReservedLiters)}
              meta={`${totalOpenOrderCount} open orders`}
              infoDescription="Volume dat al vastligt in lopende orders."
            />
            <MetricCard
              label="Omzet"
              value={formatCurrency(data.dashboard.totalRevenueAmount)}
              meta={`${data.dashboard.completedOrderCount} afgeronde orders`}
              infoDescription="Totale gerealiseerde omzet uit opbrengstregels."
            />
            <MetricCard
              label="Marge"
              value={formatCurrency(data.dashboard.totalMarginAmount)}
              meta={`${profitableBatchesCount} winstgevende batches`}
              tone={
                <ToneBadge
                  color={getMarginToneColor(data.dashboard.totalMarginAmount)}
                  label={
                    data.dashboard.totalMarginAmount > 0
                      ? "Winst"
                      : data.dashboard.totalMarginAmount < 0
                        ? "Verlies"
                        : "Break-even"
                  }
                />
              }
              valueClassName={getMarginToneClass(data.dashboard.totalMarginAmount)}
              infoDescription="Omzet min geregistreerde kosten over de huidige dataset."
            />
            <MetricCard
              label="Marge / L"
              value={marginPerSoldLiter === null ? "n.v.t." : `${formatCurrency(marginPerSoldLiter)}/L`}
              meta={formatLiters(data.dashboard.totalSoldLiters)}
              tone={
                marginPerSoldLiter === null ? undefined : (
                  <ToneBadge
                    color={getMarginToneColor(marginPerSoldLiter)}
                    label={
                      marginPerSoldLiter > 0
                        ? "Positief"
                        : marginPerSoldLiter < 0
                          ? "Negatief"
                          : "Neutraal"
                    }
                  />
                )
              }
              valueClassName={getMarginToneClass(marginPerSoldLiter)}
              infoDescription="Gemiddelde marge per verkochte liter."
            />
            <MetricCard
              label="Klaar voor levering"
              value={`${data.dashboard.ordersReadyCount}`}
              meta={`${data.dashboard.ordersInProgressCount} in verwerking`}
              infoDescription="Orders die operationeel klaar zijn om uit te leveren."
            />
          </SimpleGrid>

          <Grid gutter="md" className="dashboard-main-layout">
            <Grid.Col span={12} className="batch-detail-pane">
              <SectionCard
                title="Batchperformantie"
                compact
                action={
                  <Button
                    size="xs"
                    radius="sm"
                    variant="subtle"
                    color="gray"
                    className="batch-toolbar-button"
                    onClick={() => switchView("batches")}
                  >
                    Open batches
                  </Button>
                }
                className="batch-screen-card batch-detail-static-card dashboard-scroll-card"
                contentClassName="batch-detail-static-content dashboard-scroll-card-content"
              >
                <Box className="batch-table-frame">
                  <Box className="batch-table-head dashboard-table-head">
                    <Text className="batch-table-head-cell">Batch</Text>
                    <Text className="batch-table-head-cell">Status</Text>
                    <Text className="batch-table-head-cell table-mobile-hidden">Product</Text>
                    <Text className="batch-table-head-cell">Beschikbaar</Text>
                    <Text className="batch-table-head-cell table-mobile-hidden">Verkocht</Text>
                    <Text className="batch-table-head-cell table-mobile-hidden">Kosten</Text>
                    <Text className="batch-table-head-cell">Omzet</Text>
                    <Text className="batch-table-head-cell">Marge</Text>
                  </Box>
                  <Box className="batch-table-scroll">
                    {dashboardBatchRows.length > 0 ? (
                      <Stack gap={0}>
                        {dashboardBatchRows.map((batch) => (
                          <Box
                            key={batch.id}
                            className="batch-table-row dashboard-table-row"
                            role="button"
                            tabIndex={0}
                            onClick={() => openBatch(batch.id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                openBatch(batch.id);
                              }
                            }}
                          >
                            <Box className="batch-table-cell batch-table-cell-primary" data-label="Batch">
                              <Text className="batch-table-batch-number">{batch.batchNumber}</Text>
                            </Box>
                            <Box className="batch-table-cell" data-label="Status">
                              <ToneBadge color={getBatchStatusColor(batch.status)} label={formatBatchStatus(batch.status)} />
                            </Box>
                            <Box className="batch-table-cell table-mobile-hidden" data-label="Product">
                              <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                                {batch.finishedGoodArticleName}
                              </Text>
                            </Box>
                            <Box className="batch-table-cell" data-label="Beschikbaar">
                              <Text size="sm" fw={700} className="batch-table-metric">
                                {formatLiters(batch.availableLiters)}
                              </Text>
                            </Box>
                            <Box className="batch-table-cell table-mobile-hidden" data-label="Verkocht">
                              <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                                {formatLiters(batch.soldLiters)}
                              </Text>
                            </Box>
                            <Box className="batch-table-cell table-mobile-hidden" data-label="Kosten">
                              <Text size="sm" fw={700} className="batch-table-metric">
                                {formatCurrency(batch.costAmount)}
                              </Text>
                            </Box>
                            <Box className="batch-table-cell" data-label="Omzet">
                              <Text size="sm" fw={700} className="batch-table-metric">
                                {formatCurrency(batch.revenueAmount)}
                              </Text>
                            </Box>
                            <Box className="batch-table-cell" data-label="Marge">
                              <Text
                                size="sm"
                                fw={700}
                                className={["batch-table-metric", getMarginToneClass(batch.marginAmount)].join(" ")}
                              >
                                {formatCurrency(batch.marginAmount)}
                              </Text>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <EmptyState
                        icon={<IconChartBar size={20} />}
                        title="Nog geen batchdata"
                        description="Voeg eerst batches, orders en kosten toe om performantie te kunnen lezen."
                      />
                    )}
                  </Box>
                </Box>
              </SectionCard>
            </Grid.Col>
          </Grid>

          <Grid gutter="md" className="dashboard-secondary-layout">
            <Grid.Col span={{ base: 12, xl: 6 }} className="batch-detail-pane">
              <SectionCard
                title="Topklanten"
                compact
                className="batch-screen-card batch-history-card dashboard-scroll-card"
                contentClassName="batch-history-card-content dashboard-scroll-card-content"
              >
                <ScrollArea
                  type="always"
                  offsetScrollbars
                  scrollbars="y"
                  scrollbarSize={8}
                  className="dashboard-scroll-shell"
                >
                  {customerSummaries.filter((customer) => customer.revenueAmount > 0).length > 0 ? (
                    <Stack gap="sm">
                      {customerSummaries
                        .filter((customer) => customer.revenueAmount > 0)
                        .slice(0, 8)
                        .map((customer) => (
                          <SelectableCard
                            key={customer.id}
                            title={customer.fullName}
                            subtitle={`${customer.completedOrderCount} afgerond · ${formatLiters(customer.litersSold)}`}
                            badge={<ToneBadge color="teal" label={formatCurrency(customer.revenueAmount)} />}
                            meta={
                              <Text size="sm" className="muted-copy">
                                Laatste activiteit · {formatShortDate(customer.latestActivityAt)}
                              </Text>
                            }
                            onClick={() => openCustomer(customer.id)}
                          />
                        ))}
                    </Stack>
                  ) : (
                    <EmptyState
                      icon={<IconShoppingBag size={20} />}
                      title="Nog geen klantomzet"
                      description="Zodra orders afgerond zijn, zie je hier wie de omzet draagt."
                    />
                  )}
                </ScrollArea>
              </SectionCard>
            </Grid.Col>

            <Grid.Col span={{ base: 12, xl: 6 }} className="batch-detail-pane">
              <SectionCard
                title="Kostendrijvers"
                compact
                className="batch-screen-card batch-history-card dashboard-scroll-card"
                contentClassName="batch-history-card-content dashboard-scroll-card-content"
              >
                <ScrollArea
                  type="always"
                  offsetScrollbars
                  scrollbars="y"
                  scrollbarSize={8}
                  className="dashboard-scroll-shell"
                >
                  {expenseTotalsByArticle.length > 0 ? (
                    <Stack gap="sm">
                      {expenseTotalsByArticle.slice(0, 8).map((article) => (
                        <SelectableCard
                          key={article.articleId}
                          title={article.articleName}
                          subtitle={`${article.registrations} registratie${article.registrations === 1 ? "" : "s"}`}
                          badge={<ToneBadge color="orange" label={formatCurrency(article.totalAmount)} />}
                          meta={<Text size="sm" className="muted-copy">Totaal geregistreerde kost</Text>}
                          onClick={() => switchView("expenses")}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <EmptyState
                      icon={<IconInfoCircle size={20} />}
                      title="Nog geen kostendrijvers"
                      description="Zodra kosten geregistreerd zijn, zie je hier welke artikels het zwaarst doorwegen."
                    />
                  )}
                </ScrollArea>
              </SectionCard>
            </Grid.Col>
          </Grid>
        </Stack>
      </Box>
    );
  };

  function handleBatchTemplateChange(nextTemplateId: string) {
    const template = data.ratioTemplates.find((item) => item.id === nextTemplateId);
    const alcoholInput = Number(batchForm.alcoholInputLiters || 0);
    const recommendedOutput = template
      ? (alcoholInput / template.baseAlcoholLiters) * template.expectedOutputLitersPerBaseAlcoholLiter
      : 0;

    setBatchForm((current) => ({
      ...current,
      ratioTemplateId: nextTemplateId,
      expectedOutputLiters: template ? recommendedOutput.toFixed(2) : current.expectedOutputLiters,
    }));
  }

  function handleBatchAlcoholInputChange(nextAlcoholInput: string) {
    const alcoholInput = Number(nextAlcoholInput || 0);
    const template = data.ratioTemplates.find((item) => item.id === batchForm.ratioTemplateId);
    const recommendedOutput = template
      ? (alcoholInput / template.baseAlcoholLiters) * template.expectedOutputLitersPerBaseAlcoholLiter
      : 0;

    setBatchForm((current) => ({
      ...current,
      alcoholInputLiters: nextAlcoholInput,
      expectedOutputLiters: template ? recommendedOutput.toFixed(2) : current.expectedOutputLiters,
    }));
  }

  const renderBatchCreatePanel = () => (
    <SectionCard
      title="Nieuwe batch"
      subtitle="Batchnummer volgt automatisch. Kies recept, output en startmoment."
      headerStart={
        data.batches.length > 0 ? (
          <ActionIcon
            variant="subtle"
            color="gray"
            radius="xl"
            size="lg"
            className="batch-detail-back-button"
            onClick={openBatchOverview}
          >
            <IconArrowLeft size={18} />
          </ActionIcon>
        ) : undefined
      }
      className="batch-screen-card"
    >
      <Stack gap="md">
          <NativeSelect
            label="Ratio template"
            data={data.ratioTemplates.map((template) => ({
              value: template.id,
              label: `${template.name} - ${template.finishedGoodArticleName}`,
            }))}
            value={batchForm.ratioTemplateId}
            onChange={(event) => handleBatchTemplateChange(event.currentTarget.value)}
          />
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
            <TextInput
              label="Startdatum"
              type="date"
              value={batchForm.startedSteepingAt}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setBatchForm((current) => ({
                  ...current,
                  startedSteepingAt: value,
                }));
              }}
            />
            <TextInput
              label="Trekdagen"
              type="number"
              min="0"
              value={batchForm.steepDays}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setBatchForm((current) => ({ ...current, steepDays: value }));
              }}
            />
            <TextInput
              label="Alcohol input (L)"
              type="number"
              step="0.1"
              value={batchForm.alcoholInputLiters}
              onChange={(event) => handleBatchAlcoholInputChange(event.currentTarget.value)}
            />
            <TextInput
              label="Verwachte output (L)"
              type="number"
              step="0.1"
              value={batchForm.expectedOutputLiters}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setBatchForm((current) => ({
                  ...current,
                  expectedOutputLiters: value,
                }));
              }}
            />
            <TextInput
              label="Prijs per liter"
              type="number"
              step="0.01"
              value={batchForm.unitPricePerLiter}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setBatchForm((current) => ({
                  ...current,
                  unitPricePerLiter: value,
                }));
              }}
            />
            <NativeSelect
              label="Startstatus"
              data={BATCH_STATUS_OPTIONS}
              value={batchForm.status}
              onChange={(event) => {
                const value = event.currentTarget.value as BatchStatus;
                setBatchForm((current) => ({
                  ...current,
                  status: value,
                }));
              }}
            />
          </SimpleGrid>
          <Textarea
            label="Notitie"
            minRows={3}
            value={batchForm.notes}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setBatchForm((current) => ({ ...current, notes: value }));
            }}
          />
          {selectedBatchTemplate ? (
            <Text size="sm" className="muted-copy">
              {selectedBatchTemplate.finishedGoodArticleName} via {selectedBatchTemplate.name}.
            </Text>
          ) : null}
          <Button
            loading={pendingAction === "Batch opgeslagen"}
            disabled={databaseUnavailable}
            onClick={() =>
              runAction(
                "Batch opgeslagen",
                () =>
                  createBatchAction({
                    startedSteepingAt: batchForm.startedSteepingAt,
                    steepDays: Number(batchForm.steepDays),
                    status: batchForm.status,
                    ratioTemplateId: batchForm.ratioTemplateId,
                    alcoholInputLiters: Number(batchForm.alcoholInputLiters),
                    expectedOutputLiters: Number(batchForm.expectedOutputLiters),
                    unitPricePerLiter: Number(batchForm.unitPricePerLiter),
                    notes: batchForm.notes,
                  } satisfies CreateBatchInput),
                () => {
                  setBatchWorkspaceMode("overview");
                  setBatchForm((current) => ({
                    ...current,
                    notes: "",
                  }));
                },
              )
            }
          >
            Batch aanmaken
          </Button>
      </Stack>
    </SectionCard>
  );

  const renderBatchDetailsPanel = () => {
    if (!selectedBatch) {
      return null;
    }

    return (
      <Box className="batch-panel-layout">
        <Group gap="xs" className="batch-detail-actions">
          <Button
            size="xs"
            radius="sm"
            variant="light"
            color="sage"
            className="batch-context-button"
            onClick={() => openOrdersForBatch(selectedBatch.id)}
          >
            Orders ({selectedBatchOrders.length})
          </Button>
          <Button
            size="xs"
            radius="sm"
            variant="light"
            color="sage"
            className="batch-context-button"
            onClick={() => openExpensesForBatch(selectedBatch.id)}
          >
            Kosten ({selectedBatchExpenses.length})
          </Button>
          <Button
            size="xs"
            radius="sm"
            variant="light"
            color="sage"
            className="batch-context-button"
            onClick={() => openRevenueForBatch(selectedBatch.id)}
          >
            Opbrengsten ({selectedBatchRevenue.length})
          </Button>
        </Group>
        <Box className="batch-panel-auto-grid batch-panel-grow">
          <Box className="batch-panel-block">
            <Stack gap="xs">
              <Text fw={700}>Batchinfo</Text>
              <DetailRow label="Product" value={selectedBatch.finishedGoodArticleName} />
              <DetailRow label="Template" value={selectedBatch.ratioTemplateName} />
              <DetailRow label="Aangemaakt" value={formatShortDate(selectedBatch.createdAt.slice(0, 10))} />
              <DetailRow label="Status" value={formatBatchStatus(selectedBatch.status)} />
            </Stack>
          </Box>
          <Box className="batch-panel-block">
            <Stack gap="xs">
              <Text fw={700}>Productieritme</Text>
              <DetailRow label="Start steeping" value={formatShortDate(selectedBatch.startedSteepingAt)} />
              <DetailRow label="Steeping tot" value={formatShortDate(selectedBatch.steepingUntil)} />
              <DetailRow label="Klaar sinds" value={formatShortDate(selectedBatch.readyAt)} />
              <DetailRow label="Trekdagen" value={String(selectedBatch.steepDays)} />
            </Stack>
          </Box>
          <Box className="batch-panel-block">
            <Stack gap="xs">
              <Text fw={700}>Recept & volume</Text>
              <DetailRow label="Alcohol input" value={formatLiters(selectedBatch.alcoholInputLiters)} />
              <DetailRow label="Verwacht volume" value={formatLiters(selectedBatch.expectedOutputLiters)} />
              <DetailRow
                label="Effectief geproduceerd"
                value={
                  selectedBatch.actualProducedLiters
                    ? formatLiters(selectedBatch.actualProducedLiters)
                    : "Nog open"
                }
              />
              <DetailRow label="Prijs per liter" value={formatCurrency(selectedBatch.unitPricePerLiter)} />
            </Stack>
          </Box>
          <Box className="batch-panel-block">
            <Stack gap="xs">
              <Text fw={700}>Commercieel</Text>
              <DetailRow label="Gereserveerd" value={formatLiters(selectedBatch.reservedLiters)} />
              <DetailRow label="Verkocht" value={formatLiters(selectedBatch.soldLiters)} />
              <DetailRow label="Beschikbaar" value={formatLiters(selectedBatch.availableLiters)} />
              <DetailRow label="Marge" value={formatCurrency(selectedBatch.marginAmount)} />
            </Stack>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderBatchHistoryPanel = () => {
    if (!selectedBatch) {
      return null;
    }

    const latestHistory = selectedBatchHistory[0] ?? null;

    return (
      <Box className="batch-panel-layout batch-history-panel">
        <Box className="batch-panel-stat-grid">
          <Box className="batch-panel-block">
            <Stack gap="xs">
              <Text fw={700}>Statuswissels</Text>
              <Title order={3}>{selectedBatchHistory.length}</Title>
            </Stack>
          </Box>
          <Box className="batch-panel-block">
            <Stack gap="xs">
              <Text fw={700}>Huidige status</Text>
              <Title order={3}>{formatBatchStatus(selectedBatch.status)}</Title>
            </Stack>
          </Box>
          <Box className="batch-panel-block">
            <Stack gap="xs">
              <Text fw={700}>Laatste wijziging</Text>
              <Title order={3}>
                {latestHistory ? formatShortDate(latestHistory.changedAt.slice(0, 10)) : "Nog leeg"}
              </Title>
            </Stack>
          </Box>
        </Box>
        <Box className="batch-panel-feed-shell">
          {selectedBatchHistory.length > 0 ? (
            <Stack gap="sm" className="batch-history-list">
              {selectedBatchHistory.map((item) => (
                <Box
                  key={item.id}
                  className="batch-history-item"
                >
                  <Stack gap={4}>
                    <Text fw={700}>{formatBatchStatus(item.toStatus)}</Text>
                    <Text size="sm" className="muted-copy">
                      {formatShortDate(item.changedAt.slice(0, 10))}
                    </Text>
                    {item.fromStatus ? (
                      <Text size="sm" className="muted-copy">
                        Van {formatBatchStatus(item.fromStatus)}
                      </Text>
                    ) : null}
                  </Stack>
                </Box>
              ))}
            </Stack>
          ) : (
            <Box className="batch-panel-empty">
              <EmptyState
                icon={<IconInfoCircle size={20} />}
                title="Nog geen historiek"
                description="Zodra statussen wijzigen verschijnt hier de historiek."
              />
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  const renderBatches = () => {
    const readyBatchCount = visibleBatches.filter((batch) => batch.status === "ready").length;
    const steepingBatchCount = visibleBatches.filter((batch) => batch.status === "steeping").length;
    const soldOutBatchCount = visibleBatches.filter((batch) => batch.status === "sold_out").length;

    if (batchWorkspaceMode === "create") {
      return (
        <Box className="batch-workspace-shell">
          <Stack gap="md" className="batch-screen-shell">
            {renderBatchCreatePanel()}
          </Stack>
        </Box>
      );
    }

    if (batchWorkspaceMode === "detail" && selectedBatch) {
      return (
        <Box className="batch-workspace-shell">
          <Stack gap="md" className="batch-screen-shell batch-detail-screen">
            <SectionCard
              title={selectedBatch.batchNumber}
              subtitle={`${selectedBatch.finishedGoodArticleName} - ${selectedBatch.ratioTemplateName}`}
              className="batch-screen-card batch-detail-hero-card"
              compact
              headerStart={
                <ActionIcon
                  variant="transparent"
                  color="gray"
                  size="md"
                  radius="xl"
                  aria-label="Terug naar batches"
                  className="batch-detail-back-button"
                  onClick={openBatchOverview}
                >
                  <IconArrowLeft size={18} />
                </ActionIcon>
              }
              action={
                <Group gap="xs" wrap="nowrap">
                  <ToneBadge color="gray" label={selectedBatch.finishedGoodArticleName} />
                  <ToneBadge
                    color={getBatchStatusColor(selectedBatch.status)}
                    label={formatBatchStatus(selectedBatch.status)}
                  />
                </Group>
              }
            >
              <Box className="batch-kpi-grid">
                <Card radius="md" padding="md" className="batch-kpi-card batch-kpi-card-hero">
                  <Stack gap={6}>
                    <InfoLabel
                      label="Beschikbaar"
                      description="Beschikbaar volume is wat nog vrij is voor nieuwe orders. We nemen eerst het effectief geproduceerde volume als dat ingevuld is, anders de verwachte output, en trekken daar verkocht en gereserveerd volume vanaf."
                    />
                    <Title order={1} className="batch-kpi-value">
                      {formatLiters(selectedBatch.availableLiters)}
                    </Title>
                  </Stack>
                </Card>
                <Card radius="md" padding="md" className="batch-kpi-card">
                  <Stack gap={6}>
                    <InfoLabel
                      label="Geproduceerd"
                      description="Dit is het effectief geproduceerde aantal liters van deze batch. Als dit nog niet ingevuld is, blijft de batch werken op basis van de verwachte output."
                    />
                    <Title order={2} className="batch-kpi-value">
                      {selectedBatch.actualProducedLiters
                        ? formatLiters(selectedBatch.actualProducedLiters)
                        : "Nog open"}
                    </Title>
                  </Stack>
                </Card>
                <Card radius="md" padding="md" className="batch-kpi-card">
                  <Stack gap={6}>
                    <InfoLabel
                      label="Verkocht"
                      description="Verkocht volume telt alleen liters mee uit orders die afgerond zijn en dus ook als opbrengst geboekt werden op deze batch."
                    />
                    <Title order={2} className="batch-kpi-value">
                      {formatLiters(selectedBatch.soldLiters)}
                    </Title>
                  </Stack>
                </Card>
                <Card radius="md" padding="md" className="batch-kpi-card">
                  <Stack gap={6}>
                    <InfoLabel
                      label="Omzet"
                      description="Omzet is de som van alle opbrengsten die effectief op deze batch gerealiseerd zijn via afgeronde orders."
                    />
                    <Title order={2} className="batch-kpi-value">
                      {formatCurrency(selectedBatch.revenueAmount)}
                    </Title>
                  </Stack>
                </Card>
                <Card radius="md" padding="md" className="batch-kpi-card">
                  <Stack gap={6}>
                    <Group justify="space-between" gap="sm">
                      <InfoLabel
                        label="Marge"
                        description="Marge is omzet min alle geregistreerde batchkosten. Een negatieve marge betekent dat de batch momenteel meer kost dan ze heeft opgebracht."
                      />
                      <ToneBadge
                        color={selectedBatch.marginAmount >= 0 ? "teal" : "red"}
                        label={selectedBatch.marginAmount >= 0 ? "Positief" : "Onder water"}
                      />
                    </Group>
                    <Title order={2} className="batch-kpi-value">
                      {formatCurrency(selectedBatch.marginAmount)}
                    </Title>
                  </Stack>
                </Card>
              </Box>
              <Box className="batch-kpi-strip">
                <Box className="batch-kpi-strip-item">
                  <InfoLabel
                    label="Verwacht"
                    size="xs"
                    description="Dit is de verwachte output waarmee de batch gestart is, berekend op basis van alcohol input en het gekozen ratio template."
                  />
                  <Text fw={700}>{formatLiters(selectedBatch.expectedOutputLiters)}</Text>
                </Box>
                <Box className="batch-kpi-strip-item">
                  <InfoLabel
                    label="Kosten"
                    size="xs"
                    description="Kosten is de som van alle geregistreerde uitgaven die aan deze batch gekoppeld zijn, zoals alcohol, fruit, flessen of verpakking."
                  />
                  <Text fw={700}>{formatCurrency(selectedBatch.costAmount)}</Text>
                </Box>
                <Box className="batch-kpi-strip-item">
                  <InfoLabel
                    label="Prijs per liter"
                    size="xs"
                    description="Dit is de standaardprijs per liter van de batch. Bij het aanmaken van een order wordt deze prijs overgenomen zodat historische orders correct blijven."
                  />
                  <Text fw={700}>{formatCurrency(selectedBatch.unitPricePerLiter)}</Text>
                </Box>
                <Box className="batch-kpi-strip-item">
                  <InfoLabel
                    label="Template"
                    size="xs"
                    description="Het template toont op welk ratio recept deze batch gebaseerd is. Het bepaalt onder meer de verwachte output bij de start van de batch."
                  />
                  <Text fw={700} truncate>
                    {selectedBatch.ratioTemplateName}
                  </Text>
                </Box>
              </Box>
            </SectionCard>

            <Box className="batch-detail-layout">
              <Box className="batch-detail-pane">
                <SectionCard
                  title="Details"
                  className="batch-screen-card batch-detail-static-card"
                  contentClassName="batch-detail-static-content"
                >
                  {renderBatchDetailsPanel()}
                </SectionCard>
              </Box>
              <Box className="batch-detail-pane">
                <SectionCard
                  title="Historiek"
                  className="batch-screen-card batch-history-card"
                  contentClassName="batch-history-card-content"
                >
                  {renderBatchHistoryPanel()}
                </SectionCard>
              </Box>
            </Box>
          </Stack>
        </Box>
      );
    }

    return (
      <Box className="batch-workspace-shell">
        <Stack gap="md" className="batch-screen-shell">
          <Box className="batch-overview-summary-grid">
            <Card radius="md" padding="md" className="batch-summary-card">
              <Stack gap="sm">
                <InfoLabel
                  label="Status"
                  description="Deze verdeling toont hoeveel zichtbare batches momenteel klaar zijn, aan het trekken zijn of uitverkocht zijn."
                />
                <Box className="batch-summary-status-grid">
                  <Box className="batch-summary-status-item">
                    <InfoLabel
                      label="Klaar"
                      size="xs"
                      description="Batches met status klaar zijn productiegewijs afgerond en beschikbaar voor orders."
                    />
                    <Text className="batch-summary-status-value">{readyBatchCount}</Text>
                  </Box>
                  <Box className="batch-summary-status-item">
                    <InfoLabel
                      label="Aan het trekken"
                      size="xs"
                      description="Batches met deze status zitten nog in hun steeping-periode en zijn nog niet klaar voor verkoop."
                    />
                    <Text className="batch-summary-status-value">{steepingBatchCount}</Text>
                  </Box>
                  <Box className="batch-summary-status-item">
                    <InfoLabel
                      label="Uitverkocht"
                      size="xs"
                      description="Uitverkochte batches hebben geen beschikbaar volume meer voor nieuwe orders."
                    />
                    <Text className="batch-summary-status-value">{soldOutBatchCount}</Text>
                  </Box>
                </Box>
              </Stack>
            </Card>
            <Card radius="md" padding="md" className="batch-summary-card">
              <Stack gap={6}>
                <InfoLabel
                  label="Beschikbaar volume"
                  description="Beschikbaar volume is de som van het vrije volume uit alle zichtbare batches samen."
                />
                <Title order={2}>{formatLiters(visibleAvailableLiters)}</Title>
              </Stack>
            </Card>
            <Card radius="md" padding="md" className="batch-summary-card">
              <Stack gap={6}>
                <InfoLabel
                  label="Output open"
                  description="Output open telt batches waar de effectieve productie nog niet manueel werd ingevuld."
                />
                <Title order={2}>{visibleBatchesMissingActualOutput.length}</Title>
              </Stack>
            </Card>
          </Box>

            <SectionCard
              title="Batches"
              action={
                <Group gap="xs">
                  <TextInput
                    aria-label="Zoek batches"
                    placeholder="Zoek batch"
                    value={batchSearchQuery}
                    onChange={(event) => setBatchSearchQuery(event.currentTarget.value)}
                    className="workspace-toolbar-select"
                  />
                  {archivedBatchCount > 0 ? (
                    <Button
                      size="xs"
                    radius="sm"
                    variant="subtle"
                    color="gray"
                    className={
                      showArchivedBatches
                        ? "batch-toolbar-button batch-toolbar-button-active"
                        : "batch-toolbar-button"
                    }
                    onClick={() => setShowArchivedBatches((current) => !current)}
                  >
                    {showArchivedBatches ? "Verberg archief" : `Toon archief (${archivedBatchCount})`}
                  </Button>
                ) : null}
                <Button
                  size="xs"
                  radius="sm"
                  variant="subtle"
                  color="gray"
                  className="batch-toolbar-button batch-toolbar-button-primary"
                  onClick={openBatchCreator}
                >
                  Nieuwe batch
                </Button>
              </Group>
            }
            className="batch-screen-card batch-overview-card"
            contentClassName="batch-section-content"
          >
            <Box className="batch-table-frame">
              <Box className="batch-table-head">
                <Text className="batch-table-head-cell">Batch</Text>
                <Text className="batch-table-head-cell">Status</Text>
                <Text className="batch-table-head-cell">Type</Text>
                <Text className="batch-table-head-cell table-mobile-hidden">Steeping tot</Text>
                <Text className="batch-table-head-cell table-mobile-hidden">Geproduceerd</Text>
                <Text className="batch-table-head-cell">Beschikbaar</Text>
                <Text className="batch-table-head-cell table-mobile-hidden">Verkocht</Text>
                <Text className="batch-table-head-cell">Marge</Text>
                <Text className="batch-table-head-cell table-mobile-hidden">Acties</Text>
              </Box>
              <Box className="batch-table-scroll">
                {filteredVisibleBatches.length > 0 ? (
                  <Stack gap={0}>
                    {filteredVisibleBatches.map((batch) => {
                      const statusTone = getBatchStatusColor(batch.status);
                      const batchStatusSelectId = `batch-status-${batch.id}`;
                      const batchActualProducedInputId = `batch-output-${batch.id}`;

                      return (
                        <Box
                          key={batch.id}
                          className="batch-table-row"
                          role="button"
                          tabIndex={0}
                          onClick={() => openBatch(batch.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openBatch(batch.id);
                            }
                          }}
                        >
                          <Box
                            className="batch-table-cell batch-table-cell-primary"
                            data-label="Batch"
                          >
                            <Text className="batch-table-batch-number">{batch.batchNumber}</Text>
                          </Box>
                          <Box className="batch-table-cell batch-table-cell-mobile-full" data-label="Status">
                            <Group gap={8} wrap="nowrap" className="batch-table-status">
                              <Box className={`batch-status-dot batch-status-dot-${statusTone}`} />
                              <NativeSelect
                                id={batchStatusSelectId}
                                aria-label={`Status voor ${batch.batchNumber}`}
                                size="xs"
                                radius="md"
                                value={batch.status}
                                data={BATCH_STATUS_OPTIONS}
                                disabled={databaseUnavailable || pendingAction === "Batchstatus bijgewerkt"}
                                className={`batch-table-select batch-table-select-tag batch-table-select-tag-${statusTone}`}
                                onClick={(event) => event.stopPropagation()}
                                onMouseDown={(event) => event.stopPropagation()}
                                onKeyDown={(event) => event.stopPropagation()}
                                onChange={(event) => {
                                  event.stopPropagation();
                                  const nextStatus = event.currentTarget.value as BatchStatus;

                                  if (nextStatus === batch.status) {
                                    return;
                                  }

                                  void runAction("Batchstatus bijgewerkt", () =>
                                    updateBatchStatusAction({
                                      batchId: batch.id,
                                      status: nextStatus,
                                    }),
                                  );
                                }}
                              />
                            </Group>
                          </Box>
                          <Box className="batch-table-cell" data-label="Type">
                            <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                              {batch.finishedGoodArticleName}
                            </Text>
                          </Box>
                          <Box className="batch-table-cell table-mobile-hidden" data-label="Steeping tot">
                            <Text size="sm" fw={600} className="batch-table-metric batch-table-metric-soft">
                              {formatShortDate(batch.steepingUntil)}
                            </Text>
                          </Box>
                          <Box className="batch-table-cell table-mobile-hidden" data-label="Geproduceerd">
                            <TextInput
                              id={batchActualProducedInputId}
                              aria-label={`Effectieve output voor ${batch.batchNumber}`}
                              size="xs"
                              radius="md"
                              type="number"
                              step="0.1"
                              inputMode="decimal"
                              value={batchActualProducedInputs[batch.id] ?? ""}
                              disabled={
                                databaseUnavailable || pendingAction === "Effectieve output bijgewerkt"
                              }
                              className="batch-table-input"
                              onClick={(event) => event.stopPropagation()}
                              onMouseDown={(event) => event.stopPropagation()}
                              onFocus={(event) => event.stopPropagation()}
                              onChange={(event) => {
                                event.stopPropagation();
                                const value = event.currentTarget.value;
                                setBatchActualProducedInputs((current) => ({
                                  ...current,
                                  [batch.id]: value,
                                }));
                              }}
                              onBlur={() => {
                                void commitBatchActualProduced(batch);
                              }}
                              onKeyDown={(event) => {
                                event.stopPropagation();

                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  event.currentTarget.blur();
                                }

                                if (event.key === "Escape") {
                                  event.preventDefault();
                                  resetBatchActualProducedInput(batch);
                                  event.currentTarget.blur();
                                }
                              }}
                            />
                          </Box>
                          <Box className="batch-table-cell" data-label="Beschikbaar">
                            <Text size="sm" fw={700} className="batch-table-metric">
                              {formatLiters(batch.availableLiters)}
                            </Text>
                          </Box>
                          <Box className="batch-table-cell table-mobile-hidden" data-label="Verkocht">
                            <Text size="sm" fw={600} className="batch-table-metric batch-table-metric-soft">
                              {formatLiters(batch.soldLiters)}
                            </Text>
                          </Box>
                          <Box className="batch-table-cell" data-label="Marge">
                            <Text
                              size="sm"
                              fw={700}
                              className="batch-table-metric"
                              c={batch.marginAmount >= 0 ? "teal.8" : "red.7"}
                            >
                              {formatCurrency(batch.marginAmount)}
                            </Text>
                          </Box>
                          <Box className="batch-table-cell batch-table-cell-actions table-mobile-hidden" data-label="Acties">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              radius="md"
                              aria-label={`Verwijder ${batch.batchNumber}`}
                              disabled={databaseUnavailable || pendingAction === "Batch verwijderd"}
                              onClick={(event) => {
                                event.stopPropagation();
                                void runAction("Batch verwijderd", () => deleteBatchAction(batch.id));
                              }}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                ) : archivedBatchCount > 0 && !showArchivedBatches ? (
                  <EmptyState
                    icon={<IconBottle size={20} />}
                    title="Archief is verborgen"
                    description="Toon het archief om ook gearchiveerde batches terug te zien."
                  />
                ) : batchSearchTerm ? (
                  <EmptyState
                    icon={<IconInfoCircle size={20} />}
                    title="Geen batches gevonden"
                    description="Pas je zoekterm aan om opnieuw batches in de lijst te zien."
                  />
                ) : (
                  <EmptyState
                    icon={<IconBottle size={20} />}
                    title="Nog geen batches"
                    description="Maak je eerste batch aan om productie, kosten en orders te koppelen."
                  />
                )}
              </Box>
            </Box>
          </SectionCard>
        </Stack>
      </Box>
    );
  };

  const renderOrderDetailsWorkspacePanel = () => {
    if (!selectedOrder) {
      return null;
    }

    return (
      <Box className="batch-panel-layout">
        <Group gap="xs" className="batch-detail-actions">
          <Button
            size="xs"
            radius="sm"
            variant="light"
            color="sage"
            className="batch-context-button"
            onClick={() => openBatch(selectedOrder.batchId)}
          >
            Batch openen
          </Button>
          <Button
            size="xs"
            radius="sm"
            variant="light"
            color="sage"
            className="batch-context-button"
            onClick={() => openCustomer(selectedOrder.customerId)}
          >
            Klant openen
          </Button>
        </Group>
        <Box className="batch-panel-auto-grid batch-panel-grow">
          <Box className="batch-panel-block">
            <Stack gap="xs">
              <Text fw={700}>Orderinfo</Text>
              <DetailRow label="Klant" value={selectedOrder.customerName} />
              <DetailRow label="Batch" value={selectedOrder.batchNumber} />
              {selectedOrderDetailBatch ? (
                <Box className="order-detail-inline-note">
                  <Text size="sm" fw={600}>
                    Vrij op batch: {formatLiters(selectedOrderDetailBatch.availableLiters)}
                  </Text>
                </Box>
              ) : null}
              <DetailRow label="Product" value={selectedOrder.finishedGoodArticleName} />
              <DetailRow label="Volume" value={formatLiters(selectedOrder.orderedLiters)} />
              <DetailRow label="Prijs per liter" value={formatCurrency(selectedOrder.unitPricePerLiter)} />
              <DetailRow label="Totaal" value={formatCurrency(selectedOrder.totalAmount)} />
              <DetailRow label="Besteld op" value={formatShortDate(selectedOrder.orderedAt)} />
              <DetailRow label="Afgerond op" value={formatShortDate(selectedOrder.completedAt)} />
              {selectedOrder.notes ? (
                <>
                  <Divider my="xs" />
                  <Text size="sm" className="muted-copy">
                    {selectedOrder.notes}
                  </Text>
                </>
              ) : null}
            </Stack>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderOrderHistoryWorkspacePanel = () => {
    if (!selectedOrder) {
      return null;
    }

    return (
      <Box className="batch-history-panel">
        <Box className="batch-panel-feed-shell">
          {selectedOrderHistory.length > 0 ? (
            <Stack gap="sm" className="batch-history-list">
              {selectedOrderHistory.map((item) => (
                <Box key={item.id} className="batch-history-item">
                  <Stack gap={6}>
                    <Group justify="space-between" align="flex-start" gap="sm">
                      <Text fw={700}>{formatOrderStatus(item.toStatus)}</Text>
                      <Text size="sm" className="muted-copy">
                        {formatShortDate(item.changedAt.slice(0, 10))}
                      </Text>
                    </Group>
                    {item.fromStatus ? (
                      <Text size="sm" className="muted-copy">
                        Van {formatOrderStatus(item.fromStatus)}
                      </Text>
                    ) : null}
                    {item.note ? (
                      <Text size="sm" className="muted-copy">
                        {item.note}
                      </Text>
                    ) : null}
                  </Stack>
                </Box>
              ))}
            </Stack>
          ) : (
            <Box className="batch-panel-empty">
              <EmptyState
                icon={<IconInfoCircle size={20} />}
                title="Nog geen historiek"
                description="Statuswijzigingen van dit order verschijnen hier."
              />
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  const renderOrderCreateWorkspace = () => (
    <SectionCard
      title="Nieuw order"
      className="batch-screen-card"
      headerStart={
        <ActionIcon
          variant="transparent"
          color="gray"
          size="md"
          radius="xl"
          aria-label="Terug naar orders"
          className="batch-detail-back-button"
          onClick={openOrdersOverview}
        >
          <IconArrowLeft size={18} />
        </ActionIcon>
      }
    >
      <Stack gap="sm">
        <TextInput
          label="Ordernummer"
          value={orderForm.orderNumber}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setOrderForm((current) => ({ ...current, orderNumber: value }));
          }}
        />
        <NativeSelect
          label="Klant"
          data={data.customers.map((customer) => ({
            value: customer.id,
            label: `${customer.firstName} ${customer.lastName}`,
          }))}
          value={orderForm.customerId}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setOrderForm((current) => ({ ...current, customerId: value }));
          }}
        />
        <NativeSelect
          label="Batch"
          data={batchSelectOptions}
          value={orderForm.batchId}
          onChange={(event) => {
            const batchId = event.currentTarget.value;
            setOrderForm((current) => ({ ...current, batchId }));
          }}
        />
        <Group grow>
          <TextInput
            label="Liters"
            type="number"
            step="0.1"
            value={orderForm.orderedLiters}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setOrderForm((current) => ({ ...current, orderedLiters: value }));
            }}
          />
          <TextInput
            label="Orderdatum"
            type="date"
            value={orderForm.orderedAt}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setOrderForm((current) => ({ ...current, orderedAt: value }));
            }}
          />
        </Group>
        <NativeSelect
          label="Status"
          data={ORDER_STATUS_OPTIONS}
          value={orderForm.status}
          onChange={(event) => {
            const value = event.currentTarget.value as OrderStatus;
            setOrderForm((current) => ({
              ...current,
              status: value,
            }));
          }}
        />
        <Textarea
          label="Notitie"
          minRows={3}
          value={orderForm.notes}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setOrderForm((current) => ({ ...current, notes: value }));
          }}
        />
        <Alert color="orange" variant="light" icon={<IconInfoCircle size={16} />}>
          {selectedOrderBatch ? (
            <Stack gap={2}>
              <Text size="sm">
                Batchprijs: {formatCurrency(selectedOrderBatch.unitPricePerLiter)} per liter
              </Text>
              <Text size="sm">Beschikbaar: {formatLiters(selectedOrderBatch.availableLiters)}</Text>
              <Text size="sm">
                Geschat bedrag:{" "}
                {formatCurrency(Number(orderForm.orderedLiters || 0) * selectedOrderBatch.unitPricePerLiter)}
              </Text>
            </Stack>
          ) : (
            <Text size="sm">Kies eerst een batch om het bedrag te zien.</Text>
          )}
        </Alert>
        <Button
          loading={pendingAction === "Order opgeslagen"}
          disabled={databaseUnavailable}
          className="batch-toolbar-button-primary"
          onClick={() =>
            runAction(
              "Order opgeslagen",
              () =>
                createOrderAction({
                  orderNumber: orderForm.orderNumber,
                  customerId: orderForm.customerId,
                  batchId: orderForm.batchId,
                  orderedLiters: Number(orderForm.orderedLiters),
                  status: orderForm.status,
                  orderedAt: orderForm.orderedAt,
                  notes: orderForm.notes,
                } satisfies CreateOrderInput),
              () =>
                setOrderForm((current) => ({
                  ...current,
                  orderNumber: "",
                  notes: "",
                })),
            )
          }
        >
          Order aanmaken
        </Button>
      </Stack>
    </SectionCard>
  );

  const renderOrdersWorkspace = () => {
    const completedOrderCount = filteredOrders.filter((order) => order.status === "afgerond").length;
    const orderedOrderCount = visibleOrders.filter((order) => order.status === "besteld").length;
    const inProgressOrderCount = visibleOrders.filter((order) => order.status === "in_verwerking").length;
    const readyOrderCount = visibleOrders.filter(
      (order) => order.status === "klaar_voor_uitlevering",
    ).length;
    const openOrderCount = visibleOrders.filter(
      (order) => order.status !== "afgerond" && order.status !== "geannuleerd",
    ).length;
    const openOrderLiters = visibleOrders
      .filter((order) => order.status !== "afgerond" && order.status !== "geannuleerd")
      .reduce((sum, order) => sum + order.orderedLiters, 0);
    const filteredOrderTotalAmount = visibleOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    if (orderWorkspaceMode === "create") {
      return (
        <Box className="batch-workspace-shell">
          <Stack gap="md" className="batch-screen-shell">
            {renderOrderCreateWorkspace()}
          </Stack>
        </Box>
      );
    }

    if (orderWorkspaceMode === "detail" && selectedOrder) {
      return (
        <Box className="batch-workspace-shell">
          <Stack gap="md" className="batch-screen-shell batch-detail-screen">
            <SectionCard
              title={selectedOrder.orderNumber}
              subtitle={`${selectedOrder.customerName} · ${selectedOrder.finishedGoodArticleName}`}
              className="batch-screen-card batch-detail-hero-card"
              compact
              headerStart={
                <ActionIcon
                  variant="transparent"
                  color="gray"
                  size="md"
                  radius="xl"
                  aria-label="Terug naar orders"
                  className="batch-detail-back-button"
                  onClick={openOrdersOverview}
                >
                  <IconArrowLeft size={18} />
                </ActionIcon>
              }
              action={
                <Group gap="xs" wrap="nowrap">
                  <ToneBadge color="gray" label={selectedOrder.batchNumber} />
                  <ToneBadge
                    color={getOrderStatusColor(selectedOrder.status)}
                    label={formatOrderStatus(selectedOrder.status)}
                  />
                </Group>
              }
            >
              <Box className="batch-kpi-grid">
                <Card radius="md" padding="md" className="batch-kpi-card batch-kpi-card-hero">
                  <Stack gap={6}>
                    <InfoLabel
                      label="Totaal"
                      description="Dit is het totaalbedrag van het order op basis van volume en vaste prijs per liter."
                    />
                    <Title order={1} className="batch-kpi-value">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </Title>
                  </Stack>
                </Card>
                <Card radius="md" padding="md" className="batch-kpi-card">
                  <Stack gap={6}>
                    <InfoLabel
                      label="Volume"
                      description="Het bestelde volume van dit order in liters."
                    />
                    <Title order={2} className="batch-kpi-value">
                      {formatLiters(selectedOrder.orderedLiters)}
                    </Title>
                  </Stack>
                </Card>
                <Card radius="md" padding="md" className="batch-kpi-card">
                  <Stack gap={6}>
                    <InfoLabel
                      label="Prijs per liter"
                      description="Deze prijs wordt op het order vastgezet zodat historiek stabiel blijft."
                    />
                    <Title order={2} className="batch-kpi-value">
                      {formatCurrency(selectedOrder.unitPricePerLiter)}
                    </Title>
                  </Stack>
                </Card>
                <Card radius="md" padding="md" className="batch-kpi-card">
                  <Stack gap={6}>
                    <InfoLabel
                      label="Batch beschikbaar"
                      description="Vrij volume op de gekoppelde batch op dit moment."
                    />
                    <Title order={2} className="batch-kpi-value">
                      {selectedOrderDetailBatch
                        ? formatLiters(selectedOrderDetailBatch.availableLiters)
                        : "Niet gevonden"}
                    </Title>
                  </Stack>
                </Card>
                <Card radius="md" padding="md" className="batch-kpi-card">
                  <Stack gap={6}>
                    <InfoLabel
                      label="Moment"
                      description="Laatste relevante ordermoment: besteld of afgerond."
                    />
                    <Title order={2} className="batch-kpi-value">
                      {formatShortDate(selectedOrder.completedAt ?? selectedOrder.orderedAt)}
                    </Title>
                  </Stack>
                </Card>
              </Box>
              <Box className="batch-kpi-strip">
                <Box className="batch-kpi-strip-item">
                  <InfoLabel
                    label="Besteld op"
                    size="xs"
                    description="Originele besteldatum van dit order."
                  />
                  <Text fw={700}>{formatShortDate(selectedOrder.orderedAt)}</Text>
                </Box>
                <Box className="batch-kpi-strip-item">
                  <InfoLabel
                    label="Afgerond op"
                    size="xs"
                    description="Datum waarop het order effectief afgerond werd."
                  />
                  <Text fw={700}>{formatShortDate(selectedOrder.completedAt)}</Text>
                </Box>
                <Box className="batch-kpi-strip-item">
                  <InfoLabel
                    label="Klant"
                    size="xs"
                    description="Klant aan wie dit order gekoppeld is."
                  />
                  <Text fw={700} truncate>
                    {selectedOrder.customerName}
                  </Text>
                </Box>
                <Box className="batch-kpi-strip-item">
                  <InfoLabel
                    label="Batch"
                    size="xs"
                    description="Batch waaruit dit order geleverd wordt."
                  />
                  <Text fw={700}>{selectedOrder.batchNumber}</Text>
                </Box>
              </Box>
            </SectionCard>

            <Box className="batch-detail-layout">
              <Box className="batch-detail-pane">
                <SectionCard
                  title="Details"
                  className="batch-screen-card batch-detail-static-card"
                  contentClassName="batch-detail-static-content"
                >
                  {renderOrderDetailsWorkspacePanel()}
                </SectionCard>
              </Box>
              <Box className="batch-detail-pane">
                <SectionCard
                  title="Historiek"
                  className="batch-screen-card batch-history-card"
                  contentClassName="batch-history-card-content"
                >
                  {renderOrderHistoryWorkspacePanel()}
                </SectionCard>
              </Box>
            </Box>
          </Stack>
        </Box>
      );
    }

    return (
      <Box className="batch-workspace-shell">
        <Stack gap="md" className="batch-screen-shell">
          <Box className="batch-overview-summary-grid">
            <Card radius="md" padding="md" className="batch-summary-card">
              <Stack gap="sm">
                <InfoLabel
                  label="Status"
                  description="Deze verdeling toont hoe de zichtbare orders momenteel door de flow bewegen."
                />
                <Box className="batch-summary-status-grid order-summary-status-grid">
                  <Box className="batch-summary-status-item">
                    <InfoLabel
                      label="Besteld"
                      size="xs"
                      description="Nieuwe orders die nog niet in verwerking zitten."
                    />
                    <Text className="batch-summary-status-value">{orderedOrderCount}</Text>
                  </Box>
                  <Box className="batch-summary-status-item">
                    <InfoLabel
                      label="In verwerking"
                      size="xs"
                      description="Orders die al volume reserveren op een batch."
                    />
                    <Text className="batch-summary-status-value">{inProgressOrderCount}</Text>
                  </Box>
                  <Box className="batch-summary-status-item">
                    <InfoLabel
                      label="Klaar"
                      size="xs"
                      description="Orders die klaarstaan voor uitlevering."
                    />
                    <Text className="batch-summary-status-value">{readyOrderCount}</Text>
                  </Box>
                </Box>
              </Stack>
            </Card>
            <Card radius="md" padding="md" className="batch-summary-card">
              <Stack gap={6}>
                <InfoLabel
                  label="Open volume"
                  description="Liters die nog niet afgerond of geannuleerd zijn."
                />
                <Title order={2}>{formatLiters(openOrderLiters)}</Title>
              </Stack>
            </Card>
            <Card radius="md" padding="md" className="batch-summary-card">
              <Stack gap={6}>
                <InfoLabel
                  label="Open orders"
                  description="Orders die nog opvolging vragen in de operationele flow."
                />
                <Title order={2}>{openOrderCount}</Title>
              </Stack>
            </Card>
            <Card radius="md" padding="md" className="batch-summary-card">
              <Stack gap={6}>
                <InfoLabel
                  label="Orderwaarde"
                  description="Totale waarde van de zichtbare orders samen."
                />
                <Title order={2}>{formatCurrency(filteredOrderTotalAmount)}</Title>
              </Stack>
            </Card>
          </Box>

          <SectionCard
            title="Orders"
            subtitle={
              ordersFilterBatch
                ? `Gefilterd op ${ordersFilterBatch.batchNumber}`
                : "Volg statussen, batchkoppeling en verkoopmomenten in één werkruimte."
            }
              action={
                <Group gap="xs">
                  <TextInput
                    aria-label="Zoek orders"
                    placeholder="Zoek order, batch of klant"
                    value={orderSearchQuery}
                    onChange={(event) => setOrderSearchQuery(event.currentTarget.value)}
                    className="workspace-toolbar-select"
                  />
                  {completedOrderCount > 0 ? (
                    <Button
                      size="xs"
                    radius="sm"
                    variant="subtle"
                    color="gray"
                    className={
                      showCompletedOrders
                        ? "batch-toolbar-button batch-toolbar-button-active"
                        : "batch-toolbar-button"
                    }
                    onClick={() => setShowCompletedOrders((current) => !current)}
                  >
                    {showCompletedOrders
                      ? "Verberg afgerond"
                      : `Toon afgerond (${completedOrderCount})`}
                  </Button>
                ) : null}
                {ordersFilterBatch ? (
                  <Button
                    size="xs"
                    radius="sm"
                    variant="subtle"
                    color="gray"
                    className="batch-toolbar-button"
                    onClick={() => setOrdersBatchFilterId(null)}
                  >
                    Alle orders
                  </Button>
                ) : null}
                <Button
                  size="xs"
                  radius="sm"
                  variant="subtle"
                  color="gray"
                  className="batch-toolbar-button batch-toolbar-button-primary"
                  onClick={openOrderCreator}
                >
                  Nieuw order
                </Button>
              </Group>
            }
            className="batch-screen-card batch-overview-card"
            contentClassName="batch-section-content"
          >
            <Box className="batch-table-frame">
              <Box className="batch-table-head order-table-head">
                <Text className="batch-table-head-cell">Order</Text>
                <Text className="batch-table-head-cell">Status</Text>
                <Text className="batch-table-head-cell">Klant</Text>
                <Text className="batch-table-head-cell">Batch</Text>
                <Text className="batch-table-head-cell">Volume</Text>
                <Text className="batch-table-head-cell">Totaal</Text>
                <Text className="batch-table-head-cell">Moment</Text>
              </Box>
              <Box className="batch-table-scroll">
                  {searchedVisibleOrders.length > 0 ? (
                    <Stack gap={0}>
                      {searchedVisibleOrders.map((order) => {
                        const statusTone = getOrderStatusColor(order.status);

                      return (
                        <Box
                          key={order.id}
                          className="batch-table-row order-table-row"
                          role="button"
                          tabIndex={0}
                          onClick={() => openOrder(order.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openOrder(order.id);
                            }
                          }}
                        >
                          <Box className="batch-table-cell batch-table-cell-primary" data-label="Order">
                            <Text className="batch-table-batch-number">{order.orderNumber}</Text>
                          </Box>
                          <Box className="batch-table-cell batch-table-cell-mobile-full" data-label="Status">
                            <Group gap={8} wrap="nowrap" className="batch-table-status">
                              <Box className={`batch-status-dot batch-status-dot-${statusTone}`} />
                              <NativeSelect
                                aria-label={`Status voor ${order.orderNumber}`}
                                size="xs"
                                radius="md"
                                value={order.status}
                                data={ORDER_STATUS_OPTIONS}
                                disabled={databaseUnavailable || pendingAction === "Orderstatus bijgewerkt"}
                                className={`batch-table-select batch-table-select-tag batch-table-select-tag-${statusTone}`}
                                onClick={(event) => event.stopPropagation()}
                                onMouseDown={(event) => event.stopPropagation()}
                                onKeyDown={(event) => event.stopPropagation()}
                                onChange={(event) => {
                                  event.stopPropagation();
                                  const nextStatus = event.currentTarget.value as OrderStatus;

                                  if (nextStatus === order.status) {
                                    return;
                                  }

                                  void runAction("Orderstatus bijgewerkt", () =>
                                    updateOrderStatusAction({
                                      orderId: order.id,
                                      status: nextStatus,
                                    }),
                                  );
                                }}
                              />
                            </Group>
                          </Box>
                          <Box className="batch-table-cell" data-label="Klant">
                            <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                              {order.customerName}
                            </Text>
                          </Box>
                          <Box className="batch-table-cell" data-label="Batch">
                            <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                              {order.batchNumber}
                            </Text>
                          </Box>
                          <Box className="batch-table-cell" data-label="Volume">
                            <Text size="sm" fw={700} className="batch-table-metric">
                              {formatLiters(order.orderedLiters)}
                            </Text>
                          </Box>
                          <Box className="batch-table-cell" data-label="Totaal">
                            <Text size="sm" fw={700} className="batch-table-metric">
                              {formatCurrency(order.totalAmount)}
                            </Text>
                          </Box>
                          <Box className="batch-table-cell" data-label="Moment">
                            <Text size="sm" fw={600} className="batch-table-metric batch-table-metric-soft">
                              {order.completedAt
                                ? `Afgerond ${formatShortDate(order.completedAt)}`
                                : formatShortDate(order.orderedAt)}
                            </Text>
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                  ) : orderSearchTerm ? (
                    <EmptyState
                      icon={<IconShoppingBag size={20} />}
                      title="Geen orders gevonden"
                      description="Pas je zoekterm aan om opnieuw orders in de lijst te zien."
                    />
                  ) : completedOrderCount > 0 && !showCompletedOrders ? (
                    <EmptyState
                      icon={<IconShoppingBag size={20} />}
                    title="Afgeronde orders zijn verborgen"
                    description="Gebruik de filter rechtsboven om ook afgeronde orders terug te zien."
                  />
                ) : ordersFilterBatch ? (
                  <EmptyState
                    icon={<IconShoppingBag size={20} />}
                    title="Nog geen orders op deze batch"
                    description="Je kan vanuit deze context meteen een nieuw order voor deze batch toevoegen."
                  />
                ) : (
                  <EmptyState
                    icon={<IconShoppingBag size={20} />}
                    title="Nog geen orders"
                    description="Nieuwe orders verschijnen hier zodra ze aangemaakt zijn."
                  />
                )}
              </Box>
            </Box>
          </SectionCard>
        </Stack>
      </Box>
    );
  };

  const renderExpensesListWorkspace = () => {
    const filteredExpenseTotalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const articleById = new Map(data.articles.map((article) => [article.id, article]));
    const expenseBatchIds = Array.from(new Set(filteredExpenses.map((expense) => expense.batchId)));
    const filteredExpenseBatches = expenseBatchIds
      .map((batchId) => data.batches.find((batch) => batch.id === batchId))
      .filter((batch): batch is Batch => Boolean(batch));
    const totalExpectedOutputLiters = filteredExpenseBatches.reduce(
      (sum, batch) => sum + batch.expectedOutputLiters,
      0,
    );
    const alcoholArticleIds = new Set(
      data.articles
        .filter((article) => {
          const articleLabel = `${article.name} ${article.sku ?? ""}`;

          return article.category === "ingredient" && /(alcohol|ethanol|spirit|alc)/i.test(articleLabel);
        })
        .map((article) => article.id),
    );
    const alcoholExpenses = filteredExpenses.filter((expense) => alcoholArticleIds.has(expense.articleId));
    const totalAlcoholExpenseAmount = alcoholExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalAlcoholExpenseLiters = alcoholExpenses.reduce((sum, expense) => {
      if (expense.unit === "l" && expense.quantity) {
        return sum + expense.quantity;
      }

      return sum;
    }, 0);
    const averageAlcoholCostPerLiter =
      totalAlcoholExpenseLiters > 0 ? totalAlcoholExpenseAmount / totalAlcoholExpenseLiters : null;
    const averageCostPerOutputLiter =
      totalExpectedOutputLiters > 0 ? filteredExpenseTotalAmount / totalExpectedOutputLiters : null;
    const expenseTotalsByArticle = filteredExpenses.reduce<Map<string, { name: string; amount: number }>>(
      (totals, expense) => {
        const current = totals.get(expense.articleId);
        totals.set(expense.articleId, {
          name: expense.articleName,
          amount: (current?.amount ?? 0) + expense.amount,
        });
        return totals;
      },
      new Map(),
    );
    const largestExpenseArticle =
      Array.from(expenseTotalsByArticle.values()).sort((left, right) => right.amount - left.amount)[0] ?? null;
    const averageCostPerArticle = Array.from(
      filteredExpenses.reduce<
        Map<
          string,
          { name: string; unit: string; totalAmount: number; totalQuantity: number; registrations: number }
        >
      >((totals, expense) => {
        const article = articleById.get(expense.articleId);
        const current = totals.get(expense.articleId);
        const unit = expense.unit ?? article?.defaultUnit ?? "";

        totals.set(expense.articleId, {
          name: expense.articleName,
          unit,
          totalAmount: (current?.totalAmount ?? 0) + expense.amount,
          totalQuantity: (current?.totalQuantity ?? 0) + (expense.quantity ?? 0),
          registrations: (current?.registrations ?? 0) + 1,
        });

        return totals;
      }, new Map()).values(),
    ).sort((left, right) => right.totalAmount - left.totalAmount);

    return (
      <>
        <Box className="batch-workspace-shell">
          <Stack gap="md" className="batch-screen-shell expenses-screen-shell">
          <Box className="batch-overview-summary-grid">
            <Card radius="md" padding="md" className="batch-summary-card">
              <Stack gap={6}>
                <InfoLabel
                  label="Totale zichtbare kosten"
                  description="Som van alle zichtbare kosten samen binnen de huidige filter."
                />
                <Title order={2}>{formatCurrency(filteredExpenseTotalAmount)}</Title>
              </Stack>
            </Card>
            <Card radius="md" padding="md" className="batch-summary-card">
              <Stack gap={6}>
                <InfoLabel
                  label="Kost per L alcoholinput"
                  description="Alleen geregistreerde alcoholkosten gedeeld door de zichtbare liters alcohol."
                />
                <Title order={2}>
                  {averageAlcoholCostPerLiter === null
                    ? "n.v.t."
                    : `${formatCurrency(averageAlcoholCostPerLiter)}/L`}
                </Title>
              </Stack>
            </Card>
            <Card radius="md" padding="md" className="batch-summary-card">
              <Stack gap={6}>
                <InfoLabel
                  label="Kost per L output"
                  description="Zichtbare kosten gedeeld door de verwachte output van de betrokken batches."
                />
                <Title order={2}>
                  {averageCostPerOutputLiter === null
                    ? "n.v.t."
                    : `${formatCurrency(averageCostPerOutputLiter)}/L`}
                </Title>
              </Stack>
            </Card>
            <Card radius="md" padding="md" className="batch-summary-card">
              <Stack gap={6}>
                <InfoLabel
                  label="Grootste kostenpost"
                  description="Artikelgroep die momenteel het grootste deel van de zichtbare kosten draagt."
                />
                <Title order={2}>{largestExpenseArticle?.name ?? "Geen kosten"}</Title>
                <Text size="sm" className="muted-copy">
                  {largestExpenseArticle ? formatCurrency(largestExpenseArticle.amount) : "Nog geen bedrag"}
                </Text>
              </Stack>
            </Card>
          </Box>

          <Grid gutter="md" className="expenses-detail-layout">
            <Grid.Col span={{ base: 12, xl: 3 }} className="batch-detail-pane">
              <SectionCard
                title="Gemiddelde kost per artikel"
                compact
                className="batch-screen-card batch-history-card expenses-scroll-card"
                contentClassName="batch-history-card-content expenses-scroll-card-content"
              >
                <ScrollArea
                  type="always"
                  offsetScrollbars
                  scrollbars="y"
                  scrollbarSize={8}
                  className="batch-panel-feed-shell expenses-scroll-shell"
                >
                  {averageCostPerArticle.length > 0 ? (
                    <Stack gap="sm" className="batch-history-list">
                      {averageCostPerArticle.map((article) => (
                        <Box key={article.name} className="batch-history-item">
                          <Stack gap={6}>
                            <Group justify="space-between" align="flex-start" gap="sm">
                              <Text fw={700}>{article.name}</Text>
                              <Text size="sm" className="muted-copy">
                                {article.totalQuantity > 0 && article.unit
                                  ? `${formatCurrency(article.totalAmount / article.totalQuantity)}/${article.unit}`
                                  : "n.v.t."}
                              </Text>
                            </Group>
                            <Text size="sm" className="muted-copy">
                              {formatCurrency(article.totalAmount)} totaal
                              {article.totalQuantity > 0 && article.unit
                                ? ` · ${article.totalQuantity} ${article.unit}`
                                : ""}
                            </Text>
                            <Text size="sm" className="muted-copy">
                              {article.registrations} registratie{article.registrations === 1 ? "" : "s"}
                            </Text>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <EmptyState
                      icon={<IconInfoCircle size={20} />}
                      title="Nog geen artikels"
                      description="Zodra er kosten zichtbaar zijn, zie je hier de gemiddelde kost per artikel."
                    />
                  )}
                </ScrollArea>
              </SectionCard>
            </Grid.Col>
            <Grid.Col span={{ base: 12, xl: 4, lg: 7 }} className="batch-detail-pane">
              <SectionCard
                title={expensesFilterBatch ? `Kosten · ${expensesFilterBatch.batchNumber}` : "Alle kosten"}
                compact
                action={
                  <Group gap="xs" className="workspace-toolbar-group">
                    <NativeSelect
                      aria-label="Filter kosten op batch"
                      value={expensesBatchFilterId ?? ""}
                      data={batchFilterOptions}
                      onChange={(event) => {
                        const batchId = event.currentTarget.value;
                        setExpensesBatchFilterId(batchId || null);
                      }}
                      className="workspace-toolbar-select"
                    />
                    <Button
                      radius="sm"
                      className="batch-toolbar-button-primary"
                      onClick={() => openExpenseCreator(expensesBatchFilterId)}
                    >
                      Nieuwe kost
                    </Button>
                  </Group>
                }
                className="batch-screen-card batch-detail-static-card expenses-scroll-card"
                contentClassName="batch-detail-static-content expenses-scroll-card-content"
              >
                <ScrollArea
                  type="always"
                  offsetScrollbars
                  scrollbars="y"
                  scrollbarSize={8}
                  className="batch-list-scroll expenses-scroll-shell"
                >
                  <Stack gap="sm">
                    {filteredExpenses.length > 0 ? (
                      filteredExpenses.map((expense) => (
                        <SelectableCard
                          key={expense.id}
                          selected={expense.id === selectedExpenseId}
                          title={expense.articleName}
                          subtitle={`${expense.batchNumber} · ${formatShortDate(expense.expenseDate)}`}
                          badge={
                            <ToneBadge
                              color={expense.paymentMethod === "cash" ? "orange" : "blue"}
                              label={formatCurrency(expense.amount)}
                            />
                          }
                          meta={
                            <Stack gap={2}>
                              <Text size="sm" className="muted-copy">
                                {formatPaymentMethod(expense.paymentMethod)}
                                {expense.supplierName ? ` · ${expense.supplierName}` : ""}
                              </Text>
                              <Text size="sm" className="muted-copy">
                                {expense.quantity && expense.unit
                                  ? `${expense.quantity} ${expense.unit}`
                                  : "Geen hoeveelheid ingevuld"}
                              </Text>
                            </Stack>
                          }
                          onClick={() => setSelectedExpenseId(expense.id)}
                        />
                      ))
                    ) : (
                      <EmptyState
                        icon={<IconInfoCircle size={20} />}
                        title={expensesFilterBatch ? "Geen kosten voor deze batch" : "Nog geen kosten"}
                        description={
                          expensesFilterBatch
                            ? "Pas de filter aan of registreer meteen een nieuwe kost voor deze batch."
                            : "Registreer de eerste kosten om batchmarges te kunnen zien."
                        }
                      />
                    )}
                  </Stack>
                </ScrollArea>
              </SectionCard>
            </Grid.Col>
            <Grid.Col span={{ base: 12, xl: 5, lg: 5 }} className="batch-detail-pane">
              <SectionCard
                title="Kostdetail"
                compact
                className="batch-screen-card batch-history-card"
                contentClassName="batch-history-card-content"
              >
                <Box className="batch-panel-feed-shell">
                  {selectedExpense ? (
                    <Stack gap="sm" style={{ width: "100%" }}>
                      <Group justify="space-between" align="flex-start" gap="sm">
                        <Stack gap={2}>
                          <Text fw={700}>{selectedExpense.articleName}</Text>
                          <Text size="sm" className="muted-copy">
                            {selectedExpense.batchNumber}
                          </Text>
                        </Stack>
                        <ToneBadge
                          color={selectedExpense.paymentMethod === "cash" ? "orange" : "blue"}
                          label={formatCurrency(selectedExpense.amount)}
                        />
                      </Group>
                      <DetailRow label="Datum" value={formatShortDate(selectedExpense.expenseDate)} />
                      <DetailRow
                        label="Hoeveelheid"
                        value={
                          selectedExpense.quantity && selectedExpense.unit
                            ? `${selectedExpense.quantity} ${selectedExpense.unit}`
                            : "Niet ingevuld"
                        }
                      />
                      <DetailRow
                        label="Betaalmethode"
                        value={formatPaymentMethod(selectedExpense.paymentMethod)}
                      />
                      <DetailRow
                        label="Leverancier"
                        value={selectedExpense.supplierName ?? "Niet ingevuld"}
                      />
                      <DetailRow
                        label="Laatste update"
                        value={formatShortDate(selectedExpense.updatedAt.slice(0, 10))}
                      />
                      <Group gap="xs" className="batch-detail-actions">
                        <Button
                          size="xs"
                          radius="sm"
                          variant="light"
                          color="sage"
                          className="batch-context-button"
                          onClick={() => openBatch(selectedExpense.batchId)}
                        >
                          Batch openen
                        </Button>
                      </Group>
                      {selectedExpense.notes ? (
                        <Box className="order-detail-inline-note">
                          <Text size="sm" className="muted-copy">
                            {selectedExpense.notes}
                          </Text>
                        </Box>
                      ) : null}
                    </Stack>
                  ) : (
                    <EmptyState
                      icon={<IconInfoCircle size={20} />}
                      title="Geen kost geselecteerd"
                      description="Kies links een kost om details en context te zien."
                    />
                  )}
                </Box>
              </SectionCard>
            </Grid.Col>
          </Grid>
          </Stack>
        </Box>

        <Drawer
          opened={expenseCreateOpened}
          onClose={closeExpenseCreator}
          position="right"
          size="32rem"
          title="Nieuwe kost"
        >
          <Stack gap="sm">
            <NativeSelect
              label="Batch"
              data={batchSelectOptions}
              value={expenseForm.batchId}
              onChange={(event) => {
                const batchId = event.currentTarget.value;
                setExpenseForm((current) => ({ ...current, batchId }));
              }}
            />
            <NativeSelect
              label="Artikel"
              data={data.articles.map((article) => ({
                value: article.id,
                label: article.name,
              }))}
              value={expenseForm.articleId}
              onChange={(event) => {
                const articleId = event.currentTarget.value;
                const article = data.articles.find((item) => item.id === articleId);
                setExpenseForm((current) => ({
                  ...current,
                  articleId,
                  unit: article?.defaultUnit ?? current.unit,
                }));
              }}
            />
            <Group grow>
              <TextInput
                label="Datum"
                type="date"
                value={expenseForm.expenseDate}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setExpenseForm((current) => ({
                    ...current,
                    expenseDate: value,
                  }));
                }}
              />
              <TextInput
                label="Bedrag"
                type="number"
                step="0.01"
                value={expenseForm.amount}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setExpenseForm((current) => ({ ...current, amount: value }));
                }}
              />
            </Group>
            <Group grow>
              <TextInput
                label="Hoeveelheid"
                type="number"
                step="0.1"
                value={expenseForm.quantity}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setExpenseForm((current) => ({ ...current, quantity: value }));
                }}
              />
              <NativeSelect
                label="Eenheid"
                data={UNIT_OPTIONS}
                value={expenseForm.unit}
                onChange={(event) => {
                  const value = event.currentTarget.value as Unit;
                  setExpenseForm((current) => ({
                    ...current,
                    unit: value,
                  }));
                }}
              />
            </Group>
            <NativeSelect
              label="Betaalmethode"
              data={PAYMENT_METHOD_OPTIONS}
              value={expenseForm.paymentMethod}
              onChange={(event) => {
                const value = event.currentTarget.value as PaymentMethod;
                setExpenseForm((current) => ({
                  ...current,
                  paymentMethod: value,
                }));
              }}
            />
            <TextInput
              label="Leverancier"
              value={expenseForm.supplierName}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setExpenseForm((current) => ({
                  ...current,
                  supplierName: value,
                }));
              }}
            />
            <Textarea
              label="Notitie"
              minRows={3}
              value={expenseForm.notes}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setExpenseForm((current) => ({ ...current, notes: value }));
              }}
            />
            <Button
              loading={pendingAction === "Kost opgeslagen"}
              disabled={databaseUnavailable}
              className="batch-toolbar-button-primary"
              onClick={() =>
                runAction(
                  "Kost opgeslagen",
                  () =>
                    createExpenseAction({
                      batchId: expenseForm.batchId,
                      articleId: expenseForm.articleId,
                      expenseDate: expenseForm.expenseDate,
                      quantity: expenseForm.quantity ? Number(expenseForm.quantity) : null,
                      unit: expenseForm.quantity ? expenseForm.unit : null,
                      amount: Number(expenseForm.amount),
                      paymentMethod: expenseForm.paymentMethod,
                      supplierName: expenseForm.supplierName,
                      notes: expenseForm.notes,
                    } satisfies CreateExpenseInput),
                  () => {
                    setExpenseCreateOpened(false);
                    setExpenseForm(buildExpenseFormState(data, expenseForm.batchId));
                  },
                )
              }
            >
              Kost registreren
            </Button>
          </Stack>
        </Drawer>
      </>
    );
  };

  const renderRevenue = () => (
    <Box className="batch-workspace-shell">
      <Stack gap="md" className="batch-screen-shell revenue-screen-shell">
        <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
          <MetricCard
            label="Boekingen"
            value={String(filteredRevenueEntries.length)}
            infoDescription="Boekingen zijn opbrengstregels die effectief aangemaakt zijn vanuit afgeronde orders."
          />
          <MetricCard
            label="Verkocht volume"
            value={formatLiters(filteredRevenueLiters)}
            infoDescription="Verkocht volume telt alleen liters mee die als opbrengst geboekt zijn."
          />
          <MetricCard
            label="Omzet"
            value={formatCurrency(filteredRevenueAmount)}
            infoDescription="Omzet is de som van alle zichtbare opbrengstregels in deze lijst."
          />
          <MetricCard
            label="Gem. orderwaarde"
            value={
              filteredRevenueAverageOrderValue === null
                ? "n.v.t."
                : formatCurrency(filteredRevenueAverageOrderValue)
            }
            infoDescription="Gemiddelde orderwaarde is de zichtbare omzet gedeeld door het aantal zichtbare afgeronde orders."
          />
        </SimpleGrid>

        <Grid gutter="md" className="revenue-detail-layout">
          <Grid.Col span={{ base: 12, xl: 3 }} className="batch-detail-pane">
            <Box className="revenue-insights-rail">
              <SectionCard
                title="Analyse"
                compact
                onClick={() => setRevenueInsightsPanel("analysis")}
                action={
                  <Box className="revenue-insight-toggle-indicator" aria-hidden="true">
                    {revenueInsightsPanel === "analysis" ? (
                      <IconChevronUp size={16} />
                    ) : (
                      <IconChevronDown size={16} />
                    )}
                  </Box>
                }
                className={[
                  "batch-screen-card",
                  "batch-history-card",
                  "revenue-insight-card",
                  revenueInsightsPanel === "analysis"
                    ? "revenue-insight-card-active"
                    : "revenue-insight-card-collapsed",
                ].join(" ")}
                contentClassName={[
                  "batch-history-card-content",
                  "revenue-insight-card-content",
                  revenueInsightsPanel === "analysis"
                    ? "revenue-insight-card-content-active"
                    : "revenue-insight-card-content-collapsed",
                ].join(" ")}
              >
                {revenueInsightsPanel === "analysis" ? (
                  <Box className="revenue-insight-card-body">
                    <Stack gap="sm">
                      <Card radius="md" padding="md" className="batch-summary-card">
                        <Stack gap={6}>
                          <InfoLabel
                            label="Gem. prijs per L"
                            description="Zichtbare omzet gedeeld door het zichtbare verkochte volume."
                          />
                          <Title order={2}>
                            {filteredRevenueAveragePricePerLiter === null
                              ? "n.v.t."
                              : `${formatCurrency(filteredRevenueAveragePricePerLiter)}/L`}
                          </Title>
                        </Stack>
                      </Card>
                      <Card radius="md" padding="md" className="batch-summary-card">
                        <Stack gap={6}>
                          <InfoLabel
                            label="Sterkste batch"
                            description="Batch die momenteel de meeste omzet draagt binnen de zichtbare opbrengsten."
                          />
                          <Title order={2}>{topRevenueBatch?.batchNumber ?? "Geen batch"}</Title>
                          <Text size="sm" className="muted-copy">
                            {topRevenueBatch
                              ? `${formatCurrency(topRevenueBatch.totalAmount)} · ${formatLiters(topRevenueBatch.litersSold)}`
                              : "Nog geen opbrengsten"}
                          </Text>
                        </Stack>
                      </Card>
                      <Card radius="md" padding="md" className="batch-summary-card">
                        <Stack gap={6}>
                          <InfoLabel
                            label="Topklant"
                            description="Klant die binnen de zichtbare filter het meeste omzet genereert."
                          />
                          <Title order={2}>{topRevenueCustomer?.customerName ?? "Geen klant"}</Title>
                          <Text size="sm" className="muted-copy">
                            {topRevenueCustomer
                              ? `${formatCurrency(topRevenueCustomer.totalAmount)} · ${topRevenueCustomer.bookings} order${topRevenueCustomer.bookings === 1 ? "" : "s"}`
                              : "Nog geen opbrengsten"}
                          </Text>
                        </Stack>
                      </Card>
                    </Stack>
                  </Box>
                ) : null}
              </SectionCard>

              <SectionCard
                title="Omzet per batch"
                compact
                onClick={() => setRevenueInsightsPanel("batch_breakdown")}
                action={
                  <Box className="revenue-insight-toggle-indicator" aria-hidden="true">
                    {revenueInsightsPanel === "batch_breakdown" ? (
                      <IconChevronUp size={16} />
                    ) : (
                      <IconChevronDown size={16} />
                    )}
                  </Box>
                }
                className={[
                  "batch-screen-card",
                  "batch-history-card",
                  "revenue-insight-card",
                  revenueInsightsPanel === "batch_breakdown"
                    ? "revenue-insight-card-active"
                    : "revenue-insight-card-collapsed",
                ].join(" ")}
                contentClassName={[
                  "batch-history-card-content",
                  "revenue-insight-card-content",
                  revenueInsightsPanel === "batch_breakdown"
                    ? "revenue-insight-card-content-active"
                    : "revenue-insight-card-content-collapsed",
                ].join(" ")}
              >
                {revenueInsightsPanel === "batch_breakdown" ? (
                  <Box className="revenue-insight-card-body">
                    <Box className="batch-panel-feed-shell">
                      {revenueTotalsByBatch.length > 0 ? (
                        <Stack gap="sm" className="batch-history-list">
                          {revenueTotalsByBatch.map((batch) => (
                            <Box key={batch.batchId} className="batch-history-item">
                              <Stack gap={6}>
                                <Group justify="space-between" align="flex-start" gap="sm">
                                  <Text fw={700}>{batch.batchNumber}</Text>
                                  <Text size="sm" className="muted-copy">
                                    {formatCurrency(batch.totalAmount)}
                                  </Text>
                                </Group>
                                <Text size="sm" className="muted-copy">
                                  {batch.finishedGoodArticleName}
                                </Text>

                                <Text size="sm" className="muted-copy">
                                  {formatLiters(batch.litersSold)} · {batch.bookings} boeking
                                  {batch.bookings === 1 ? "" : "en"}
                                </Text>
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <EmptyState
                          icon={<IconInfoCircle size={20} />}
                          title="Nog geen batchomzet"
                          description="Zodra orders afgerond zijn, zie je hier welke batches de omzet dragen."
                        />
                      )}
                    </Box>
                  </Box>
                ) : null}
              </SectionCard>
            </Box>
          </Grid.Col>
          <Grid.Col span={{ base: 12, xl: 4, lg: 7 }} className="batch-detail-pane">
            <SectionCard
              title={revenueFilterBatch ? `Opbrengsten · ${revenueFilterBatch.batchNumber}` : "Alle opbrengsten"}
              subtitle="Read-only analyse van afgeronde orders en hun omzetregels."
              compact
              action={
                <Group gap="xs" className="workspace-toolbar-group">
                  <TextInput
                    aria-label="Zoek opbrengsten"
                    placeholder="Zoek order, batch of klant"
                    value={revenueSearchQuery}
                    onChange={(event) => setRevenueSearchQuery(event.currentTarget.value)}
                    className="workspace-toolbar-select"
                  />
                  <NativeSelect
                    aria-label="Filter opbrengsten op batch"
                    value={revenueBatchFilterId ?? ""}
                    data={batchFilterOptions}
                    onChange={(event) => {
                      const batchId = event.currentTarget.value;
                      setRevenueBatchFilterId(batchId || null);
                    }}
                    className="workspace-toolbar-select"
                  />
                  {revenueFilterBatch ? (
                    <Button
                      size="xs"
                      radius="sm"
                      variant="subtle"
                      color="gray"
                      onClick={() => setRevenueBatchFilterId(null)}
                    >
                      Alle batches
                    </Button>
                  ) : null}
                </Group>
              }
              className="batch-screen-card batch-detail-static-card"
              contentClassName="batch-detail-static-content"
            >
              <Box className="batch-list-scroll">
                <Stack gap="sm">
                  {searchedRevenueEntries.length > 0 ? (
                    searchedRevenueEntries.map((entry) => (
                      <SelectableCard
                        key={entry.id}
                        selected={entry.id === selectedRevenueEntryId}
                        title={entry.orderNumber}
                        subtitle={`${entry.customerName} · ${entry.batchNumber}`}
                        badge={<ToneBadge color="teal" label={formatCurrency(entry.totalAmount)} />}
                        meta={
                          <Stack gap={2}>
                            <Text size="sm" className="muted-copy">
                              {formatLiters(entry.litersSold)} · {formatShortDate(entry.recognizedAt)}
                            </Text>
                            <Text size="sm" className="muted-copy">
                              {entry.finishedGoodArticleName}
                            </Text>
                          </Stack>
                        }
                        onClick={() => setSelectedRevenueEntryId(entry.id)}
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon={<IconShoppingBag size={20} />}
                      title={
                        revenueSearchTerm
                          ? "Geen opbrengsten gevonden"
                          : revenueFilterBatch
                            ? "Geen opbrengsten voor deze batch"
                            : "Nog geen opbrengsten"
                      }
                      description={
                        revenueSearchTerm
                          ? "Verfijn je zoekterm of pas de batchfilter aan om een opbrengstregel terug te vinden."
                          : revenueFilterBatch
                            ? "Pas de filter aan of rond orders af om hier omzet voor deze batch te zien."
                            : "Zodra orders afgerond zijn, verschijnen de opbrengsten hier."
                      }
                    />
                  )}
                </Stack>
              </Box>
            </SectionCard>
          </Grid.Col>
          <Grid.Col span={{ base: 12, xl: 5, lg: 5 }} className="batch-detail-pane">
            <SectionCard
              title="Opbrengstdetail"
              compact
                className="batch-screen-card batch-history-card"
                contentClassName="batch-history-card-content"
              >
              <Box className="batch-panel-feed-shell">
                {selectedRevenueEntry ? (
                  <Stack gap="sm" style={{ width: "100%" }}>
                    <Group justify="space-between" align="flex-start" gap="sm">
                      <Stack gap={2}>
                        <Text fw={700}>{selectedRevenueEntry.orderNumber}</Text>
                        <Text size="sm" className="muted-copy">
                          {selectedRevenueEntry.customerName} · {selectedRevenueEntry.batchNumber}
                        </Text>
                      </Stack>
                      <ToneBadge color="teal" label={formatCurrency(selectedRevenueEntry.totalAmount)} />
                    </Group>
                    <DetailRow label="Klant" value={selectedRevenueEntry.customerName} />
                    <DetailRow label="Batch" value={selectedRevenueEntry.batchNumber} />
                    <DetailRow label="Product" value={selectedRevenueEntry.finishedGoodArticleName} />
                    <DetailRow label="Volume" value={formatLiters(selectedRevenueEntry.litersSold)} />
                    <DetailRow
                      label="Prijs per liter"
                      value={formatCurrency(selectedRevenueEntry.unitPricePerLiter)}
                    />
                    <DetailRow
                      label="Geboekt op"
                      value={formatShortDate(selectedRevenueEntry.recognizedAt)}
                    />
                    <DetailRow
                      label="Order afgerond"
                      value={formatShortDate(selectedRevenueOrder?.completedAt ?? selectedRevenueEntry.recognizedAt)}
                    />
                    <Divider />
                    <Text fw={700}>Context</Text>
                    <DetailRow
                      label="Batchomzet"
                      value={
                        selectedRevenueBatchDetail
                          ? formatCurrency(selectedRevenueBatchDetail.revenueAmount)
                          : "Niet gevonden"
                      }
                    />
                    <DetailRow
                      label="Batchkosten"
                      value={
                        selectedRevenueBatchDetail
                          ? formatCurrency(selectedRevenueBatchDetail.costAmount)
                          : "Niet gevonden"
                      }
                    />
                    <DetailRow
                      label="Batchmarge"
                      value={
                        selectedRevenueBatchDetail
                          ? formatCurrency(selectedRevenueBatchDetail.marginAmount)
                          : "Niet gevonden"
                      }
                    />
                    <Group gap="xs" className="batch-detail-actions">
                      <Button
                        size="xs"
                        radius="sm"
                        variant="light"
                        color="sage"
                        className="batch-context-button"
                        onClick={() => openOrder(selectedRevenueEntry.orderId)}
                      >
                        Order openen
                      </Button>
                      <Button
                        size="xs"
                        radius="sm"
                        variant="light"
                        color="gray"
                        className="batch-context-button"
                        onClick={() => openBatch(selectedRevenueEntry.batchId)}
                      >
                        Batch openen
                      </Button>
                      {selectedRevenueCustomer ? (
                        <Button
                          size="xs"
                          radius="sm"
                          variant="light"
                          color="gray"
                          className="batch-context-button"
                          onClick={() => openCustomer(selectedRevenueCustomer.id)}
                        >
                          Klant openen
                        </Button>
                      ) : null}
                    </Group>
                    {selectedRevenueEntry.notes ? (
                      <Box className="order-detail-inline-note">
                        <Text size="sm" className="muted-copy">
                          {selectedRevenueEntry.notes}
                        </Text>
                      </Box>
                    ) : (
                      <Alert color="teal" variant="light" icon={<IconInfoCircle size={16} />}>
                        Deze opbrengstregel wordt automatisch aangemaakt zodra het gekoppelde order afgerond is.
                      </Alert>
                    )}
                  </Stack>
                ) : (
                  <EmptyState
                    icon={<IconInfoCircle size={20} />}
                    title="Geen opbrengst geselecteerd"
                    description="Kies links een opbrengst om omzet en batchcontext te bekijken."
                  />
                )}
              </Box>
            </SectionCard>
          </Grid.Col>
        </Grid>
      </Stack>
    </Box>
  );

  const renderCustomersWorkspace = () => {
    const customersWithOrdersCount = customerSummaries.filter((customer) => customer.orderCount > 0).length;
    const customersWithRevenueCount = customerSummaries.filter((customer) => customer.revenueAmount > 0).length;
    const customersWithOpenOrdersCount = customerSummaries.filter((customer) => customer.openOrderCount > 0).length;
    const totalOpenCustomerOrders = customerSummaries.reduce(
      (sum, customer) => sum + customer.openOrderCount,
      0,
    );
    const totalCustomerRevenue = customerSummaries.reduce((sum, customer) => sum + customer.revenueAmount, 0);
    const totalCustomerLitersSold = customerSummaries.reduce((sum, customer) => sum + customer.litersSold, 0);
    const averageRevenuePerPayingCustomer =
      customersWithRevenueCount > 0 ? totalCustomerRevenue / customersWithRevenueCount : null;
    const mostActiveCustomer =
      [...customerSummaries].sort((left, right) => right.orderCount - left.orderCount)[0] ?? null;
    const newestCustomer =
      [...customerSummaries].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0] ?? null;

    const customerCreateDrawer = (
      <Drawer
        opened={customerCreateOpened}
        onClose={closeCustomerCreator}
        position="right"
        size="30rem"
        title="Nieuwe klant"
      >
        <Stack gap="sm">
          <Group grow>
            <TextInput
              label="Voornaam"
              value={customerForm.firstName}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setCustomerForm((current) => ({
                  ...current,
                  firstName: value,
                }));
              }}
            />
            <TextInput
              label="Achternaam"
              value={customerForm.lastName}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setCustomerForm((current) => ({
                  ...current,
                  lastName: value,
                }));
              }}
            />
          </Group>
          <TextInput
            label="E-mail"
            value={customerForm.email}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setCustomerForm((current) => ({ ...current, email: value }));
            }}
          />
          <TextInput
            label="Telefoon"
            value={customerForm.phone}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setCustomerForm((current) => ({ ...current, phone: value }));
            }}
          />
          <Textarea
            label="Notitie"
            minRows={4}
            value={customerForm.notes}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setCustomerForm((current) => ({ ...current, notes: value }));
            }}
          />
          <Button
            loading={pendingAction === "Klant opgeslagen"}
            disabled={databaseUnavailable}
            className="batch-toolbar-button-primary"
            onClick={() =>
              runAction(
                "Klant opgeslagen",
                () =>
                  createCustomerAction({
                    firstName: customerForm.firstName,
                    lastName: customerForm.lastName,
                    email: customerForm.email,
                    phone: customerForm.phone,
                    notes: customerForm.notes,
                  } satisfies CreateCustomerInput),
                () => {
                  setCustomerCreateOpened(false);
                  setCustomerForm({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    notes: "",
                  });
                },
              )
            }
          >
            Klant aanmaken
          </Button>
        </Stack>
      </Drawer>
    );

    if (customerWorkspaceMode === "detail" && selectedCustomer && selectedCustomerSummary) {
      return (
        <>
          <Box className="batch-workspace-shell">
            <Stack gap="md" className="batch-screen-shell batch-detail-screen customer-screen-shell">
              <SectionCard
                title={selectedCustomerSummary.fullName}
                subtitle="Klantcontext, contactinfo, orders en opbrengsten."
                className="batch-screen-card batch-detail-hero-card"
                compact
                headerStart={
                  <ActionIcon
                    variant="transparent"
                    color="gray"
                    size="md"
                    radius="xl"
                    aria-label="Terug naar klanten"
                    className="batch-detail-back-button"
                    onClick={openCustomersOverview}
                  >
                    <IconArrowLeft size={18} />
                  </ActionIcon>
                }
                action={
                  <ToneBadge
                    color={
                      selectedCustomerSummary.revenueAmount > 0
                        ? "teal"
                        : selectedCustomerSummary.openOrderCount > 0
                          ? "orange"
                          : "gray"
                    }
                    label={
                      selectedCustomerSummary.revenueAmount > 0
                        ? formatCurrency(selectedCustomerSummary.revenueAmount)
                        : `${selectedCustomerSummary.orderCount} order${selectedCustomerSummary.orderCount === 1 ? "" : "s"}`
                    }
                  />
                }
              >
                <Box className="batch-kpi-grid">
                  <Card radius="md" padding="md" className="batch-kpi-card batch-kpi-card-hero">
                    <Stack gap={6}>
                      <InfoLabel
                        label="Omzet"
                        description="Som van alle gerealiseerde opbrengsten voor deze klant."
                      />
                      <Title order={1} className="batch-kpi-value">
                        {formatCurrency(selectedCustomerSummary.revenueAmount)}
                      </Title>
                    </Stack>
                  </Card>
                  <Card radius="md" padding="md" className="batch-kpi-card">
                    <Stack gap={6}>
                      <InfoLabel
                        label="Orders"
                        description="Alle gekoppelde orders op deze klant."
                      />
                      <Title order={2} className="batch-kpi-value">
                        {selectedCustomerSummary.orderCount}
                      </Title>
                    </Stack>
                  </Card>
                  <Card radius="md" padding="md" className="batch-kpi-card">
                    <Stack gap={6}>
                      <InfoLabel
                        label="Open"
                        description="Orders die nog niet afgerond of geannuleerd zijn."
                      />
                      <Title order={2} className="batch-kpi-value">
                        {selectedCustomerSummary.openOrderCount}
                      </Title>
                    </Stack>
                  </Card>
                  <Card radius="md" padding="md" className="batch-kpi-card">
                    <Stack gap={6}>
                      <InfoLabel
                        label="Laatste activiteit"
                        description="Recentste update op klant, order of opbrengst."
                      />
                      <Title order={2} className="batch-kpi-value">
                        {formatShortDate(selectedCustomerSummary.latestActivityAt)}
                      </Title>
                    </Stack>
                  </Card>
                </Box>
              </SectionCard>

              <SectionCard
                title="Klantdetail"
                compact
                className="batch-screen-card batch-detail-static-card customer-scroll-card"
                contentClassName="batch-detail-static-content customer-scroll-card-content"
              >
                <Box className="customer-scroll-shell">
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start" gap="sm">
                      <Text size="sm" className="muted-copy">
                        {selectedCustomer.email ?? selectedCustomer.phone ?? "Nog geen contactgegevens ingevuld"}
                      </Text>
                      <ToneBadge
                        color={
                          selectedCustomerSummary.revenueAmount > 0
                            ? "teal"
                            : selectedCustomerSummary.openOrderCount > 0
                              ? "orange"
                              : "gray"
                        }
                        label={formatLiters(selectedCustomerSummary.litersSold)}
                      />
                    </Group>

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                      <Card radius="md" padding="md" className="batch-summary-card">
                        <Stack gap={6}>
                          <InfoLabel
                            label="Contact"
                            description="Primaire contactlijn die momenteel op de klantfiche staat."
                          />
                          <Title order={2}>{selectedCustomer.phone ?? "Niet ingevuld"}</Title>
                          <Text size="sm" className="muted-copy">
                            {selectedCustomer.email ?? "Geen e-mail opgegeven"}
                          </Text>
                        </Stack>
                      </Card>
                      <Card radius="md" padding="md" className="batch-summary-card">
                        <Stack gap={6}>
                          <InfoLabel
                            label="Afgerond"
                            description="Aantal afgeronde orders en opbrengstboekingen."
                          />
                          <Title order={2}>{selectedCustomerSummary.completedOrderCount}</Title>
                          <Text size="sm" className="muted-copy">
                            {selectedCustomerSummary.revenueBookingCount} opbrengstregel
                            {selectedCustomerSummary.revenueBookingCount === 1 ? "" : "s"}
                          </Text>
                        </Stack>
                      </Card>
                    </SimpleGrid>

                    {selectedCustomer.notes ? (
                      <Alert color="orange" variant="light" icon={<IconInfoCircle size={16} />}>
                        {selectedCustomer.notes}
                      </Alert>
                    ) : null}

                    <Divider />

                    <Stack gap="sm">
                      <Group justify="space-between" align="center" gap="sm">
                        <Text fw={700}>Orders</Text>
                        <Text size="sm" className="muted-copy">
                          {selectedCustomerOrders.length} totaal
                        </Text>
                      </Group>
                      {selectedCustomerOrders.length > 0 ? (
                        selectedCustomerOrders.map((order) => (
                          <SelectableCard
                            key={order.id}
                            title={order.orderNumber}
                            subtitle={`${order.batchNumber} · ${formatShortDate(order.completedAt ?? order.orderedAt)}`}
                            badge={
                              <ToneBadge
                                color={getOrderStatusColor(order.status)}
                                label={formatOrderStatus(order.status)}
                              />
                            }
                            meta={
                              <Stack gap={2}>
                                <Text size="sm" className="muted-copy">
                                  {formatCurrency(order.totalAmount)} · {formatLiters(order.orderedLiters)}
                                </Text>
                                <Text size="sm" className="muted-copy">
                                  {order.finishedGoodArticleName}
                                </Text>
                              </Stack>
                            }
                            onClick={() => openOrder(order.id)}
                          />
                        ))
                      ) : (
                        <EmptyState
                          icon={<IconInfoCircle size={20} />}
                          title="Nog geen orders"
                          description="Orders van deze klant verschijnen hier zodra ze aangemaakt zijn."
                        />
                      )}
                    </Stack>

                    <Stack gap="sm">
                      <Group justify="space-between" align="center" gap="sm">
                        <Text fw={700}>Opbrengsten</Text>
                        <Text size="sm" className="muted-copy">
                          {formatCurrency(selectedCustomerSummary.revenueAmount)}
                        </Text>
                      </Group>
                      {selectedCustomerRevenueEntries.length > 0 ? (
                        selectedCustomerRevenueEntries.map((entry) => (
                          <SelectableCard
                            key={entry.id}
                            title={entry.orderNumber}
                            subtitle={`${entry.batchNumber} · ${formatShortDate(entry.recognizedAt)}`}
                            badge={<ToneBadge color="teal" label={formatCurrency(entry.totalAmount)} />}
                            meta={
                              <Stack gap={2}>
                                <Text size="sm" className="muted-copy">
                                  {formatLiters(entry.litersSold)} · {entry.finishedGoodArticleName}
                                </Text>
                                <Text size="sm" className="muted-copy">
                                  Opbrengst geboekt op {formatShortDate(entry.recognizedAt)}
                                </Text>
                              </Stack>
                            }
                            onClick={() => openRevenueEntry(entry.id)}
                          />
                        ))
                      ) : (
                        <Alert color="teal" variant="light" icon={<IconInfoCircle size={16} />}>
                          Nog geen afgeronde orders voor deze klant, dus ook nog geen opbrengsten.
                        </Alert>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              </SectionCard>
            </Stack>
          </Box>

          {customerCreateDrawer}
        </>
      );
    }

    return (
      <>
        <Box className="batch-workspace-shell">
          <Stack gap="md" className="batch-screen-shell customer-screen-shell">
            <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
              <MetricCard
                label="Klanten"
                value={`${data.customers.length}`}
                meta={`${customersWithOrdersCount} met orders`}
                infoDescription="Totaal aantal klanten in de huidige database."
              />
              <MetricCard
                label="Met omzet"
                value={`${customersWithRevenueCount}`}
                meta={topRevenueCustomer?.customerName ?? "Nog geen omzet"}
                infoDescription="Aantal klanten dat al minstens één afgerond order heeft."
              />
              <MetricCard
                label="Open orders"
                value={`${totalOpenCustomerOrders}`}
                meta={`${customersWithOpenOrdersCount} klantdossiers actief`}
                infoDescription="Orders die nog niet afgerond of geannuleerd zijn."
              />
              <MetricCard
                label="Lifetime omzet"
                value={formatCurrency(totalCustomerRevenue)}
                meta={formatLiters(totalCustomerLitersSold)}
                infoDescription="Totale omzet en verkocht volume over alle klanten heen."
              />
            </SimpleGrid>

            <Grid gutter="md" className="customer-detail-layout">
              <Grid.Col span={{ base: 12, xl: 3 }} className="batch-detail-pane">
                <Stack gap="md">
                  <MetricCard
                    label="Topklant"
                    value={topRevenueCustomer?.customerName ?? "Geen omzet"}
                    meta={
                      topRevenueCustomer
                        ? `${formatCurrency(topRevenueCustomer.totalAmount)} · ${topRevenueCustomer.bookings} afgeronde order${topRevenueCustomer.bookings === 1 ? "" : "s"}`
                        : "Nog geen afgeronde orders"
                    }
                    infoDescription="Klant met de hoogste gerealiseerde omzet."
                  />
                  <MetricCard
                    label="Gemiddelde omzet"
                    value={
                      averageRevenuePerPayingCustomer === null
                        ? "n.v.t."
                        : formatCurrency(averageRevenuePerPayingCustomer)
                    }
                    meta={`${customersWithRevenueCount} klant${customersWithRevenueCount === 1 ? "" : "en"} met omzet`}
                    infoDescription="Gemiddelde omzet over klanten die al opbrengsten hebben."
                  />
                  <MetricCard
                    label="Meest actief"
                    value={mostActiveCustomer?.fullName ?? "Geen orders"}
                    meta={
                      mostActiveCustomer
                        ? `${mostActiveCustomer.orderCount} order${mostActiveCustomer.orderCount === 1 ? "" : "s"}`
                        : "Nog geen orderhistoriek"
                    }
                    infoDescription="Klant met de meeste gekoppelde orders."
                  />
                  <MetricCard
                    label="Nieuwste wijziging"
                    value={newestCustomer?.fullName ?? "Geen klanten"}
                    meta={newestCustomer ? formatShortDate(newestCustomer.updatedAt) : "Nog geen wijzigingen"}
                    infoDescription="Recentst bijgewerkte klantfiche."
                  />
                </Stack>
              </Grid.Col>

              <Grid.Col span={{ base: 12, xl: 9 }} className="batch-detail-pane">
                <SectionCard
                  title="Alle klanten"
                  subtitle="Gesorteerd op recentste activiteit en gerealiseerde omzet."
                  compact
                  action={
                    <Group gap="xs">
                      <TextInput
                        aria-label="Zoek klanten"
                        placeholder="Zoek op klantnaam"
                        value={customerSearchQuery}
                        onChange={(event) => setCustomerSearchQuery(event.currentTarget.value)}
                        className="workspace-toolbar-select"
                      />
                      <Button
                        size="xs"
                        radius="sm"
                        className="batch-toolbar-button-primary"
                        onClick={openCustomerCreator}
                      >
                        Nieuwe klant
                      </Button>
                    </Group>
                  }
                  className="batch-screen-card batch-overview-card"
                  contentClassName="batch-section-content"
                >
                  <Box className="batch-table-frame">
                    <Box className="batch-table-head customer-table-head">
                      <Text className="batch-table-head-cell">Klant</Text>
                      <Text className="batch-table-head-cell">Contact</Text>
                      <Text className="batch-table-head-cell table-mobile-hidden">Orders</Text>
                      <Text className="batch-table-head-cell table-mobile-hidden">Open</Text>
                      <Text className="batch-table-head-cell">Omzet</Text>
                      <Text className="batch-table-head-cell">Laatste activiteit</Text>
                    </Box>
                    <Box className="batch-table-scroll">
                      {searchedCustomerSummaries.length > 0 ? (
                        <Stack gap={0}>
                          {searchedCustomerSummaries.map((customer) => (
                            <Box
                              key={customer.id}
                              className="batch-table-row customer-table-row"
                              role="button"
                              tabIndex={0}
                              onClick={() => openCustomer(customer.id)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  openCustomer(customer.id);
                                }
                              }}
                            >
                              <Box className="batch-table-cell batch-table-cell-primary" data-label="Klant">
                                <Text className="batch-table-batch-number">{customer.fullName}</Text>
                              </Box>
                              <Box className="batch-table-cell" data-label="Contact">
                                <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                                  {customer.phone ?? "Geen telefoon"}
                                </Text>
                                <Text size="sm" className="batch-table-subline-muted" truncate>
                                  {customer.email ?? "Geen e-mail"}
                                </Text>
                              </Box>
                              <Box className="batch-table-cell table-mobile-hidden" data-label="Orders">
                                <Text size="sm" fw={700} className="batch-table-metric">
                                  {customer.orderCount}
                                </Text>
                              </Box>
                              <Box className="batch-table-cell table-mobile-hidden" data-label="Open">
                                <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                                  {customer.openOrderCount}
                                </Text>
                              </Box>
                              <Box className="batch-table-cell" data-label="Omzet">
                                <Text size="sm" fw={700} className="batch-table-metric">
                                  {formatCurrency(customer.revenueAmount)}
                                </Text>
                              </Box>
                              <Box className="batch-table-cell" data-label="Laatste activiteit">
                                <Text size="sm" fw={600} className="batch-table-metric batch-table-metric-soft">
                                  {formatShortDate(customer.latestActivityAt)}
                                </Text>
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <EmptyState
                          icon={<IconInfoCircle size={20} />}
                          title={customerSearchTerm ? "Geen klanten gevonden" : "Nog geen klanten"}
                          description={
                            customerSearchTerm
                              ? "Verfijn je zoekterm om een klant op naam terug te vinden."
                              : "Zodra je een klant aanmaakt, verschijnt die hier in het overzicht."
                          }
                        />
                      )}
                    </Box>
                  </Box>
                </SectionCard>
              </Grid.Col>
            </Grid>
          </Stack>
        </Box>

        {customerCreateDrawer}
      </>
    );
  };

  const renderRatiosWorkspace = () => {
    const ratioAverageOutput =
      data.ratioTemplates.length > 0
        ? data.ratioTemplates.reduce(
            (sum, template) => sum + template.expectedOutputLitersPerBaseAlcoholLiter,
            0,
          ) / data.ratioTemplates.length
        : null;

    const ratioCreateDrawers = (
      <>
        <Drawer
          opened={ratioTemplateCreateOpened}
          onClose={closeRatioTemplateCreator}
          position="right"
          size="30rem"
          title="Nieuw ratio template"
        >
          <Stack gap="sm">
            <TextInput
              label="Naam"
              value={ratioForm.name}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setRatioForm((current) => ({ ...current, name: value }));
              }}
            />
            <NativeSelect
              label="Afgewerkt product"
              data={finishedGoodOptions}
              value={ratioForm.finishedGoodArticleId}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setRatioForm((current) => ({
                  ...current,
                  finishedGoodArticleId: value,
                }));
              }}
            />
            <Group grow>
              <TextInput
                label="Basis alcohol (L)"
                type="number"
                step="0.1"
                value={ratioForm.baseAlcoholLiters}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setRatioForm((current) => ({
                    ...current,
                    baseAlcoholLiters: value,
                  }));
                }}
              />
              <TextInput
                label="Verwachte output (L)"
                type="number"
                step="0.1"
                value={ratioForm.expectedOutputLitersPerBaseAlcoholLiter}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setRatioForm((current) => ({
                    ...current,
                    expectedOutputLitersPerBaseAlcoholLiter: value,
                  }));
                }}
              />
            </Group>
            <Textarea
              label="Notitie"
              minRows={3}
              value={ratioForm.notes}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setRatioForm((current) => ({ ...current, notes: value }));
              }}
            />
            <Button
              loading={pendingAction === "Ratio template opgeslagen"}
              disabled={databaseUnavailable}
              className="batch-toolbar-button-primary"
              onClick={() =>
                runAction(
                  "Ratio template opgeslagen",
                  () =>
                    createRatioTemplateAction({
                      name: ratioForm.name,
                      finishedGoodArticleId: ratioForm.finishedGoodArticleId,
                      baseAlcoholLiters: Number(ratioForm.baseAlcoholLiters),
                      expectedOutputLitersPerBaseAlcoholLiter: Number(
                        ratioForm.expectedOutputLitersPerBaseAlcoholLiter,
                      ),
                      notes: ratioForm.notes,
                    } satisfies CreateRatioTemplateInput),
                  () => {
                    setRatioTemplateCreateOpened(false);
                    setRatioForm((current) => ({
                      ...current,
                      name: "",
                      notes: "",
                    }));
                  },
                )
              }
            >
              Template aanmaken
            </Button>
          </Stack>
        </Drawer>

        <Drawer
          opened={ratioLineCreateOpened}
          onClose={closeRatioLineCreator}
          position="right"
          size="28rem"
          title="Receptregel toevoegen"
        >
          <Stack gap="sm">
            <NativeSelect
              label="Artikel"
              data={data.articles.map((article) => ({
                value: article.id,
                label: article.name,
              }))}
              value={ratioLineForm.articleId}
              onChange={(event) => {
                const articleId = event.currentTarget.value;
                const article = data.articles.find((item) => item.id === articleId);
                setRatioLineForm((current) => ({
                  ...current,
                  ratioTemplateId: selectedRatioTemplate?.id ?? current.ratioTemplateId,
                  articleId,
                  unit: article?.defaultUnit ?? current.unit,
                }));
              }}
            />
            <TextInput
              label="Hoeveelheid"
              type="number"
              step="0.1"
              value={ratioLineForm.quantity}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setRatioLineForm((current) => ({
                  ...current,
                  quantity: value,
                }));
              }}
            />
            <NativeSelect
              label="Eenheid"
              data={UNIT_OPTIONS}
              value={ratioLineForm.unit}
              onChange={(event) => {
                const value = event.currentTarget.value as Unit;
                setRatioLineForm((current) => ({
                  ...current,
                  unit: value,
                }));
              }}
            />
            <Button
              loading={pendingAction === "Ratio line opgeslagen"}
              disabled={databaseUnavailable || !selectedRatioTemplate}
              className="batch-toolbar-button-primary"
              onClick={() =>
                selectedRatioTemplate
                  ? runAction(
                      "Ratio line opgeslagen",
                      () =>
                        createRatioTemplateLineAction({
                          ratioTemplateId: selectedRatioTemplate.id,
                          articleId: ratioLineForm.articleId,
                          quantity: Number(ratioLineForm.quantity),
                          unit: ratioLineForm.unit,
                        } satisfies CreateRatioTemplateLineInput),
                      () => {
                        setRatioLineCreateOpened(false);
                        setRatioLineForm((current) => ({
                          ...current,
                          quantity: "",
                          ratioTemplateId: selectedRatioTemplate.id,
                        }));
                      },
                    )
                  : Promise.resolve()
              }
            >
              Regel toevoegen
            </Button>
          </Stack>
        </Drawer>
      </>
    );

    if (ratioWorkspaceMode === "detail" && selectedRatioTemplate) {
      return (
        <>
          <Box className="batch-workspace-shell">
            <Stack gap="md" className="batch-screen-shell batch-detail-screen ratio-screen-shell">
              <SectionCard
                title={selectedRatioTemplate.name}
                subtitle={`${selectedRatioTemplate.finishedGoodArticleName} · ${selectedRatioTemplate.expectedOutputLitersPerBaseAlcoholLiter} L output`}
                className="batch-screen-card batch-detail-hero-card"
                compact
                headerStart={
                  <ActionIcon
                    variant="transparent"
                    color="gray"
                    size="md"
                    radius="xl"
                    aria-label="Terug naar templates"
                    className="batch-detail-back-button"
                    onClick={openRatioOverview}
                  >
                    <IconArrowLeft size={18} />
                  </ActionIcon>
                }
                action={
                  <Group gap="xs" wrap="nowrap">
                    <ToneBadge color="gray" label={selectedRatioTemplate.finishedGoodArticleName} />
                    <ToneBadge
                      color={selectedRatioLines.length > 0 ? "teal" : "gray"}
                      label={`${selectedRatioLines.length} regel${selectedRatioLines.length === 1 ? "" : "s"}`}
                    />
                  </Group>
                }
              >
                <Box className="batch-kpi-grid">
                  <Card radius="md" padding="md" className="batch-kpi-card batch-kpi-card-hero">
                    <Stack gap={6}>
                      <InfoLabel
                        label="Verwachte output"
                        description="Verwachte output van deze template per referentiehoeveelheid alcohol."
                      />
                      <Title order={1} className="batch-kpi-value">
                        {selectedRatioTemplate.expectedOutputLitersPerBaseAlcoholLiter} L
                      </Title>
                    </Stack>
                  </Card>
                  <Card radius="md" padding="md" className="batch-kpi-card">
                    <Stack gap={6}>
                      <InfoLabel
                        label="Basis alcohol"
                        description="Referentiehoeveelheid alcohol waarop dit recept gebaseerd is."
                      />
                      <Title order={2} className="batch-kpi-value">
                        {selectedRatioTemplate.baseAlcoholLiters} L
                      </Title>
                    </Stack>
                  </Card>
                  <Card radius="md" padding="md" className="batch-kpi-card">
                    <Stack gap={6}>
                      <InfoLabel
                        label="Ingredienten"
                        description="Aantal ingredientregels op deze template."
                      />
                      <Title order={2} className="batch-kpi-value">
                        {selectedRatioLines.length}
                      </Title>
                    </Stack>
                  </Card>
                  <Card radius="md" padding="md" className="batch-kpi-card">
                    <Stack gap={6}>
                      <InfoLabel
                        label="Laatste update"
                        description="Laatste gekende wijziging op deze recepttemplate."
                      />
                      <Title order={2} className="batch-kpi-value">
                        {formatShortDate(selectedRatioTemplate.updatedAt)}
                      </Title>
                    </Stack>
                  </Card>
                </Box>
              </SectionCard>

              <Box className="batch-detail-layout">
                <Box className="batch-detail-pane">
                  <SectionCard
                    title="Details"
                    className="batch-screen-card batch-detail-static-card"
                    contentClassName="batch-detail-static-content"
                  >
                    <Box className="ratio-scroll-shell">
                      <Stack gap="md">
                        <Stack gap="xs">
                          <DetailRow label="Template" value={selectedRatioTemplate.name} />
                          <DetailRow label="Afgewerkt product" value={selectedRatioTemplate.finishedGoodArticleName} />
                          <DetailRow label="Basis alcohol" value={`${selectedRatioTemplate.baseAlcoholLiters} L`} />
                          <DetailRow
                            label="Verwachte output"
                            value={`${selectedRatioTemplate.expectedOutputLitersPerBaseAlcoholLiter} L`}
                          />
                          <DetailRow label="Laatste update" value={formatShortDate(selectedRatioTemplate.updatedAt)} />
                        </Stack>
                        {selectedRatioTemplate.notes ? (
                          <Alert color="orange" variant="light" icon={<IconInfoCircle size={16} />}>
                            {selectedRatioTemplate.notes}
                          </Alert>
                        ) : (
                          <Alert color="teal" variant="light" icon={<IconInfoCircle size={16} />}>
                            Geen extra notitie op deze template. Gebruik dit veld voor receptcontext of procesafspraken.
                          </Alert>
                        )}
                      </Stack>
                    </Box>
                  </SectionCard>
                </Box>

                <Box className="batch-detail-pane">
                  <SectionCard
                    title="Receptregels"
                    action={
                      <Button
                        size="xs"
                        radius="sm"
                        className="batch-toolbar-button-primary"
                        onClick={() => openRatioLineCreator(selectedRatioTemplate.id)}
                      >
                        Regel toevoegen
                      </Button>
                    }
                    className="batch-screen-card batch-history-card"
                    contentClassName="batch-history-card-content"
                  >
                    <Box className="ratio-scroll-shell">
                      {selectedRatioLines.length > 0 ? (
                        <Stack gap="sm" className="batch-history-list">
                          {selectedRatioLines.map((line) => (
                            <Box key={line.id} className="batch-history-item">
                              <Stack gap={6}>
                                <Group justify="space-between" align="flex-start" gap="sm">
                                  <Text fw={700}>{line.articleName}</Text>
                                  <Text size="sm" className="muted-copy">
                                    {line.quantity} {line.unit}
                                  </Text>
                                </Group>
                                <Text size="sm" className="muted-copy">
                                  Toegevoegd op {formatShortDate(line.updatedAt)}
                                </Text>
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <Box className="batch-panel-empty">
                          <EmptyState
                            icon={<IconInfoCircle size={20} />}
                            title="Nog geen regels"
                            description="Voeg ingredientregels toe zodat batches op dit recept kunnen steunen."
                          />
                        </Box>
                      )}
                    </Box>
                  </SectionCard>
                </Box>
              </Box>
            </Stack>
          </Box>

          {ratioCreateDrawers}
        </>
      );
    }

    return (
      <>
        <Box className="batch-workspace-shell">
          <Stack gap="md" className="batch-screen-shell ratio-screen-shell">
            <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
              <MetricCard
                label="Templates"
                value={`${data.ratioTemplates.length}`}
                meta={`${ratioFinishedGoodsCount} afgewerkte producten`}
                infoDescription="Aantal actieve recepttemplates in de database."
              />
              <MetricCard
                label="Receptregels"
                value={`${data.ratioTemplateLines.length}`}
                meta={
                  averageRatioLinesPerTemplate === null
                    ? "Nog geen templates"
                    : `${averageRatioLinesPerTemplate.toFixed(1)} per template`
                }
                infoDescription="Totaal aantal ingredientregels over alle templates heen."
              />
              <MetricCard
                label="Gem. output"
                value={ratioAverageOutput === null ? "n.v.t." : `${ratioAverageOutput.toFixed(2)} L`}
                meta="Per 1 L alcoholbasis"
                infoDescription="Gemiddelde verwachte outputfactor over alle templates."
              />
              <MetricCard
                label="Meest gebruikt artikel"
                value={topRatioArticle?.articleName ?? "Geen regels"}
                meta={
                  topRatioArticle
                    ? `${topRatioArticle.usageCount} receptregel${topRatioArticle.usageCount === 1 ? "" : "s"}`
                    : "Nog geen ingredienten"
                }
                infoDescription="Artikel dat het vaakst voorkomt in receptregels."
              />
            </SimpleGrid>

            <SectionCard
              title="Templates"
              subtitle="Volledige receptbibliotheek. Klik op een template om details en receptregels te openen."
              compact
              action={
                <Group gap="xs">
                  <TextInput
                    aria-label="Zoek ratio templates"
                    placeholder="Zoek op naam"
                    value={ratioTemplateSearchQuery}
                    onChange={(event) => setRatioTemplateSearchQuery(event.currentTarget.value)}
                    className="workspace-toolbar-select"
                  />
                  <Button
                    size="xs"
                    radius="sm"
                    className="batch-toolbar-button-primary"
                    onClick={openRatioTemplateCreator}
                  >
                    Nieuw template
                  </Button>
                </Group>
              }
              className="batch-screen-card batch-overview-card"
              contentClassName="batch-section-content"
            >
              <Box className="batch-table-frame">
                <Box className="batch-table-head ratio-table-head">
                  <Text className="batch-table-head-cell">Template</Text>
                  <Text className="batch-table-head-cell table-mobile-hidden">Product</Text>
                  <Text className="batch-table-head-cell table-mobile-hidden">Basis alcohol</Text>
                  <Text className="batch-table-head-cell">Output</Text>
                  <Text className="batch-table-head-cell">Receptregels</Text>
                  <Text className="batch-table-head-cell">Laatste update</Text>
                </Box>
                <Box className="batch-table-scroll">
                  {searchedRatioTemplateSummaries.length > 0 ? (
                    <Stack gap={0}>
                      {searchedRatioTemplateSummaries.map((template) => (
                        <Box
                          key={template.id}
                          className="batch-table-row ratio-table-row"
                          role="button"
                          tabIndex={0}
                          onClick={() => openRatioTemplate(template.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openRatioTemplate(template.id);
                            }
                          }}
                        >
                          <Box className="batch-table-cell batch-table-cell-primary" data-label="Template">
                            <Text className="batch-table-batch-number">{template.name}</Text>
                          </Box>
                          <Box className="batch-table-cell table-mobile-hidden" data-label="Product">
                            <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                              {template.finishedGoodArticleName}
                            </Text>
                          </Box>
                          <Box className="batch-table-cell table-mobile-hidden" data-label="Basis alcohol">
                            <Text size="sm" fw={700} className="batch-table-metric">
                              {formatLiters(template.baseAlcoholLiters)}
                            </Text>
                          </Box>
                          <Box className="batch-table-cell" data-label="Output">
                            <Text size="sm" fw={700} className="batch-table-metric">
                              {template.expectedOutputLitersPerBaseAlcoholLiter.toFixed(2)} L
                            </Text>
                          </Box>
                          <Box className="batch-table-cell" data-label="Receptregels">
                            <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                              {template.lineCount}
                            </Text>
                          </Box>
                          <Box className="batch-table-cell" data-label="Laatste update">
                            <Text size="sm" fw={600} className="batch-table-metric batch-table-metric-soft">
                              {formatShortDate(template.latestActivityAt)}
                            </Text>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <EmptyState
                      icon={<IconInfoCircle size={20} />}
                      title={ratioTemplateSearchTerm ? "Geen templates gevonden" : "Nog geen templates"}
                      description={
                        ratioTemplateSearchTerm
                          ? "Verfijn je zoekterm om een template op naam terug te vinden."
                          : "Maak je eerste ratio template aan om batches op recepten te baseren."
                      }
                    />
                  )}
                </Box>
              </Box>
            </SectionCard>
          </Stack>
        </Box>

        {ratioCreateDrawers}
      </>
    );
  };

  const renderArticlesWorkspace = () => {
    const ingredientCount = data.articles.filter((article) => article.category === "ingredient").length;
    const packagingCount = data.articles.filter((article) => article.category === "packaging").length;
    const finishedGoodCount = data.articles.filter((article) => article.category === "finished_good").length;
    const totalPurchaseAmount = data.articleReports.reduce((sum, report) => sum + report.totalPurchaseAmount, 0);
    const totalSalesAmount = data.articleReports.reduce((sum, report) => sum + report.totalSalesAmount, 0);
    const topPurchaseArticle =
      [...data.articleReports].sort((left, right) => right.totalPurchaseAmount - left.totalPurchaseAmount)[0] ?? null;
    const topSalesArticle =
      [...data.articleReports].sort((left, right) => right.totalSalesAmount - left.totalSalesAmount)[0] ?? null;
    const articleRows = data.articles
      .map((article) => ({
        article,
        report:
          data.articleReports.find((report) => report.articleId === article.id) ?? {
            articleId: article.id,
            name: article.name,
            category: article.category,
            defaultUnit: article.defaultUnit,
            totalPurchasedQuantity: 0,
            totalPurchaseAmount: 0,
            totalSoldQuantity: 0,
            totalSalesAmount: 0,
          },
      }))
      .sort(
        (left, right) =>
          right.article.updatedAt.localeCompare(left.article.updatedAt) ||
          right.report.totalSalesAmount - left.report.totalSalesAmount ||
          left.article.name.localeCompare(right.article.name),
      );
    const articleSearchTerm = articleSearchQuery.trim().toLocaleLowerCase();
    const searchedArticleRows = articleSearchTerm
      ? articleRows.filter(({ article, report }) =>
          [article.name, report.name].join(" ").toLocaleLowerCase().includes(articleSearchTerm),
        )
      : articleRows;

    const articleCreateDrawer = (
      <Drawer
        opened={articleCreateOpened}
        onClose={closeArticleCreator}
        position="right"
        size="30rem"
        title="Nieuw artikel"
      >
        <Stack gap="sm">
          <TextInput
            label="Naam"
            value={articleForm.name}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setArticleForm((current) => ({ ...current, name: value }));
            }}
          />
          <TextInput
            label="SKU"
            value={articleForm.sku}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setArticleForm((current) => ({ ...current, sku: value }));
            }}
          />
          <Group grow>
            <NativeSelect
              label="Categorie"
              data={ARTICLE_CATEGORY_OPTIONS}
              value={articleForm.category}
              onChange={(event) => {
                const value = event.currentTarget.value as CreateArticleInput["category"];
                setArticleForm((current) => ({
                  ...current,
                  category: value,
                }));
              }}
            />
            <NativeSelect
              label="Eenheid"
              data={UNIT_OPTIONS}
              value={articleForm.defaultUnit}
              onChange={(event) => {
                const value = event.currentTarget.value as CreateArticleInput["defaultUnit"];
                setArticleForm((current) => ({
                  ...current,
                  defaultUnit: value,
                }));
              }}
            />
          </Group>
          <Button
            loading={pendingAction === "Artikel opgeslagen"}
            disabled={databaseUnavailable}
            className="batch-toolbar-button-primary"
            onClick={() =>
              runAction(
                "Artikel opgeslagen",
                () =>
                  createArticleAction({
                    name: articleForm.name,
                    sku: articleForm.sku,
                    category: articleForm.category,
                    defaultUnit: articleForm.defaultUnit,
                  } satisfies CreateArticleInput),
                () => {
                  setArticleCreateOpened(false);
                  setArticleForm({
                    name: "",
                    sku: "",
                    category: "ingredient",
                    defaultUnit: "l",
                  });
                },
              )
            }
          >
            Artikel aanmaken
          </Button>
        </Stack>
      </Drawer>
    );

    if (articleWorkspaceMode === "detail" && selectedArticle) {
      return (
        <>
          <Box className="batch-workspace-shell">
            <Stack gap="md" className="batch-screen-shell batch-detail-screen customer-screen-shell">
              <SectionCard
                title={selectedArticle.name}
                subtitle={`${formatArticleCategory(selectedArticle.category)} · ${selectedArticle.sku || "Geen SKU"}`}
                className="batch-screen-card batch-detail-hero-card"
                compact
                headerStart={
                  <ActionIcon
                    variant="transparent"
                    color="gray"
                    size="md"
                    radius="xl"
                    aria-label="Terug naar artikelen"
                    className="batch-detail-back-button"
                    onClick={openArticlesOverview}
                  >
                    <IconArrowLeft size={18} />
                  </ActionIcon>
                }
                action={<ToneBadge color="gray" label={selectedArticle.defaultUnit} />}
              >
                <Box className="batch-kpi-grid">
                  <Card radius="md" padding="md" className="batch-kpi-card batch-kpi-card-hero">
                    <Stack gap={6}>
                      <InfoLabel
                        label="Aankoop"
                        description="Totale geregistreerde aankoopwaarde voor dit artikel."
                      />
                      <Title order={1} className="batch-kpi-value">
                        {formatCurrency(selectedArticleReport?.totalPurchaseAmount ?? 0)}
                      </Title>
                    </Stack>
                  </Card>
                  <Card radius="md" padding="md" className="batch-kpi-card">
                    <Stack gap={6}>
                      <InfoLabel
                        label="Verkoop"
                        description="Totale gerealiseerde verkoopwaarde voor dit artikel."
                      />
                      <Title order={2} className="batch-kpi-value">
                        {formatCurrency(selectedArticleReport?.totalSalesAmount ?? 0)}
                      </Title>
                    </Stack>
                  </Card>
                  <Card radius="md" padding="md" className="batch-kpi-card">
                    <Stack gap={6}>
                      <InfoLabel
                        label="Receptgebruik"
                        description="Aantal receptregels waarin dit artikel voorkomt."
                      />
                      <Title order={2} className="batch-kpi-value">
                        {selectedArticleRatioLines.length}
                      </Title>
                    </Stack>
                  </Card>
                  <Card radius="md" padding="md" className="batch-kpi-card">
                    <Stack gap={6}>
                      <InfoLabel
                        label="Laatste update"
                        description="Laatste update op de artikelmaster."
                      />
                      <Title order={2} className="batch-kpi-value">
                        {formatShortDate(selectedArticle.updatedAt)}
                      </Title>
                    </Stack>
                  </Card>
                </Box>
              </SectionCard>

              <Grid gutter="md" className="revenue-detail-layout">
                <Grid.Col span={{ base: 12, xl: 4, lg: 5 }} className="batch-detail-pane">
                  <Box className="revenue-insights-rail">
                    <SectionCard
                      title="Receptgebruik"
                      compact
                      onClick={() => setArticleDetailPanel("recipe_usage")}
                      action={
                        <Box className="revenue-insight-toggle-indicator" aria-hidden="true">
                          {articleDetailPanel === "recipe_usage" ? (
                            <IconChevronUp size={16} />
                          ) : (
                            <IconChevronDown size={16} />
                          )}
                        </Box>
                      }
                      className={[
                        "batch-screen-card",
                        "batch-history-card",
                        "revenue-insight-card",
                        articleDetailPanel === "recipe_usage"
                          ? "revenue-insight-card-active"
                          : "revenue-insight-card-collapsed",
                      ].join(" ")}
                      contentClassName={[
                        "batch-history-card-content",
                        "revenue-insight-card-content",
                        articleDetailPanel === "recipe_usage"
                          ? "revenue-insight-card-content-active"
                          : "revenue-insight-card-content-collapsed",
                      ].join(" ")}
                    >
                      {articleDetailPanel === "recipe_usage" ? (
                        <Box className="revenue-insight-card-body">
                          {selectedArticleRatioLines.length > 0 ? (
                            <Stack gap="sm" className="batch-history-list">
                              {selectedArticleRatioLines.map((line) => (
                                <SelectableCard
                                  key={line.id}
                                  title={line.articleName}
                                  subtitle={`${line.quantity} ${line.unit}`}
                                  meta={
                                    <Text size="sm" className="muted-copy">
                                      Template · {data.ratioTemplates.find((template) => template.id === line.ratioTemplateId)?.name ?? "Onbekend"}
                                    </Text>
                                  }
                                  onClick={() => openRatioTemplate(line.ratioTemplateId)}
                                />
                              ))}
                            </Stack>
                          ) : (
                            <Alert color="gray" variant="light" icon={<IconInfoCircle size={16} />}>
                              Dit artikel zit momenteel in geen enkele recepttemplate.
                            </Alert>
                          )}
                        </Box>
                      ) : null}
                    </SectionCard>

                    <SectionCard
                      title="Kostenregistraties"
                      compact
                      onClick={() => setArticleDetailPanel("expense_registrations")}
                      action={
                        <Box className="revenue-insight-toggle-indicator" aria-hidden="true">
                          {articleDetailPanel === "expense_registrations" ? (
                            <IconChevronUp size={16} />
                          ) : (
                            <IconChevronDown size={16} />
                          )}
                        </Box>
                      }
                      className={[
                        "batch-screen-card",
                        "batch-history-card",
                        "revenue-insight-card",
                        articleDetailPanel === "expense_registrations"
                          ? "revenue-insight-card-active"
                          : "revenue-insight-card-collapsed",
                      ].join(" ")}
                      contentClassName={[
                        "batch-history-card-content",
                        "revenue-insight-card-content",
                        articleDetailPanel === "expense_registrations"
                          ? "revenue-insight-card-content-active"
                          : "revenue-insight-card-content-collapsed",
                      ].join(" ")}
                    >
                      {articleDetailPanel === "expense_registrations" ? (
                        <Box className="revenue-insight-card-body">
                          {selectedArticleExpenses.length > 0 ? (
                            <Stack gap="sm" className="batch-history-list">
                              {selectedArticleExpenses.map((expense) => (
                                <SelectableCard
                                  key={expense.id}
                                  title={expense.batchNumber}
                                  subtitle={`${formatShortDate(expense.expenseDate)} · ${expense.quantity} ${expense.unit}`}
                                  badge={<ToneBadge color="orange" label={formatCurrency(expense.amount)} />}
                                  meta={
                                    <Text size="sm" className="muted-copy">
                                      {expense.supplierName || expense.paymentMethod}
                                    </Text>
                                  }
                                  onClick={() => openExpensesForBatch(expense.batchId)}
                                />
                              ))}
                            </Stack>
                          ) : (
                            <Alert color="gray" variant="light" icon={<IconInfoCircle size={16} />}>
                              Nog geen kosten geregistreerd voor dit artikel.
                            </Alert>
                          )}
                        </Box>
                      ) : null}
                    </SectionCard>
                  </Box>
                </Grid.Col>

                <Grid.Col span={{ base: 12, xl: 8, lg: 7 }} className="batch-detail-pane">
                  <SectionCard
                    title="Commercieel gebruik"
                    compact
                    className="batch-screen-card batch-detail-static-card customer-scroll-card"
                    contentClassName="batch-detail-static-content customer-scroll-card-content"
                  >
                    <Box className="customer-scroll-shell">
                      <Stack gap="sm">
                        <Group justify="space-between" align="center" gap="sm">
                          <Text size="sm" className="muted-copy">
                            {selectedArticle.category === "finished_good"
                              ? `${selectedArticleBatches.length} batch${selectedArticleBatches.length === 1 ? "" : "es"} · ${selectedArticleOrders.length} order${selectedArticleOrders.length === 1 ? "" : "s"}`
                              : "Niet-commercieel artikel"}
                          </Text>
                          <ToneBadge color="gray" label={selectedArticle.defaultUnit} />
                        </Group>

                        {selectedArticle.category === "finished_good" ? (
                          selectedArticleBatches.length > 0 ? (
                            selectedArticleBatches.map((batch) => (
                              <SelectableCard
                                key={batch.id}
                                title={batch.batchNumber}
                                subtitle={`${formatShortDate(batch.startedSteepingAt)} · ${formatLiters(batch.availableLiters)} beschikbaar`}
                                badge={<ToneBadge color={getBatchStatusColor(batch.status)} label={formatBatchStatus(batch.status)} />}
                                meta={
                                  <Stack gap={2}>
                                    <Text size="sm" className="muted-copy">
                                      {formatCurrency(batch.revenueAmount)} omzet · {formatCurrency(batch.marginAmount)} marge
                                    </Text>
                                    <Text size="sm" className="muted-copy">
                                      {batch.status === "ready" ? "Klaar voor verkoop" : buildBatchRecommendations(batch)}
                                    </Text>
                                  </Stack>
                                }
                                onClick={() => openBatch(batch.id)}
                              />
                            ))
                          ) : selectedArticleRevenueEntries.length > 0 ? (
                            selectedArticleRevenueEntries.map((entry) => (
                              <SelectableCard
                                key={entry.id}
                                title={entry.orderNumber}
                                subtitle={`${entry.batchNumber} · ${formatShortDate(entry.recognizedAt)}`}
                                badge={<ToneBadge color="teal" label={formatCurrency(entry.totalAmount)} />}
                                meta={
                                  <Text size="sm" className="muted-copy">
                                    {formatLiters(entry.litersSold)} verkocht
                                  </Text>
                                }
                                onClick={() => openRevenueEntry(entry.id)}
                              />
                            ))
                          ) : (
                            <Alert color="gray" variant="light" icon={<IconInfoCircle size={16} />}>
                              Dit afgewerkte product is nog niet commercieel gebruikt.
                            </Alert>
                          )
                        ) : (
                          <Alert color="gray" variant="light" icon={<IconInfoCircle size={16} />}>
                            Dit artikel wordt vooral intern gebruikt als ingrediënt, verpakking of ondersteunend item en heeft daarom geen commerciële batch- of orderstroom.
                          </Alert>
                        )}
                      </Stack>
                    </Box>
                  </SectionCard>
                </Grid.Col>
              </Grid>
            </Stack>
          </Box>

          {articleCreateDrawer}
        </>
      );
    }

    return (
      <>
        <Box className="batch-workspace-shell">
          <Stack gap="md" className="batch-screen-shell customer-screen-shell">
            <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
              <MetricCard
                label="Artikelen"
                value={`${data.articles.length}`}
                meta={`${finishedGoodCount} afgewerkte producten`}
                infoDescription="Totaal aantal artikels in masterdata."
              />
              <MetricCard
                label="Ingrediënten"
                value={`${ingredientCount}`}
                meta={`${packagingCount} verpakking`}
                infoDescription="Beschikbare ingrediënten en verpakkingsartikelen."
              />
              <MetricCard
                label="Aankoopwaarde"
                value={formatCurrency(totalPurchaseAmount)}
                meta={topPurchaseArticle?.name ?? "Nog geen aankopen"}
                infoDescription="Totale geregistreerde aankoopwaarde over alle artikels."
              />
              <MetricCard
                label="Verkoopwaarde"
                value={formatCurrency(totalSalesAmount)}
                meta={topSalesArticle?.name ?? "Nog geen verkoop"}
                infoDescription="Totale gerealiseerde verkoopwaarde over alle artikels."
              />
            </SimpleGrid>

            <Grid gutter="md" className="customer-detail-layout">
              <Grid.Col span={12} className="batch-detail-pane">
                <SectionCard
                  title="Artikelen"
                  subtitle="Masterdata met aankoop-, verkoop- en gebruikscontext."
                  compact
                  action={
                    <Group gap="xs">
                      <TextInput
                        aria-label="Zoek artikelen"
                        placeholder="Zoek op artikelnaam"
                        value={articleSearchQuery}
                        onChange={(event) => setArticleSearchQuery(event.currentTarget.value)}
                        className="workspace-toolbar-select"
                      />
                      <Button
                        size="xs"
                        radius="sm"
                        className="batch-toolbar-button-primary"
                        onClick={openArticleCreator}
                      >
                        Nieuw artikel
                      </Button>
                    </Group>
                  }
                  className="batch-screen-card batch-overview-card"
                  contentClassName="batch-section-content"
                >
                  <Box className="batch-table-frame">
                    <Box className="batch-table-head article-table-head">
                      <Text className="batch-table-head-cell">Artikel</Text>
                      <Text className="batch-table-head-cell table-mobile-hidden">Categorie</Text>
                      <Text className="batch-table-head-cell">Eenheid</Text>
                      <Text className="batch-table-head-cell">Aankoop</Text>
                      <Text className="batch-table-head-cell">Verkoop</Text>
                      <Text className="batch-table-head-cell table-mobile-hidden">Laatste update</Text>
                    </Box>
                    <Box className="batch-table-scroll">
                      {searchedArticleRows.length > 0 ? (
                        <Stack gap={0}>
                          {searchedArticleRows.map(({ article, report }) => (
                              <Box
                                key={article.id}
                                className="batch-table-row article-table-row"
                                role="button"
                                tabIndex={0}
                                onClick={() => openArticle(article.id)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    openArticle(article.id);
                                  }
                                }}
                              >
                                <Box className="batch-table-cell batch-table-cell-primary" data-label="Artikel">
                                  <Text className="batch-table-batch-number">{report.name}</Text>
                                </Box>
                                <Box className="batch-table-cell table-mobile-hidden" data-label="Categorie">
                                  <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                                    {formatArticleCategory(report.category)}
                                  </Text>
                                </Box>
                                <Box className="batch-table-cell" data-label="Eenheid">
                                  <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                                    {report.defaultUnit}
                                  </Text>
                                </Box>
                                <Box className="batch-table-cell" data-label="Aankoop">
                                  <Text size="sm" fw={700} className="batch-table-metric">
                                    {formatCurrency(report.totalPurchaseAmount)}
                                  </Text>
                                </Box>
                                <Box className="batch-table-cell" data-label="Verkoop">
                                  <Text size="sm" fw={700} className="batch-table-metric">
                                    {formatCurrency(report.totalSalesAmount)}
                                  </Text>
                                </Box>
                                <Box className="batch-table-cell table-mobile-hidden" data-label="Laatste update">
                                  <Text size="sm" fw={600} className="batch-table-metric batch-table-metric-soft">
                                    {formatShortDate(article.updatedAt)}
                                  </Text>
                                </Box>
                              </Box>
                            ))}
                        </Stack>
                      ) : (
                        <EmptyState
                          icon={<IconInfoCircle size={20} />}
                          title={articleSearchTerm ? "Geen artikelen gevonden" : "Nog geen artikelen"}
                          description="Voeg artikelen toe voor ingrediënten, verpakking en afgewerkte producten."
                        />
                      )}
                    </Box>
                  </Box>
                </SectionCard>
              </Grid.Col>
            </Grid>
          </Stack>
        </Box>

        {articleCreateDrawer}
      </>
    );
  };


  return (
    <AppShell
      className="workspace-shell"
      header={{ height: { base: 72, md: 96 } }}
      padding="md"
    >
      <AppShell.Header
        bg="rgba(255, 255, 255, 0.98)"
        style={{ borderBottom: "1px solid var(--border-strong)", boxShadow: "none" }}
      >
        <Box className="workspace-topbar-shell">
          <Box className="workspace-topbar">
            <Stack gap="sm">
              <Group justify="space-between" align="center" gap="sm" wrap="nowrap">
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon size="lg" radius="md" color="gray" variant="light" className="workspace-brand-icon">
                    <IconBottle size={20} />
                  </ThemeIcon>
                  <Box>
                    <Title order={3}>Limoncello business</Title>
                  </Box>
                </Group>
                <Group gap="xs" wrap="nowrap" className="workspace-topbar-controls">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    radius="xl"
                    size="lg"
                    aria-label="Account en thema"
                    onClick={() => setAccountShelfOpened(true)}
                  >
                    <IconUser size={18} />
                  </ActionIcon>
                  <Burger
                    hiddenFrom="md"
                    opened={mobileNavOpened}
                    onClick={() => setMobileNavOpened((current) => !current)}
                    aria-label="Open navigatie"
                    size="sm"
                  />
                </Group>
              </Group>

              <Group justify="space-between" align="center" visibleFrom="md">
                <Group gap="xs">
                  {PRIMARY_VIEWS.map((view) => (
                    <Button
                      key={view.value}
                      size="sm"
                      radius="md"
                      variant="subtle"
                      color="gray"
                      className={activeView === view.value ? "workspace-nav-button workspace-nav-button-active" : "workspace-nav-button"}
                      onClick={() => switchView(view.value)}
                    >
                      {view.label}
                    </Button>
                  ))}
                </Group>
                <Group gap="xs">
                  {SECONDARY_VIEWS.map((view) => (
                    <Button
                      key={view.value}
                      size="sm"
                      radius="md"
                      variant="subtle"
                      color="gray"
                      className={activeView === view.value ? "workspace-nav-button workspace-nav-button-active" : "workspace-nav-button workspace-nav-button-secondary"}
                      onClick={() => switchView(view.value)}
                    >
                      {view.label}
                    </Button>
                  ))}
                </Group>
              </Group>
            </Stack>
          </Box>
        </Box>
      </AppShell.Header>

      <Drawer
        opened={mobileNavOpened}
        onClose={() => setMobileNavOpened(false)}
        position="right"
        size="min(22rem, calc(100vw - 1.5rem))"
        title="Navigatie"
        hiddenFrom="md"
      >
        <Stack gap="md">
          <Stack gap="xs">
            <Text size="sm" fw={700} className="muted-copy">
              Hoofdsecties
            </Text>
            {PRIMARY_VIEWS.map((view) => (
              <Button
                key={view.value}
                fullWidth
                justify="space-between"
                variant={activeView === view.value ? "filled" : "light"}
                color={activeView === view.value ? "petrol" : "gray"}
                onClick={() => switchView(view.value)}
              >
                {view.label}
              </Button>
            ))}
          </Stack>

          <Stack gap="xs">
            <Text size="sm" fw={700} className="muted-copy">
              Beheer
            </Text>
            {SECONDARY_VIEWS.map((view) => (
              <Button
                key={view.value}
                fullWidth
                justify="space-between"
                variant={activeView === view.value ? "filled" : "light"}
                color={activeView === view.value ? "petrol" : "gray"}
                onClick={() => switchView(view.value)}
              >
                {view.label}
              </Button>
            ))}
          </Stack>
        </Stack>
      </Drawer>

      <Drawer
        opened={accountShelfOpened}
        onClose={() => setAccountShelfOpened(false)}
        position="right"
        size="min(22rem, calc(100vw - 1.5rem))"
        title="Account & thema"
      >
        <Stack gap="lg">
          <Stack gap={4}>
            <Text fw={700}>Weergave</Text>
            <Text size="sm" className="muted-copy">
              Kies welk thema de app gebruikt.
            </Text>
          </Stack>

          <SegmentedControl
            fullWidth
            radius="xl"
            value={colorScheme}
            onChange={(value) => setColorScheme(value as "light" | "dark")}
            data={[
              { label: "Licht", value: "light" },
              { label: "Donker", value: "dark" },
            ]}
          />

          <Divider />

          <Stack gap={4}>
            <Text fw={700}>Sessie</Text>
            <Text size="sm" className="muted-copy">
              Sluit je sessie af zodra je klaar bent.
            </Text>
          </Stack>

          <form action={logoutAction}>
            <Button type="submit" variant="light" color="red" radius="xl">
              Uitloggen
            </Button>
          </form>
        </Stack>
      </Drawer>

      <AppShell.Main>
        <Stack gap="md" className="workspace-main-stack">
          {data.connectionError || errorMessage || noticeMessage ? (
            <Box className="workspace-toast-stack">
              <Stack gap="sm">
                {data.connectionError ? (
                  <Alert
                    color="red"
                    radius="lg"
                    icon={<IconAlertTriangle size={18} />}
                    className="workspace-toast workspace-toast-error"
                  >
                    De database is nog niet bereikbaar. Start eerst `npm run db:up`, kopieer
                    `.env.example` naar `.env.local` en run daarna `npm run db:init`.
                    De technische melding is: {data.connectionError}
                  </Alert>
                ) : null}

                {errorMessage ? (
                  <Alert
                    color="red"
                    radius="lg"
                    icon={<IconAlertTriangle size={18} />}
                    className="workspace-toast workspace-toast-error"
                  >
                    {errorMessage}
                  </Alert>
                ) : null}

                {noticeMessage ? (
                  <Alert
                    color="teal"
                    radius="lg"
                    icon={<IconInfoCircle size={18} />}
                    className="workspace-toast workspace-toast-success"
                  >
                    {noticeMessage}
                  </Alert>
                ) : null}
              </Stack>
            </Box>
          ) : null}

          {activeView === "home" ? renderHome() : null}
          {activeView === "dashboard" ? renderDashboard() : null}
          {activeView === "batches" ? renderBatches() : null}
          {activeView === "orders" ? renderOrdersWorkspace() : null}
          {activeView === "expenses" ? renderExpensesListWorkspace() : null}
          {activeView === "revenue" ? renderRevenue() : null}
          {activeView === "customers" ? renderCustomersWorkspace() : null}
          {activeView === "ratios" ? renderRatiosWorkspace() : null}
            {activeView === "articles" ? renderArticlesWorkspace() : null}
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
}



