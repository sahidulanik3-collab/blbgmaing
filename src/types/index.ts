export type ProductCategory =
  | 'Snacks'
  | 'Chips'
  | 'Soft Drinks'
  | 'Water'
  | 'Energy Drinks'
  | 'Biscuits'
  | 'Chocolate'
  | 'Instant Food'
  | 'Other';

export type UnitType =
  | 'Piece'
  | 'Bottle'
  | 'Can'
  | 'Packet'
  | 'Box'
  | 'Other';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  brand?: string;
  sku?: string;
  purchaseCost: number; // in BDT
  sellingPrice: number; // in BDT
  currentStock: number;
  minStockAlert: number;
  unitType: UnitType;
  image?: string;
  status: 'active' | 'disabled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryAdjustmentReason =
  | 'New purchase'
  | 'Damaged'
  | 'Expired'
  | 'Lost'
  | 'Manual correction'
  | 'Sale'
  | 'Sale Reversal'
  | 'Other';

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'refund' | 'damaged' | 'expired' | 'lost';
  quantityDelta: number; // positive = added, negative = deducted
  previousStock: number;
  newStock: number;
  unitCost: number;
  reason: InventoryAdjustmentReason;
  referenceId?: string; // sessionId, checkoutId, purchaseId, quickSaleId
  employeeId: string;
  employeeName: string;
  timestamp: string;
  notes?: string;
}

export interface ProductPurchase {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  purchaseCostPerUnit: number;
  totalCost: number;
  supplier?: string;
  invoiceNumber?: string;
  employeeId: string;
  employeeName: string;
  timestamp: string;
  notes?: string;
}

export interface ProductSaleItem {
  productId: string;
  productName: string;
  category: ProductCategory;
  quantity: number;
  unitPrice: number;
  unitCost: number; // snapshot of purchase cost for COGS and gross profit
  lineTotal: number;
  addedByEmployeeId: string;
  addedByEmployeeName: string;
  addedAt: string;
}

export type StationType = 'PS5' | 'PS4' | 'Xbox' | 'Pandora' | 'PC' | 'VR' | 'Racing' | 'Billiards' | 'Other';
export type StationStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export interface StationPackage {
  id: string;
  label: string;
  players: number;
  durationMinutes: number;
  price: number;
}

export interface GamingStation {
  id: string;
  name: string;
  subtitle?: string;
  type: StationType;
  hourlyRate: number; // default per hour in BDT
  halfHourRate?: number; // default 30-min rate in BDT
  packages?: StationPackage[];
  status: StationStatus;
  currentSessionId?: string;
  notes?: string;
}

export interface AdditionalCharge {
  id: string;
  name: string;
  amount: number;
  reason?: string;
}

export interface DiscountItem {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number; // e.g. 10 (%) or 50 (BDT)
  amountCalculated: number; // evaluated in BDT
  reason: string;
}

export interface SessionExtension {
  id: string;
  addedMinutes: number;
  addedCharge: number;
  timestamp: string;
  employeeName: string;
}

export interface GamingSession {
  id: string;
  stationId: string;
  stationName: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  activePlayers: number;
  startTime: string; // ISO
  endTime?: string; // ISO when completed
  bookedMinutes?: number; // e.g. 30, 60, 90, 120 for countdown timer
  durationMinutes: number;
  hourlyRate: number;
  packageId?: string;
  packageName?: string;
  lockedGamingCharge?: number; // fixed/package/extended charge snapshot
  gamingCharge: number;
  isCustomTime?: boolean;
  customTimeWindow?: string; // e.g. "7:00 PM - 8:00 PM"
  isPaused?: boolean;
  pausedAt?: string;
  totalPausedMs?: number;
  extensions?: SessionExtension[];
  productItems: ProductSaleItem[];
  additionalCharges: AdditionalCharge[];
  discounts: DiscountItem[];
  advancePayment: number;
  advanceMethod?: PaymentMethod;
  previousPayments: number;
  status: 'active' | 'completed' | 'cancelled';
  createdByEmployeeId: string;
  createdByEmployeeName: string;
  createdAt: string;
  notes?: string;
}

export interface QueueBooking {
  id: string;
  stationId: string;
  stationName: string;
  customerName: string;
  customerPhone?: string;
  players: number;
  packageId?: string;
  packageName?: string;
  bookedMinutes: number;
  basePrice: number;
  discountAmount: number;
  lockedPrice: number;
  advancePayment: number;
  advanceMethod: PaymentMethod;
  isCustomTime: boolean;
  customStartTime?: string;
  customEndTime?: string;
  notes?: string;
  createdAt: string;
  createdByEmployeeId: string;
  createdByEmployeeName: string;
  status: 'waiting' | 'started' | 'cancelled';
}

