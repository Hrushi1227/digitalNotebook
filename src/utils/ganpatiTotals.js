export function ledgerTotals(entries) {
  return entries.reduce((total, item) => {
    const amount = Number(item.amount) || 0;
    if (item.type === "outgoing") total.spent += amount;
    else if (!item.type || item.type === "incoming") {
      if (item.verificationStatus === "pending") total.pendingReview += amount;
      else total.received += amount;
    }
    total.balance = total.received - total.spent;
    return total;
  }, { received: 0, spent: 0, pendingReview: 0, balance: 0 });
}

export function combinedTotals(byWing) {
  const received = byWing.A.received + byWing.B.received;
  const spent = byWing.A.spent + byWing.B.spent;
  return { received, spent, balance: received - spent };
}
