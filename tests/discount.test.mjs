import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
const file = new URL("../js/calculations.mjs", import.meta.url);
const { stackDiscounts } = existsSync(file)
  ? await import(file)
  : { stackDiscounts: () => null };
test("15% then 10% applies to the remaining $150 balance", () => {
  assert.deepEqual(stackDiscounts(150, [15, 10]), {
    net: 114.75,
    cuts: [22.5, 12.75],
    balances: [127.5, 114.75],
    effective: 23.5,
  });
});
test("empty stack retains the rate; zero and 100% are defined", () => {
  assert.equal(stackDiscounts(150, []).net, 150);
  assert.equal(stackDiscounts(0, [15, 10]).net, 0);
  assert.equal(stackDiscounts(150, [100, 10]).net, 0);
});
test("currency rounds at each discount to avoid phantom cents", () => {
  assert.equal(stackDiscounts(19.99, [15, 10]).net, 15.29);
});
test("invalid rates and percentages cannot produce a misleading result", () => {
  for (const [rate, discounts] of [
    [-1, [10]],
    [NaN, [10]],
    [150, [-10]],
    [150, [101]],
    [Infinity, [10]],
  ]) {
    assert.throws(() => stackDiscounts(rate, discounts), RangeError);
  }
});
