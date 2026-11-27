import {
  Product,
  InventoryTransaction,
  ProductPurchase,
  GamingStation,
  GamingSession,
  CheckoutRecord,
  DueRecord,
  DueRepayment,
  QuickSaleRecord,
  ExpenseRecord,
  Employee,
  Customer,
  AppSettings,
  ProductSaleItem,
  SplitPayment,
  PaymentMethod,
  InventoryAdjustmentReason,
  PaymentRecord,
  QueueBooking,
  StationPackage,
} from '../types';
import { generateReceiptNumber } from './formatters';

const STORAGE_VERSION_KEY = 'blb_db_version';
const CURRENT_STORAGE_VERSION = 'v2_6_stations_biplob';

const STORAGE_KEYS = {
  PRODUCTS: 'blb_products',
  TRANSACTIONS: 'blb_inventory_transactions',
  PURCHASES: 'blb_product_purchases',
  STATIONS: 'blb_gaming_stations',
  SESSIONS: 'blb_gaming_sessions',
  QUEUES: 'blb_station_queues',
  CHECKOUTS: 'blb_checkout_records',
  DUES: 'blb_due_records',
  QUICK_SALES: 'blb_quick_sales',
  EXPENSES: 'blb_expenses',
  PAYMENTS: 'blb_payments',
  EMPLOYEES: 'blb_employees',
  CUSTOMERS: 'blb_customers',
  SETTINGS: 'blb_settings',
  CURRENT_USER: 'blb_current_user',
};

export function buildDefaultPackages(hourlyRate: number, halfHourRate: number): StationPackage[] {
  return [
    {
      id: 'pkg-1p-30m',
      label: `1 Player • 30 Min`,
      players: 1,
      durationMinutes: 30,
      price: halfHourRate,
    },
    {
      id: 'pkg-1p-1h',
      label: `1 Player • 1 Hour`,
      players: 1,
      durationMinutes: 60,
      price: hourlyRate,
    },
    {
      id: 'pkg-2p-30m',
      label: `2 Players • 30 Min`,
      players: 2,
      durationMinutes: 30,
      price: Math.round(halfHourRate * 1.5),
    },
    {
      id: 'pkg-2p-1h',
      label: `2 Players • 1 Hour`,
      players: 2,
      durationMinutes: 60,
      price: Math.round(hourlyRate * 1.5),
    },
  ];
}

// Seed Products (realistic Bangladeshi gaming lounge items)
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Coca-Cola 250ml Can',
    category: 'Soft Drinks',
    brand: 'Coca-Cola',
    sku: 'CC-250C',
    purchaseCost: 35,
    sellingPrice: 50,
    currentStock: 32,
    minStockAlert: 10,
    unitType: 'Can',
    status: 'active',
    notes: 'Chilled in fridge 1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    name: 'Mojo Cold Drink 250ml',
    category: 'Soft Drinks',
    brand: 'Akij',
    sku: 'MOJO-250',
    purchaseCost: 15,
    sellingPrice: 25,
    currentStock: 48,
    minStockAlert: 15,
    unitType: 'Bottle',
    status: 'active',
    notes: 'Top seller among gamers',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    name: 'Speed Energy Drink 250ml',
    category: 'Energy Drinks',
    brand: 'Akij',
    sku: 'SPD-250',
    purchaseCost: 28,
    sellingPrice: 40,
    currentStock: 18,
    minStockAlert: 10,
    unitType: 'Bottle',
    status: 'active',
    notes: 'Energy booster',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    name: 'Mountain Dew 250ml Can',
    category: 'Soft Drinks',
    brand: 'PepsiCo',
    sku: 'MD-250C',
    purchaseCost: 38,
    sellingPrice: 55,
    currentStock: 7, // Low stock on purpose to showcase alerts!
    minStockAlert: 10,
    unitType: 'Can',
    status: 'active',
    notes: 'Popular gamer drink',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    name: 'Kinley Mineral Water 500ml',
    category: 'Water',
    brand: 'Coca-Cola',
    sku: 'WAT-500',
    purchaseCost: 14,
    sellingPrice: 20,
    currentStock: 40,
    minStockAlert: 12,
    unitType: 'Bottle',
    status: 'active',
    notes: 'Normal and chilled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    name: 'Doritos Nacho Cheese 60g',
    category: 'Chips',
    brand: 'Frito-Lay',
    sku: 'DOR-60G',
    purchaseCost: 65,
    sellingPrice: 90,
    currentStock: 14,
    minStockAlert: 8,
    unitType: 'Packet',
    status: 'active',
    notes: 'Imported batch',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    name: 'Pran Potato Crackers Spicy',
    category: 'Chips',
    brand: 'Pran',
    sku: 'PRAN-POT',
    purchaseCost: 12,
    sellingPrice: 20,
    currentStock: 25,
    minStockAlert: 10,
    unitType: 'Packet',
    status: 'active',
    notes: 'Crispy spicy snacks',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-8',
    name: 'Mr. Twist Chips',
    category: 'Chips',
    brand: 'Bombay Sweets',
    sku: 'BS-TWIST',
    purchaseCost: 15,
    sellingPrice: 25,
    currentStock: 20,
    minStockAlert: 8,
    unitType: 'Packet',
    status: 'active',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-9',
    name: 'Snickers Chocolate Bar 50g',
    category: 'Chocolate',
    brand: 'Mars',
    sku: 'SNIK-50G',
    purchaseCost: 65,
    sellingPrice: 90,
    currentStock: 5, // Low stock demo
    minStockAlert: 10,
    unitType: 'Piece',
    status: 'active',
    notes: 'Store in cool shelf',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-10',
    name: 'KitKat 4-Finger 41.5g',
    category: 'Chocolate',
    brand: 'Nestle',
    sku: 'KIT-4F',
    purchaseCost: 55,
    sellingPrice: 75,
    currentStock: 16,
    minStockAlert: 8,
    unitType: 'Piece',
    status: 'active',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-11',
    name: 'Maggi 2-Minute Noodles (Cooked Bowl)',
    category: 'Instant Food',
    brand: 'Nestle',
    sku: 'MAGGI-COOK',
    purchaseCost: 35,
    sellingPrice: 60,
    currentStock: 22,
    minStockAlert: 10,
    unitType: 'Box',
    status: 'active',
    notes: 'Served hot with seasoning',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-12',
    name: 'Red Bull Energy Drink 250ml',
    category: 'Energy Drinks',
    brand: 'Red Bull',
    sku: 'RB-250',
    purchaseCost: 140,
    sellingPrice: 190,
    currentStock: 12,
    minStockAlert: 6,
    unitType: 'Can',
    status: 'active',
    notes: 'Premium imported can',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Seed Stations — 6 stations (PS5 Seat 1 & 2, PS4 Seat 1 & 2, Xbox Series X, Pandora Box Arcade)