export type PaymentMethod = 'Cash' | 'bKash' | 'Nagad' | 'Bank' | 'Other';

export interface SplitPayment {
  method: PaymentMethod;
  amount: number;
  transactionId?: string;
  note?: string;
}

export interface PaymentRecord {
  id: string;
  referenceType: 'checkout' | 'due_repayment' | 'quick_sale' | 'advance';
  referenceId: string;
  customerId?: string;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  employeeId: string;
  employeeName: string;
  timestamp: string;
  notes?: string;
}

export type CheckoutStatus = 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';

export interface CheckoutRecord {
  id: string;
  receiptNumber: string;
  sessionId?: string; // empty if quick-sale
  stationId?: string;
  stationName?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  
  // Gaming Breakdown
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  package?: string;
  gamingCharge: number;
  
  // Product Breakdown
  products: ProductSaleItem[];
  productSubtotal: number;
  
  // Additional & Discounts
  additionalCharges: AdditionalCharge[];
  additionalChargesSubtotal: number;
  discounts: DiscountItem[];
  discountSubtotal: number;
  
  // Financial Summary
  grandTotal: number;
  previousSessionPayments: number;
  advancePayments: number;
  checkoutPaymentReceived: number;
  totalPaid: number;
  remainingDue: number;
  
  // Payment Breakdown
  splitPayments: SplitPayment[];
  status: CheckoutStatus;
  
  employeeId: string;
  employeeName: string;
  timestamp: string;
  notes?: string;
}

export type DueStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';

export interface DueRepayment {
  id: string;
  dueId: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  employeeId: string;
  employeeName: string;
  timestamp: string;
  previousBalance: number;
  remainingBalance: number;
  notes?: string;
}

export interface DueRecord {
  id: string;
  customerId?: string;
  customerName: string;
  phone?: string;
  sessionId?: string;
  checkoutId: string;
  stationName?: string;
  gamingCharge: number;
  productCharge: number;
  grandTotal: number;
  paidAmount: number;
  remainingBalance: number;
  createdDate: string;
  employeeId: string;
  employeeName: string;
  status: DueStatus;
  repayments: DueRepayment[];
  notes?: string;
}

export interface QuickSaleRecord {
  id: string;
  receiptNumber: string;
  products: ProductSaleItem[];
  productSubtotal: number;
  discount: number;
  grandTotal: number;
  paymentReceived: number;
  splitPayments: SplitPayment[];
  customerName?: string;
  customerPhone?: string;
  employeeId: string;
  employeeName: string;
  timestamp: string;
  notes?: string;
}

export interface ExpenseRecord {
  id: string;
  category: 'electricity' | 'utility' | 'rent' | 'inventory_purchase' | 'hardware_maintenance' | 'refreshment' | 'salary' | 'other';
  title: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paidTo?: string;
  employeeId: string;
  employeeName: string;
  timestamp: string;
  notes?: string;
  linkedPurchaseId?: string;
}

export type ThemeColor = 'cyan' | 'purple' | 'emerald' | 'rose' | 'amber';
export type WallpaperId = 'obsidian' | 'cyber-grid' | 'neon-arena' | 'deep-space' | 'midnight-purple' | 'custom';

export type UserRole = 'Owner' | 'Admin' | 'Manager' | 'Staff';

export interface Employee {
  id: string;
  name: string;
  role: UserRole;
  pin: string; // 4-digit quick pin for POS
  phone: string;
  status: 'active' | 'inactive';
  permissions: {
    canAdjustStock: boolean;
    canCreateDue: boolean;
    canGiveDiscount: boolean;
    canManageProducts: boolean;
    canViewAccounting: boolean;
    canSettleDues: boolean;
  };
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  membershipTier?: 'Standard' | 'Silver' | 'Gold' | 'VIP';
  totalVisits: number;
  totalSpent: number;
  currentDueBalance: number;
  notes?: string;
  createdAt: string;
}

export interface AppSettings {
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  currencySymbol: string;
  allowNegativeStock: boolean;
  receiptFooter: string;
  thermalReceiptWidth: '80mm' | '58mm';
  taxPercentage: number;
  themeColor?: ThemeColor;
  wallpaperId?: WallpaperId;
  customWallpaperUrl?: string;
  wallpaperDim?: number; // 0-95% dark overlay for readability
}
