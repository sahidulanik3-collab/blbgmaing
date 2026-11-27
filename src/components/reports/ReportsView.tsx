import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  DollarSign,
  Package,
  ShoppingBag,
  Flame,
  AlertTriangle,
  Gamepad2,
  Clock,
  Receipt,
  PieChart,
} from 'lucide-react';
import {
  Product,
  CheckoutRecord,
  QuickSaleRecord,
  InventoryTransaction,
  ProductPurchase,
  GamingStation,
  GamingSession,
  ExpenseRecord,
} from '../../types';
import { formatBDT, formatDateTime, formatDuration } from '../../utils/formatters';

interface ReportsViewProps {
  products: Product[];
  stations: GamingStation[];
  sessions: GamingSession[];
  checkouts: CheckoutRecord[];
  quickSales: QuickSaleRecord[];
  expenses: ExpenseRecord[];
  transactions: InventoryTransaction[];
  purchases: ProductPurchase[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  products,
  stations,
  sessions,
  checkouts,
  quickSales,
  expenses,
  transactions,
  purchases,
}) => {
  const [reportTab, setReportTab] = useState<'combined' | 'gaming' | 'snacks'>('combined');
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('today');

  // Filter date range
  const now = new Date();
  let startDate = new Date(0);
  if (timeframe === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (timeframe === 'week') {
    startDate = new Date(now.getTime() - 7 * 86400000);
  } else if (timeframe === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // --- 1. Gaming Station Aggregation (Completed Checkouts + Live Active Sessions) ---
  const filteredCheckouts = checkouts.filter((chk) => new Date(chk.timestamp) >= startDate);
  const stationStatsMap: {
    [stationId: string]: {
      stationId: string;
      stationName: string;
      type: string;
      completedSessions: number;
      totalMinutes: number;
      gamingRevenue: number;
      snacksRevenue: number;
      discountsGiven: number;
    };
  } = {};

  // Seed all configured stations so even 0-session stations appear cleanly
  stations.forEach((st) => {
    stationStatsMap[st.id] = {
      stationId: st.id,
      stationName: st.name,
      type: st.type,
      completedSessions: 0,
      totalMinutes: 0,
      gamingRevenue: 0,
      snacksRevenue: 0,
      discountsGiven: 0,
    };
  });

  let totalGamingRevenue = 0;
  let totalGamingMinutes = 0;
  let totalCheckoutsCount = 0;
  let totalDiscountsGiven = 0;
  let totalAdditionalFees = 0;

  filteredCheckouts.forEach((chk) => {
    totalCheckoutsCount++;
    totalGamingRevenue += chk.gamingCharge || 0;
    totalGamingMinutes += chk.durationMinutes || 0;
    totalDiscountsGiven += chk.discountSubtotal || 0;
    totalAdditionalFees += chk.additionalChargesSubtotal || 0;

    const key = chk.stationId || chk.stationName || 'unknown';
    if (!stationStatsMap[key]) {
      stationStatsMap[key] = {
        stationId: key,
        stationName: chk.stationName || 'Unknown Station',
        type: 'Other',
        completedSessions: 0,
        totalMinutes: 0,
        gamingRevenue: 0,
        snacksRevenue: 0,
        discountsGiven: 0,
      };
    }
    stationStatsMap[key].completedSessions += 1;
    stationStatsMap[key].totalMinutes += chk.durationMinutes || 0;
    stationStatsMap[key].gamingRevenue += chk.gamingCharge || 0;
    stationStatsMap[key].snacksRevenue += chk.productSubtotal || 0;
    stationStatsMap[key].discountsGiven += chk.discountSubtotal || 0;
  });

  const stationStatsList = Object.values(stationStatsMap).sort(
    (a, b) => b.gamingRevenue - a.gamingRevenue
  );

  // Also calculate live un-checked-out active sessions value for awareness
  const activeSessions = sessions.filter((s) => s.status === 'active');
  const activeEstimatedRevenue = activeSessions.reduce((acc, s) => acc + (s.gamingCharge || 0), 0);

  // --- 2. Snacks & Drinks Aggregation ---
  const allSoldItems: {
    productId: string;
    productName: string;
    category: string;
    quantity: number;
    sellingPrice: number;
    unitCost: number;
    lineTotal: number;
    timestamp: string;
  }[] = [];

  filteredCheckouts.forEach((chk) => {
    chk.products.forEach((p) => {
      allSoldItems.push({ ...p, sellingPrice: p.unitPrice, timestamp: chk.timestamp });
    });
  });

  quickSales.forEach((qs) => {
    if (new Date(qs.timestamp) >= startDate) {
      totalDiscountsGiven += qs.discount || 0;
      qs.products.forEach((p) => {
        allSoldItems.push({ ...p, sellingPrice: p.unitPrice, timestamp: qs.timestamp });
      });
    }
  });

  let totalProductRevenue = 0;
  let totalCOGS = 0;
  let totalUnitsSold = 0;

  const productAggMap: {
    [productId: string]: {
      name: string;
      category: string;
      unitsSold: number;
      revenue: number;
      cost: number;
      grossProfit: number;
    };
  } = {};

  allSoldItems.forEach((item) => {
    totalUnitsSold += item.quantity;
    totalProductRevenue += item.lineTotal;
    const cost = item.quantity * (item.unitCost || 0);
    totalCOGS += cost;

    if (!productAggMap[item.productId]) {
      productAggMap[item.productId] = {
        name: item.productName,
        category: item.category,
        unitsSold: 0,
        revenue: 0,
        cost: 0,
        grossProfit: 0,
      };
    }

    productAggMap[item.productId].unitsSold += item.quantity;
    productAggMap[item.productId].revenue += item.lineTotal;
    productAggMap[item.productId].cost += cost;
    productAggMap[item.productId].grossProfit += item.lineTotal - cost;
  });

  const snacksGrossProfit = totalProductRevenue - totalCOGS;
  const grossProfitMargin =
    totalProductRevenue > 0 ? Math.round((snacksGrossProfit / totalProductRevenue) * 100) : 0;

  const topSellingProducts = Object.values(productAggMap).sort((a, b) => b.unitsSold - a.unitsSold);

  // --- 3. Expenses & Combined Net Profit ---
  const filteredExpenses = expenses.filter((e) => new Date(e.timestamp) >= startDate);
  // Operating expenses exclude `inventory_purchase` so COGS isn't double-counted against snacks profit
  const operatingExpenses = filteredExpenses.filter((e) => e.category !== 'inventory_purchase');
  const totalOperatingExpenses = operatingExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalInventoryPurchasesCost = filteredExpenses
    .filter((e) => e.category === 'inventory_purchase')
    .reduce((acc, e) => acc + e.amount, 0);

  const combinedTotalRevenue =
    totalGamingRevenue + totalProductRevenue + totalAdditionalFees - totalDiscountsGiven;
  const combinedGrossProfit =
    totalGamingRevenue + totalAdditionalFees + snacksGrossProfit - totalDiscountsGiven;
  const combinedNetProfit = combinedGrossProfit - totalOperatingExpenses;

  // Expense category breakdown
  const expenseByCategory: Record<string, number> = {};
  operatingExpenses.forEach((e) => {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
  });

  const damagedTransactions = transactions.filter(
    (t) =>
      (t.type === 'damaged' || t.type === 'expired' || t.type === 'lost') &&
      new Date(t.timestamp) >= startDate
  );

  // CSV Exporters
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `BLB_Report_${reportTab}_${timeframe}.csv`;

    if (reportTab === 'snacks') {
      headers = ['Product Name', 'Category', 'Units Sold', 'Revenue (BDT)', 'COGS (BDT)', 'Gross Profit (BDT)', 'Margin %'];
      rows = topSellingProducts.map((p) => [
        `"${p.name}"`,
        p.category,
        p.unitsSold,
        p.revenue,
        p.cost,
        p.grossProfit,
        `${p.revenue > 0 ? Math.round((p.grossProfit / p.revenue) * 100) : 0}%`,
      ]);
    } else if (reportTab === 'gaming') {
      headers = ['Station Name', 'Type', 'Completed Sessions', 'Hours Played (Mins)', 'Gaming Revenue (BDT)', 'Snacks Revenue (BDT)', 'Total (BDT)'];
      rows = stationStatsList.map((s) => [
        `"${s.stationName}"`,
        s.type,
        s.completedSessions,
        s.totalMinutes,
        s.gamingRevenue,
        s.snacksRevenue,
        s.gamingRevenue + s.snacksRevenue,
      ]);
    } else {
      headers = ['Metric', 'Amount (BDT)'];
      rows = [
        ['Gaming Station Revenue', totalGamingRevenue],
        ['Snacks & Drinks Revenue', totalProductRevenue],
        ['Additional Fees', totalAdditionalFees],
        ['Discounts Given', -totalDiscountsGiven],
        ['Snacks COGS', -totalCOGS],
        ['Combined Gross Profit', combinedGrossProfit],
        ['Operating Shop Expenses (Bills/Rent/Salary)', -totalOperatingExpenses],
        ['Net Shop Profit', combinedNetProfit],
      ];
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header, Report Switcher & Timeframe */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Business &amp; Profit Reports
            </h2>
            <p className="text-xs text-slate-400">
              Combined Net Profit, Station Gaming Hours &amp; Revenue, and Snacks COGS Breakdown
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
              {(['today', 'week', 'month', 'all'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition ${
                    timeframe === t
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Report Type Sub-Tabs */}
        <div className="flex gap-2 border-t border-slate-800 pt-3 overflow-x-auto">
          <button
            onClick={() => setReportTab('combined')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition ${
              reportTab === 'combined'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/70 text-slate-400 hover:text-white'
            }`}
          >
            <PieChart className="w-4 h-4" />
            Combined Profit (Gaming + Snacks - Bills)
          </button>

          <button
            onClick={() => setReportTab('gaming')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition ${
              reportTab === 'gaming'
                ? 'bg-cyan-400 text-black shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/70 text-slate-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            Gaming Stations Report
          </button>

          <button
            onClick={() => setReportTab('snacks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition ${
              reportTab === 'snacks'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'bg-slate-800/70 text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Snacks &amp; Drinks Profit
          </button>
        </div>
      </div>

      {/* ================= TAB 1: COMBINED OVERALL PROFIT REPORT ================= */}
      {reportTab === 'combined' && (
        <div className="space-y-6">
          {/* Top Combined KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Gaming Station Revenue</span>
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-cyan-400 font-mono">
                {formatBDT(totalGamingRevenue)}
              </div>
              <span className="text-[11px] text-slate-500">
                {totalCheckoutsCount} sessions • {formatDuration(totalGamingMinutes)} played
              </span>
            </div>

            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Snacks Gross Profit</span>
                <ShoppingBag className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-300 font-mono">
                {formatBDT(snacksGrossProfit)}
              </div>
              <span className="text-[11px] text-slate-500">
                Sales {formatBDT(totalProductRevenue)} − COGS {formatBDT(totalCOGS)}
              </span>
            </div>

            <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Operating Bills &amp; Khoroch</span>
                <Receipt className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400 font-mono">
                -{formatBDT(totalOperatingExpenses)}
              </div>
              <span className="text-[11px] text-slate-500">
                Electricity, Rent, Utility, Salary, Repairs
              </span>
            </div>

            <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-4 shadow-lg shadow-emerald-500/5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold text-emerald-300 uppercase">Net Shop Profit</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div
                className={`text-2xl font-black font-mono ${
                  combinedNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatBDT(combinedNetProfit)}
              </div>
              <span className="text-[11px] text-slate-400">
                After snacks COGS &amp; all shop expenses
              </span>
            </div>
          </div>

          {/* Profit & Loss Statement Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3">
                Profit &amp; Loss Summary ({timeframe.toUpperCase()})
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-300">1. Gaming Stations Revenue (Completed Checkouts)</span>
                  <span className="font-mono font-bold text-cyan-400">
                    +{formatBDT(totalGamingRevenue)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-300">2. Snacks &amp; Drinks Sales Revenue</span>
                  <span className="font-mono font-bold text-purple-300">
                    +{formatBDT(totalProductRevenue)}
                  </span>
                </div>
                {totalAdditionalFees > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-300">3. Additional Controller / Extra Fees</span>
                    <span className="font-mono font-bold text-amber-300">
                      +{formatBDT(totalAdditionalFees)}
                    </span>
                  </div>
                )}
                {totalDiscountsGiven > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Less: Discounts Given</span>
                    <span className="font-mono text-rose-300">-{formatBDT(totalDiscountsGiven)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t border-slate-800 font-bold text-white">
                  <span>Total Net Sales Revenue</span>
                  <span className="font-mono">{formatBDT(combinedTotalRevenue)}</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Less: Snacks Cost of Goods Sold (COGS)</span>
                  <span className="font-mono text-slate-300">-{formatBDT(totalCOGS)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-slate-800 font-bold text-emerald-300">
                  <span>Combined Gross Profit (Gaming + Snacks Margin)</span>
                  <span className="font-mono">{formatBDT(combinedGrossProfit)}</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-400">
                    Less: Operating Expenses (Electricity, Utility, Rent, Salary, Repairs)
                  </span>
                  <span className="font-mono text-rose-400">
                    -{formatBDT(totalOperatingExpenses)}
                  </span>
                </div>

                <div className="flex justify-between pt-3 border-t border-slate-700 text-base font-black">
                  <span className="text-white">NET SHOP PROFIT</span>
                  <span
                    className={`font-mono ${
                      combinedNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatBDT(combinedNetProfit)}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex justify-between">
                <span>
                  Note: New inventory stock purchases ({formatBDT(totalInventoryPurchasesCost)}) are
                  tracked separately so they aren&apos;t double-counted with COGS.
                </span>
                {activeEstimatedRevenue > 0 && (
                  <span className="text-cyan-400 font-semibold shrink-0 ml-2">
                    Live running: ~{formatBDT(activeEstimatedRevenue)}
                  </span>
                )}
              </div>
            </div>

            {/* Expense Breakdown by Category */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3">
                Shop Bills &amp; Expenses Breakdown
              </h3>

              {Object.keys(expenseByCategory).length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500">
                  No operating bills/expenses logged in this period.
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(expenseByCategory).map(([cat, amt]) => {
                    const pct =
                      totalOperatingExpenses > 0
                        ? Math.round((amt / totalOperatingExpenses) * 100)
                        : 0;
                    return (
                      <div key={cat} className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="capitalize font-semibold text-slate-300">
                            {cat.replace('_', ' ')}
                          </span>
                          <span className="font-mono font-bold text-rose-400">
                            {formatBDT(amt)} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: GAMING STATIONS REPORT ================= */}
      {reportTab === 'gaming' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-400 block mb-1">
                Total Gaming Revenue
              </span>
              <div className="text-2xl font-black text-cyan-400 font-mono">
                {formatBDT(totalGamingRevenue)}
              </div>
              <span className="text-[11px] text-slate-500">Completed checkouts</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-400 block mb-1">
                Total Hours Played
              </span>
              <div className="text-2xl font-black text-white font-mono">
                {formatDuration(totalGamingMinutes)}
              </div>
              <span className="text-[11px] text-slate-500">{totalGamingMinutes} total minutes</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-400 block mb-1">
                Completed Sessions
              </span>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {totalCheckoutsCount}
              </div>
              <span className="text-[11px] text-slate-500">
                {activeSessions.length} currently running
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-400 block mb-1">
                Top Earning Station
              </span>
              <div className="text-base font-bold text-white truncate">
                {stationStatsList[0]?.completedSessions > 0
                  ? stationStatsList[0].stationName
                  : 'No data yet'}
              </div>
              <span className="text-[11px] text-cyan-400 font-mono">
                {formatBDT(stationStatsList[0]?.gamingRevenue || 0)}
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">
                Station-by-Station Usage &amp; Revenue Breakdown
              </h3>
              <span className="text-xs text-slate-500">{stationStatsList.length} stations</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/70 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Station Name</th>
                    <th className="px-4 py-3.5">Platform</th>
                    <th className="px-4 py-3.5 text-center">Sessions</th>
                    <th className="px-4 py-3.5 text-center">Total Time Played</th>
                    <th className="px-4 py-3.5 text-right">Gaming Revenue</th>
                    <th className="px-4 py-3.5 text-right">Snacks on Seat</th>
                    <th className="px-5 py-3.5 text-right">Total Station Bill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {stationStatsList.map((st) => (
                    <tr key={st.stationId} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-3.5 font-bold text-white">{st.stationName}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-400">{st.type}</td>
                      <td className="px-4 py-3.5 text-center font-mono text-white">
                        {st.completedSessions}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono text-cyan-300">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 opacity-70" />
                          {formatDuration(st.totalMinutes)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-cyan-400">
                        {formatBDT(st.gamingRevenue)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-purple-300">
                        {formatBDT(st.snacksRevenue)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-400">
                        {formatBDT(st.gamingRevenue + st.snacksRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: SNACKS & DRINKS PROFIT REPORT ================= */}
      {reportTab === 'snacks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Product Sales Revenue</span>
                <DollarSign className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-cyan-400 font-mono">
                {formatBDT(totalProductRevenue)}
              </div>
              <span className="text-[11px] text-slate-500">{totalUnitsSold} total units sold</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Cost of Goods Sold (COGS)</span>
                <ShoppingBag className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-black text-slate-300 font-mono">
                {formatBDT(totalCOGS)}
              </div>
              <span className="text-[11px] text-slate-500">Inventory purchase cost basis</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Gross Profit</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {formatBDT(snacksGrossProfit)}
              </div>
              <span className="text-[11px] text-emerald-500 font-semibold font-mono">
                {grossProfitMargin}% profit margin
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Best-Selling Product</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-base font-bold text-white truncate">
                {topSellingProducts[0]?.name || 'N/A'}
              </div>
              <span className="text-[11px] text-amber-400 font-mono">
                {topSellingProducts[0]?.unitsSold || 0} units sold
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">
                Product Sales &amp; Profit Margin Breakdown
              </h3>
              <span className="text-xs text-slate-500">
                {topSellingProducts.length} items recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/70 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Product Name</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5 text-center">Units Sold</th>
                    <th className="px-4 py-3.5 text-right">Revenue</th>
                    <th className="px-4 py-3.5 text-right">Cost (COGS)</th>
                    <th className="px-4 py-3.5 text-right">Gross Profit</th>
                    <th className="px-5 py-3.5 text-center">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {topSellingProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-500 text-xs">
                        No sales recorded for selected timeframe.
                      </td>
                    </tr>
                  ) : (
                    topSellingProducts.map((p, idx) => {
                      const margin =
                        p.revenue > 0 ? Math.round((p.grossProfit / p.revenue) * 100) : 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-800/40 transition">
                          <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2">
                            {idx === 0 && <Flame className="w-4 h-4 text-amber-400 shrink-0" />}
                            {p.name}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-400">{p.category}</td>
                          <td className="px-4 py-3.5 text-center font-mono font-bold text-cyan-400">
                            {p.unitsSold}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-white text-xs">
                            {formatBDT(p.revenue)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-slate-400 text-xs">
                            {formatBDT(p.cost)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400 text-xs">
                            {formatBDT(p.grossProfit)}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              {margin}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Purchase History & Damaged Stock */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                Recent Stock Purchases ({purchases.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {purchases.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-500">
                    No stock purchases recorded yet.
                  </p>
                ) : (
                  purchases.map((pur) => (
                    <div
                      key={pur.id}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-bold text-white block">{pur.productName}</span>
                        <span className="text-[11px] text-slate-400">
                          +{pur.quantity} units @ {formatBDT(pur.purchaseCostPerUnit)} each •{' '}
                          {formatDateTime(pur.timestamp)}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400">
                        {formatBDT(pur.totalCost)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Damaged, Expired or Lost Stock Log
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {damagedTransactions.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-500">
                    No damaged stock reported.
                  </p>
                ) : (
                  damagedTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-bold text-white block">{tx.productName}</span>
                        <span className="text-[11px] text-rose-400">
                          Reason: {tx.reason} ({tx.quantityDelta} units) • {tx.notes || 'No remarks'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {formatDateTime(tx.timestamp)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