const INITIAL_STATIONS: GamingStation[] = [
  {
    id: 'st-1',
    name: 'PS5 Seat 1',
    subtitle: 'PlayStation 5',
    type: 'PS5',
    hourlyRate: 100,
    halfHourRate: 60,
    packages: buildDefaultPackages(100, 60),
    status: 'occupied',
    currentSessionId: 'sess-1',
    notes: '4K Display • DualSense',
  },
  {
    id: 'st-2',
    name: 'PS5 Seat 2',
    subtitle: 'PlayStation 5',
    type: 'PS5',
    hourlyRate: 100,
    halfHourRate: 60,
    packages: buildDefaultPackages(100, 60),
    status: 'occupied',
    currentSessionId: 'sess-2',
    notes: '4K Display • DualSense',
  },
  {
    id: 'st-3',
    name: 'PS4 Seat 1',
    subtitle: 'PlayStation 4',
    type: 'PS4',
    hourlyRate: 80,
    halfHourRate: 50,
    packages: buildDefaultPackages(80, 50),
    status: 'available',
    notes: 'DualShock 4',
  },
  {
    id: 'st-4',
    name: 'PS4 Seat 2',
    subtitle: 'PlayStation 4',
    type: 'PS4',
    hourlyRate: 80,
    halfHourRate: 50,
    packages: buildDefaultPackages(80, 50),
    status: 'available',
    notes: 'DualShock 4',
  },
  {
    id: 'st-5',
    name: 'Xbox Seat 1',
    subtitle: 'Xbox Series X',
    type: 'Xbox',
    hourlyRate: 100,
    halfHourRate: 60,
    packages: buildDefaultPackages(100, 60),
    status: 'available',
    notes: 'Game Pass Ultimate',
  },
  {
    id: 'st-6',
    name: 'Pandora Box 1',
    subtitle: 'Pandora Box Arcade',
    type: 'Pandora',
    hourlyRate: 60,
    halfHourRate: 40,
    packages: buildDefaultPackages(60, 40),
    status: 'available',
    notes: 'Classic Arcade Joystick',
  },
];

// Seed Active Sessions
const session1Start = new Date(Date.now() - 55 * 60 * 1000).toISOString(); // 55 mins ago (5 mins left of 60m)
const session2Start = new Date(Date.now() - 25 * 60 * 1000).toISOString(); // 25 mins ago (35 mins left of 60m)

const INITIAL_SESSIONS: GamingSession[] = [
  {
    id: 'sess-1',
    stationId: 'st-1',
    stationName: 'PS5 Seat 1',
    customerId: 'cust-1',
    customerName: 'Rahim Ahmed',
    customerPhone: '01711223344',
    activePlayers: 2,
    startTime: session1Start,
    bookedMinutes: 60,
    durationMinutes: 55,
    hourlyRate: 100,
    packageName: '2 Players • 1 Hour',
    lockedGamingCharge: 150,
    gamingCharge: 150,
    totalPausedMs: 0,
    extensions: [],
    productItems: [
      {
        productId: 'prod-1',
        productName: 'Coca-Cola 250ml Can',
        category: 'Soft Drinks',
        quantity: 1,
        unitPrice: 50,
        unitCost: 35,
        lineTotal: 50,
        addedByEmployeeId: 'emp-1',
        addedByEmployeeName: 'Biplob (Owner)',
        addedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        productId: 'prod-7',
        productName: 'Pran Potato Crackers Spicy',
        category: 'Chips',
        quantity: 2,
        unitPrice: 20,
        unitCost: 12,
        lineTotal: 40,
        addedByEmployeeId: 'emp-1',
        addedByEmployeeName: 'Biplob (Owner)',
        addedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      },
      {
        productId: 'prod-5',
        productName: 'Kinley Mineral Water 500ml',
        category: 'Water',
        quantity: 1,
        unitPrice: 20,
        unitCost: 14,
        lineTotal: 20,
        addedByEmployeeId: 'emp-1',
        addedByEmployeeName: 'Biplob (Owner)',
        addedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
    ],
    additionalCharges: [],
    discounts: [],
    advancePayment: 100,
    advanceMethod: 'Cash',
    previousPayments: 0,
    status: 'active',
    createdByEmployeeId: 'emp-1',
    createdByEmployeeName: 'Biplob (Owner)',
    createdAt: session1Start,
    notes: 'Playing FC 25 tournament match',
  },
  {
    id: 'sess-2',
    stationId: 'st-2',
    stationName: 'PS5 Seat 2',
    customerId: 'cust-2',
    customerName: 'Shakil Hasan',
    customerPhone: '01855667788',
    activePlayers: 1,
    startTime: session2Start,
    bookedMinutes: 60,
    durationMinutes: 25,
    hourlyRate: 100,
    packageName: '1 Player • 1 Hour',
    lockedGamingCharge: 100,
    gamingCharge: 100,
    totalPausedMs: 0,
    extensions: [],
    productItems: [
      {
        productId: 'prod-3',
        productName: 'Speed Energy Drink 250ml',
        category: 'Energy Drinks',
        quantity: 2,
        unitPrice: 40,
        unitCost: 28,
        lineTotal: 80,
        addedByEmployeeId: 'emp-2',
        addedByEmployeeName: 'Sabbir (Staff)',
        addedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
    ],
    additionalCharges: [],
    discounts: [],
    advancePayment: 50,
    advanceMethod: 'Cash',
    previousPayments: 0,
    status: 'active',
    createdByEmployeeId: 'emp-2',
    createdByEmployeeName: 'Sabbir (Staff)',
    createdAt: session2Start,
    notes: 'Mortal Kombat match',
  },
];

// Seed Employees
const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'Biplob',
    role: 'Owner',
    pin: '1234',
    phone: '01700000001',
    status: 'active',
    permissions: {
      canAdjustStock: true,
      canCreateDue: true,
      canGiveDiscount: true,
      canManageProducts: true,
      canViewAccounting: true,
      canSettleDues: true,
    },
  },
  {
    id: 'emp-2',
    name: 'Sabbir',
    role: 'Staff',
    pin: '2222',
    phone: '01700000002',
    status: 'active',
    permissions: {
      canAdjustStock: false,
      canCreateDue: true,
      canGiveDiscount: false,
      canManageProducts: false,
      canViewAccounting: false,
      canSettleDues: true,
    },
  },
];

// Seed Customers
const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Rahim Ahmed',
    phone: '01711223344',
    email: 'rahim@example.com',
    membershipTier: 'Gold',
    totalVisits: 14,
    totalSpent: 4200,
    currentDueBalance: 0,
    notes: 'Regular FIFA enthusiast',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'cust-2',
    name: 'Shakil Hasan',
    phone: '01855667788',
    membershipTier: 'Silver',
    totalVisits: 8,
    totalSpent: 2150,
    currentDueBalance: 120, // Has previous due to test due settlement!
    notes: 'Plays weekends',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'cust-3',
    name: 'Farhan Kabir',
    phone: '01999887766',
    membershipTier: 'VIP',
    totalVisits: 22,
    totalSpent: 8500,
    currentDueBalance: 0,
    notes: 'CS2 and Valorant regular',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
];

