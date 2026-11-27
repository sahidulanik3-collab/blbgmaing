import { AdditionalCharge, DiscountItem, GamingSession, ProductSaleItem, SplitPayment } from '../types';

export interface CalculationInput {
  gamingCharge: number;
  products: ProductSaleItem[];
  additionalCharges?: AdditionalCharge[];
  discounts?: DiscountItem[];
  advancePayment?: number;
  previousPayments?: number;
  checkoutPayments?: SplitPayment[] | number;
}

export interface CalculationResult {
  gamingSubtotal: number;
  productSubtotal: number;
  additionalChargesSubtotal: number;
  discountSubtotal: number;
  grandTotal: number;
  advancePayment: number;
  previousPayments: number;
  checkoutPaymentReceived: number;
  totalPaid: number;
  remainingDue: number;
  changeReturn: number;
}

/**
 * Standard rounding to nearest integer BDT or 2 decimal places.
 * For BDT currency, integers are preferred to prevent floating point issues.
 */
export function roundBDT(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round(amount);
}

/**
 * Centralized financial calculation logic for gaming sessions, quick sales, and checkouts.
 * Adheres strictly to Section 6 of requirements.
 */
export function calculateCheckoutFinancials(input: CalculationInput): CalculationResult {
  const gamingSubtotal = roundBDT(Math.max(0, input.gamingCharge || 0));

  // Product Subtotal
  const productSubtotal = roundBDT(
    (input.products || []).reduce((acc, item) => {
      const line = (item.quantity || 0) * (item.unitPrice || 0);
      return acc + Math.max(0, line);
    }, 0)
  );

  // Additional Charges Subtotal
  const additionalChargesSubtotal = roundBDT(
    (input.additionalCharges || []).reduce((acc, charge) => {
      return acc + Math.max(0, charge.amount || 0);
    }, 0)
  );

  // Base total before discount
  const preDiscountTotal = gamingSubtotal + productSubtotal + additionalChargesSubtotal;

  // Discounts Subtotal
  const discountSubtotal = roundBDT(
    (input.discounts || []).reduce((acc, discount) => {
      if (discount.type === 'percentage') {
        const calculated = (preDiscountTotal * Math.min(100, Math.max(0, discount.value))) / 100;
        return acc + calculated;
      }
      return acc + Math.max(0, discount.value || 0);
    }, 0)
  );

  // Grand Total cannot be negative
  const grandTotal = Math.max(0, preDiscountTotal - discountSubtotal);

  // Payments
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

  // Grand Total - Previous Session Payments - Advance Payments - Checkout Payments = Remaining Due
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

/**
 * Calculates COGS (Cost of Goods Sold) and Gross Profit for sold product items.
 */
export function calculateProductProfit(products: ProductSaleItem[]): {
  revenue: number;
  cost: number;
  grossProfit: number;
  marginPercent: number;
} {
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

/**
 * Formats milliseconds into MM:SS or HH:MM:SS clock display.
 */
export function formatClockMs(ms: number, alwaysShowHours = false): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  if (hrs > 0 || alwaysShowHours) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Formats remaining countdown milliseconds into total-minutes MM:SS (e.g. 60:00 -> 59:59 -> ... -> 00:00).
 */
export function formatCountdownMMSS(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSec = Math.ceil(ms / 1000);
  const totalMins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(totalMins)}:${pad(secs)}`;
}

export interface LiveSessionTimerInfo {
  elapsedMs: number;
  elapsedMinutes: number;
  elapsedClock: string; // HH:MM:SS
  remainingMs: number;
  remainingClock: string; // MM:SS or HH:MM:SS
  hasBookedDuration: boolean;
  isTimeFinished: boolean;
  isPaused: boolean;
  currentCharge: number;
  progressPercent: number;
}

/**
 * Computes live countdown/elapsed timer and accurate gaming charge accounting for pause/resume & extensions.
 */
export function calculateLiveSessionTimer(
  session: GamingSession,
  nowMs: number = Date.now()
): LiveSessionTimerInfo {
  const startMs = new Date(session.startTime).getTime();
  const basePausedMs = session.totalPausedMs || 0;
  const activePauseMs =
    session.isPaused && session.pausedAt
      ? Math.max(0, nowMs - new Date(session.pausedAt).getTime())
      : 0;

  const elapsedMs = Math.max(0, nowMs - startMs - basePausedMs - activePauseMs);
  const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60000));
  const elapsedClock = formatClockMs(elapsedMs, true);

  const hasBookedDuration = Boolean(session.bookedMinutes && session.bookedMinutes > 0);
  const bookedMs = (session.bookedMinutes || 0) * 60000;
  const remainingMs = hasBookedDuration ? Math.max(0, bookedMs - elapsedMs) : 0;
  const isTimeFinished = hasBookedDuration && remainingMs <= 0;
  const remainingClock = hasBookedDuration
    ? formatCountdownMMSS(remainingMs)
    : elapsedClock;

  const progressPercent = hasBookedDuration
    ? Math.min(100, Math.round((elapsedMs / Math.max(1, bookedMs)) * 100))
    : 100;

  // If lockedGamingCharge is set (package, custom booking, or extended), use it unless overtime exceeded?
  // Note: User screenshots show booked Charge ৳100 even when Time finished, and user can "+ Extend".
  const currentCharge =
    session.lockedGamingCharge !== undefined && session.lockedGamingCharge >= 0
      ? roundBDT(session.lockedGamingCharge)
      : roundBDT((elapsedMinutes / 60) * session.hourlyRate);

  return {
    elapsedMs,
    elapsedMinutes,
    elapsedClock,
    remainingMs,
    remainingClock,
    hasBookedDuration,
    isTimeFinished,
    isPaused: Boolean(session.isPaused),
    currentCharge,
    progressPercent,
  };
}

/**
 * Gaming duration & charge calculation based on hourly rate.
 */
export function calculateGamingCharge(
  startIso: string,
  endIso: string | null,
  hourlyRate: number,
  packageFixedPrice?: number,
  totalPausedMs: number = 0
): { durationMinutes: number; charge: number } {
  if (packageFixedPrice !== undefined && packageFixedPrice >= 0) {
    const start = new Date(startIso).getTime();
    const end = endIso ? new Date(endIso).getTime() : Date.now();
    const diffMs = Math.max(0, end - start - totalPausedMs);
    const durationMinutes = Math.max(1, Math.round(diffMs / 60000));
    return {
      durationMinutes,
      charge: roundBDT(packageFixedPrice),
    };
  }

  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const diffMs = Math.max(0, end - start - totalPausedMs);
  const durationMinutes = Math.max(1, Math.round(diffMs / 60000));

  const minuteRate = hourlyRate / 60;
  const charge = roundBDT(durationMinutes * minuteRate);

  return {
    durationMinutes,
    charge,
  };
}
