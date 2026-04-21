import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveBatchPrefix,
  formatBatchNumber,
  formatOrderNumber,
} from "../src/lib/server/domain/documents.ts";

test("deriveBatchPrefix uses sku segment when available", () => {
  assert.equal(deriveBatchPrefix("Klassieke Limoncello", "fg-lim-premium"), "LIM");
});

test("deriveBatchPrefix falls back to normalized article name", () => {
  assert.equal(deriveBatchPrefix("Zachte Arancèllo", null), "ZAC");
});

test("document numbers are consistently padded", () => {
  assert.equal(formatBatchNumber("LIM", "2026", 7), "LIM-2026-007");
  assert.equal(formatOrderNumber("2026", 42), "ORD-2026-0042");
});
