function roundBDT(amount) {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round(amount);
}

function calculateCheckoutFinancials(input) {
  const gamingSubtotal = roundBDT(Math.max(0, input.gamingCharge || 0));

  const productSubtotal = roundBDT(
    (input.products || []).reduce((acc, item) => {
      const line = (item.quantity || 0) * (item.unitPrice || 0);
      return acc + Math.max(0, line);
    }, 0)
  );

  const additionalChargesSubtotal = roundBDT(
    (input.additionalCharges || []).reduce((acc, charge) => {
      return acc + Math.max(0, charge.amount || 0);
    }, 0)
  );

  const preDiscountTotal = gamingSubtotal + productSubtotal + additionalChargesSubtotal;

  const discountSubtotal = roundBDT(
    (input.discounts || []).reduce((acc, discount) => {
      if (discount.type === 'percentage') {
        const calculated = (preDiscountTotal * Math.min(100, Math.max(0, discount.value))) / 100;
        return acc + calculated;
      }
      return acc + Math.max(0, discount.value || 0);
    }, 0)
  );

  const grandTotal = Math.max(0, preDiscountTotal - discountSubtotal);
  const advancePayment = roundBDT(Math.max(0, input.advancePayment || 0));
  const previousPayments = roundBDT(Math.max(0, input.previousPayments || 0));

  let checkoutPaymentReceived = 0;
  if (Array.isArray(input.checkoutPayments)) {
    checkoutPaymentReceived = roundBDT(
      input.checkoutPayments.reduce((acc, p) => acc + Math.max(0, p.amount || 0), 0)
    );
  } else if (typeof input.checkoutPayments === 'number') {
    checkoutPaymentReceived = roundBDT(Math.max(0, input.checkoutPayments));
  }

  const totalPaid = advancePayment + previousPayments + checkoutPaymentReceived;
  const netRemaining = grandTotal - totalPaid;

  const remainingDue = netRemaining > 0 ? netRemaining : 0;
  const changeReturn = netRemaining < 0 ? Math.abs(netRemaining) : 0;

  return {
    gamingSubtotal,
    productSubtotal,
    additionalChargesSubtotal,
    discountSubtotal,
    grandTotal,
    advancePayment,
    previousPayments,
    checkoutPaymentReceived,
    totalPaid,
    remainingDue,
    changeReturn,
  };
}

function calculateProductProfit(products) {
  let revenue = 0;
  let cost = 0;
  for (const item of products) {
    const itemRev = item.quantity * item.unitPrice;
    const itemCost = item.quantity * (item.unitCost || 0);
    revenue += itemRev;
    cost += itemCost;
  }
  const grossProfit = revenue - cost;
  const marginPercent = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0;
  return {
    revenue: roundBDT(revenue),
    cost: roundBDT(cost),
    grossProfit: roundBDT(grossProfit),
    marginPercent,
  };
}

function calculateGamingCharge(startIso, endIso, hourlyRate, packageFixedPrice) {
  if (packageFixedPrice && packageFixedPrice > 0) {
    const start = new Date(startIso).getTime();
    const end = endIso ? new Date(endIso).getTime() : Date.now();
    const durationMinutes = Math.max(1, Math.round((end - start) / 60000));
    return { durationMinutes, charge: roundBDT(packageFixedPrice) };
  }
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);
  const durationMinutes = Math.max(1, Math.round(diffMs / 60000));
  const minuteRate = hourlyRate / 60;
  const charge = roundBDT(durationMinutes * minuteRate);
  return { durationMinutes, charge };
}

function formatCountdownMMSS(ms) {
  if (ms <= 0) return '00:00';
  const totalSec = Math.ceil(ms / 1000);
  const totalMins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(totalMins)}:${pad(secs)}`;
}

module.exports = {
  roundBDT,
  calculateCheckoutFinancials,
  calculateProductProfit,
  calculateGamingCharge,
  formatCountdownMMSS,
};
