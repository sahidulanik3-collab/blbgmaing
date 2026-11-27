// Automated validation test for BLB Gaming financial & inventory logic
const {
  calculateCheckoutFinancials,
  calculateProductProfit,
  calculateGamingCharge,
  formatCountdownMMSS,
} = require('./calculations_cjs.cjs');

let pass = 0;
let fail = 0;

function test(name, condition) {
  if (condition) {
    console.log(`PASS: ${name}`);
    pass++;
  } else {
    console.error(`FAIL: ${name}`);
    fail++;
  }
}

console.log('=== RUNNING VERIFICATION OF USER SPECIFICATION ===');

// Prompt Section 6 verification
const section6Result = calculateCheckoutFinancials({
  gamingCharge: 100,
  products: [
    { quantity: 1, unitPrice: 40, unitCost: 30 },
    { quantity: 2, unitPrice: 30, unitCost: 20 },
    { quantity: 1, unitPrice: 20, unitCost: 14 },
  ],
  advancePayment: 100,
  previousPayments: 0,
  checkoutPayments: 50,
});

test('Section 6: Gaming subtotal is 100', section6Result.gamingSubtotal === 100);
test('Section 6: Product subtotal is 120 (40 + 60 + 20)', section6Result.productSubtotal === 120);
test('Section 6: Grand Total is 220', section6Result.grandTotal === 220);
test('Section 6: Total Paid is 150 (Advance 100 + Checkout 50)', section6Result.totalPaid === 150);
test('Section 6: Remaining Due is 70', section6Result.remainingDue === 70);

// Full payment
const fullPay = calculateCheckoutFinancials({
  gamingCharge: 150,
  products: [{ quantity: 2, unitPrice: 25, unitCost: 15 }],
  advancePayment: 50,
  checkoutPayments: 150,
});
test('Full payment sets remainingDue to 0', fullPay.remainingDue === 0 && fullPay.totalPaid === 200);

// Profit & COGS calculation
const profit = calculateProductProfit([
  { quantity: 5, unitPrice: 90, unitCost: 65 },
  { quantity: 10, unitPrice: 25, unitCost: 15 },
]);
test('Profit revenue is 700', profit.revenue === 700);
test('COGS is 475', profit.cost === 475);
test('Gross profit is 225', profit.grossProfit === 225);
test('Margin is 32%', profit.marginPercent === 32);

// Gaming rate test
const gaming = calculateGamingCharge(new Date(Date.now() - 60 * 60000).toISOString(), null, 120);
test('60 mins gaming at 120/hr is 120 BDT', gaming.durationMinutes === 60 && gaming.charge === 120);

// Reverse countdown test (60:00 -> 59:59 -> 00:00)
test('Countdown at 60 mins displays 60:00', formatCountdownMMSS(60 * 60000) === '60:00');
test('Countdown 1s later displays 59:59', formatCountdownMMSS(60 * 60000 - 1000) === '59:59');
test('Countdown at 0 displays 00:00', formatCountdownMMSS(0) === '00:00');

console.log(`\nResults: ${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
