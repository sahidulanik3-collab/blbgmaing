import React, { useState } from 'react';
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  AlertTriangle,
  Check,
  Package,
} from 'lucide-react';
import { Product, ProductCategory, GamingSession, Employee } from '../../types';
import { formatBDT } from '../../utils/formatters';
import DB from '../../utils/storage';

interface AddProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: GamingSession | null;
  products: Product[];
  currentEmployee: Employee;
  onRefresh: () => void;
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

export const AddProductsModal: React.FC<AddProductsModalProps> = ({
  isOpen,
  onClose,
  session,
  products,
  currentEmployee,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>('All');
  
  // Pending selection to add right now: productId -> quantity
  const [pendingCart, setPendingCart] = useState<{ [productId: string]: number }>({});
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!isOpen || !session) return null;

  // Filter available active products
  const activeProducts = products.filter((p) => p.status === 'active');
  const filteredProducts = activeProducts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleIncrement = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const currentPending = pendingCart[productId] || 0;
    if (prod.currentStock <= currentPending) {
      alert(`Cannot add more. Only ${prod.currentStock} in stock!`);
      return;
    }
    setPendingCart((prev) => ({ ...prev, [productId]: currentPending + 1 }));
  };

  const handleDecrement = (productId: string) => {
    const current = pendingCart[productId] || 0;
    if (current <= 1) {
      const copy = { ...pendingCart };
      delete copy[productId];
      setPendingCart(copy);
    } else {
      setPendingCart((prev) => ({ ...prev, [productId]: current - 1 }));
    }
  };

  const handleConfirmAddProducts = () => {
    const itemsToAdd = Object.entries(pendingCart).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    if (itemsToAdd.length === 0) {
      alert('Please select at least one item');
      return;
    }

    const res = DB.addProductsToSession(session.id, itemsToAdd, currentEmployee);
    if (!res.success) {
      alert(res.error || 'Failed to add products');
      return;
    }

    setPendingCart({});
    setFeedbackMessage('Products added & stock deducted successfully!');
    setTimeout(() => setFeedbackMessage(null), 3000);
    onRefresh();
  };

  // Safe item modification in session (reverses stock safely)
  const handleModifySessionItem = (productId: string, newQty: number) => {
    const res = DB.updateSessionProductItem(
      session.id,
      productId,
      newQty,
      currentEmployee,
      'Adjusted from In-Session Add Products modal'
    );
    if (!res.success) {
      alert(res.error);
      return;
    }
    onRefresh();
  };

  // Pending cart totals
  const pendingTotalAmount = Object.entries(pendingCart).reduce((acc, [pId, qty]) => {
    const prod = products.find((p) => p.id === pId);
    return acc + (prod ? prod.sellingPrice * qty : 0);
  }, 0);

  const sessionProductsTotal = session.productItems.reduce((acc, p) => acc + p.lineTotal, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Add Products to Session:
                <span className="text-cyan-400">{session.stationName}</span>
              </h2>
              <p className="text-xs text-slate-400">
                Customer: <span className="font-semibold text-white">{session.customerName}</span>{' '}
                • Added by: {currentEmployee.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 px-6 py-2.5 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            {feedbackMessage}
          </div>
        )}

        {/* Modal Layout Grid: Left Catalog, Right Current Session Items & Pending */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Column: Product Catalog (7 cols) */}
          <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-slate-800 overflow-y-auto flex flex-col">
            {/* Search & Category filter */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search snacks, chips, soft drinks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-cyan-500 text-black'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const inCart = pendingCart[p.id] || 0;
                const outOfStock = p.currentStock <= 0;

                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border flex flex-col justify-between transition ${
                      inCart > 0
                        ? 'bg-cyan-950/20 border-cyan-500/50'
                        : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-white text-xs line-clamp-1">
                          {p.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono shrink-0">
                          {p.category}
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-cyan-400 font-bold font-mono text-sm">
                          {formatBDT(p.sellingPrice)}
                        </span>
                        <span
                          className={`text-[10px] font-mono ${
                            outOfStock
                              ? 'text-rose-400'
                              : p.currentStock <= p.minStockAlert
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          Stock: {p.currentStock}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-700/50">
                      {inCart === 0 ? (
                        <button
                          disabled={outOfStock}
                          onClick={() => handleIncrement(p.id)}
                          className="w-full py-1.5 px-3 bg-slate-700 hover:bg-cyan-500 hover:text-black disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <button
                            onClick={() => handleDecrement(p.id)}
                            className="w-7 h-7 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold text-cyan-400 text-sm">
                            {inCart}
                          </span>
                          <button
                            disabled={p.currentStock <= inCart}
                            onClick={() => handleIncrement(p.id)}
                            className="w-7 h-7 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold rounded-lg flex items-center justify-center transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pending Confirmation Bar */}
            {Object.keys(pendingCart).length > 0 && (
              <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-300">Selected New Items:</span>
                  <p className="text-base font-bold text-cyan-400 font-mono">
                    {formatBDT(pendingTotalAmount)}
                  </p>
                </div>
                <button
                  onClick={handleConfirmAddProducts}
                  className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Confirm & Deduct Stock
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Currently Attached Session Items (5 cols) */}
          <div className="lg:col-span-5 p-6 bg-slate-950/40 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-cyan-400" />
                  Currently Billed Products ({session.productItems.length})
                </h3>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  Total: {formatBDT(sessionProductsTotal)}
                </span>
              </div>

              {session.productItems.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No snacks or drinks added yet to this session bill.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {session.productItems.map((item) => (
                    <div
                      key={item.productId}
                      className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between text-xs"
                    >
                      <div className="truncate mr-2">
                        <span className="font-bold text-white block truncate">
                          {item.productName}
                        </span>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {formatBDT(item.unitPrice)} × {item.quantity} ={' '}
                          <span className="text-cyan-400 font-bold">{formatBDT(item.lineTotal)}</span>
                        </div>
                      </div>

                      {/* Modify quantity controls with safe audit reverse */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          title="Reduce quantity (restores stock)"
                          onClick={() =>
                            handleModifySessionItem(item.productId, item.quantity - 1)
                          }
                          className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold text-white w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          title="Increase quantity"
                          onClick={() =>
                            handleModifySessionItem(item.productId, item.quantity + 1)
                          }
                          className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          title="Cancel/Remove item (restores full stock)"
                          onClick={() => handleModifySessionItem(item.productId, 0)}
                          className="p-1 hover:text-rose-400 text-slate-500 rounded ml-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Summary */}
            <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Gaming Duration:</span>
                <span className="font-mono text-white">{session.durationMinutes} mins</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Current Gaming Charge:</span>
                <span className="font-mono text-white">{formatBDT(session.gamingCharge)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Products Subtotal:</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {formatBDT(sessionProductsTotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800/60">
                <span>Current Est. Bill:</span>
                <span className="font-mono text-cyan-300">
                  {formatBDT(session.gamingCharge + sessionProductsTotal)}
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full mt-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
