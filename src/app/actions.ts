"use server";

import { createArticleAction as createArticleActionImpl, updateArticleAction as updateArticleActionImpl } from "./actions/articles";
import {
  createBatchAction as createBatchActionImpl,
  deleteBatchAction as deleteBatchActionImpl,
  updateBatchAction as updateBatchActionImpl,
  updateBatchActualProducedAction as updateBatchActualProducedActionImpl,
  updateBatchStatusAction as updateBatchStatusActionImpl,
} from "./actions/batches";
import {
  createCustomerAction as createCustomerActionImpl,
  updateCustomerAction as updateCustomerActionImpl,
} from "./actions/customers";
import { createExpenseAction as createExpenseActionImpl } from "./actions/expenses";
import {
  createOrderAction as createOrderActionImpl,
  updateOrderAction as updateOrderActionImpl,
  updateOrderStatusAction as updateOrderStatusActionImpl,
} from "./actions/orders";
import {
  createRatioTemplateAction as createRatioTemplateActionImpl,
  createRatioTemplateLineAction as createRatioTemplateLineActionImpl,
  deleteRatioTemplateLineAction as deleteRatioTemplateLineActionImpl,
  updateRatioTemplateAction as updateRatioTemplateActionImpl,
} from "./actions/ratios";
import {
  CreateArticleInput,
  CreateBatchInput,
  CreateCustomerInput,
  CreateExpenseInput,
  CreateOrderInput,
  CreateRatioTemplateInput,
  CreateRatioTemplateLineInput,
  UpdateArticleInput,
  UpdateBatchActualProducedInput,
  UpdateBatchInput,
  UpdateBatchStatusInput,
  UpdateCustomerInput,
  UpdateOrderInput,
  UpdateOrderStatusInput,
  UpdateRatioTemplateInput,
} from "@/lib/types";

export async function createArticleAction(input: CreateArticleInput) {
  return createArticleActionImpl(input);
}

export async function updateArticleAction(input: UpdateArticleInput) {
  return updateArticleActionImpl(input);
}

export async function createRatioTemplateAction(input: CreateRatioTemplateInput) {
  return createRatioTemplateActionImpl(input);
}

export async function updateRatioTemplateAction(input: UpdateRatioTemplateInput) {
  return updateRatioTemplateActionImpl(input);
}

export async function createRatioTemplateLineAction(input: CreateRatioTemplateLineInput) {
  return createRatioTemplateLineActionImpl(input);
}

export async function deleteRatioTemplateLineAction(ratioTemplateLineId: string) {
  return deleteRatioTemplateLineActionImpl(ratioTemplateLineId);
}

export async function createBatchAction(input: CreateBatchInput) {
  return createBatchActionImpl(input);
}

export async function updateBatchAction(input: UpdateBatchInput) {
  return updateBatchActionImpl(input);
}

export async function deleteBatchAction(batchId: string) {
  return deleteBatchActionImpl(batchId);
}

export async function updateBatchStatusAction(input: UpdateBatchStatusInput) {
  return updateBatchStatusActionImpl(input);
}

export async function updateBatchActualProducedAction(input: UpdateBatchActualProducedInput) {
  return updateBatchActualProducedActionImpl(input);
}

export async function createCustomerAction(input: CreateCustomerInput) {
  return createCustomerActionImpl(input);
}

export async function updateCustomerAction(input: UpdateCustomerInput) {
  return updateCustomerActionImpl(input);
}

export async function createOrderAction(input: CreateOrderInput) {
  return createOrderActionImpl(input);
}

export async function updateOrderAction(input: UpdateOrderInput) {
  return updateOrderActionImpl(input);
}

export async function updateOrderStatusAction(input: UpdateOrderStatusInput) {
  return updateOrderStatusActionImpl(input);
}

export async function createExpenseAction(input: CreateExpenseInput) {
  return createExpenseActionImpl(input);
}
