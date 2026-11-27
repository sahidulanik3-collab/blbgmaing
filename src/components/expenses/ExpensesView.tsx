import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Zap,
  Wifi,
  Home,
  Wrench,
  Users,
  ShoppingBag,
  Trash2,
  Search,
  Calendar,
  Download,
  X,
} from 'lucide-react';
import { ExpenseRecord, Employee, PaymentMethod } from '../../types';
import { formatBDT, formatDateTime } from '../../utils/formatters';
import DB from '../../utils/storage';

interface ExpensesViewProps {
  expenses: ExpenseRecord[];
  currentEmployee: Employee;
  onRefresh: () => void;
}

const EXPENSE_CATEGORIES: {
  id: ExpenseRecord['category'];
  label: string;
  icon: React.ReactNode;
  badgeColor: string;
}[] = [
  {
    id: 'electricity',
    label: 'Electricity Bill',
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  {
    id: 'utility',
    label: 'Internet / Utility Bill',
    icon: <Wifi className="w-4 h-4 text-cyan-400" />,
    badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  },
  {
    id: 'rent',
    label: 'Shop Rent',
    icon: <Home className="w-4 h-4 text-purple-400" />,
    badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  {
    id: 'inventory_purchase',
    label: 'Snacks / Stock Purchase',
    icon: <ShoppingBag className="w-4 h-4 text-emerald-400" />,
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'hardware_maintenance',
    label: 'Controller / Hardware Repair',
    icon: <Wrench className="w-4 h-4 text-rose-400" />,
    badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
  {
    id: 'salary',
    label: 'Staff Salary',
    icon: <Users className="w-4 h-4 text-blue-400" />,
    badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  },
  {
    id: 'refreshment',
    label: 'Tea / Staff Snacks',
    icon: <ShoppingBag className="w-4 h-4 text-orange-400" />,
    badgeColor: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  },
  {
    id: 'other',
    label: 'Other Expense',
    icon: <Receipt className="w-4 h-4 text-slate-400" />,
    badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
  },
];

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  currentEmployee,
  onRefresh,
}) => {
  const [timeframe, setTimeframe] = useState<'today' | 'month' | 'all'>('month');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseRecord['category']>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Add Modal / Form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<ExpenseRecord['category']>('electricity');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paidTo, setPaidTo] = useState('');
  const [notes, setNotes] = useState('');

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayTotal = expenses
    .filter((e) => new Date(e.timestamp) >= todayStart)
    .reduce((acc, e) => acc + e.amount, 0);

  const monthExpenses = expenses.filter((e) => new Date(e.timestamp) >= monthStart);
  const monthTotal = monthExpenses.reduce((acc, e) => acc + e.amount, 0);

  const monthBillsTotal = monthExpenses
    .filter((e) => e.category === 'electricity' || e.category === 'utility' || e.category === 'rent')
    .reduce((acc, e) => acc + e.amount, 0);

  const monthSnacksPurchaseTotal = monthExpenses
    .filter((e) => e.category === 'inventory_purchase' || e.category === 'refreshment')
    .reduce((acc, e) => acc + e.amount, 0);

  const filteredExpenses = expenses.filter((e) => {
    const dt = new Date(e.timestamp);
    if (timeframe === 'today' && dt < todayStart) return false;
    if (timeframe === 'month' && dt < monthStart) return false;
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (
      searchQuery &&
      !e.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(e.paidTo || '').toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const filteredSum = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  const openPresetModal = (presetCat: ExpenseRecord['category'], defaultTitle: string) => {
    setCategory(presetCat);
    setTitle(defaultTitle);
    setAmount(0);
    setPaidTo('');
    setNotes('');
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) {
      alert('Please enter expense title and valid amount.');
      return;
    }

    DB.addExpense(
      {
        title: title.trim(),
        amount,
        category,
        paymentMethod,
        paidTo: paidTo.trim() || undefined,
        employeeId: currentEmployee.id,
        employeeName: currentEmployee.name,
        notes: notes.trim() || undefined,
      },
      currentEmployee
    );

    setIsAddModalOpen(false);
    onRefresh();
  };

  const handleDelete = (exp: ExpenseRecord) => {
    if (exp.linkedPurchaseId) {
      alert('This entry is linked to a stock purchase. Manage stock purchases from Inventory.');
      return;
    }
    if (confirm(`Delete expense "${exp.title}" (${formatBDT(exp.amount)})?`)) {
      DB.deleteExpense(exp.id);
      onRefresh();
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Title', 'Category', 'Amount (BDT)', 'Method', 'Paid To', 'Employee', 'Notes'];
    const rows = filteredExpenses.map((e) => [
      `"${formatDateTime(e.timestamp)}"`,
      `"${e.title}"`,
      e.category,
      e.amount,
      e.paymentMethod,
      `"${e.paidTo || ''}"`,
      `"${e.employeeName}"`,
      `"${e.notes || ''}"`,
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = encodeURI(csv);
    a.download = `BLB_Expenses_${timeframe}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Header + Quick Bill Buttons */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-rose-400" />
            Daily Khoroch &amp; Monthly Bills
          </h2>
          <p className="text-xs text-slate-400">
            Track Electricity, Wi-Fi/Utility, Rent, Snacks &amp; daily expenses — auto-deducted in Net Profit Report
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openPresetModal('electricity', 'Monthly Electricity Bill')}
            className="px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Zap className="w-3.5 h-3.5" /> + Electricity Bill
          </button>
          <button
            onClick={() => openPresetModal('utility', 'Wi-Fi / Utility Bill')}
            className="px-3 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Wifi className="w-3.5 h-3.5" /> + Utility / Net
          </button>
          <button
            onClick={() => openPresetModal('rent', 'Monthly Shop Rent')}
            className="px-3 py-2 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Home className="w-3.5 h-3.5" /> + Shop Rent
          </button>
          <button
            onClick={() => openPresetModal('other', '')}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Today&apos;s Khoroch</span>
          <div className="text-2xl font-black text-rose-400 font-mono">{formatBDT(todayTotal)}</div>
          <span className="text-[11px] text-slate-500">All expenses recorded today</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-semibold text-slate-400 block mb-1">This Month Total</span>
          <div className="text-2xl font-black text-white font-mono">{formatBDT(monthTotal)}</div>
          <span className="text-[11px] text-slate-500">Current calendar month</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Electricity, Utility &amp; Rent</span>
          <div className="text-2xl font-black text-amber-400 font-mono">{formatBDT(monthBillsTotal)}</div>
          <span className="text-[11px] text-slate-500">Monthly fixed bills</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Snacks &amp; Refreshments</span>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {formatBDT(monthSnacksPurchaseTotal)}
          </div>
          <span className="text-[11px] text-slate-500">Stock &amp; tea/snacks this month</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search expense, paid to..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            {(['today', 'month', 'all'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition ${
                  timeframe === t ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={exportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            CSV
          </button>
        </div>
      </div>

      {/* Expense Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300">
            Showing {filteredExpenses.length} expense entries
          </span>
          <span className="font-mono font-bold text-rose-400">
            Filtered Total: {formatBDT(filteredSum)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/70 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Title &amp; Notes</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Paid With</th>
                <th className="px-4 py-3.5">Date &amp; Staff</th>
                <th className="px-4 py-3.5 text-right">Amount</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500 text-xs">
                    <Receipt className="w-9 h-9 mx-auto mb-2 opacity-30" />
                    No expenses found for this filter. Click &ldquo;+ Electricity Bill&rdquo; or &ldquo;Add Expense&rdquo; to log one.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const catInfo =
                    EXPENSE_CATEGORIES.find((c) => c.id === exp.category) ||
                    EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];

                  return (
                    <tr key={exp.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-white block">{exp.title}</span>
                        {(exp.paidTo || exp.notes) && (
                          <span className="text-xs text-slate-400">
                            {exp.paidTo ? `To: ${exp.paidTo}` : ''}
                            {exp.paidTo && exp.notes ? ' • ' : ''}
                            {exp.notes || ''}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${catInfo.badgeColor}`}
                        >
                          {catInfo.icon}
                          {catInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-300">
                        {exp.paymentMethod}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400">
                        <span className="font-mono block">{formatDateTime(exp.timestamp)}</span>
                        <span className="text-[11px] text-slate-500">By {exp.employeeName}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-400">
                        -{formatBDT(exp.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {!exp.linkedPurchaseId ? (
                          <button
                            title="Delete expense"
                            onClick={() => handleDelete(exp)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Inventory Linked</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-rose-950/20">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-400" />
                Record Shop Expense / Bill
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DESCO Electricity Bill, Wi-Fi Bill, Tea"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Amount (৳ BDT) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount || ''}
                    onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Cash">Cash (Shop Drawer)</option>
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Bank">Bank</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Paid To (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DESCO, Landlord"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Month or invoice details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
