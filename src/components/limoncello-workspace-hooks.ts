"use client";

import { useEffect, useState } from "react";

import { AppView, WorkspaceData } from "@/lib/types";

import {
  ArticleDetailPanel,
  ArticleWorkspaceMode,
  BatchWorkspaceMode,
  CustomerWorkspaceMode,
  RevenueInsightsPanel,
  OrderWorkspaceMode,
  RatioWorkspaceMode,
  firstOrEmpty,
  getDefaultBatchId,
} from "./limoncello-workspace-support";

function useAutoClearMessage(
  message: string | null,
  clearMessage: () => void,
  timeoutMs = 5_000,
) {
  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout = window.setTimeout(clearMessage, timeoutMs);
    return () => window.clearTimeout(timeout);
  }, [clearMessage, message, timeoutMs]);
}

export function useWorkspaceChromeState(initialView: AppView) {
  const [activeView, setActiveView] = useState<AppView>(initialView);
  const [mobileNavOpened, setMobileNavOpened] = useState(false);
  const [accountShelfOpened, setAccountShelfOpened] = useState(false);

  return {
    activeView,
    setActiveView,
    mobileNavOpened,
    setMobileNavOpened,
    accountShelfOpened,
    setAccountShelfOpened,
  };
}

export function useWorkspaceFeedbackState() {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  useAutoClearMessage(errorMessage, () => setErrorMessage(null));
  useAutoClearMessage(noticeMessage, () => setNoticeMessage(null));

  return {
    pendingAction,
    setPendingAction,
    errorMessage,
    setErrorMessage,
    noticeMessage,
    setNoticeMessage,
  };
}

export function useBatchWorkspaceState(data: WorkspaceData) {
  const [batchWorkspaceMode, setBatchWorkspaceMode] = useState<BatchWorkspaceMode>(
    data.batches.length > 0 ? "overview" : "create",
  );
  const [selectedBatchId, setSelectedBatchId] = useState(getDefaultBatchId(data));
  const [showArchivedBatches, setShowArchivedBatches] = useState(false);
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
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
  }, [data.batches, selectedBatchId]);

  useEffect(() => {
    if (data.batches.length === 0) {
      setBatchWorkspaceMode("create");
    }
  }, [data.batches.length]);

  useEffect(() => {
    setBatchActualProducedInputs(
      Object.fromEntries(
        data.batches.map((batch) => [batch.id, batch.actualProducedLiters?.toString() ?? ""]),
      ),
    );
  }, [data.batches]);

  return {
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
  };
}

export function useOrderWorkspaceState(data: WorkspaceData) {
  const [orderWorkspaceMode, setOrderWorkspaceMode] = useState<OrderWorkspaceMode>(
    data.orders.length > 0 ? "overview" : "create",
  );
  const [selectedOrderId, setSelectedOrderId] = useState(firstOrEmpty(data.orders));
  const [showCompletedOrders, setShowCompletedOrders] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [ordersBatchFilterId, setOrdersBatchFilterId] = useState<string | null>(null);

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

  return {
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
  };
}

export function useExpensesWorkspaceState(data: WorkspaceData) {
  const [selectedExpenseId, setSelectedExpenseId] = useState(firstOrEmpty(data.expenses));
  const [expensesBatchFilterId, setExpensesBatchFilterId] = useState<string | null>(null);

  useEffect(() => {
    if (!data.expenses.some((expense) => expense.id === selectedExpenseId)) {
      setSelectedExpenseId(firstOrEmpty(data.expenses));
    }
  }, [data.expenses, selectedExpenseId]);

  return {
    selectedExpenseId,
    setSelectedExpenseId,
    expensesBatchFilterId,
    setExpensesBatchFilterId,
  };
}

