import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
  Building,
  Smartphone,
  Calendar,
  X,
} from 'lucide-react';
import { PaymentRecord, ExpenseRecord, Employee, PaymentMethod } from '../../types';
import { formatBDT, formatDateTime } from '../../utils/formatters';
import DB from '../../utils/storage';

interface DailyRegisterViewProps {
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
  currentEmployee: Employee;
  onRefresh: () => void;
}

export const DailyRegisterView: React.FC<DailyRegisterViewProps> = ({
  payments,
  expenses,
  currentEmployee,
  onRefresh,
}) => {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseCategory, setExpenseCategory] = useState<any>('utility');
  const [expenseMethod, setExpenseMethod] = useState<PaymentMethod>('Cash');
  const [expensePaidTo, setExpensePaidTo] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Calculations for Today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayPayments = payments.filter((p) => new Date(p.timestamp) >= todayStart);
  const todayExpenses = expenses.filter((e) => new Date(e.timestamp) >= todayStart);

  const cashIn = todayPayments
    .filter((p) => p.method === 'Cash')
    .reduce((acc, p) => acc + p.amount, 0);

  const cashOut = todayExpenses
    .filter((e) => e.paymentMethod === 'Cash')
    .reduce((acc, e) => acc + e.amount, 0);

  const netCashDrawer = cashIn - cashOut;

  const bKashTotal = todayPayments
    .filter((p) => p.method === 'bKash')
    .reduce((acc, p) => acc + p.amount, 0);

  const nagadTotal = todayPayments
    .filter((p) => p.method === 'Nagad')
    .reduce((acc, p) => acc + p.amount, 0);

  const bankTotal = todayPayments
    .filter((p) => p.method === 'Bank')
    .reduce((acc, p) => acc + p.amount, 0);

  const totalRevenueToday = todayPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalExpenseToday = todayExpenses.reduce((acc, e) => acc + e.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || expenseAmount <= 0) return;

    DB.addExpense(
      {
        title: expenseTitle.trim(),
        amount: expenseAmount,
        category: expenseCategory,
        paymentMethod: expenseMethod,
        paidTo: expensePaidTo.trim() || undefined,
        employeeId: currentEmployee.id,
        employeeName: currentEmployee.name,
        notes: expenseNotes.trim() || undefined,
      },
      currentEmployee
    );

    setExpenseTitle('');
    setExpenseAmount(0);
    setExpensePaidTo('');
    setExpenseNotes('');
    setIsAddExpenseOpen(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            Daily Cash Register & Accounts
          </h2>
          <p className="text-xs text-slate-400">
            Real-time shop cash drawer balance, payment gateways, and business expenses
          </p>
        </div>

        <button
          onClick={() => setIsAddExpenseOpen(true)}
          className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20 transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Shop Expense
        </button>
      </div>

      {/* Main Register Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Physical Cash Drawer Card */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Wallet className="w-4 h-4" /> Net Cash in Drawer
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold">
              Today
            </span>
          </div>

          <div className="text-3xl font-black text-white font-mono mt-1">
            {formatBDT(netCashDrawer)}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">Cash In (Sales/Dues):</span>
              <span className="text-emerald-400 font-bold">+{formatBDT(cashIn)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px]">Cash Out (Purchases/Exp):</span>
              <span className="text-rose-400 font-bold">-{formatBDT(cashOut)}</span>
            </div>
          </div>
        </div>

        {/* Digital MFS Collection */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" /> Digital / MFS Today
            </span>
            <span className="text-xs font-mono font-bold text-white">
              {formatBDT(bKashTotal + nagadTotal + bankTotal)}
            </span>
          </div>

          <div className="space-y-2 mt-3 text-xs">
            <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="font-semibold text-pink-400">bKash:</span>
              <span className="font-mono font-bold text-white">{formatBDT(bKashTotal)}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="font-semibold text-orange-400">Nagad:</span>
              <span className="font-mono font-bold text-white">{formatBDT(nagadTotal)}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="font-semibold text-cyan-400">Bank Transfer:</span>
              <span className="font-mono font-bold text-white">{formatBDT(bankTotal)}</span>
            </div>
          </div>
        </div>

        {/* Daily Net Profit Estimate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Total Collections vs Expenses
            </span>
          </div>

          <div className="text-3xl font-black text-cyan-400 font-mono mt-1">
            {formatBDT(totalRevenueToday - totalExpenseToday)}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">Total Received:</span>
              <span className="text-emerald-400 font-bold">{formatBDT(totalRevenueToday)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px]">Total Expenses:</span>
              <span className="text-rose-400 font-bold">{formatBDT(totalExpenseToday)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Payments vs Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payments Inflow Log */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              Incoming Payments Log ({payments.length})
            </h3>
            <span className="text-xs text-slate-500">Real-time ledger</span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {payments.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">No payments recorded yet.</p>
            ) : (
              payments.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{p.customerName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                        {p.method}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {p.notes || p.referenceType} • {formatDateTime(p.timestamp)}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    +{formatBDT(p.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expenses Outflow Log */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
              Shop Expenses Log ({expenses.length})
            </h3>
            <span className="text-xs text-slate-500">Purchases & costs</span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {expenses.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">No expenses recorded yet.</p>
            ) : (
              expenses.map((e) => (
                <div
                  key={e.id}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{e.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 font-semibold">
                        {e.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Paid via {e.paymentMethod} {e.paidTo ? `to ${e.paidTo}` : ''} •{' '}
                      {formatDateTime(e.timestamp)}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    -{formatBDT(e.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-rose-950/20">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-rose-400" />
                Add Shop Expense
              </h2>
              <button
                onClick={() => setIsAddExpenseOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electricity bill, Staff lunch, Controller cable"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Amount (৳) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expenseAmount || ''}
                    onChange={(e) => setExpenseAmount(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="utility">Electricity / Utility</option>
                    <option value="hardware_maintenance">Hardware / Maintenance</option>
                    <option value="refreshment">Refreshment</option>
                    <option value="rent">Shop Rent</option>
                    <option value="salary">Employee Salary</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Paid With
                  </label>
                  <select
                    value={expenseMethod}
                    onChange={(e) => setExpenseMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
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
                    placeholder="e.g. Electrician, Landlord"
                    value={expensePaidTo}
                    onChange={(e) => setExpensePaidTo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="Optional remarks..."
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