// Seed Previous Due Record
const INITIAL_DUES: DueRecord[] = [
  {
    id: 'due-1',
    customerId: 'cust-2',
    customerName: 'Shakil Hasan',
    phone: '01855667788',
    sessionId: 'sess-prev-1',
    checkoutId: 'chk-prev-1',
    stationName: 'PS5 Station 2',
    gamingCharge: 150,
    productCharge: 70,
    grandTotal: 220,
    paidAmount: 100,
    remainingBalance: 120,
    createdDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    employeeId: 'emp-1',
    employeeName: 'Biplob',
    status: 'PARTIALLY_PAID',
    repayments: [],
    notes: 'Left in hurry, promised to pay next session',
  },
];

// Seed Settings
const INITIAL_SETTINGS: AppSettings = {
  shopName: 'BLB GAMING ZONE',
  shopPhone: '+880 1700-123456',
  shopAddress: 'House 14, Road 7, Block C, Mirpur-2, Dhaka',
  currencySymbol: '৳',
  allowNegativeStock: false,
  receiptFooter: 'Thank you for gaming with us! GG & Come back soon! 🎮',
  thermalReceiptWidth: '80mm',
  taxPercentage: 0,
  themeColor: 'cyan',
  wallpaperId: 'obsidian',
  customWallpaperUrl: '',
  wallpaperDim: 75,
};

// Generic safe storage helper
class DB {
  private static listeners: Set<() => void> = new Set();

  static subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private static notify() {
    this.listeners.forEach((fn) => fn());
  }

