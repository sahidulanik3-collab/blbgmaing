import {
  calculateCheckoutFinancials,
  calculateProductProfit,
  calculateGamingCharge,
  roundBDT,
} from '../src/utils/calculations';
import { generateReceiptNumber } from '../src/utils/formatters';

let passCount = 0;
let failCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✕ FAIL: ${testName}`);
    failCount++;
  }
}

console.log('=== RUNNING AUTOMATED TEST SUITE FOR BLB GAMING ZONE ===\n');

// 1. Prompt Section 6 Calculation Logic Test
console.log('--- Test Group 1: Financial Checkout Logic (Prompt Section 6 Example) ---');
{
  const products = [
    { productId: 'p1', productName: 'Coca-Cola', category: 'Soft Drinks', quantity: 1, unitPrice: 40, unitCost: 30, lineTotal: 40, addedByEmployeeId: 'e1', addedByEmployeeName: 'Admin', addedAt: '' },
    { productId: 'p2', productName: 'Chips', category: 'Chips', quantity: 2, unitPrice: 30, unitCost: 20, lineTotal: 60, addedByEmployeeId: 'e1', addedByEmployeeName: 'Admin', addedAt: '' },
    { productId: 'p3', productName: 'Water', category: 'Water', quantity: 1, unitPrice: 20, unitCost: 14, lineTotal: 20, addedByEmployeeId: 'e1', addedByEmployeeName: 'Admin', addedAt: '' },
  ];

  const result = calculateCheckoutFinancials({
    gamingCharge: 100,
    products,
    advancePayment: 100,
    previousPayments: 0,
    checkoutPayments: 50,
  });

  assert(result.gamingSubtotal === 100, 'Gaming Subtotal is ৳100');
  assert(result.productSubtotal === 120, 'Product Subtotal is ৳120 (40 + 60 + 20)');
  assert(result.grandTotal === 220, 'Grand Total is ৳220 (100 + 120)');
  assert(result.totalPaid === 150, 'Total Paid is ৳150 (Advance 100 + Checkout 50)');
  assert(result.remainingDue === 70, 'Remaining Due is strictly ৳70 as given in specification');
}

// 2. Full Payment & Zero Due Test
console.log('\n--- Test Group 2: Full Payment Option A ---');
{
  const result = calculateCheckoutFinancials({
    gamingCharge: 150,
    products: [
      { productId: 'p1', productName: 'Mojo', category: 'Soft Drinks', quantity: 2, unitPrice: 25, unitCost: 15, lineTotal: 50, addedByEmployeeId: 'e1', addedByEmployeeName: 'Admin', addedAt: '' }
    ],
    advancePayment: 50,
    checkoutPayments: [
      { method: 'Cash', amount: 100 },
      { method: 'bKash', amount: 50 }
    ],
  });

  assert(result.grandTotal === 200, 'Grand total is ৳200');
  assert(result.checkoutPaymentReceived === 150, 'Split checkout received is ৳150');
  assert(result.totalPaid === 200, 'Total Paid is ৳200');
  assert(result.remainingDue === 0, 'Remaining Due is ৳0 for full payment');
}

// 3. Checkout with Due (Option C) Test
console.log('\n--- Test Group 3: Checkout with Due Option C ---');
{
  const result = calculateCheckoutFinancials({
    gamingCharge: 120,
    products: [],
    advancePayment: 0,
    checkoutPayments: 0,
  });

  assert(result.grandTotal === 120, 'Grand total is ৳120');
  assert(result.remainingDue === 120, 'Full unpaid amount recorded as due: ৳120');
}

// 4. Percentage & Fixed Discounts
console.log('\n--- Test Group 4: Discounts Application ---');
{
  const result = calculateCheckoutFinancials({
    gamingCharge: 200,
    products: [
      { productId: 'p1', productName: 'Red Bull', category: 'Energy Drinks', quantity: 1, unitPrice: 190, unitCost: 140, lineTotal: 190, addedByEmployeeId: 'e1', addedByEmployeeName: 'Admin', addedAt: '' }
    ],
    discounts: [
      { id: 'd1', name: '10% Discount', type: 'percentage', value: 10, amountCalculated: 39, reason: 'VIP' }
    ],
    checkoutPayments: 351,
  });

  assert(result.grandTotal === 351, 'Grand total with 10% discount is ৳351 (390 - 39)');
  assert(result.remainingDue === 0, 'Due is 0 when ৳351 is paid');
}

// 5. COGS and Profit Margins
console.log('\n--- Test Group 5: Profit and Cost of Goods Sold (COGS) ---');
{
  const items = [
    { productId: 'p1', productName: 'Doritos', category: 'Chips', quantity: 5, unitPrice: 90, unitCost: 65, lineTotal: 450, addedByEmployeeId: 'e1', addedByEmployeeName: 'Admin', addedAt: '' },
    { productId: 'p2', productName: 'Mojo', category: 'Soft Drinks', quantity: 10, unitPrice: 25, unitCost: 15, lineTotal: 250, addedByEmployeeId: 'e1', addedByEmployeeName: 'Admin', addedAt: '' },
  ];

  const profit = calculateProductProfit(items);
  assert(profit.revenue === 700, 'Total Revenue is ৳700 (450 + 250)');
  assert(profit.cost === 475, 'Total COGS is ৳475 (325 + 150)');
  assert(profit.grossProfit === 225, 'Gross Profit is ৳225 (700 - 475)');
  assert(profit.marginPercent === 32, 'Gross Margin is 32%');
}

// 6. Gaming Duration & Hourly Charge
console.log('\n--- Test Group 6: Gaming Charge Calculation ---');
{
  const startTime = new Date(Date.now() - 90 * 60 * 1000).toISOString(); // 90 mins ago
  const calc = calculateGamingCharge(startTime, null, 120); // ৳120 / hr = ৳2 / min
  assert(calc.durationMinutes === 90, 'Duration is 90 mins');
  assert(calc.charge === 180, 'Charge for 90 mins at 120/hr is ৳180');
}

// 7. Receipt Number Generator
console.log('\n--- Test Group 7: Receipt Generator ---');
{
  const r1 = generateReceiptNumber('BLB');
  const r2 = generateReceiptNumber('BLB');
  assert(r1.startsWith('BLB-'), 'Receipt has prefix BLB-');
  assert(r1 !== r2, 'Receipt numbers are unique');
}

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passCount} Passed, ${failCount} Failed`);
console.log(`========================================\n`);

if (failCount > 0) {
  process.exit(1);
}
