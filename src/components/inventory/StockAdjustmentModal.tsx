import React, { useState } from 'react';
import { X, SlidersHorizontal, AlertOctagon, History } from 'lucide-react';
import { Product, InventoryAdjustmentReason, Employee } from '../../types';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  currentEmployee: Employee;
  onAdjust: (
    productId: string,
    newStock: number,
    reason: InventoryAdjustmentReason,
    notes: string
  ) => void;
}

const ADJUSTMENT_REASONS: InventoryAdjustmentReason[] = [
  'Damaged',
  'Expired',
  'Lost',
  'Manual correction',
  'New purchase',
  'Other',
];

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
  currentEmployee,
  onAdjust,
}) => {
  const [newStock, setNewStock] = useState<number>(0);
  const [reason, setReason] = useState<InventoryAdjustmentReason>('Manual correction');
  const [notes, setNotes] = useState<string>('');

  React.useEffect(() => {
    if (product) {
      setNewStock(product.currentStock);
      setNotes('');
      setReason('Manual correction');
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const delta = newStock - product.currentStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee.permissions.canAdjustStock) {
      alert('Access Denied: You do not have permission to adjust inventory stock.');
      return;
    }

    if (delta === 0) {
      alert('No stock change detected.');
      return;
    }

    onAdjust(product.id, newStock, reason, notes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Stock Adjustment</h2>
              <p className="text-xs text-slate-400">Audit trail logged for every change</p>
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
          {/* Target Product Info */}
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-sm">{product.name}</h3>
              <p className="text-xs text-slate-400">{product.category} • {product.unitType}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-400 block">Current Stock</span>
              <span className="font-mono font-bold text-cyan-400 text-lg">
                {product.currentStock} {product.unitType}
              </span>
            </div>
          </div>

          {/* New Stock & Delta */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              New Counted Stock Quantity *
            </label>
            <input
              type="number"
              min="0"
              required
              value={newStock}
              onChange={(e) => setNewStock(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-base text-white focus:outline-none focus:border-amber-500 font-mono font-bold"
            />
            <div className="mt-2 text-xs flex justify-between items-center px-1">
              <span className="text-slate-400">Inventory change:</span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded ${
                  delta > 0
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : delta < 0
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {delta > 0 ? `+${delta}` : delta} {product.unitType}
              </span>
            </div>
          </div>

          {/* Adjustment Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Reason for Adjustment *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as InventoryAdjustmentReason)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              {ADJUSTMENT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Detailed Notes / Explanation
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 2 cans broke during handling in stock room"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
            <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              This action will immediately update stock levels and create a permanent audit log
              under employee: <span className="font-bold">{currentEmployee.name}</span>.
            </p>
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
              disabled={delta === 0}
              className="px-5 py-2 text-sm font-bold text-black bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Confirm Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
