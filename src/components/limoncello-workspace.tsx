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
  IconPencil,
  IconReceipt2,
  IconShoppingBag,
  IconTrash,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  createArticleAction,
  createBatchAction,
  createCustomerAction,
  deleteBatchAction,
  createExpenseAction,
  createOrderAction,
  createRatioTemplateAction,
  createRatioTemplateLineAction,
  deleteRatioTemplateLineAction,
  updateArticleAction,
  updateBatchAction,
  updateBatchActualProducedAction,
  updateCustomerAction,
  updateOrderAction,
  updateBatchStatusAction,
  updateOrderStatusAction,
  updateRatioTemplateAction,
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
  UpdateArticleInput,
  UpdateBatchInput,
  UpdateCustomerInput,
  UpdateOrderInput,
  UpdateRatioTemplateInput,
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
import {
  ARTICLE_EDITOR_COPY,
  BATCH_EDITOR_COPY,
  CUSTOMER_EDITOR_COPY,
  ORDER_EDITOR_COPY,
  RATIO_EDITOR_COPY,
  ArticleDetailPanel,
  ArticleFormState,
  ArticleWorkspaceMode,
  BatchFormState,
  BatchWorkspaceMode,
  CustomerFormState,
  CustomerSummary,
  CustomerWorkspaceMode,
  EditorMode,
  ExpenseFormState,
  OrderFormState,
  OrderWorkspaceMode,
  RatioFormState,
  RatioLineFormState,
  RatioWorkspaceMode,
  RevenueInsightsPanel,
  buildBatchFormState,
  buildBatchFormStateFromBatch,
  buildBatchRecommendations,
  buildEmptyArticleForm,
  buildEmptyCustomerForm,
  buildEmptyRatioForm,
  buildExpenseFormState,
  buildOrderFormState,
  buildOrderFormStateFromOrder,
  buildRatioFormStateFromTemplate,
  firstOrEmpty,
  formatBatchSelectLabel,
  getCustomerSummaryTone,
  getDefaultBatchId,
  getEditorCopy,
  getErrorMessage,
  getMarginToneClass,
  getMarginToneColor,
  getOrderReservationCopy,
  orderStatusReservesBatchCapacity,
  sortBatchesNewToOld,
} from "./limoncello-workspace-support";
import {
  useArticlesWorkspaceState,
  useBatchWorkspaceState,
  useCustomersWorkspaceState,
  useExpensesWorkspaceState,
  useOrderWorkspaceState,
  useRatiosWorkspaceState,
  useRevenueWorkspaceState,
  useWorkspaceChromeState,
  useWorkspaceFeedbackState,
} from "./limoncello-workspace-hooks";
import { WorkspaceTableFrame, WorkspaceTableRows } from "./workspace-table";
import { BatchesWorkspaceView } from "./workspace-views/batches-view";
import { ArticlesWorkspaceView } from "./workspace-views/articles-view";
import { CustomersWorkspaceView } from "./workspace-views/customers-view";
import { DashboardView } from "./workspace-views/dashboard-view";
import { ExpensesWorkspaceView } from "./workspace-views/expenses-view";
import { HomeView } from "./workspace-views/home-view";
import { OrdersWorkspaceView } from "./workspace-views/orders-view";
import { RatiosWorkspaceView } from "./workspace-views/ratios-view";
import { RevenueWorkspaceView } from "./workspace-views/revenue-view";

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
  const { activeView, setActiveView, mobileNavOpened, setMobileNavOpened, accountShelfOpened, setAccountShelfOpened } =
    useWorkspaceChromeState(initialView);
  const {
    pendingAction,
    setPendingAction,
    errorMessage,
    setErrorMessage,
    noticeMessage,
    setNoticeMessage,
  } = useWorkspaceFeedbackState();
  const {
    batchWorkspaceMode,
    setBatchWorkspaceMode,
    selectedBatchId,
    setSelectedBatchId,
    showArchivedBatches,
    setShowArchivedBatches,
    batchSearchQuery,
    setBatchSearchQuery,
    batchActualProducedInputs,
    setBatchActualProducedInputs,
  } = useBatchWorkspaceState(data);
  const {
    orderWorkspaceMode,
    setOrderWorkspaceMode,
    selectedOrderId,
    setSelectedOrderId,
    showCompletedOrders,
    setShowCompletedOrders,
    orderSearchQuery,
    setOrderSearchQuery,
    ordersBatchFilterId,
    setOrdersBatchFilterId,
  } = useOrderWorkspaceState(data);
  const { selectedExpenseId, setSelectedExpenseId, expensesBatchFilterId, setExpensesBatchFilterId } =
    useExpensesWorkspaceState(data);
  const {
    selectedRevenueEntryId,
    setSelectedRevenueEntryId,
    revenueInsightsPanel,
    setRevenueInsightsPanel,
    revenueSearchQuery,
    setRevenueSearchQuery,
    revenueBatchFilterId,
    setRevenueBatchFilterId,
  } = useRevenueWorkspaceState(data);
  const {
    selectedArticleId,
    setSelectedArticleId,
    articleWorkspaceMode,
    setArticleWorkspaceMode,
    articleDetailPanel,
    setArticleDetailPanel,
    articleSearchQuery,
    setArticleSearchQuery,
    articleCreateOpened,
    setArticleCreateOpened,
  } = useArticlesWorkspaceState(data);
  const {
    selectedCustomerId,
    setSelectedCustomerId,
    customerWorkspaceMode,
    setCustomerWorkspaceMode,
    customerSearchQuery,
    setCustomerSearchQuery,
    customerCreateOpened,
    setCustomerCreateOpened,
  } = useCustomersWorkspaceState(data);
  const {
    selectedRatioTemplateId,
    setSelectedRatioTemplateId,
    ratioWorkspaceMode,
    setRatioWorkspaceMode,
    ratioTemplateSearchQuery,
    setRatioTemplateSearchQuery,
    ratioTemplateCreateOpened,
    setRatioTemplateCreateOpened,
    ratioLineCreateOpened,
    setRatioLineCreateOpened,
  } = useRatiosWorkspaceState(data);
  const [articleEditorMode, setArticleEditorMode] = useState<EditorMode>("create");
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [customerEditorMode, setCustomerEditorMode] = useState<EditorMode>("create");
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [ratioEditorMode, setRatioEditorMode] = useState<EditorMode>("create");
  const [editingRatioTemplateId, setEditingRatioTemplateId] = useState<string | null>(null);
  const [batchEditorMode, setBatchEditorMode] = useState<EditorMode>("create");
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [orderEditorMode, setOrderEditorMode] = useState<EditorMode>("create");
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [expenseCreateOpened, setExpenseCreateOpened] = useState(false);
  const [articleForm, setArticleForm] = useState<ArticleFormState>(buildEmptyArticleForm);
  const [customerForm, setCustomerForm] = useState<CustomerFormState>(buildEmptyCustomerForm);
  const [ratioForm, setRatioForm] = useState<RatioFormState>(() => buildEmptyRatioForm(data));
  const [ratioLineForm, setRatioLineForm] = useState<RatioLineFormState>({
    ratioTemplateId: firstOrEmpty(data.ratioTemplates),
      articleId: firstOrEmpty(data.articles),
      quantity: "",
      unit: data.articles[0]?.defaultUnit ?? "l",
    });
  const [batchForm, setBatchForm] = useState<BatchFormState>(() => buildBatchFormState(data));
  const [orderForm, setOrderForm] = useState<OrderFormState>(() => buildOrderFormState(data));
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(() => buildExpenseFormState(data));
  const articleEditorCopy = getEditorCopy(ARTICLE_EDITOR_COPY, articleEditorMode);
  const customerEditorCopy = getEditorCopy(CUSTOMER_EDITOR_COPY, customerEditorMode);
  const ratioEditorCopy = getEditorCopy(RATIO_EDITOR_COPY, ratioEditorMode);
  const batchEditorCopy = getEditorCopy(BATCH_EDITOR_COPY, batchEditorMode);
  const orderEditorCopy = getEditorCopy(ORDER_EDITOR_COPY, orderEditorMode);

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

  function handleBatchStatusChange(batchId: string, status: BatchStatus) {
    void runAction("Batchstatus bijgewerkt", () =>
      updateBatchStatusAction({
        batchId,
        status,
      }),
    );
  }

  function handleBatchDelete(batchId: string) {
    void runAction("Batch verwijderd", () => deleteBatchAction(batchId));
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
      subtitle: `${batch.finishedGoodArticleName} Â· ${formatCurrency(batch.marginAmount)}`,
      badge: <ToneBadge color="red" label="Marge" />,
      meta: `${formatCurrency(batch.costAmount)} kosten Â· ${formatCurrency(batch.revenueAmount)} omzet`,
      onClick: () => openBatch(batch.id),
    })),
    ...lowAvailabilityBatches.slice(0, 3).map((batch) => ({
      id: `signal-stock-${batch.id}`,
      title: `${batch.batchNumber} bijna leeg`,
      subtitle: `${batch.finishedGoodArticleName} Â· ${formatLiters(batch.availableLiters)} beschikbaar`,
      badge: <ToneBadge color="orange" label="Voorraad" />,
      meta: `${formatLiters(batch.soldLiters)} verkocht Â· ${formatCurrency(batch.revenueAmount)} omzet`,
      onClick: () => openBatch(batch.id),
    })),
    ...ordersReadyForDelivery.slice(0, 3).map((order) => ({
      id: `signal-order-${order.id}`,
      title: `${order.orderNumber} klaar voor uitlevering`,
      subtitle: `${order.customerName} Â· ${order.batchNumber}`,
      badge: <ToneBadge color="blue" label="Order" />,
      meta: `${formatLiters(order.orderedLiters)} Â· ${formatCurrency(order.totalAmount)}`,
      onClick: () => openOrder(order.id),
    })),
    ...batchesMissingActualOutput.slice(0, 3).map((batch) => ({
      id: `signal-output-${batch.id}`,
      title: `${batch.batchNumber} mist effectieve output`,
      subtitle: `${batch.finishedGoodArticleName} Â· ${formatLiters(batch.expectedOutputLiters)} verwacht`,
      badge: <ToneBadge color="yellow" label="Output" />,
      meta: "Werk de echte output bij om marges correct te lezen.",
      onClick: () => openBatch(batch.id),
    })),
  ].slice(0, 10);
  const selectedBatch = data.batches.find((item) => item.id === selectedBatchId) ?? null;
  const selectedBatchOrders = data.orders
    .filter((order) => order.batchId === selectedBatchId)
    .sort((left, right) => right.orderedAt.localeCompare(left.orderedAt));
  const selectedBatchReservedOrders = selectedBatchOrders.filter((order) => order.reservesBatchCapacity);
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
        reservedOrderCount: number;
        totalOrderedLiters: number;
        totalOrderedAmount: number;
        totalMarginAmount: number;
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
        reservedOrderCount:
          (current?.reservedOrderCount ?? 0) + (order.reservesBatchCapacity ? 1 : 0),
        totalOrderedLiters: (current?.totalOrderedLiters ?? 0) + order.orderedLiters,
        totalOrderedAmount: (current?.totalOrderedAmount ?? 0) + order.totalAmount,
        totalMarginAmount:
          (current?.totalMarginAmount ?? 0) + (order.status === "geannuleerd" ? 0 : order.marginAmount),
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
    .map<CustomerSummary>((customer) => {
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
        reservedOrderCount: orderStats?.reservedOrderCount ?? 0,
        totalOrderedLiters: orderStats?.totalOrderedLiters ?? 0,
        totalOrderedAmount: orderStats?.totalOrderedAmount ?? 0,
        marginAmount: orderStats?.totalMarginAmount ?? 0,
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

  function resetBatchEditor(preferredBatchId?: string | null) {
    setBatchEditorMode("create");
    setEditingBatchId(null);
    setBatchForm(buildBatchFormState(data));

    if (preferredBatchId) {
      setSelectedBatchId(preferredBatchId);
    }
  }

  function resetOrderEditor(preferredBatchId?: string | null) {
    setOrderEditorMode("create");
    setEditingOrderId(null);
    setOrderForm(buildOrderFormState(data, preferredBatchId ?? ordersBatchFilterId));
  }

  function resetArticleEditor() {
    setArticleEditorMode("create");
    setEditingArticleId(null);
    setArticleForm(buildEmptyArticleForm());
  }

  function resetCustomerEditor() {
    setCustomerEditorMode("create");
    setEditingCustomerId(null);
    setCustomerForm(buildEmptyCustomerForm());
  }

  function resetRatioEditor() {
    setRatioEditorMode("create");
    setEditingRatioTemplateId(null);
    setRatioForm(buildEmptyRatioForm(data));
  }

  function openBatchCreator() {
    resetBatchEditor();
    setBatchWorkspaceMode("create");
    setActiveView("batches");
  }

  function openBatchOverview() {
    resetBatchEditor();
    setBatchWorkspaceMode(data.batches.length > 0 ? "overview" : "create");
    setActiveView("batches");
  }

  function openBatch(batchId: string) {
    setSelectedBatchId(batchId);
    setBatchWorkspaceMode("detail");
    setActiveView("batches");
  }

  function openBatchEditor(batch: WorkspaceData["batches"][number]) {
    setSelectedBatchId(batch.id);
    setBatchEditorMode("edit");
    setEditingBatchId(batch.id);
    setBatchForm(buildBatchFormStateFromBatch(batch));
    setBatchWorkspaceMode("create");
    setActiveView("batches");
  }

  function openOrderCreator() {
    resetOrderEditor();
    setOrderWorkspaceMode("create");
    setActiveView("orders");
  }

  function openOrdersOverview() {
    resetOrderEditor();
    setOrderWorkspaceMode(data.orders.length > 0 ? "overview" : "create");
    setActiveView("orders");
  }

  function openOrder(orderId: string) {
    setSelectedOrderId(orderId);
    setOrderWorkspaceMode("detail");
    setActiveView("orders");
  }

  function openOrderEditor(order: WorkspaceData["orders"][number]) {
    setSelectedOrderId(order.id);
    setOrderEditorMode("edit");
    setEditingOrderId(order.id);
    setOrderForm(buildOrderFormStateFromOrder(order));
    setOrderWorkspaceMode("create");
    setActiveView("orders");
  }

  function openOrdersForBatch(batchId: string) {
    setSelectedBatchId(batchId);
    setOrdersBatchFilterId(batchId);
    resetOrderEditor(batchId);
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
    resetArticleEditor();
    setArticleCreateOpened(true);
  }

  function openArticleEditor(selectedArticle: WorkspaceData["articles"][number]) {
    setArticleWorkspaceMode("detail");
    setSelectedArticleId(selectedArticle.id);
    setArticleDetailPanel("recipe_usage");
    setActiveView("articles");
    setArticleEditorMode("edit");
    setEditingArticleId(selectedArticle.id);
    setArticleForm({
      name: selectedArticle.name,
      sku: selectedArticle.sku ?? "",
      category: selectedArticle.category,
      defaultUnit: selectedArticle.defaultUnit,
    });
    setArticleCreateOpened(true);
  }

  function closeArticleCreator() {
    setArticleCreateOpened(false);
    resetArticleEditor();
  }

  function openCustomersOverview() {
    setCustomerWorkspaceMode("overview");
    setActiveView("customers");
  }

  function openCustomerCreator() {
    setCustomerWorkspaceMode("overview");
    setActiveView("customers");
    resetCustomerEditor();
    setCustomerCreateOpened(true);
  }

  function openCustomerEditor(customer: WorkspaceData["customers"][number]) {
    setSelectedCustomerId(customer.id);
    setCustomerWorkspaceMode("detail");
    setActiveView("customers");
    setCustomerEditorMode("edit");
    setEditingCustomerId(customer.id);
    setCustomerForm({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      notes: customer.notes ?? "",
    });
    setCustomerCreateOpened(true);
  }

  function closeCustomerCreator() {
    setCustomerCreateOpened(false);
    resetCustomerEditor();
  }

  function openRatioTemplateCreator() {
    setRatioWorkspaceMode("overview");
    setActiveView("ratios");
    resetRatioEditor();
    setRatioTemplateCreateOpened(true);
  }

  function closeRatioTemplateCreator() {
    setRatioTemplateCreateOpened(false);
    resetRatioEditor();
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

  function openRatioTemplateEditor(template: WorkspaceData["ratioTemplates"][number]) {
    setSelectedRatioTemplateId(template.id);
    setRatioWorkspaceMode("detail");
    setActiveView("ratios");
    setRatioEditorMode("edit");
    setEditingRatioTemplateId(template.id);
    setRatioForm(buildRatioFormStateFromTemplate(template));
    setRatioTemplateCreateOpened(true);
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

  const orderCompletedOrderCount = filteredOrders.filter((order) => order.status === "afgerond").length;
  const orderOpenOrderCount = visibleOrders.filter(
    (order) => order.status !== "afgerond" && order.status !== "geannuleerd",
  ).length;
  const orderOpenOrderLiters = visibleOrders
    .filter((order) => order.status !== "afgerond" && order.status !== "geannuleerd")
    .reduce((sum, order) => sum + order.orderedLiters, 0);
  const orderFilteredMarginAmount = visibleOrders.reduce(
    (sum, order) => sum + (order.status === "geannuleerd" ? 0 : order.marginAmount),
    0,
  );

  const customerOverviewCountWithOrders = customerSummaries.filter((customer) => customer.orderCount > 0).length;
  const customerOverviewCountWithRevenue = customerSummaries.filter((customer) => customer.revenueAmount > 0).length;
  const customerOverviewCountWithOpenOrders = customerSummaries.filter((customer) => customer.openOrderCount > 0).length;
  const customerOverviewTotalOpenOrders = customerSummaries.reduce(
    (sum, customer) => sum + customer.openOrderCount,
    0,
  );
  const customerOverviewTotalRevenue = customerSummaries.reduce((sum, customer) => sum + customer.revenueAmount, 0);
  const customerOverviewTotalMargin = customerSummaries.reduce((sum, customer) => sum + customer.marginAmount, 0);
  const customerOverviewTotalLitersSold = customerSummaries.reduce((sum, customer) => sum + customer.litersSold, 0);
  const customerOptions = data.customers.map((customer) => ({
    value: customer.id,
    label: `${customer.firstName} ${customer.lastName}`,
  }));

  function handleOrderStatusChange(orderId: string, status: OrderStatus) {
    void runAction("Orderstatus bijgewerkt", () =>
      updateOrderStatusAction({
        orderId,
        status,
      }),
    );
  }

  function handleOrderSubmit() {
    void runAction(
      orderEditorCopy.success,
      () =>
        orderEditorMode === "edit" && editingOrderId
          ? updateOrderAction({
              orderId: editingOrderId,
              orderNumber: orderForm.orderNumber,
              customerId: orderForm.customerId,
              batchId: orderForm.batchId,
              orderedLiters: Number(orderForm.orderedLiters),
              status: orderForm.status,
              orderedAt: orderForm.orderedAt,
              notes: orderForm.notes,
            } satisfies UpdateOrderInput)
          : createOrderAction({
              customerId: orderForm.customerId,
              batchId: orderForm.batchId,
              orderedLiters: Number(orderForm.orderedLiters),
              status: orderForm.status,
              orderedAt: orderForm.orderedAt,
              notes: orderForm.notes,
            } satisfies CreateOrderInput),
      () => {
        if (orderEditorMode === "edit" && editingOrderId) {
          setSelectedOrderId(editingOrderId);
          setOrderWorkspaceMode("detail");
        } else {
          setOrderWorkspaceMode("overview");
        }
        resetOrderEditor();
      },
    );
  }

  function handleBatchSubmit() {
    void runAction(
      batchEditorCopy.success,
      () =>
        batchEditorMode === "edit" && editingBatchId
          ? updateBatchAction({
              batchId: editingBatchId,
              startedSteepingAt: batchForm.startedSteepingAt,
              steepDays: Number(batchForm.steepDays),
              status: batchForm.status,
              ratioTemplateId: batchForm.ratioTemplateId,
              alcoholInputLiters: Number(batchForm.alcoholInputLiters),
              expectedOutputLiters: Number(batchForm.expectedOutputLiters),
              unitPricePerLiter: Number(batchForm.unitPricePerLiter),
              notes: batchForm.notes,
            } satisfies UpdateBatchInput)
          : createBatchAction({
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
        if (batchEditorMode === "edit" && editingBatchId) {
          setSelectedBatchId(editingBatchId);
          setBatchWorkspaceMode("detail");
        } else {
          setBatchWorkspaceMode("overview");
        }
        resetBatchEditor();
      },
    );
  }

  function handleExpenseSubmit() {
    void runAction(
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
    );
  }

  const customerEditorDrawer = (
    <Drawer
      opened={customerCreateOpened}
      onClose={closeCustomerCreator}
      position="right"
      size="30rem"
      title={customerEditorCopy.title}
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
          loading={pendingAction === customerEditorCopy.success}
          disabled={databaseUnavailable}
          className="batch-toolbar-button-primary"
          onClick={() =>
            runAction(
              customerEditorCopy.success,
              () =>
                customerEditorMode === "edit" && editingCustomerId
                  ? updateCustomerAction({
                      customerId: editingCustomerId,
                      firstName: customerForm.firstName,
                      lastName: customerForm.lastName,
                      email: customerForm.email,
                      phone: customerForm.phone,
                      notes: customerForm.notes,
                    } satisfies UpdateCustomerInput)
                  : createCustomerAction({
                      firstName: customerForm.firstName,
                      lastName: customerForm.lastName,
                      email: customerForm.email,
                      phone: customerForm.phone,
                      notes: customerForm.notes,
                    } satisfies CreateCustomerInput),
              closeCustomerCreator,
            )
          }
        >
          {customerEditorCopy.submit}
        </Button>
      </Stack>
    </Drawer>
  );

  const renderHome = () => {
    return (
      <HomeView
        data={data}
        lowAvailabilityCount={lowAvailabilityBatches.length}
        batchesMissingActualOutputCount={batchesMissingActualOutput.length}
        signals={dashboardSignals}
        onOpenBatchCreator={openBatchCreator}
        onOpenOrderCreator={openOrderCreator}
        onOpenExpenseCreator={() => openExpenseCreator()}
        onOpenCustomerCreator={openCustomerCreator}
        onOpenDashboard={() => switchView("dashboard")}
      />
    );
  };

  const renderDashboard = () => {
    return (
      <DashboardView
        data={data}
        customerSummaries={customerSummaries}
        onOpenBatch={openBatch}
        onOpenCustomer={openCustomer}
        onOpenExpenses={() => switchView("expenses")}
        onOpenBatches={() => switchView("batches")}
      />
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

  const renderBatches = () => {
    const readyBatchCount = visibleBatches.filter((batch) => batch.status === "ready").length;
    const steepingBatchCount = visibleBatches.filter((batch) => batch.status === "steeping").length;
    const soldOutBatchCount = visibleBatches.filter((batch) => batch.status === "sold_out").length;
    return (
      <BatchesWorkspaceView
        batchWorkspaceMode={batchWorkspaceMode}
        batchEditorCopy={batchEditorCopy}
        batchEditorMode={batchEditorMode}
        editingBatchId={editingBatchId}
        batchCount={data.batches.length}
        batchForm={batchForm}
        setBatchForm={setBatchForm}
        ratioTemplateOptions={data.ratioTemplates.map((template) => ({
          value: template.id,
          label: `${template.name} - ${template.finishedGoodArticleName}`,
        }))}
        selectedBatchTemplateSummary={
          selectedBatchTemplate
            ? `${selectedBatchTemplate.finishedGoodArticleName} via ${selectedBatchTemplate.name}.`
            : null
        }
        selectedBatch={selectedBatch}
        selectedBatchOrdersCount={selectedBatchOrders.length}
        selectedBatchExpensesCount={selectedBatchExpenses.length}
        selectedBatchRevenueCount={selectedBatchRevenue.length}
        selectedBatchReservedOrdersCount={selectedBatchReservedOrders.length}
        selectedBatchHistory={selectedBatchHistory}
        readyBatchCount={readyBatchCount}
        steepingBatchCount={steepingBatchCount}
        soldOutBatchCount={soldOutBatchCount}
        visibleAvailableLiters={visibleAvailableLiters}
        visibleBatchesMissingActualOutputCount={visibleBatchesMissingActualOutput.length}
        batchSearchQuery={batchSearchQuery}
        setBatchSearchQuery={setBatchSearchQuery}
        showArchivedBatches={showArchivedBatches}
        setShowArchivedBatches={setShowArchivedBatches}
        archivedBatchCount={archivedBatchCount}
        batchSearchTerm={batchSearchTerm}
        filteredVisibleBatches={filteredVisibleBatches}
        batchActualProducedInputs={batchActualProducedInputs}
        setBatchActualProducedInputs={setBatchActualProducedInputs}
        databaseUnavailable={databaseUnavailable}
        pendingAction={pendingAction}
        onBatchTemplateChange={handleBatchTemplateChange}
        onBatchAlcoholInputChange={handleBatchAlcoholInputChange}
        onSubmitBatch={handleBatchSubmit}
        onCommitBatchActualProduced={commitBatchActualProduced}
        onResetBatchActualProducedInput={resetBatchActualProducedInput}
        onOpenBatchOverview={openBatchOverview}
        onOpenBatch={openBatch}
        onOpenBatchCreator={openBatchCreator}
        onOpenBatchEditor={openBatchEditor}
        onOpenOrdersForBatch={openOrdersForBatch}
        onOpenExpensesForBatch={openExpensesForBatch}
        onOpenRevenueForBatch={openRevenueForBatch}
        onUpdateBatchStatus={handleBatchStatusChange}
        onDeleteBatch={handleBatchDelete}
      />
    );
  };

  const renderOrderDetailsWorkspacePanel = () => {
    if (!selectedOrder) {
      return null;
    }

    return (
      <Box className="batch-panel-layout">
        <Group gap="xs" className="batch-detail-actions">
          <ActionIcon
            size="lg"
            radius="sm"
            variant="light"
            color="sage"
            className="batch-context-icon-button"
            aria-label="Batch openen"
            title="Batch openen"
            onClick={() => openBatch(selectedOrder.batchId)}
          >
            <IconBottle size={18} />
          </ActionIcon>
          <ActionIcon
            size="lg"
            radius="sm"
            variant="light"
            color="sage"
            className="batch-context-icon-button"
            aria-label="Klant openen"
            title="Klant openen"
            onClick={() => openCustomer(selectedOrder.customerId)}
          >
            <IconUser size={18} />
          </ActionIcon>
          <ActionIcon
            size="lg"
            radius="sm"
            variant="light"
            color="gray"
            className="batch-context-icon-button"
            aria-label="Order aanpassen"
            title="Order aanpassen"
            onClick={() => openOrderEditor(selectedOrder)}
          >
            <IconPencil size={16} />
          </ActionIcon>
        </Group>
        <Box className="batch-panel-auto-grid batch-panel-grow">
          <Box className="batch-panel-block">
            <Stack gap="xs">
              <Text fw={700}>Orderinfo</Text>
              <DetailRow label="Klant" value={selectedOrder.customerName} />
              <DetailRow label="Batch" value={selectedOrder.batchNumber} />
              {selectedOrderDetailBatch ? (
                <Box className="order-detail-inline-note">
                  <Stack gap={2}>
                    <Text size="sm" fw={600}>
                      Nog bestelbaar: {formatLiters(selectedOrderDetailBatch.bookableLiters)}
                    </Text>
                    <Text size="sm" className="muted-copy">
                      Vrij voor reservatie: {formatLiters(selectedOrderDetailBatch.availableLiters)}
                    </Text>
                  </Stack>
                </Box>
              ) : null}
              <DetailRow label="Product" value={selectedOrder.finishedGoodArticleName} />
              <DetailRow label="Volume" value={formatLiters(selectedOrder.orderedLiters)} />
              <DetailRow label="Prijs per liter" value={formatCurrency(selectedOrder.unitPricePerLiter)} />
              <DetailRow label="Totaal" value={formatCurrency(selectedOrder.totalAmount)} />
              <DetailRow label="Kost" value={formatCurrency(selectedOrder.costAmount)} />
              <DetailRow label="Marge" value={formatCurrency(selectedOrder.marginAmount)} />
              <DetailRow
                label="Reservatie"
                value={getOrderReservationCopy(selectedOrder.status, selectedOrder.orderedLiters)}
              />
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
      title={orderEditorCopy.title}
      className="batch-screen-card"
      subtitle={orderEditorCopy.subtitle}
      headerStart={
        <ActionIcon
          variant="transparent"
          color="gray"
          size="md"
          radius="xl"
          aria-label="Terug naar orders"
          className="batch-detail-back-button"
          onClick={() =>
            orderEditorMode === "edit" && editingOrderId ? openOrder(editingOrderId) : openOrdersOverview()
          }
        >
          <IconArrowLeft size={18} />
        </ActionIcon>
      }
    >
      <Stack gap="sm">
        {orderEditorMode === "edit" ? (
          <TextInput
            label="Ordernummer"
            value={orderForm.orderNumber}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setOrderForm((current) => ({ ...current, orderNumber: value }));
            }}
          />
        ) : null}
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
              <Text size="sm">Nog bestelbaar: {formatLiters(selectedOrderBatch.bookableLiters)}</Text>
              <Text size="sm">Vrij voor reservatie: {formatLiters(selectedOrderBatch.availableLiters)}</Text>
              <Text size="sm">
                Reservatie:{" "}
                {orderStatusReservesBatchCapacity(orderForm.status)
                  ? `${formatLiters(Number(orderForm.orderedLiters || 0))} wordt vastgezet op deze batch`
                  : orderForm.status === "afgerond"
                    ? "Volume wordt als verkoop geboekt bij afronden"
                    : "Status besteld telt wel mee tegen de verwachte output, maar houdt nog geen batchvolume vast"}
              </Text>
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
          loading={pendingAction === orderEditorCopy.success}
          disabled={databaseUnavailable}
          className="batch-toolbar-button-primary"
          onClick={() =>
            runAction(
              orderEditorCopy.success,
              () =>
                orderEditorMode === "edit" && editingOrderId
                  ? updateOrderAction({
                      orderId: editingOrderId,
                      orderNumber: orderForm.orderNumber,
                      customerId: orderForm.customerId,
                      batchId: orderForm.batchId,
                      orderedLiters: Number(orderForm.orderedLiters),
                      status: orderForm.status,
                      orderedAt: orderForm.orderedAt,
                      notes: orderForm.notes,
                    } satisfies UpdateOrderInput)
                  : createOrderAction({
                      customerId: orderForm.customerId,
                      batchId: orderForm.batchId,
                      orderedLiters: Number(orderForm.orderedLiters),
                      status: orderForm.status,
                      orderedAt: orderForm.orderedAt,
                      notes: orderForm.notes,
                    } satisfies CreateOrderInput),
              () => {
                if (orderEditorMode === "edit" && editingOrderId) {
                  setSelectedOrderId(editingOrderId);
                  setOrderWorkspaceMode("detail");
                } else {
                  setOrderWorkspaceMode("overview");
                }
                resetOrderEditor();
              },
            )
          }
        >
          {orderEditorCopy.submit}
        </Button>
      </Stack>
    </SectionCard>
  );

  const renderOrdersWorkspace = () => {
    return (
      <OrdersWorkspaceView
        databaseUnavailable={databaseUnavailable}
        pendingAction={pendingAction}
        orderEditorCopy={orderEditorCopy}
        orderEditorMode={orderEditorMode}
        editingOrderId={editingOrderId}
        orderWorkspaceMode={orderWorkspaceMode}
        orderForm={orderForm}
        setOrderForm={setOrderForm}
        showCompletedOrders={showCompletedOrders}
        setShowCompletedOrders={setShowCompletedOrders}
        orderSearchQuery={orderSearchQuery}
        setOrderSearchQuery={setOrderSearchQuery}
        batchSelectOptions={batchSelectOptions}
        customerOptions={customerOptions}
        ordersBatchFilterId={ordersBatchFilterId}
        setOrdersBatchFilterId={setOrdersBatchFilterId}
        ordersFilterBatch={ordersFilterBatch}
        completedOrderCount={orderCompletedOrderCount}
        openOrderCount={orderOpenOrderCount}
        openOrderLiters={orderOpenOrderLiters}
        filteredOrderMarginAmount={orderFilteredMarginAmount}
        orderSearchTerm={orderSearchTerm}
        searchedVisibleOrders={searchedVisibleOrders}
        filteredOrders={filteredOrders}
        visibleOrders={visibleOrders}
        selectedOrder={selectedOrder}
        selectedOrderBatch={selectedOrderBatch}
        selectedOrderDetailBatch={selectedOrderDetailBatch}
        selectedOrderHistory={selectedOrderHistory}
        onOpenOrdersOverview={openOrdersOverview}
        onOpenOrder={openOrder}
        onOpenBatch={openBatch}
        onOpenCustomer={openCustomer}
        onOpenOrderEditor={openOrderEditor}
        onOpenOrderCreator={openOrderCreator}
        onUpdateOrderStatus={handleOrderStatusChange}
        onSubmitOrder={handleOrderSubmit}
      />
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
      <ExpensesWorkspaceView
        filteredExpenseTotalAmount={filteredExpenseTotalAmount}
        averageAlcoholCostPerLiter={averageAlcoholCostPerLiter}
        averageCostPerOutputLiter={averageCostPerOutputLiter}
        largestExpenseArticle={largestExpenseArticle}
        averageCostPerArticle={averageCostPerArticle}
        expensesFilterBatch={expensesFilterBatch}
        expensesBatchFilterId={expensesBatchFilterId}
        setExpensesBatchFilterId={setExpensesBatchFilterId}
        batchFilterOptions={batchFilterOptions}
        filteredExpenses={filteredExpenses}
        selectedExpenseId={selectedExpenseId}
        setSelectedExpenseId={setSelectedExpenseId}
        selectedExpense={selectedExpense}
        onOpenExpenseCreator={openExpenseCreator}
        onOpenBatch={openBatch}
        expenseCreateOpened={expenseCreateOpened}
        onCloseExpenseCreator={closeExpenseCreator}
        batchSelectOptions={batchSelectOptions}
        articles={data.articles}
        expenseForm={expenseForm}
        setExpenseForm={setExpenseForm}
        pendingAction={pendingAction}
        databaseUnavailable={databaseUnavailable}
        onSubmitExpense={handleExpenseSubmit}
      />
    );
  };
  const renderRevenue = () => (
    <RevenueWorkspaceView
      filteredRevenueEntries={filteredRevenueEntries}
      filteredRevenueLiters={filteredRevenueLiters}
      filteredRevenueAmount={filteredRevenueAmount}
      filteredRevenueAverageOrderValue={filteredRevenueAverageOrderValue}
      filteredRevenueAveragePricePerLiter={filteredRevenueAveragePricePerLiter}
      topRevenueBatch={topRevenueBatch}
      topRevenueCustomer={topRevenueCustomer}
      revenueInsightsPanel={revenueInsightsPanel}
      setRevenueInsightsPanel={setRevenueInsightsPanel}
      revenueTotalsByBatch={revenueTotalsByBatch}
      revenueFilterBatch={revenueFilterBatch}
      revenueSearchQuery={revenueSearchQuery}
      setRevenueSearchQuery={setRevenueSearchQuery}
      revenueBatchFilterId={revenueBatchFilterId}
      setRevenueBatchFilterId={setRevenueBatchFilterId}
      batchFilterOptions={batchFilterOptions}
      searchedRevenueEntries={searchedRevenueEntries}
      revenueSearchTerm={revenueSearchTerm}
      selectedRevenueEntryId={selectedRevenueEntryId}
      setSelectedRevenueEntryId={setSelectedRevenueEntryId}
      selectedRevenueEntry={selectedRevenueEntry}
      selectedRevenueOrder={selectedRevenueOrder}
      selectedRevenueBatchDetail={selectedRevenueBatchDetail}
      selectedRevenueCustomer={selectedRevenueCustomer}
      onOpenOrder={openOrder}
      onOpenBatch={openBatch}
      onOpenCustomer={openCustomer}
    />
  );
  const renderCustomersWorkspace = () => {
    return (
      <CustomersWorkspaceView
        customerCount={data.customers.length}
        customersWithOrdersCount={customerOverviewCountWithOrders}
        customersWithRevenueCount={customerOverviewCountWithRevenue}
        customersWithOpenOrdersCount={customerOverviewCountWithOpenOrders}
        totalOpenCustomerOrders={customerOverviewTotalOpenOrders}
        totalCustomerRevenue={customerOverviewTotalRevenue}
        totalCustomerMargin={customerOverviewTotalMargin}
        totalCustomerLitersSold={customerOverviewTotalLitersSold}
        topRevenueCustomerName={topRevenueCustomer?.customerName ?? null}
        customerSearchQuery={customerSearchQuery}
        setCustomerSearchQuery={setCustomerSearchQuery}
        customerSearchTerm={customerSearchTerm}
        searchedCustomerSummaries={searchedCustomerSummaries}
        selectedCustomer={selectedCustomer}
        selectedCustomerSummary={selectedCustomerSummary}
        selectedCustomerOrders={selectedCustomerOrders}
        selectedCustomerRevenueEntries={selectedCustomerRevenueEntries}
        customerWorkspaceMode={customerWorkspaceMode}
        onOpenCustomer={openCustomer}
        onOpenOrder={openOrder}
        onOpenRevenueEntry={openRevenueEntry}
        onOpenCustomerEditor={openCustomerEditor}
        onOpenCustomerCreator={openCustomerCreator}
        onOpenCustomersOverview={openCustomersOverview}
        customerEditorDrawer={customerEditorDrawer}
      />
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
          title={ratioEditorCopy.title}
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
              loading={pendingAction === ratioEditorCopy.success}
              disabled={databaseUnavailable}
              className="batch-toolbar-button-primary"
              onClick={() =>
                runAction(
                  ratioEditorCopy.success,
                  () =>
                    ratioEditorMode === "edit" && editingRatioTemplateId
                      ? updateRatioTemplateAction({
                          ratioTemplateId: editingRatioTemplateId,
                          name: ratioForm.name,
                          finishedGoodArticleId: ratioForm.finishedGoodArticleId,
                          baseAlcoholLiters: Number(ratioForm.baseAlcoholLiters),
                          expectedOutputLitersPerBaseAlcoholLiter: Number(
                            ratioForm.expectedOutputLitersPerBaseAlcoholLiter,
                          ),
                          notes: ratioForm.notes,
                        } satisfies UpdateRatioTemplateInput)
                      : createRatioTemplateAction({
                          name: ratioForm.name,
                          finishedGoodArticleId: ratioForm.finishedGoodArticleId,
                          baseAlcoholLiters: Number(ratioForm.baseAlcoholLiters),
                          expectedOutputLitersPerBaseAlcoholLiter: Number(
                            ratioForm.expectedOutputLitersPerBaseAlcoholLiter,
                          ),
                          notes: ratioForm.notes,
                        } satisfies CreateRatioTemplateInput),
                  closeRatioTemplateCreator,
                )
              }
            >
              {ratioEditorCopy.submit}
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

    return (
      <RatiosWorkspaceView
        ratioTemplateCount={data.ratioTemplates.length}
        ratioTemplateLineCount={data.ratioTemplateLines.length}
        ratioFinishedGoodsCount={ratioFinishedGoodsCount}
        averageRatioLinesPerTemplate={averageRatioLinesPerTemplate}
        ratioAverageOutput={ratioAverageOutput}
        topRatioArticle={topRatioArticle}
        ratioWorkspaceMode={ratioWorkspaceMode}
        selectedRatioTemplate={selectedRatioTemplate}
        selectedRatioLines={selectedRatioLines}
        ratioTemplateSearchQuery={ratioTemplateSearchQuery}
        setRatioTemplateSearchQuery={setRatioTemplateSearchQuery}
        ratioTemplateSearchTerm={ratioTemplateSearchTerm}
        searchedRatioTemplateSummaries={searchedRatioTemplateSummaries}
        ratioEditorDrawers={ratioCreateDrawers}
        onOpenRatioOverview={openRatioOverview}
        onOpenRatioTemplate={openRatioTemplate}
        onOpenRatioTemplateCreator={openRatioTemplateCreator}
        onOpenRatioTemplateEditor={openRatioTemplateEditor}
        onOpenRatioLineCreator={openRatioLineCreator}
        onDeleteRatioLine={(lineId) =>
          runAction("Receptregel verwijderd", () => deleteRatioTemplateLineAction(lineId))
        }
      />
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
        title={articleEditorCopy.title}
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
            loading={pendingAction === articleEditorCopy.success}
            disabled={databaseUnavailable}
            className="batch-toolbar-button-primary"
            onClick={() =>
              runAction(
                articleEditorCopy.success,
                () =>
                  articleEditorMode === "edit" && editingArticleId
                    ? updateArticleAction({
                        articleId: editingArticleId,
                        name: articleForm.name,
                        sku: articleForm.sku,
                        category: articleForm.category,
                        defaultUnit: articleForm.defaultUnit,
                      } satisfies UpdateArticleInput)
                    : createArticleAction({
                        name: articleForm.name,
                        sku: articleForm.sku,
                        category: articleForm.category,
                        defaultUnit: articleForm.defaultUnit,
                      } satisfies CreateArticleInput),
                closeArticleCreator,
              )
            }
          >
            {articleEditorCopy.submit}
          </Button>
        </Stack>
      </Drawer>
    );

    return (
      <ArticlesWorkspaceView
        articleCount={data.articles.length}
        ingredientCount={ingredientCount}
        packagingCount={packagingCount}
        finishedGoodCount={finishedGoodCount}
        totalPurchaseAmount={totalPurchaseAmount}
        totalSalesAmount={totalSalesAmount}
        topPurchaseArticleName={topPurchaseArticle?.name ?? null}
        topSalesArticleName={topSalesArticle?.name ?? null}
        articleWorkspaceMode={articleWorkspaceMode}
        articleSearchQuery={articleSearchQuery}
        setArticleSearchQuery={setArticleSearchQuery}
        articleSearchTerm={articleSearchTerm}
        searchedArticleRows={searchedArticleRows}
        articleEditorDrawer={articleCreateDrawer}
        selectedArticle={selectedArticle}
        selectedArticleReport={selectedArticleReport}
        selectedArticleRatioLines={selectedArticleRatioLines}
        selectedArticleExpenses={selectedArticleExpenses}
        selectedArticleBatches={selectedArticleBatches}
        selectedArticleOrders={selectedArticleOrders}
        selectedArticleRevenueEntries={selectedArticleRevenueEntries}
        ratioTemplates={data.ratioTemplates}
        articleDetailPanel={articleDetailPanel}
        setArticleDetailPanel={setArticleDetailPanel}
        onOpenArticlesOverview={openArticlesOverview}
        onOpenArticle={openArticle}
        onOpenArticleCreator={openArticleCreator}
        onOpenArticleEditor={openArticleEditor}
        onOpenRatioTemplate={openRatioTemplate}
        onOpenExpensesForBatch={openExpensesForBatch}
        onOpenBatch={openBatch}
        onOpenRevenueEntry={openRevenueEntry}
      />
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




