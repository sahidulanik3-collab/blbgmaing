import React, { useState } from 'react';
import {
  Zap,
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  User,
  Phone,
  CheckCircle2,
  Receipt,
  ShoppingBag,
} from 'lucide-react';
import { Product, ProductCategory, Employee, SplitPayment, PaymentMethod } from '../../types';
import { formatBDT } from '../../utils/formatters';
import DB from '../../utils/storage';

interface QuickSaleViewProps {
  products: Product[];
  currentEmployee: Employee;
  onRefresh: () => void;
  onOpenReceipt: (receiptData: any) => void;
}

const CATEGORIES: ('All' | ProductCategory)[] = [
  'All',
  'Soft Drinks',
  'Energy Drinks',
  'Water',
  'Chips',
  'Snacks',
  'Chocolate',
  'Instant Food',
];

export const QuickSaleView: React.FC<QuickSaleViewProps> = ({
  products,
  currentEmployee,
  onRefresh,
  onOpenReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>('All');
  
  // Cart: productId -> quantity
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  
  // Split payments
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([
    { method: 'Cash', amount: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeProducts = products.filter((p) => p.status === 'active');
  const filteredProducts = activeProducts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleAddToCart = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const current = cart[productId] || 0;
    if (prod.currentStock <= current) {
      alert(`Only ${prod.currentStock} in stock for ${prod.name}!`);
      return;
    }
    setCart((prev) => ({ ...prev, [productId]: current + 1 }));
  };

  const handleDecrement = (productId: string) => {
    const current = cart[productId] || 0;
    if (current <= 1) {
      const copy = { ...cart };
      delete copy[productId];
      setCart(copy);
    } else {
      setCart((prev) => ({ ...prev, [productId]: current - 1 }));
    }
  };

  const handleRemove = (productId: string) => {
    const copy = { ...cart };
    delete copy[productId];
    setCart(copy);
  };

  const clearCart = () => {
    setCart({});
    setDiscount(0);
    setNotes('');
  };

  // Calculations
  const subtotal = Object.entries(cart).reduce((acc, [pId, qty]) => {
    const prod = products.find((p) => p.id === pId);
    return acc + (prod ? prod.sellingPrice * qty : 0);
  }, 0);

  const grandTotal = Math.max(0, subtotal - discount);

  // Sync default single payment amount to grandTotal
  React.useEffect(() => {
    setSplitPayments([{ method: paymentMethod, amount: grandTotal }]);
  }, [grandTotal, paymentMethod]);

  const totalPaid = splitPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const handleCheckout = () => {
    if (Object.keys(cart).length === 0) {
      alert('Cart is empty.');
      return;
    }

    if (totalPaid < grandTotal) {
      alert(
        `Received amount (৳${totalPaid}) is less than total bill (৳${grandTotal}). Walk-in sales require full payment.`
      );
      return;
    }

    setIsSubmitting(true);
    const items = Object.entries(cart).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    const result = DB.processQuickSale(
      items,
      discount,
      splitPayments,
      customerName.trim(),
      customerPhone.trim(),
      currentEmployee,
      notes.trim() || undefined
    );

    setIsSubmitting(false);

    if (!result.success || !result.quickSaleRecord) {
      alert(result.error || 'Failed to complete quick sale');
      return;
    }

    // Format receipt data
    const receiptData = {
      receiptNumber: result.quickSaleRecord.receiptNumber,
      date: result.quickSaleRecord.timestamp,
      customerName: result.quickSaleRecord.customerName,
      customerPhone: result.quickSaleRecord.customerPhone,
      employeeName: result.quickSaleRecord.employeeName,
      type: 'WALK_IN_QUICK_SALE',
      gamingCharge: 0,
      products: result.quickSaleRecord.products,
      productSubtotal: result.quickSaleRecord.productSubtotal,
      discount: result.quickSaleRecord.discount,
      grandTotal: result.quickSaleRecord.grandTotal,
      paidAmount: result.quickSaleRecord.paymentReceived,
      remainingDue: 0,
      splitPayments: result.quickSaleRecord.splitPayments,
      notes: result.quickSaleRecord.notes,
    };

    clearCart();
    onRefresh();
    onOpenReceipt(receiptData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Product Selection Grid (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search & Categories */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Walk-in Quick Sale</h2>
              <p className="text-xs text-slate-400">
                Direct snacks & beverages checkout without active gaming session
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search snack, chips, energy drink..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-amber-400 text-black font-bold shadow-md shadow-amber-400/20'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Catalog Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredProducts.map((p) => {
            const qtyInCart = cart[p.id] || 0;
            const isOut = p.currentStock <= 0;

            return (
              <button
                key={p.id}
                disabled={isOut}
                onClick={() => handleAddToCart(p.id)}
                className={`text-left p-3.5 rounded-2xl border transition relative flex flex-col justify-between ${
                  qtyInCart > 0
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 disabled:opacity-40'
                }`}
              >
                {qtyInCart > 0 && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 text-black font-mono font-bold text-xs flex items-center justify-center">
                    {qtyInCart}
                  </span>
                )}
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">
                    {p.category}
                  </span>
                  <h4 className="font-bold text-white text-xs mt-0.5 line-clamp-1">{p.name}</h4>
                </div>

                <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-amber-400 font-bold font-mono text-sm">
                    {formatBDT(p.sellingPrice)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Stock: {p.currentStock}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Walk-in Cart & Checkout (5 cols) */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm">Cart Items ({Object.keys(cart).length})</h3>
          </div>
          {Object.keys(cart).length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Cart Item List */}
        <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
          {Object.keys(cart).length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Click any product to add to cart
            </div>
          ) : (
            Object.entries(cart).map(([productId, quantity]) => {
              const product = products.find((p) => p.id === productId);
              if (!product) return null;
              const lineTotal = product.sellingPrice * quantity;

              return (
                <div
                  key={productId}
                  className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-2">
                    <span className="font-bold text-white block truncate">{product.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatBDT(product.sellingPrice)} each
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-0.5">
                      <button
                        onClick={() => handleDecrement(productId)}
                        className="w-5 h-5 flex items-center justify-center hover:bg-slate-700 rounded text-slate-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-white">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleAddToCart(productId)}
                        className="w-5 h-5 flex items-center justify-center hover:bg-slate-700 rounded text-slate-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-mono font-bold text-amber-400 w-14 text-right">
                      {formatBDT(lineTotal)}
                    </span>

                    <button
                      onClick={() => handleRemove(productId)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Customer Details (Optional) */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Customer Name (Optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <input
              type="tel"
              placeholder="Phone # (Optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
        </div>

        {/* Payment Method & Discount */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Payment Method:</span>
            <div className="flex gap-1">
              {(['Cash', 'bKash', 'Nagad'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    paymentMethod === m
                      ? 'bg-amber-400 text-black font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Discount Field */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">Discount (৳):</span>
            <input
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
        </div>

        {/* Bill Summary */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal:</span>
            <span className="font-mono text-white">{formatBDT(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Discount:</span>
              <span className="font-mono">- {formatBDT(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
            <span>Grand Total:</span>
            <span className="font-mono text-amber-400 text-lg">{formatBDT(grandTotal)}</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          disabled={Object.keys(cart).length === 0 || isSubmitting}
          onClick={handleCheckout}
          className="w-full py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm rounded-xl shadow-lg shadow-amber-400/20 transition flex items-center justify-center gap-2"
        >
          <Receipt className="w-4 h-4" />
          Complete Sale & Print Receipt
        </button>
      </div>
    </div>
  );
};
