import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { StationGrid } from './components/sessions/StationGrid';
import { ProductManagement } from './components/inventory/ProductManagement';
import { QuickSaleView } from './components/quicksale/QuickSaleView';
import { DueManagementView } from './components/dues/DueManagementView';
import { DailyRegisterView } from './components/accounting/DailyRegisterView';
import { ReportsView } from './components/reports/ReportsView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { SettingsView } from './components/settings/SettingsView';
import { UnifiedCheckoutModal } from './components/checkout/UnifiedCheckoutModal';
import { ReceiptModal } from './components/checkout/ReceiptModal';
import { GamingSession, CheckoutRecord } from './types';
import { getWallpaperBackgroundStyle } from './utils/theme';
import DB from './utils/storage';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('stations');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Active data states
  const [products, setProducts] = useState(DB.getProducts());
  const [stations, setStations] = useState(DB.getStations());
  const [sessions, setSessions] = useState(DB.getSessions());
  const [queues, setQueues] = useState(DB.getQueues());
  const [dues, setDues] = useState(DB.getDues());
  const [checkouts, setCheckouts] = useState(DB.getCheckouts());
  const [quickSales, setQuickSales] = useState(DB.getQuickSales());
  const [payments, setPayments] = useState(DB.getPayments());
  const [expenses, setExpenses] = useState(DB.getExpenses());
  const [employees, setEmployees] = useState(DB.getEmployees());
  const [settings, setSettings] = useState(DB.getSettings());
  const [currentUser, setCurrentUser] = useState(DB.getCurrentUser());
  const [transactions, setTransactions] = useState(DB.getTransactions());
  const [purchases, setPurchases] = useState(DB.getPurchases());

  // Modals
  const [selectedSessionForCheckout, setSelectedSessionForCheckout] =
    useState<GamingSession | null>(null);
  const [receiptData, setReceiptData] = useState<any | null>(null);

  // Sync state from DB
  const refreshAll = () => {
    setProducts(DB.getProducts());
    setStations(DB.getStations());
    setSessions(DB.getSessions());
    setQueues(DB.getQueues());
    setDues(DB.getDues());
    setCheckouts(DB.getCheckouts());
    setQuickSales(DB.getQuickSales());
    setPayments(DB.getPayments());
    setExpenses(DB.getExpenses());
    setEmployees(DB.getEmployees());
    setSettings(DB.getSettings());
    setCurrentUser(DB.getCurrentUser());
    setTransactions(DB.getTransactions());
    setPurchases(DB.getPurchases());
    setRefreshIndex((prev) => prev + 1);
  };

  useEffect(() => {
    const unsubscribe = DB.subscribe(refreshAll);
    return () => {
      unsubscribe();
    };
  }, []);

  const handleOpenCheckout = (session: GamingSession) => {
    setSelectedSessionForCheckout(session);
  };

  const handleCheckoutComplete = (checkoutRecord: CheckoutRecord) => {
    setReceiptData(checkoutRecord);
    refreshAll();
  };

  const wallpaperStyle = getWallpaperBackgroundStyle(
    settings.wallpaperId,
    settings.customWallpaperUrl,
    settings.wallpaperDim
  );

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col transition-all duration-300"
      style={wallpaperStyle}
    >
      {/* Top Navbar + Collapsible Sidebar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        products={products}
        currentEmployee={currentUser}
        shopName={settings.shopName}
        themeColor={settings.themeColor}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Content Area (shifts smoothly when desktop sidebar is open) */}
      <main
        className={`flex-1 w-full transition-all duration-200 p-4 sm:p-6 ${
          isSidebarOpen ? 'md:pl-72' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {activeTab === 'stations' && (
            <StationGrid
              stations={stations}
              sessions={sessions}
              queues={queues}
              products={products}
              currentEmployee={currentUser}
              onOpenCheckout={handleOpenCheckout}
              onRefresh={refreshAll}
            />
          )}

          {activeTab === 'inventory' && (
            <ProductManagement
              products={products}
              currentEmployee={currentUser}
              onRefresh={refreshAll}
            />
          )}

          {activeTab === 'quicksale' && (
            <QuickSaleView
              products={products}
              currentEmployee={currentUser}
              onRefresh={refreshAll}
              onOpenReceipt={(data) => setReceiptData(data)}
            />
          )}

          {activeTab === 'dues' && (
            <DueManagementView
              dues={dues}
              currentEmployee={currentUser}
              onRefresh={refreshAll}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView
              expenses={expenses}
              currentEmployee={currentUser}
              onRefresh={refreshAll}
            />
          )}

          {activeTab === 'register' && (
            <DailyRegisterView
              payments={payments}
              expenses={expenses}
              currentEmployee={currentUser}
              onRefresh={refreshAll}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              products={products}
              stations={stations}
              sessions={sessions}
              checkouts={checkouts}
              quickSales={quickSales}
              expenses={expenses}
              transactions={transactions}
              purchases={purchases}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              stations={stations}
              employees={employees}
              currentEmployee={currentUser}
              onRefresh={refreshAll}
            />
          )}
        </div>
      </main>

      {/* Unified Session Checkout Modal */}
      <UnifiedCheckoutModal
        isOpen={!!selectedSessionForCheckout}
        onClose={() => setSelectedSessionForCheckout(null)}
        session={selectedSessionForCheckout}
        currentEmployee={currentUser}
        onRefresh={refreshAll}
        onCheckoutComplete={handleCheckoutComplete}
      />

      {/* Receipt Modal (Thermal 80mm & Standard A4) */}
      <ReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        receiptData={receiptData}
        settings={settings}
      />
    </div>
  );
}

export default App;
