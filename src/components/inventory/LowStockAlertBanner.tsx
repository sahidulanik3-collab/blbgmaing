import React from 'react';
import { AlertTriangle, ChevronRight, PackageCheck } from 'lucide-react';
import { Product } from '../../types';

interface LowStockAlertBannerProps {
  products: Product[];
  onSelectProduct?: (product: Product) => void;
  onOpenPurchase?: (product: Product) => void;
}

export const LowStockAlertBanner: React.FC<LowStockAlertBannerProps> = ({
  products,
  onOpenPurchase,
}) => {
  const lowStockItems = products.filter(
    (p) => p.status === 'active' && p.currentStock <= p.minStockAlert
  );

  if (lowStockItems.length === 0) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
          <span>Low Stock Warning ({lowStockItems.length} Products Need Restocking)</span>
        </div>
        <span className="text-xs text-amber-300/80">
          Products at or below minimum alert threshold
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-2">
        {lowStockItems.map((prod) => (
          <div
            key={prod.id}
            className="flex items-center justify-between bg-slate-900/90 border border-amber-500/20 rounded-xl px-3 py-2 text-xs"
          >
            <div className="truncate mr-2">
              <span className="font-semibold text-white block truncate">{prod.name}</span>
              <span className="text-[11px] text-amber-400 font-mono">
                Only {prod.currentStock} {prod.unitType} left (Min: {prod.minStockAlert})
              </span>
            </div>
            {onOpenPurchase && (
              <button
                onClick={() => onOpenPurchase(prod)}
                className="shrink-0 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 hover:text-white rounded-lg transition font-medium text-[11px]"
              >
                + Restock
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
