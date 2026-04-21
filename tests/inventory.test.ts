import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBatchCommitmentErrorMessage,
  canBookRequestedLiters,
} from "../src/lib/server/domain/inventory.ts";

test("canBookRequestedLiters rejects requests above bookable volume", () => {
  assert.equal(canBookRequestedLiters(12, 8), true);
  assert.equal(canBookRequestedLiters(12, 12), true);
  assert.equal(canBookRequestedLiters(12, 12.1), false);
});

test("buildBatchCommitmentErrorMessage mentions both ordered and sold commitments", () => {
  const message = buildBatchCommitmentErrorMessage(4.5, 2, 6.5);

  assert.match(message, /4,500 L besteld/);
  assert.match(message, /2 L verkocht/);
  assert.match(message, /6,500 L/);
});
