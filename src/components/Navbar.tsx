import React from 'react';
import {
  Gamepad2,
  Package,
  Zap,
  FileText,
  Wallet,
  BarChart3,
  Settings,
  AlertTriangle,
  Receipt,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Employee, Product, ThemeColor } from '../types';
import { getThemePalette } from '../utils/theme';

export type NavTab =
  | 'stations'
  | 'inventory'
  | 'quicksale'
  | 'dues'
  | 'expenses'
  | 'register'
  | 'reports'
  | 'settings';

interface SidebarNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  products: Product[];
  currentEmployee: Employee;
  shopName: string;
  themeColor?: ThemeColor;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

interface NavGroup {
  title: string;
  items: {
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[];
}

export const Navbar: React.FC<SidebarNavProps> = ({
  activeTab,
  onSelectTab,
  products,
  currentEmployee,
  shopName,
  themeColor = 'cyan',
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const palette = getThemePalette(themeColor);
  const lowStockCount = products.filter(
    (p) => p.status === 'active' && p.currentStock <= p.minStockAlert
  ).length;

  const groups: NavGroup[] = [
    {
      title: 'Floor & POS',
      items: [
        { id: 'stations', label: 'Sessions & Stations', icon: <Gamepad2 className="w-4 h-4" /> },
        { id: 'quicksale', label: 'Walk-in Quick Sale', icon: <Zap className="w-4 h-4" /> },
      ],
    },
    {
      title: 'Stock & Dues',
      items: [
        {
          id: 'inventory',
          label: 'Snacks & Inventory',
          icon: <Package className="w-4 h-4" />,
          badge: lowStockCount > 0 ? lowStockCount : undefined,
        },
        { id: 'dues', label: 'Customer Dues', icon: <FileText className="w-4 h-4" /> },
      ],
    },
    {
      title: 'Finance & Reports',
      items: [
        { id: 'expenses', label: 'Expenses & Bills', icon: <Receipt className="w-4 h-4" /> },
        { id: 'register', label: 'Cash Register', icon: <Wallet className="w-4 h-4" /> },
        { id: 'reports', label: 'Profit Reports', icon: <BarChart3 className="w-4 h-4" /> },
      ],
    },
    {
      title: 'System',
      items: [{ id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }],
    },
  ];

  const activeItemLabel =
    groups.flatMap((g) => g.items).find((i) => i.id === activeTab)?.label || 'Dashboard';

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 h-16 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Sidebar Open / Close Button */}
          <button
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'Collapse Sidebar' : 'Open Sidebar Menu'}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-5 h-5 hidden md:block" />
            ) : (
              <PanelLeftOpen className="w-5 h-5 hidden md:block" />
            )}
            <Menu className="w-5 h-5 md:hidden" />
          </button>

          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl p-0.5 flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${palette.hex}, #8b5cf6)`,
              }}
            >
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Gamepad2 className={`w-4 h-4 ${palette.textAccent}`} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-sm sm:text-base tracking-wider uppercase">
                  {shopName}
                </span>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 font-semibold">
                  {activeItemLabel}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight hidden sm:block">
                Gaming Lounge, Inventory &amp; Unified POS
              </p>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {lowStockCount > 0 && (
            <button
              onClick={() => onSelectTab('inventory')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-bold transition animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{lowStockCount} Low Stock</span>
            </button>
          )}

          <button
            onClick={() => onSelectTab('expenses')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white text-xs font-semibold transition"
          >
            <Receipt className="w-3.5 h-3.5 text-rose-400" />
            <span>+ Khoroch</span>
          </button>

          {/* Active Employee Chip */}
          <button
            onClick={() => onSelectTab('settings')}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition text-xs"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] border ${palette.badgeBg}`}
            >
              {currentEmployee.name.charAt(0)}
            </div>
            <div className="text-left hidden md:block">
              <span className="font-semibold text-white block leading-tight">
                {currentEmployee.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono leading-none">
                {currentEmployee.role}
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={onToggleSidebar}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Collapsible Left Sidebar */}
      <aside
        className={`fixed top-0 md:top-16 left-0 z-50 md:z-30 h-full md:h-[calc(100vh-4rem)] w-64 bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ease-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Drawer Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800 md:hidden">
          <span className="font-black text-white text-sm tracking-wider uppercase">{shopName}</span>
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {groups.map((group) => (
            <div key={group.title}>
              <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                {group.title}
              </span>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        if (window.innerWidth < 768) {
                          onToggleSidebar();
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                        isActive
                          ? `${palette.activeBg} shadow-lg ${palette.glowShadow}`
                          : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        {item.icon}
                        <span>{item.label}</span>
                      </span>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                            isActive ? 'bg-black/80 text-amber-300' : 'bg-amber-500 text-black'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Staff & Theme Info */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={() => {
              onSelectTab('settings');
              if (window.innerWidth < 768) onToggleSidebar();
            }}
            className="w-full p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition"
          >
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">
                {currentEmployee.name}
              </span>
              <span className="text-[10px] text-slate-400">
                {currentEmployee.role} • Theme &amp; Stations
              </span>
            </div>
            <Settings className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
};
