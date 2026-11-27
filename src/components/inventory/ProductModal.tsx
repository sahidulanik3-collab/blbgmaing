import React, { useState, useEffect } from 'react';
import { X, Package, DollarSign, AlertTriangle, Layers, Tag } from 'lucide-react';
import { Product, ProductCategory, UnitType } from '../../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  initialProduct?: Product | null;
}

const CATEGORIES: ProductCategory[] = [
  'Snacks',
  'Chips',
  'Soft Drinks',
  'Water',
  'Energy Drinks',
  'Biscuits',
  'Chocolate',
  'Instant Food',
  'Other',
];

const UNIT_TYPES: UnitType[] = ['Piece', 'Bottle', 'Can', 'Packet', 'Box', 'Other'];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProduct,
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: 'Soft Drinks',
    brand: '',
    sku: '',
    purchaseCost: 0,
    sellingPrice: 0,
    currentStock: 0,
    minStockAlert: 10,
    unitType: 'Bottle',
    image: '',
    status: 'active',
    notes: '',
  });

  useEffect(() => {
    if (initialProduct) {
      setFormData(initialProduct);
    } else {
      setFormData({
        id: `prod-${Date.now()}`,
        name: '',
        category: 'Soft Drinks',
        brand: '',
        sku: '',
        purchaseCost: 0,
        sellingPrice: 0,
        currentStock: 0,
        minStockAlert: 10,
        unitType: 'Bottle',
        image: '',
        status: 'active',
        notes: '',
      });
    }
  }, [initialProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Please enter a product name');
      return;
    }

    const finalProduct: Product = {
      id: formData.id || `prod-${Date.now()}`,
      name: formData.name.trim(),
      category: formData.category || 'Other',
      brand: formData.brand?.trim() || undefined,
      sku: formData.sku?.trim() || undefined,
      purchaseCost: Number(formData.purchaseCost) || 0,
      sellingPrice: Number(formData.sellingPrice) || 0,
      currentStock: Number(formData.currentStock) || 0,
      minStockAlert: Number(formData.minStockAlert) || 5,
      unitType: formData.unitType || 'Piece',
      image: formData.image?.trim() || undefined,
      status: formData.status || 'active',
      notes: formData.notes?.trim() || undefined,
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(finalProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {initialProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-xs text-slate-400">
                Manage inventory snack, drink or gaming merchandise
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Name & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Coca-Cola 250ml"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Brand (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Coca-Cola, Akij, Nestle"
                value={formData.brand || ''}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as ProductCategory })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Unit Type *
              </label>
              <select
                value={formData.unitType}
                onChange={(e) =>
                  setFormData({ ...formData, unitType: e.target.value as UnitType })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {UNIT_TYPES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing: Purchase Cost & Selling Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Purchase Cost (৳ BDT)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono text-sm">৳</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder="30"
                  value={formData.purchaseCost ?? 0}
                  onChange={(e) =>
                    setFormData({ ...formData, purchaseCost: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Used for COGS and profit reports</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Selling Price (৳ BDT) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-cyan-400 font-mono text-sm">৳</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder="40"
                  value={formData.sellingPrice ?? 0}
                  onChange={(e) =>
                    setFormData({ ...formData, sellingPrice: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono font-bold text-cyan-300"
                />
              </div>
              <p className="text-[11px] text-cyan-400/80 mt-1">
                Estimated profit: ৳{Math.max(0, (formData.sellingPrice || 0) - (formData.purchaseCost || 0))} per unit
              </p>
            </div>
          </div>

          {/* Stock Quantities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Current Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                placeholder="20"
                value={formData.currentStock ?? 0}
                onChange={(e) =>
                  setFormData({ ...formData, currentStock: Math.max(0, parseInt(e.target.value) || 0) })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Minimum Stock Alert Level
              </label>
              <input
                type="number"
                min="1"
                placeholder="10"
                value={formData.minStockAlert ?? 10}
                onChange={(e) =>
                  setFormData({ ...formData, minStockAlert: Math.max(1, parseInt(e.target.value) || 1) })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
              <p className="text-[11px] text-amber-400 mt-1">Triggers low stock badge</p>
            </div>
          </div>

          {/* SKU & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                SKU / Barcode (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. CC-250ML"
                value={formData.sku || ''}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Product Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as 'active' | 'disabled' })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="active">Active (Available for sales)</option>
                <option value="disabled">Disabled (Hidden from POS)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Internal Notes / Shelf Location
            </label>
            <input
              type="text"
              placeholder="e.g. Stored in main fridge top rack"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-black bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              {initialProduct ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