export function useRevenueWorkspaceState(data: WorkspaceData) {
  const [selectedRevenueEntryId, setSelectedRevenueEntryId] = useState(firstOrEmpty(data.revenueEntries));
  const [revenueInsightsPanel, setRevenueInsightsPanel] = useState<RevenueInsightsPanel>("analysis");
  const [revenueSearchQuery, setRevenueSearchQuery] = useState("");
  const [revenueBatchFilterId, setRevenueBatchFilterId] = useState<string | null>(null);

  useEffect(() => {
    if (!data.revenueEntries.some((entry) => entry.id === selectedRevenueEntryId)) {
      setSelectedRevenueEntryId(firstOrEmpty(data.revenueEntries));
    }
  }, [data.revenueEntries, selectedRevenueEntryId]);

  return {
    selectedRevenueEntryId,
    setSelectedRevenueEntryId,
    revenueInsightsPanel,
    setRevenueInsightsPanel,
    revenueSearchQuery,
    setRevenueSearchQuery,
    revenueBatchFilterId,
    setRevenueBatchFilterId,
  };
}

export function useArticlesWorkspaceState(data: WorkspaceData) {
  const [selectedArticleId, setSelectedArticleId] = useState(firstOrEmpty(data.articles));
  const [articleWorkspaceMode, setArticleWorkspaceMode] = useState<ArticleWorkspaceMode>("overview");
  const [articleDetailPanel, setArticleDetailPanel] = useState<ArticleDetailPanel>("recipe_usage");
  const [articleSearchQuery, setArticleSearchQuery] = useState("");
  const [articleCreateOpened, setArticleCreateOpened] = useState(false);

  useEffect(() => {
    if (!data.articles.some((article) => article.id === selectedArticleId)) {
      setSelectedArticleId(firstOrEmpty(data.articles));
    }
  }, [data.articles, selectedArticleId]);

  useEffect(() => {
    if (articleWorkspaceMode === "detail" && !data.articles.some((article) => article.id === selectedArticleId)) {
      setArticleWorkspaceMode("overview");
    }
  }, [articleWorkspaceMode, data.articles, selectedArticleId]);

  return {
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
  };
}

export function useCustomersWorkspaceState(data: WorkspaceData) {
  const [selectedCustomerId, setSelectedCustomerId] = useState(firstOrEmpty(data.customers));
  const [customerWorkspaceMode, setCustomerWorkspaceMode] = useState<CustomerWorkspaceMode>("overview");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [customerCreateOpened, setCustomerCreateOpened] = useState(false);

  useEffect(() => {
    if (!data.customers.some((customer) => customer.id === selectedCustomerId)) {
      setSelectedCustomerId(firstOrEmpty(data.customers));
    }
  }, [data.customers, selectedCustomerId]);

  useEffect(() => {
    if (customerWorkspaceMode === "detail" && !data.customers.some((customer) => customer.id === selectedCustomerId)) {
      setCustomerWorkspaceMode("overview");
    }
  }, [customerWorkspaceMode, data.customers, selectedCustomerId]);

  return {
    selectedCustomerId,
    setSelectedCustomerId,
    customerWorkspaceMode,
    setCustomerWorkspaceMode,
    customerSearchQuery,
    setCustomerSearchQuery,
    customerCreateOpened,
    setCustomerCreateOpened,
  };
}

export function useRatiosWorkspaceState(data: WorkspaceData) {
  const [selectedRatioTemplateId, setSelectedRatioTemplateId] = useState(firstOrEmpty(data.ratioTemplates));
  const [ratioWorkspaceMode, setRatioWorkspaceMode] = useState<RatioWorkspaceMode>("overview");
  const [ratioTemplateSearchQuery, setRatioTemplateSearchQuery] = useState("");
  const [ratioTemplateCreateOpened, setRatioTemplateCreateOpened] = useState(false);
  const [ratioLineCreateOpened, setRatioLineCreateOpened] = useState(false);

  useEffect(() => {
    if (!data.ratioTemplates.some((template) => template.id === selectedRatioTemplateId)) {
      setSelectedRatioTemplateId(firstOrEmpty(data.ratioTemplates));
    }
  }, [data.ratioTemplates, selectedRatioTemplateId]);

  useEffect(() => {
    if (ratioWorkspaceMode === "detail" && !data.ratioTemplates.some((template) => template.id === selectedRatioTemplateId)) {
      setRatioWorkspaceMode("overview");
    }
  }, [data.ratioTemplates, ratioWorkspaceMode, selectedRatioTemplateId]);

  return {
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
  };
}
