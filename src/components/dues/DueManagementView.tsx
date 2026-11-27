import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Phone,
  User,
  History,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import { DueRecord, Employee, DueStatus } from '../../types';
import { formatBDT, formatDateTime } from '../../utils/formatters';
import { RepayDueModal } from './RepayDueModal';
import DB from '../../utils/storage';

interface DueManagementViewProps {
  dues: DueRecord[];
  currentEmployee: Employee;
  onRefresh: () => void;
}

export const DueManagementView: React.FC<DueManagementViewProps> = ({
  dues,
  currentEmployee,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | DueStatus>('All');
  const [selectedDueForRepay, setSelectedDueForRepay] = useState<DueRecord | null>(null);

  // Stats
  const totalOutstandingDue = dues
    .filter((d) => d.status !== 'PAID' && d.status !== 'CANCELLED')
    .reduce((acc, d) => acc + d.remainingBalance, 0);

  const totalCollectedAmount = dues.reduce((acc, d) => acc + d.paidAmount, 0);
  const unpaidCount = dues.filter((d) => d.status === 'UNPAID').length;
  const partialCount = dues.filter((d) => d.status === 'PARTIALLY_PAID').length;
  const paidCount = dues.filter((d) => d.status === 'PAID').length;

  const filteredDues = dues.filter((d) => {
    const matchesSearch =
      d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.phone && d.phone.includes(searchQuery)) ||
      (d.stationName && d.stationName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRepay = (
    dueId: string,
    amount: number,
    method: any,
    transactionId: any,
    notes?: string
  ) => {
    const res = DB.repayDue(dueId, amount, method, transactionId, currentEmployee, notes);
    if (!res.success) {
      alert(res.error);
      return;
    }
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Outstanding Due</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {formatBDT(totalOutstandingDue)}
          </div>
          <span className="text-[11px] text-slate-500">Uncollected customer balance</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Recovered / Paid</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {formatBDT(totalCollectedAmount)}
          </div>
          <span className="text-[11px] text-slate-500">Received from dues</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Unpaid Invoices</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{unpaidCount}</div>
          <span className="text-[11px] text-slate-500">Zero payment made yet</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Partially Paid</span>
            <CreditCard className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono">{partialCount}</div>
          <span className="text-[11px] text-slate-500">Pending final settlement</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by customer name, phone #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Status Pills */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {(['All', 'UNPAID', 'PARTIALLY_PAID', 'PAID'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === status
                  ? 'bg-amber-400 text-black font-bold'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Due Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/70 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">Customer</th>
                <th className="px-4 py-4">Session Station</th>
                <th className="px-4 py-4 text-right">Grand Total</th>
                <th className="px-4 py-4 text-right">Paid</th>
                <th className="px-4 py-4 text-right">Remaining Due</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4">Created Date</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredDues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No customer dues found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredDues.map((due) => {
                  const isPaid = due.status === 'PAID';
                  const isPartial = due.status === 'PARTIALLY_PAID';

                  return (
                    <tr key={due.id} className="hover:bg-slate-800/40 transition">
                      {/* Customer */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-amber-400">
                            {due.customerName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{due.customerName}</span>
                            {due.phone && (
                              <span className="font-mono text-xs text-slate-400">{due.phone}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Station */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-slate-300">{due.stationName || 'N/A'}</span>
                        <div className="text-[10px] text-slate-500">
                          Gaming: {formatBDT(due.gamingCharge)} • Snacks: {formatBDT(due.productCharge)}
                        </div>
                      </td>

                      {/* Grand Total */}
                      <td className="px-4 py-3.5 text-right font-mono text-white text-xs">
                        {formatBDT(due.grandTotal)}
                      </td>

                      {/* Paid */}
                      <td className="px-4 py-3.5 text-right font-mono text-emerald-400 text-xs">
                        {formatBDT(due.paidAmount)}
                      </td>

                      {/* Remaining */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-sm">
                        <span className={due.remainingBalance > 0 ? 'text-rose-400' : 'text-slate-500'}>
                          {formatBDT(due.remainingBalance)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isPartial
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {due.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-xs text-slate-400 font-mono">
                        {formatDateTime(due.createdDate)}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5 text-right">
                        {!isPaid ? (
                          <button
                            onClick={() => setSelectedDueForRepay(due)}
                            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-xl shadow-md shadow-amber-500/10 transition inline-flex items-center gap-1"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            Collect
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-400 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                          </span>
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

      {/* Repay Modal */}
      <RepayDueModal
        isOpen={!!selectedDueForRepay}
        onClose={() => setSelectedDueForRepay(null)}
        due={selectedDueForRepay}
        currentEmployee={currentEmployee}
        onRepay={handleRepay}
      />
    </div>
  );
};
