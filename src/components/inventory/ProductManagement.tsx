import React, { useState } from 'react';
import {
  Package,
  Plus,
  ShoppingBag,
  SlidersHorizontal,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  TrendingUp,
  DollarSign,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { Product, ProductCategory, Employee } from '../../types';
import { formatBDT } from '../../utils/formatters';
import { ProductModal } from './ProductModal';
import { StockPurchaseModal } from './StockPurchaseModal';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { LowStockAlertBanner } from './LowStockAlertBanner';
import DB from '../../utils/storage';

interface ProductManagementProps {
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
  'Biscuits',
  'Instant Food',
  'Other',
];

export const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  currentEmployee,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'active'>('all');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  // Financial calculations
  const totalInventoryUnits = products.reduce((acc, p) => acc + (p.currentStock || 0), 0);
  const totalInventoryCostValue = products.reduce(
    (acc, p) => acc + (p.currentStock || 0) * (p.purchaseCost || 0),
    0
  );
  const totalPotentialRevenue = products.reduce(
    (acc, p) => acc + (p.currentStock || 0) * (p.sellingPrice || 0),
    0
  );
  const lowStockCount = products.filter(
    (p) => p.status === 'active' && p.currentStock <= p.minStockAlert && p.currentStock > 0
  ).length;
  const outOfStockCount = products.filter((p) => p.status === 'active' && p.currentStock <= 0).length;

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'low') matchesStock = p.currentStock <= p.minStockAlert && p.currentStock > 0;
    if (stockFilter === 'out') matchesStock = p.currentStock <= 0;
    if (stockFilter === 'active') matchesStock = p.status === 'active';

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleSaveProduct = (product: Product) => {
    DB.saveProduct(product);
    onRefresh();
  };

  const handleRecordPurchase = (purchaseData: any, paymentMethod: any) => {
    DB.recordPurchase(purchaseData, currentEmployee, paymentMethod);
    onRefresh();
  };

  const handleAdjustStock = (
    productId: string,
    newStock: number,
    reason: any,
    notes: string
  ) => {
    DB.recordManualAdjustment(productId, newStock, reason, notes, currentEmployee);
    onRefresh();
  };

  const handleToggleStatus = (p: Product) => {
    DB.deleteOrDisableProduct(p.id, p.status === 'active' ? 'disable' : 'enable');
    onRefresh();
  };

  const handleDeleteProduct = (p: Product) => {
    if (!currentEmployee.permissions.canManageProducts) {
      alert('Access Denied: You do not have permission to delete products.');
      return;
    }
    if (confirm(`Remove "${p.name}" permanently from product inventory?`)) {
      DB.deleteOrDisableProduct(p.id, 'delete');
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if low stock exists */}
      <LowStockAlertBanner
        products={products}
        onOpenPurchase={(p) => {
          setIsPurchaseModalOpen(true);
        }}
      />

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Stock Units</span>
            <Package className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalInventoryUnits}</div>
          <span className="text-[11px] text-slate-500">Across {products.length} products</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Inventory Valuation (Cost)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {formatBDT(totalInventoryCostValue)}
          </div>
          <span className="text-[11px] text-slate-500">
            Retail potential: {formatBDT(totalPotentialRevenue)}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{lowStockCount}</div>
          <span className="text-[11px] text-slate-500">Items below alert level</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Out of Stock</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">{outOfStockCount}</div>
          <span className="text-[11px] text-slate-500">Zero inventory remaining</span>
        </div>
      </div>

      {/* Action Header & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, brand, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Stocks</option>
            <option value="low">Low Stock Only</option>
            <option value="out">Out of Stock</option>
            <option value="active">Active Products</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setIsPurchaseModalOpen(true)}
            className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
          >
            <ShoppingBag className="w-4 h-4" />
            Purchase Stock
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/70 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">Product Name</th>
                <th className="px-4 py-4">Category</th>
                <th className="px-4 py-4 text-right">Cost Price</th>
                <th className="px-4 py-4 text-right">Selling Price</th>
                <th className="px-4 py-4 text-center">Stock Level</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No products found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.currentStock <= p.minStockAlert && p.currentStock > 0;
                  const isOut = p.currentStock <= 0;
                  const profit = p.sellingPrice - p.purchaseCost;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      {/* Name & SKU */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400 text-sm shrink-0">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-white block group-hover:text-cyan-400 transition">
                              {p.name}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              {p.brand && <span>{p.brand}</span>}
                              {p.sku && <span className="font-mono text-slate-500">#{p.sku}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300">
                          {p.category}
                        </span>
                      </td>

                      {/* Purchase Cost */}
                      <td className="px-4 py-3.5 text-right font-mono text-slate-400 text-xs">
                        {formatBDT(p.purchaseCost)}
                      </td>

                      {/* Selling Price */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-white">
                        <div className="text-cyan-400 font-bold">{formatBDT(p.sellingPrice)}</div>
                        <span className="text-[10px] text-slate-500">
                          +৳{profit} profit
                        </span>
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center gap-2">
                          <span
                            className={`font-mono font-bold text-sm px-2.5 py-1 rounded-lg ${
                              isOut
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : isLow
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-200 border border-slate-700'
                            }`}
                          >
                            {p.currentStock} {p.unitType}
                          </span>
                          {isLow && (
                            <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> Low
                            </span>
                          )}
                          {isOut && (
                            <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-0.5">
                              <XCircle className="w-3 h-3" /> Out
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold transition ${
                            p.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {p.status === 'active' ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Adjust Stock"
                            onClick={() => {
                              setAdjustingProduct(p);
                              setIsAdjustmentModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 text-slate-400 rounded-lg transition"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>
                          <button
                            title="Edit Product"
                            onClick={() => {
                              setEditingProduct(p);
                              setIsProductModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-400 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            title="Remove Product"
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        initialProduct={editingProduct}
      />

      <StockPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        products={products}
        currentEmployee={currentEmployee}
        onRecordPurchase={handleRecordPurchase}
      />

      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        product={adjustingProduct}
        currentEmployee={currentEmployee}
        onAdjust={handleAdjustStock}
      />
    </div>
  );
};
