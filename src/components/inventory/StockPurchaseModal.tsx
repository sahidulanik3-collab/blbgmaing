import React, { useState } from 'react';
import { X, ShoppingBag, DollarSign, Calendar, Truck, FileText } from 'lucide-react';
import { Product, PaymentMethod, Employee } from '../../types';
import { formatBDT } from '../../utils/formatters';

interface StockPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentEmployee: Employee;
  onRecordPurchase: (
    purchaseData: {
      productId: string;
      productName: string;
      quantity: number;
      purchaseCostPerUnit: number;
      totalCost: number;
      supplier?: string;
      invoiceNumber?: string;
      notes?: string;
    },
    paymentMethod: PaymentMethod
  ) => void;
}

export const StockPurchaseModal: React.FC<StockPurchaseModalProps> = ({
  isOpen,
  onClose,
  products,
  currentEmployee,
  onRecordPurchase,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(10);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [supplier, setSupplier] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState<string>('');

  React.useEffect(() => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (prod) {
      setUnitCost(prod.purchaseCost);
    }
  }, [selectedProductId, products]);

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const totalCost = quantity * unitCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (quantity <= 0) {
      alert('Quantity must be at least 1');
      return;
    }

    onRecordPurchase(
      {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity,
        purchaseCostPerUnit: unitCost,
        totalCost,
        supplier: supplier.trim() || undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      paymentMethod
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Purchase Stock</h2>
              <p className="text-xs text-slate-400">
                Adds inventory stock & records shop expense automatically
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Select Product */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Select Product *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current Stock: {p.currentStock} {p.unitType}) - {p.category}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Unit Purchase Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Purchase Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              {selectedProduct && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Unit: {selectedProduct.unitType} (New stock will be{' '}
                  <span className="text-emerald-400 font-bold">
                    {selectedProduct.currentStock + quantity}
                  </span>
                  )
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Unit Purchase Cost (৳) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono text-sm">৳</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={unitCost}
                  onChange={(e) => setUnitCost(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Purchase cost per unit</p>
            </div>
          </div>

          {/* Cost Summary Box */}
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Total Purchase Cost:</span>
              <p className="text-2xl font-black text-emerald-400 font-mono">
                {formatBDT(totalCost)}
              </p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <span>Recorded by:</span>
              <p className="font-semibold text-white">{currentEmployee.name}</p>
            </div>
          </div>

          {/* Supplier & Invoice */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Supplier (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Akij Beverage Dealer"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Invoice / Memo # (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. INV-9021"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Payment Method Used for Expense */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Paid With (Accounting Expense)
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Cash">Cash (From Shop Cash Drawer)</option>
              <option value="bKash">bKash Merchant/Personal</option>
              <option value="Nagad">Nagad</option>
              <option value="Bank">Bank Transfer</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notes
            </label>
            <input
              type="text"
              placeholder="e.g. 2 crates delivered to store room"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Confirm Stock Purchase
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