  static get<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      return JSON.parse(data) as T;
    } catch {
      return fallback;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notify();
    } catch (e) {
      console.error(`Error saving to localStorage key ${key}`, e);
    }
  }

  // Initialize seed database if empty or version upgraded
  static init() {
    const savedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    if (savedVersion !== CURRENT_STORAGE_VERSION) {
      // Auto-migrate to latest 6-station demo with Biplob (Owner) & Sabbir (Staff)
      this.set(STORAGE_KEYS.STATIONS, INITIAL_STATIONS);
      this.set(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
      this.set(STORAGE_KEYS.CURRENT_USER, INITIAL_EMPLOYEES[0]);
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_STORAGE_VERSION);
    }

    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.set(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.STATIONS)) {
      this.set(STORAGE_KEYS.STATIONS, INITIAL_STATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
      this.set(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
      this.set(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      this.set(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DUES)) {
      this.set(STORAGE_KEYS.DUES, INITIAL_DUES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.set(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      this.set(STORAGE_KEYS.CURRENT_USER, INITIAL_EMPLOYEES[0]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      this.set(STORAGE_KEYS.TRANSACTIONS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PURCHASES)) {
      this.set(STORAGE_KEYS.PURCHASES, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CHECKOUTS)) {
      this.set(STORAGE_KEYS.CHECKOUTS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUICK_SALES)) {
      this.set(STORAGE_KEYS.QUICK_SALES, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
      this.set(STORAGE_KEYS.EXPENSES, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
      this.set(STORAGE_KEYS.PAYMENTS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUEUES)) {
      this.set(STORAGE_KEYS.QUEUES, []);
    }
  }

  // --- Products & Inventory Operations ---
  static getProducts(): Product[] {
    return this.get<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }

  static getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  }

  static saveProduct(product: Product): { success: boolean; message: string } {
    const products = this.getProducts();
    const existingIndex = products.findIndex((p) => p.id === product.id);

    if (existingIndex >= 0) {
      products[existingIndex] = {
        ...product,
        updatedAt: new Date().toISOString(),
      };
    } else {
      products.push({
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    this.set(STORAGE_KEYS.PRODUCTS, products);
    return { success: true, message: 'Product saved successfully.' };
  }

  static deleteOrDisableProduct(id: string, action: 'disable' | 'enable' | 'delete'): void {
    const products = this.getProducts();
    if (action === 'delete') {
      const filtered = products.filter((p) => p.id !== id);
      this.set(STORAGE_KEYS.PRODUCTS, filtered);
    } else {
      const p = products.find((x) => x.id === id);
      if (p) {
        p.status = action === 'disable' ? 'disabled' : 'active';
        p.updatedAt = new Date().toISOString();
        this.set(STORAGE_KEYS.PRODUCTS, products);
      }
    }
  }

  /**
   * Transaction-safe stock deduction for sales.
   * Throws or returns error if stock insufficient and negative stock disabled.
   */
  static deductStockForSale(
    productId: string,
    quantity: number,
    referenceId: string,
    employee: Employee,
    reason: InventoryAdjustmentReason = 'Sale'
  ): { success: boolean; error?: string; updatedProduct?: Product } {
    if (quantity <= 0) return { success: true };
    const settings = this.getSettings();
    const products = this.getProducts();
    const product = products.find((p) => p.id === productId);

    if (!product) {
      return { success: false, error: 'Product not found.' };
    }

    if (!settings.allowNegativeStock && product.currentStock < quantity) {
      return {
        success: false,
        error: `Insufficient stock for ${product.name}. Available: ${product.currentStock}, requested: ${quantity}.`,
      };
    }

    const previousStock = product.currentStock;
    const newStock = previousStock - quantity;
    product.currentStock = newStock;
    product.updatedAt = new Date().toISOString();

    // Log transaction
    const transaction: InventoryTransaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: product.id,
      productName: product.name,
      type: 'sale',
      quantityDelta: -quantity,
      previousStock,
      newStock,
      unitCost: product.purchaseCost,
      reason,
      referenceId,
      employeeId: employee.id,
      employeeName: employee.name,
      timestamp: new Date().toISOString(),
    };

    const transactions = this.getTransactions();
    transactions.unshift(transaction);

    this.set(STORAGE_KEYS.PRODUCTS, products);
    this.set(STORAGE_KEYS.TRANSACTIONS, transactions);

    return { success: true, updatedProduct: product };
  }

  /**
   * Reverses product stock when an item is removed from an active session or refunded.
   * Audits the change - no silent deletions.
   */
  static restoreStockForRefund(
    productId: string,
    quantity: number,
    referenceId: string,
    employee: Employee,
    reason: InventoryAdjustmentReason = 'Sale Reversal',
    notes?: string
  ): { success: boolean; error?: string } {
    if (quantity <= 0) return { success: true };
    const products = this.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) return { success: false, error: 'Product not found.' };

    const previousStock = product.currentStock;
    const newStock = previousStock + quantity;
    product.currentStock = newStock;
    product.updatedAt = new Date().toISOString();

    const transaction: InventoryTransaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: product.id,
      productName: product.name,
      type: 'refund',
      quantityDelta: quantity,
      previousStock,
      newStock,
      unitCost: product.purchaseCost,
      reason,
      referenceId,
      employeeId: employee.id,
      employeeName: employee.name,
      timestamp: new Date().toISOString(),
      notes,
    };

    const transactions = this.getTransactions();
    transactions.unshift(transaction);

    this.set(STORAGE_KEYS.PRODUCTS, products);
    this.set(STORAGE_KEYS.TRANSACTIONS, transactions);

    return { success: true };
  }

  /**
   * Records a product stock purchase with unit cost, supplier, and auto-expense integration.
   */
  static recordPurchase(
    purchaseData: Omit<ProductPurchase, 'id' | 'timestamp'>,
    employee: Employee,
    paymentMethod: PaymentMethod = 'Cash'
  ): { success: boolean; error?: string } {
    const products = this.getProducts();
    const product = products.find((p) => p.id === purchaseData.productId);
    if (!product) return { success: false, error: 'Product not found.' };

    const previousStock = product.currentStock;
    const newStock = previousStock + purchaseData.quantity;

    // Update product stock and optionally update purchase cost to latest
    product.currentStock = newStock;
    product.purchaseCost = purchaseData.purchaseCostPerUnit;
    product.updatedAt = new Date().toISOString();

    const purchase: ProductPurchase = {
      ...purchaseData,
      id: `pur-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    const purchases = this.getPurchases();
    purchases.unshift(purchase);

    // Record inventory transaction
    const transaction: InventoryTransaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: product.id,
      productName: product.name,
      type: 'purchase',
      quantityDelta: purchaseData.quantity,
      previousStock,
      newStock,
      unitCost: purchaseData.purchaseCostPerUnit,
      reason: 'New purchase',
      referenceId: purchase.id,
      employeeId: employee.id,
      employeeName: employee.name,
      timestamp: new Date().toISOString(),
      notes: purchaseData.notes,
    };

    const transactions = this.getTransactions();
    transactions.unshift(transaction);

    // Integrated Expense record
    const expense: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      category: 'inventory_purchase',
      title: `Stock Purchase: ${product.name} (${purchaseData.quantity} ${product.unitType})`,
      amount: purchaseData.totalCost,
      paymentMethod,
      paidTo: purchaseData.supplier || 'Supplier',
      employeeId: employee.id,
      employeeName: employee.name,
      timestamp: new Date().toISOString(),
      notes: `Invoice: ${purchaseData.invoiceNumber || 'N/A'}. ${purchaseData.notes || ''}`,
      linkedPurchaseId: purchase.id,
    };

    const expenses = this.getExpenses();
    expenses.unshift(expense);

    this.set(STORAGE_KEYS.PRODUCTS, products);
    this.set(STORAGE_KEYS.PURCHASES, purchases);
    this.set(STORAGE_KEYS.TRANSACTIONS, transactions);
    this.set(STORAGE_KEYS.EXPENSES, expenses);

    return { success: true };
  }

  /**
   * Manual stock adjustment (damaged, expired, lost, correction).
   */
  static recordManualAdjustment(
    productId: string,
    newStock: number,
    reason: InventoryAdjustmentReason,
    notes: string,
    employee: Employee
  ): { success: boolean; error?: string } {
    const products = this.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) return { success: false, error: 'Product not found.' };

    const previousStock = product.currentStock;
    const delta = newStock - previousStock;
    if (delta === 0) return { success: true };

    product.currentStock = newStock;
    product.updatedAt = new Date().toISOString();

    let txType: InventoryTransaction['type'] = 'adjustment';
    if (reason === 'Damaged') txType = 'damaged';
    else if (reason === 'Expired') txType = 'expired';
    else if (reason === 'Lost') txType = 'lost';

    const transaction: InventoryTransaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: product.id,
      productName: product.name,
      type: txType,
      quantityDelta: delta,
      previousStock,
      newStock,
      unitCost: product.purchaseCost,
      reason,
      employeeId: employee.id,
      employeeName: employee.name,
      timestamp: new Date().toISOString(),
      notes,
    };

    const transactions = this.getTransactions();
    transactions.unshift(transaction);

    this.set(STORAGE_KEYS.PRODUCTS, products);
    this.set(STORAGE_KEYS.TRANSACTIONS, transactions);

    return { success: true };
  }

  static getTransactions(): InventoryTransaction[] {
    return this.get<InventoryTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  }

  static getPurchases(): ProductPurchase[] {
    return this.get<ProductPurchase[]>(STORAGE_KEYS.PURCHASES, []);
  }

  // --- Gaming Stations & Sessions ---
  static getStations(): GamingStation[] {
    const stations = this.get<GamingStation[]>(STORAGE_KEYS.STATIONS, INITIAL_STATIONS);
    return stations.map((s) => ({
      ...s,
      halfHourRate: s.halfHourRate ?? Math.round(s.hourlyRate * 0.6),
      packages:
        s.packages && s.packages.length > 0
          ? s.packages
          : buildDefaultPackages(s.hourlyRate, s.halfHourRate ?? Math.round(s.hourlyRate * 0.6)),
    }));
  }

  static saveStations(stations: GamingStation[]) {
    this.set(STORAGE_KEYS.STATIONS, stations);
  }

  static saveStation(station: GamingStation): void {
    const stations = this.getStations();
    const idx = stations.findIndex((s) => s.id === station.id);
    const enriched: GamingStation = {
      ...station,
      halfHourRate: station.halfHourRate ?? Math.round(station.hourlyRate * 0.6),
      packages:
        station.packages && station.packages.length > 0
          ? station.packages
          : buildDefaultPackages(
              station.hourlyRate,
              station.halfHourRate ?? Math.round(station.hourlyRate * 0.6)
            ),
    };
    if (idx >= 0) {
      stations[idx] = enriched;
    } else {
      stations.push(enriched);
    }
    this.saveStations(stations);
  }

  static deleteStation(stationId: string): { success: boolean; error?: string } {
    const stations = this.getStations();
    const st = stations.find((s) => s.id === stationId);
    if (!st) return { success: false, error: 'Station not found.' };
    if (st.status === 'occupied') {
      return { success: false, error: 'Cannot delete an occupied station. End the session first.' };
    }
    this.saveStations(stations.filter((s) => s.id !== stationId));
    return { success: true };
  }

  static getSessions(): GamingSession[] {
    const sessions = this.get<GamingSession[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
    return sessions.map((s) => {
      // Upgrade any legacy active sessions that lack bookedMinutes (unless explicitly Open Timer)
      if (s.status === 'active' && s.bookedMinutes === undefined && s.packageId !== 'open') {
        return {
          ...s,
          bookedMinutes: 60,
          lockedGamingCharge: s.lockedGamingCharge ?? s.hourlyRate,
        };
      }
      return s;
    });
  }

  static getActiveSessionByStation(stationId: string): GamingSession | undefined {
    return this.getSessions().find((s) => s.stationId === stationId && s.status === 'active');
  }

  static startSession(
    stationId: string,
    customerName: string,
    customerPhone: string,
    players: number,
    advancePayment: number,
    employee: Employee,
    packageId?: string,
    packageName?: string,
    hourlyRateOverride?: number,
    options?: {
      bookedMinutes?: number;
      lockedGamingCharge?: number;
      discountAmount?: number;
      advanceMethod?: PaymentMethod;
      isCustomTime?: boolean;
      customTimeWindow?: string;
      notes?: string;
    }
  ): GamingSession {
    const stations = this.getStations();
    const station = stations.find((s) => s.id === stationId);
    if (!station) throw new Error('Station not found');

    const rate = hourlyRateOverride !== undefined ? hourlyRateOverride : station.hourlyRate;
    const sessionId = `sess-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const advanceMethod = options?.advanceMethod || 'Cash';
    const discountAmt = Math.max(0, options?.discountAmount || 0);

    const discounts =
      discountAmt > 0
        ? [
            {
              id: `disc-start-${Date.now()}`,
              name: `Booking Discount`,
              type: 'fixed' as const,
              value: discountAmt,
              amountCalculated: discountAmt,
              reason: 'Applied at session start',
            },
          ]
        : [];

    const newSession: GamingSession = {
      id: sessionId,
      stationId,
      stationName: station.name,
      customerName: customerName.trim() || 'Walk-in Gamer',
      customerPhone: customerPhone.trim() || undefined,
      activePlayers: players || 1,
      startTime: nowIso,
      bookedMinutes: options?.bookedMinutes,
      durationMinutes: 0,
      hourlyRate: rate,
      packageId,
      packageName,
      lockedGamingCharge: options?.lockedGamingCharge,
      gamingCharge: options?.lockedGamingCharge ?? 0,
      isCustomTime: options?.isCustomTime,
      customTimeWindow: options?.customTimeWindow,
      isPaused: false,
      totalPausedMs: 0,
      extensions: [],
      productItems: [],
      additionalCharges: [],
      discounts,
      advancePayment: Math.max(0, advancePayment || 0),
      advanceMethod,
      previousPayments: 0,
      status: 'active',
      createdByEmployeeId: employee.id,
      createdByEmployeeName: employee.name,
      createdAt: nowIso,
      notes: options?.notes,
    };

    // If advance payment provided, log advance payment record
    if (advancePayment > 0) {
      const pRecord: PaymentRecord = {
        id: `pay-${Date.now()}`,
        referenceType: 'advance',
        referenceId: sessionId,
        customerName: newSession.customerName,
        amount: advancePayment,
        method: advanceMethod,
        employeeId: employee.id,
        employeeName: employee.name,
        timestamp: nowIso,
        notes: `Advance payment for ${station.name}`,
      };
      const payments = this.getPayments();
      payments.unshift(pRecord);
      this.set(STORAGE_KEYS.PAYMENTS, payments);
    }

    station.status = 'occupied';
    station.currentSessionId = sessionId;

    const sessions = this.getSessions();
    sessions.unshift(newSession);

    this.saveStations(stations);
    this.set(STORAGE_KEYS.SESSIONS, sessions);

    return newSession;
  }

  static togglePauseSession(sessionId: string): { success: boolean; error?: string } {
    const sessions = this.getSessions();
    const session = sessions.find((s) => s.id === sessionId && s.status === 'active');
    if (!session) return { success: false, error: 'Active session not found.' };

    const nowMs = Date.now();
    if (session.isPaused) {
      // Resume
      const pausedSince = session.pausedAt ? new Date(session.pausedAt).getTime() : nowMs;
      session.totalPausedMs = (session.totalPausedMs || 0) + Math.max(0, nowMs - pausedSince);
      session.isPaused = false;
      session.pausedAt = undefined;
    } else {
      // Pause
      session.isPaused = true;
      session.pausedAt = new Date(nowMs).toISOString();
    }

    this.set(STORAGE_KEYS.SESSIONS, sessions);
    return { success: true };
  }

  static extendSession(
    sessionId: string,
    addedMinutes: number,
    addedCharge: number,
    employee: Employee
  ): { success: boolean; error?: string } {
    const sessions = this.getSessions();
    const session = sessions.find((s) => s.id === sessionId && s.status === 'active');
    if (!session) return { success: false, error: 'Active session not found.' };

    // Calculate current elapsed minutes if session had no bookedMinutes
    const nowMs = Date.now();
    const startMs = new Date(session.startTime).getTime();
    const elapsedMins = Math.max(
      1,
      Math.round((nowMs - startMs - (session.totalPausedMs || 0)) / 60000)
    );

    const baseBooked = session.bookedMinutes ?? elapsedMins;
    session.bookedMinutes = baseBooked + addedMinutes;

    const baseCharge =
      session.lockedGamingCharge !== undefined
        ? session.lockedGamingCharge
        : Math.round((elapsedMins / 60) * session.hourlyRate);

    session.lockedGamingCharge = baseCharge + Math.max(0, addedCharge);
    session.gamingCharge = session.lockedGamingCharge;

    session.extensions = session.extensions || [];
    session.extensions.push({
      id: `ext-${Date.now()}`,
      addedMinutes,
      addedCharge,
      timestamp: new Date().toISOString(),
      employeeName: employee.name,
    });

    this.set(STORAGE_KEYS.SESSIONS, sessions);
    return { success: true };
  }

  static cancelActiveSession(
    sessionId: string,
    employee: Employee
  ): { success: boolean; error?: string } {
    const sessions = this.getSessions();
    const stations = this.getStations();
    const session = sessions.find((s) => s.id === sessionId && s.status === 'active');
    if (!session) return { success: false, error: 'Active session not found.' };

    // Restore any product stock attached to this session safely
    for (const item of session.productItems) {
      this.restoreStockForRefund(
        item.productId,
        item.quantity,
        sessionId,
        employee,
        'Sale Reversal',
        'Session cancelled'
      );
    }

    session.status = 'cancelled';
    session.endTime = new Date().toISOString();

    const st = stations.find((s) => s.id === session.stationId);
    if (st) {
      st.status = 'available';
      st.currentSessionId = undefined;
    }

    this.set(STORAGE_KEYS.SESSIONS, sessions);
    this.saveStations(stations);
    return { success: true };
  }

  // --- Station Queue Bookings ---
  static getQueues(): QueueBooking[] {
    return this.get<QueueBooking[]>(STORAGE_KEYS.QUEUES, []);
  }

  static addToQueue(
    booking: Omit<QueueBooking, 'id' | 'createdAt' | 'status'>
  ): QueueBooking {
    const queues = this.getQueues();
    const newBooking: QueueBooking = {
      ...booking,
      id: `q-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'waiting',
    };

    // If advance payment is paid while booking queue, log advance payment record
    if (booking.advancePayment > 0) {
      const pRecord: PaymentRecord = {
        id: `pay-${Date.now()}`,
        referenceType: 'advance',
        referenceId: newBooking.id,
        customerName: booking.customerName,
        amount: booking.advancePayment,
        method: booking.advanceMethod,
        employeeId: booking.createdByEmployeeId,
        employeeName: booking.createdByEmployeeName,
        timestamp: newBooking.createdAt,
        notes: `Queue booking advance for ${booking.stationName}`,
      };
      const payments = this.getPayments();
      payments.unshift(pRecord);
      this.set(STORAGE_KEYS.PAYMENTS, payments);
    }

    queues.push(newBooking);
    this.set(STORAGE_KEYS.QUEUES, queues);
    return newBooking;
  }

  static removeFromQueue(queueId: string): void {
    const queues = this.getQueues();
    const q = queues.find((x) => x.id === queueId);
    if (q) {
      q.status = 'cancelled';
      this.set(STORAGE_KEYS.QUEUES, queues);
    }
  }

  static startQueuedSession(
    queueId: string,
    employee: Employee
  ): { success: boolean; session?: GamingSession; error?: string } {
    const queues = this.getQueues();
    const q = queues.find((x) => x.id === queueId && x.status === 'waiting');
    if (!q) return { success: false, error: 'Waiting queue booking not found.' };

    const stations = this.getStations();
    const station = stations.find((s) => s.id === q.stationId);
    if (!station) return { success: false, error: 'Station not found.' };

    if (station.status === 'occupied') {
      return {
        success: false,
        error: `${station.name} is still occupied! Please end/settle the current player before starting the queued session.`,
      };
    }

    // Mark queue as started
    q.status = 'started';
    this.set(STORAGE_KEYS.QUEUES, queues);

    const customWindow =
      q.isCustomTime && q.customStartTime && q.customEndTime
        ? `${q.customStartTime} - ${q.customEndTime}`
        : undefined;

    // Start session using the locked booking snapshot (advance already logged at queue creation -> set advancePayment directly on session without double-logging payment!)
    const sessionId = `sess-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const discounts =
      q.discountAmount > 0
        ? [
            {
              id: `disc-q-${Date.now()}`,
              name: 'Queue Booking Discount',
              type: 'fixed' as const,
              value: q.discountAmount,
              amountCalculated: q.discountAmount,
              reason: 'Locked in queue booking',
            },
          ]
        : [];

    const newSession: GamingSession = {
      id: sessionId,
      stationId: q.stationId,
      stationName: station.name,
      customerName: q.customerName,
      customerPhone: q.customerPhone,
      activePlayers: q.players,
      startTime: nowIso,
      bookedMinutes: q.bookedMinutes,
      durationMinutes: 0,
      hourlyRate: station.hourlyRate,
      packageId: q.packageId,
      packageName: q.packageName,
      lockedGamingCharge: q.basePrice, // discount is stored in discounts array so UnifiedCheckout never double-subtracts!
      gamingCharge: q.basePrice,
      isCustomTime: q.isCustomTime,
      customTimeWindow: customWindow,
      isPaused: false,
      totalPausedMs: 0,
      extensions: [],
      productItems: [],
      additionalCharges: [],
      discounts,
      advancePayment: q.advancePayment,
      advanceMethod: q.advanceMethod,
      previousPayments: 0,
      status: 'active',
      createdByEmployeeId: employee.id,
      createdByEmployeeName: employee.name,
      createdAt: nowIso,
      notes: q.notes,
    };

    station.status = 'occupied';
    station.currentSessionId = sessionId;

    const sessions = this.getSessions();
    sessions.unshift(newSession);

    this.saveStations(stations);
    this.set(STORAGE_KEYS.SESSIONS, sessions);

    return { success: true, session: newSession };
  }

  /**
   * Adds products to an active gaming session and deducts stock safely.
   */
  static addProductsToSession(
    sessionId: string,
    itemsToAdd: { productId: string; quantity: number }[],
    employee: Employee
  ): { success: boolean; error?: string } {
    const sessions = this.getSessions();
    const session = sessions.find((s) => s.id === sessionId && s.status === 'active');
    if (!session) return { success: false, error: 'Active session not found.' };

    const products = this.getProducts();

    // Pre-validate stock availability for all items first
    const settings = this.getSettings();
    for (const item of itemsToAdd) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) return { success: false, error: `Product ID ${item.productId} not found.` };
      if (!settings.allowNegativeStock && prod.currentStock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${prod.name}. Available: ${prod.currentStock}, requested: ${item.quantity}.`,
        };
      }
    }

    // Now safely deduct stock and add to session
    for (const item of itemsToAdd) {
      const prod = products.find((p) => p.id === item.productId)!;
      this.deductStockForSale(
        prod.id,
        item.quantity,
        sessionId,
        employee,
        'Sale'
      );

      // Check if product already exists in session.productItems
      const existingItem = session.productItems.find((p) => p.productId === prod.id);
      if (existingItem) {
        existingItem.quantity += item.quantity;
        existingItem.lineTotal = existingItem.quantity * existingItem.unitPrice;
      } else {
        session.productItems.push({
          productId: prod.id,
          productName: prod.name,
          category: prod.category,
          quantity: item.quantity,
          unitPrice: prod.sellingPrice,
          unitCost: prod.purchaseCost,
          lineTotal: item.quantity * prod.sellingPrice,
          addedByEmployeeId: employee.id,
          addedByEmployeeName: employee.name,
          addedAt: new Date().toISOString(),
        });
      }
    }

    this.set(STORAGE_KEYS.SESSIONS, sessions);
    return { success: true };
  }

  /**
   * Removes or adjusts quantity of a product in an active session,
   * restoring stock safely and logging the reversal audit trail.
   */
  static updateSessionProductItem(
    sessionId: string,
    productId: string,
    newQuantity: number,
    employee: Employee,
    reason: string = 'Customer cancelled item'
  ): { success: boolean; error?: string } {
    const sessions = this.getSessions();
    const session = sessions.find((s) => s.id === sessionId && s.status === 'active');
    if (!session) return { success: false, error: 'Session not found.' };

    const item = session.productItems.find((p) => p.productId === productId);
    if (!item) return { success: false, error: 'Item not found in session.' };

    const oldQuantity = item.quantity;
    const diff = newQuantity - oldQuantity;

    if (diff === 0) return { success: true };

    if (diff > 0) {
      // Adding more
      const deductRes = this.deductStockForSale(productId, diff, sessionId, employee, 'Sale');
      if (!deductRes.success) return deductRes;
      item.quantity = newQuantity;
      item.lineTotal = item.quantity * item.unitPrice;
    } else {
      // Reducing or removing
      const restoreCount = Math.abs(diff);
      this.restoreStockForRefund(productId, restoreCount, sessionId, employee, 'Sale Reversal', reason);
      if (newQuantity <= 0) {
        session.productItems = session.productItems.filter((p) => p.productId !== productId);
      } else {
        item.quantity = newQuantity;
        item.lineTotal = item.quantity * item.unitPrice;
      }
    }

    this.set(STORAGE_KEYS.SESSIONS, sessions);
    return { success: true };
  }

  // --- Unified Checkout ---
  static processSessionCheckout(
    checkoutData: Omit<CheckoutRecord, 'id' | 'receiptNumber' | 'timestamp'>
  ): { success: boolean; checkoutRecord: CheckoutRecord; error?: string } {
    const sessions = this.getSessions();
    const stations = this.getStations();
    const dues = this.getDues();
    const checkouts = this.getCheckouts();
    const payments = this.getPayments();

    const receiptNumber = generateReceiptNumber('BLB');
    const nowIso = new Date().toISOString();
    const checkoutId = `chk-${Date.now()}`;

    const completeCheckout: CheckoutRecord = {
      ...checkoutData,
      id: checkoutId,
      receiptNumber,
      timestamp: nowIso,
    };

    // 1. Mark session as completed
    if (checkoutData.sessionId) {
      const sess = sessions.find((s) => s.id === checkoutData.sessionId);
      if (sess) {
        sess.status = 'completed';
        sess.endTime = nowIso;
        sess.gamingCharge = checkoutData.gamingCharge;
      }
    }

    // 2. Release station to available
    if (checkoutData.stationId) {
      const st = stations.find((s) => s.id === checkoutData.stationId);
      if (st) {
        st.status = 'available';
        st.currentSessionId = undefined;
      }
    }

    // 3. Record each split payment in payment history
    for (const split of checkoutData.splitPayments) {
      if (split.amount > 0) {
        payments.unshift({
          id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          referenceType: 'checkout',
          referenceId: checkoutId,
          customerId: checkoutData.customerId,
          customerName: checkoutData.customerName,
          amount: split.amount,
          method: split.method,
          transactionId: split.transactionId,
          employeeId: checkoutData.employeeId,
          employeeName: checkoutData.employeeName,
          timestamp: nowIso,
          notes: split.note || `Checkout payment for ${checkoutData.stationName || 'Session'}`,
        });
      }
    }

    // 4. If remaining due > 0, create Due record
    if (checkoutData.remainingDue > 0) {
      const dueId = `due-${Date.now()}`;
      const dueStatus = checkoutData.totalPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';

      const newDue: DueRecord = {
        id: dueId,
        customerId: checkoutData.customerId,
        customerName: checkoutData.customerName,
        phone: checkoutData.customerPhone,
        sessionId: checkoutData.sessionId,
        checkoutId: checkoutId,
        stationName: checkoutData.stationName,
        gamingCharge: checkoutData.gamingCharge,
        productCharge: checkoutData.productSubtotal,
        grandTotal: checkoutData.grandTotal,
        paidAmount: checkoutData.totalPaid,
        remainingBalance: checkoutData.remainingDue,
        createdDate: nowIso,
        employeeId: checkoutData.employeeId,
        employeeName: checkoutData.employeeName,
        status: dueStatus,
        repayments: [],
        notes: checkoutData.notes,
      };

      dues.unshift(newDue);

      // Update customer due balance if customer exists
      if (checkoutData.customerId) {
        const customers = this.getCustomers();
        const cust = customers.find((c) => c.id === checkoutData.customerId);
        if (cust) {
          cust.currentDueBalance = (cust.currentDueBalance || 0) + checkoutData.remainingDue;
          cust.totalSpent = (cust.totalSpent || 0) + checkoutData.totalPaid;
          cust.totalVisits = (cust.totalVisits || 0) + 1;
          this.set(STORAGE_KEYS.CUSTOMERS, customers);
        }
      }
    } else {
      // Full payment - update customer stats
      if (checkoutData.customerId) {
        const customers = this.getCustomers();
        const cust = customers.find((c) => c.id === checkoutData.customerId);
        if (cust) {
          cust.totalSpent = (cust.totalSpent || 0) + checkoutData.totalPaid;
          cust.totalVisits = (cust.totalVisits || 0) + 1;
          this.set(STORAGE_KEYS.CUSTOMERS, customers);
        }
      }
    }

    checkouts.unshift(completeCheckout);

    // Save all state
    this.set(STORAGE_KEYS.SESSIONS, sessions);
    this.saveStations(stations);
    this.set(STORAGE_KEYS.CHECKOUTS, checkouts);
    this.set(STORAGE_KEYS.DUES, dues);
    this.set(STORAGE_KEYS.PAYMENTS, payments);

    return { success: true, checkoutRecord: completeCheckout };
  }

  // --- Walk-in Quick Sales ---
  static processQuickSale(
    items: { productId: string; quantity: number }[],
    discount: number,
    splitPayments: SplitPayment[],
    customerName: string,
    customerPhone: string,
    employee: Employee,
    notes?: string
  ): { success: boolean; quickSaleRecord?: QuickSaleRecord; error?: string } {
    const products = this.getProducts();
    const settings = this.getSettings();

    // 1. Validate stocks
    for (const item of items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) return { success: false, error: 'Product not found.' };
      if (!settings.allowNegativeStock && prod.currentStock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${prod.name}. Available: ${prod.currentStock}, requested: ${item.quantity}.`,
        };
      }
    }

    const quickSaleId = `qs-${Date.now()}`;
    const receiptNumber = generateReceiptNumber('QS');
    const nowIso = new Date().toISOString();

    const saleItems: ProductSaleItem[] = [];
    let productSubtotal = 0;

    // 2. Deduct stock safely
    for (const item of items) {
      const prod = products.find((p) => p.id === item.productId)!;
      this.deductStockForSale(prod.id, item.quantity, quickSaleId, employee, 'Sale');

      const lineTotal = item.quantity * prod.sellingPrice;
      productSubtotal += lineTotal;

      saleItems.push({
        productId: prod.id,
        productName: prod.name,
        category: prod.category,
        quantity: item.quantity,
        unitPrice: prod.sellingPrice,
        unitCost: prod.purchaseCost,
        lineTotal,
        addedByEmployeeId: employee.id,
        addedByEmployeeName: employee.name,
        addedAt: nowIso,
      });
    }

    const grandTotal = Math.max(0, productSubtotal - discount);
    const paymentReceived = splitPayments.reduce((acc, p) => acc + p.amount, 0);

    const record: QuickSaleRecord = {
      id: quickSaleId,
      receiptNumber,
      products: saleItems,
      productSubtotal,
      discount,
      grandTotal,
      paymentReceived,
      splitPayments,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || undefined,
      employeeId: employee.id,
      employeeName: employee.name,
      timestamp: nowIso,
      notes,
    };

    const quickSales = this.getQuickSales();
    quickSales.unshift(record);

    // Record payments
    const payments = this.getPayments();
    for (const split of splitPayments) {
      if (split.amount > 0) {
        payments.unshift({
          id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          referenceType: 'quick_sale',
          referenceId: quickSaleId,
          customerName: record.customerName || 'Walk-in',
          amount: split.amount,
          method: split.method,
          transactionId: split.transactionId,
          employeeId: employee.id,
          employeeName: employee.name,
          timestamp: nowIso,
          notes: split.note || 'Walk-in snack/drink sale',
        });
      }
    }

    this.set(STORAGE_KEYS.QUICK_SALES, quickSales);
    this.set(STORAGE_KEYS.PAYMENTS, payments);

    return { success: true, quickSaleRecord: record };
  }

  // --- Due Management & Repayment ---
  static getDues(): DueRecord[] {
    return this.get<DueRecord[]>(STORAGE_KEYS.DUES, INITIAL_DUES);
  }

  static repayDue(
    dueId: string,
    amount: number,
    method: PaymentMethod,
    transactionId: string | undefined,
    employee: Employee,
    notes?: string
  ): { success: boolean; error?: string } {
    if (amount <= 0) return { success: false, error: 'Payment amount must be greater than 0.' };

    const dues = this.getDues();
    const due = dues.find((d) => d.id === dueId);
    if (!due) return { success: false, error: 'Due record not found.' };

    if (amount > due.remainingBalance) {
      return {
        success: false,
        error: `Amount exceeds outstanding balance (৳${due.remainingBalance}).`,
      };
    }

    const previousBalance = due.remainingBalance;
    const newRemaining = previousBalance - amount;
    const nowIso = new Date().toISOString();

    const repayment: DueRepayment = {
      id: `repay-${Date.now()}`,
      dueId,
      amount,
      method,
      transactionId,
      employeeId: employee.id,
      employeeName: employee.name,
      timestamp: nowIso,
      previousBalance,
      remainingBalance: newRemaining,
      notes,
    };

    due.paidAmount += amount;
    due.remainingBalance = newRemaining;
    due.status = newRemaining === 0 ? 'PAID' : 'PARTIALLY_PAID';
    due.repayments.push(repayment);

    // Record in global payment log
    const payments = this.getPayments();
    payments.unshift({
      id: `pay-${Date.now()}`,
      referenceType: 'due_repayment',
      referenceId: dueId,
      customerId: due.customerId,
      customerName: due.customerName,
      amount,
      method,
      transactionId,
      employeeId: employee.id,
      employeeName: employee.name,
      timestamp: nowIso,
      notes: `Due settlement for ${due.customerName}`,
    });

    // Update customer due balance
    if (due.customerId) {
      const customers = this.getCustomers();
      const cust = customers.find((c) => c.id === due.customerId);
      if (cust) {
        cust.currentDueBalance = Math.max(0, (cust.currentDueBalance || 0) - amount);
        this.set(STORAGE_KEYS.CUSTOMERS, customers);
      }
    }

    this.set(STORAGE_KEYS.DUES, dues);
    this.set(STORAGE_KEYS.PAYMENTS, payments);

    return { success: true };
  }

  // --- Expenses & Accounting ---
  static getExpenses(): ExpenseRecord[] {
    return this.get<ExpenseRecord[]>(STORAGE_KEYS.EXPENSES, []);
  }

  static addExpense(
    expense: Omit<ExpenseRecord, 'id' | 'timestamp'>,
    employee: Employee
  ): ExpenseRecord {
    const expenses = this.getExpenses();
    const newExp: ExpenseRecord = {
      ...expense,
      id: `exp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      employeeId: employee.id,
      employeeName: employee.name,
    };
    expenses.unshift(newExp);
    this.set(STORAGE_KEYS.EXPENSES, expenses);
    return newExp;
  }

  static deleteExpense(expenseId: string): void {
    const expenses = this.getExpenses().filter((e) => e.id !== expenseId);
    this.set(STORAGE_KEYS.EXPENSES, expenses);
  }

  static getCheckouts(): CheckoutRecord[] {
    return this.get<CheckoutRecord[]>(STORAGE_KEYS.CHECKOUTS, []);
  }

  static getQuickSales(): QuickSaleRecord[] {
    return this.get<QuickSaleRecord[]>(STORAGE_KEYS.QUICK_SALES, []);
  }

  static getPayments(): PaymentRecord[] {
    return this.get<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, []);
  }

  static getEmployees(): Employee[] {
    return this.get<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
  }

  static saveEmployee(employee: Employee): void {
    const employees = this.getEmployees();
    const idx = employees.findIndex((e) => e.id === employee.id);
    if (idx >= 0) {
      employees[idx] = employee;
    } else {
      employees.push(employee);
    }
    this.set(STORAGE_KEYS.EMPLOYEES, employees);

    // Keep CURRENT_USER synced if editing the active user
    const current = this.getCurrentUser();
    if (current && current.id === employee.id) {
      this.set(STORAGE_KEYS.CURRENT_USER, employee);
    }
  }

  static deleteEmployee(employeeId: string): { success: boolean; error?: string } {
    const employees = this.getEmployees();
    const target = employees.find((e) => e.id === employeeId);
    if (!target) return { success: false, error: 'Employee not found.' };

    const current = this.getCurrentUser();
    if (current && current.id === employeeId) {
      return {
        success: false,
        error: 'Cannot remove the currently active account. Switch to another account first.',
      };
    }

    const ownersLeft = employees.filter((e) => e.role === 'Owner' && e.id !== employeeId).length;
    if (target.role === 'Owner' && ownersLeft === 0) {
      return {
        success: false,
        error: 'Cannot remove the only Owner account. At least one Owner is required.',
      };
    }

    this.set(
      STORAGE_KEYS.EMPLOYEES,
      employees.filter((e) => e.id !== employeeId)
    );
    return { success: true };
  }

  static getCustomers(): Customer[] {
    return this.get<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }

  static saveCustomer(cust: Customer): void {
    const customers = this.getCustomers();
    const idx = customers.findIndex((c) => c.id === cust.id);
    if (idx >= 0) {
      customers[idx] = cust;
    } else {
      customers.push(cust);
    }
    this.set(STORAGE_KEYS.CUSTOMERS, customers);
  }

  static getSettings(): AppSettings {
    const saved = this.get<AppSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    return {
      ...INITIAL_SETTINGS,
      ...saved,
    };
  }

  static saveSettings(settings: AppSettings): void {
    this.set(STORAGE_KEYS.SETTINGS, settings);
  }

  static getCurrentUser(): Employee {
    return this.get<Employee>(STORAGE_KEYS.CURRENT_USER, INITIAL_EMPLOYEES[0]);
  }

  static setCurrentUser(employee: Employee): void {
    this.set(STORAGE_KEYS.CURRENT_USER, employee);
  }
}

// Automatically initialize storage on import
DB.init();

export default DB;
