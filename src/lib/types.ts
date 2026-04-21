export type ArticleCategory = "ingredient" | "packaging" | "finished_good" | "other";
export type Unit = "l" | "g" | "kg" | "st";
export type BatchStatus = "draft" | "steeping" | "ready" | "sold_out" | "archived";
export type OrderStatus =
  | "besteld"
  | "in_verwerking"
  | "klaar_voor_uitlevering"
  | "afgerond"
  | "geannuleerd";
export type PaymentMethod = "cash" | "overschrijving";
export type AppView =
  | "home"
  | "batches"
  | "orders"
  | "expenses"
  | "revenue"
  | "customers"
  | "ratios"
  | "articles"
  | "dashboard";

export type Article = {
  id: string;
  name: string;
  sku: string | null;
  category: ArticleCategory;
  defaultUnit: Unit;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RatioTemplate = {
  id: string;
  name: string;
  finishedGoodArticleId: string;
  finishedGoodArticleName: string;
  baseAlcoholLiters: number;
  expectedOutputLitersPerBaseAlcoholLiter: number;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RatioTemplateLine = {
  id: string;
  ratioTemplateId: string;
  articleId: string;
  articleName: string;
  quantity: number;
  unit: Unit;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Batch = {
  id: string;
  batchNumber: string;
  startedSteepingAt: string;
  steepDays: number;
  steepingUntil: string;
  readyAt: string | null;
  status: BatchStatus;
  finishedGoodArticleId: string;
  finishedGoodArticleName: string;
  ratioTemplateId: string;
  ratioTemplateName: string;
  alcoholInputLiters: number;
  expectedOutputLiters: number;
  actualProducedLiters: number | null;
  unitPricePerLiter: number;
  orderedLiters: number;
  reservedLiters: number;
  soldLiters: number;
  availableLiters: number;
  bookableLiters: number;
  revenueAmount: number;
  costAmount: number;
  marginAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BatchStatusHistoryItem = {
  id: string;
  batchId: string;
  fromStatus: BatchStatus | null;
  toStatus: BatchStatus;
  changedAt: string;
  note: string | null;
};

export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  batchId: string;
  batchNumber: string;
  finishedGoodArticleName: string;
  orderedLiters: number;
  unitPricePerLiter: number;
  totalAmount: number;
  costAmount: number;
  marginAmount: number;
  reservesBatchCapacity: boolean;
  status: OrderStatus;
  orderedAt: string;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatusHistoryItem = {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedAt: string;
  note: string | null;
};

export type RevenueEntry = {
  id: string;
  orderId: string;
  orderNumber: string;
  batchId: string;
  batchNumber: string;
  customerId: string;
  customerName: string;
  finishedGoodArticleId: string;
  finishedGoodArticleName: string;
  litersSold: number;
  unitPricePerLiter: number;
  totalAmount: number;
  recognizedAt: string;
  notes: string | null;
  createdAt: string;
};

export type Expense = {
  id: string;
  batchId: string;
  batchNumber: string;
  articleId: string;
  articleName: string;
  expenseDate: string;
  quantity: number | null;
  unit: Unit | null;
  amount: number;
  paymentMethod: PaymentMethod;
  supplierName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ArticleReport = {
  articleId: string;
  name: string;
  category: ArticleCategory;
  defaultUnit: Unit;
  totalPurchasedQuantity: number;
  totalPurchaseAmount: number;
  totalSoldQuantity: number;
  totalSalesAmount: number;
};

export type DashboardSummary = {
  activeBatchCount: number;
  readyBatchCount: number;
  totalAvailableLiters: number;
  totalReservedLiters: number;
  totalSoldLiters: number;
  totalRevenueAmount: number;
  totalCostAmount: number;
  totalMarginAmount: number;
  ordersInProgressCount: number;
  ordersReadyCount: number;
  completedOrderCount: number;
};

export type WorkspaceData = {
  connectionError: string | null;
  articles: Article[];
  ratioTemplates: RatioTemplate[];
  ratioTemplateLines: RatioTemplateLine[];
  batches: Batch[];
  batchStatusHistory: BatchStatusHistoryItem[];
  customers: Customer[];
  orders: Order[];
  orderStatusHistory: OrderStatusHistoryItem[];
  revenueEntries: RevenueEntry[];
  expenses: Expense[];
  articleReports: ArticleReport[];
  dashboard: DashboardSummary;
};

export type CreateArticleInput = {
  name: string;
  sku?: string;
  category: ArticleCategory;
  defaultUnit: Unit;
};

export type UpdateArticleInput = {
  articleId: string;
  name: string;
  sku?: string;
  category: ArticleCategory;
  defaultUnit: Unit;
};

export type CreateRatioTemplateInput = {
  name: string;
  finishedGoodArticleId: string;
  baseAlcoholLiters: number;
  expectedOutputLitersPerBaseAlcoholLiter: number;
  notes?: string;
};

export type CreateRatioTemplateLineInput = {
  ratioTemplateId: string;
  articleId: string;
  quantity: number;
  unit: Unit;
};

export type UpdateRatioTemplateInput = {
  ratioTemplateId: string;
  name: string;
  finishedGoodArticleId: string;
  baseAlcoholLiters: number;
  expectedOutputLitersPerBaseAlcoholLiter: number;
  notes?: string;
};

export type CreateBatchInput = {
  startedSteepingAt: string;
  steepDays: number;
  status: BatchStatus;
  ratioTemplateId: string;
  alcoholInputLiters: number;
  expectedOutputLiters: number;
  unitPricePerLiter: number;
  notes?: string;
};

export type UpdateBatchInput = {
  batchId: string;
  startedSteepingAt: string;
  steepDays: number;
  status: BatchStatus;
  ratioTemplateId: string;
  alcoholInputLiters: number;
  expectedOutputLiters: number;
  unitPricePerLiter: number;
  notes?: string;
};

export type UpdateBatchStatusInput = {
  batchId: string;
  status: BatchStatus;
  note?: string;
};

export type UpdateBatchActualProducedInput = {
  batchId: string;
  actualProducedLiters: number;
};

export type CreateCustomerInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
};

export type UpdateCustomerInput = {
  customerId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
};

export type CreateOrderInput = {
  customerId: string;
  batchId: string;
  orderedLiters: number;
  status: OrderStatus;
  orderedAt: string;
  notes?: string;
};

export type UpdateOrderInput = {
  orderId: string;
  orderNumber: string;
  customerId: string;
  batchId: string;
  orderedLiters: number;
  status: OrderStatus;
  orderedAt: string;
  notes?: string;
};

export type UpdateOrderStatusInput = {
  orderId: string;
  status: OrderStatus;
  note?: string;
};

export type CreateExpenseInput = {
  batchId: string;
  articleId: string;
  expenseDate: string;
  quantity?: number | null;
  unit?: Unit | null;
  amount: number;
  paymentMethod: PaymentMethod;
  supplierName?: string;
  notes?: string;
};
