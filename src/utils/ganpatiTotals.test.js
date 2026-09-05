import test from "node:test";
import assert from "node:assert/strict";
import { ledgerTotals, combinedTotals } from "./ganpatiTotals.js";

test("collections stay intact as expenses are added, edited and deleted", () => {
  const a = [{ amount: 57716 }];
  const b = [{ type: "incoming", amount: 9001, verificationStatus: "verified" }];
  const totals = () => combinedTotals({ A: ledgerTotals(a), B: ledgerTotals(b) });
  assert.deepEqual(totals(), { received: 66717, spent: 0, balance: 66717 });
  a.push({ type: "outgoing", amount: 4715 }, { type: "outgoing", amount: 4001 });
  assert.equal(ledgerTotals(a).received, 57716);
  assert.equal(ledgerTotals(b).received, 9001);
  assert.deepEqual(totals(), { received: 66717, spent: 8716, balance: 58001 });
  a[1].amount = 5000;
  assert.deepEqual(totals(), { received: 66717, spent: 9001, balance: 57716 });
  a.splice(1, 2);
  assert.deepEqual(totals(), { received: 66717, spent: 0, balance: 66717 });
});

test("pending payment becomes collected only on approval; edits and deletion recalculate", () => {
  const entries = [{ type: "incoming", amount: "1000", anonymous: true, verificationStatus: "pending" }];
  assert.deepEqual(ledgerTotals(entries), { received: 0, spent: 0, pendingReview: 1000, balance: 0 });
  entries[0].verificationStatus = "verified";
  assert.deepEqual(ledgerTotals(entries), { received: 1000, spent: 0, pendingReview: 0, balance: 1000 });
  entries[0].amount = 1500;
  assert.equal(ledgerTotals(entries).received, 1500);
  entries.pop();
  assert.deepEqual(ledgerTotals(entries), { received: 0, spent: 0, pendingReview: 0, balance: 0 });
});

test("combined total uses only the two buildings, ignoring extra summary documents", () => {
  assert.deepEqual(combinedTotals({ A: { received: 100, spent: 20 }, B: { received: 200, spent: 30 }, combined: { received: 300, spent: 50 } }), { received: 300, spent: 50, balance: 250 });
});
