import React, { useState } from 'react';
import { X, DollarSign, CreditCard, CheckCircle2, History, User } from 'lucide-react';
import { DueRecord, Employee, PaymentMethod } from '../../types';
import { formatBDT, formatDateTime } from '../../utils/formatters';

interface RepayDueModalProps {
  isOpen: boolean;
  onClose: () => void;
  due: DueRecord | null;
  currentEmployee: Employee;
  onRepay: (
    dueId: string,
    amount: number,
    method: PaymentMethod,
    transactionId: string | undefined,
    notes?: string
  ) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'bKash', 'Nagad', 'Bank', 'Other'];

export const RepayDueModal: React.FC<RepayDueModalProps> = ({
  isOpen,
  onClose,
  due,
  currentEmployee,
  onRepay,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (due) {
      setAmount(due.remainingBalance);
      setMethod('Cash');
      setTransactionId('');
      setNotes('');
    }
  }, [due, isOpen]);

  if (!isOpen || !due) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Payment amount must be greater than 0');
      return;
    }
    if (amount > due.remainingBalance) {
      alert(`Amount exceeds outstanding balance (৳${due.remainingBalance})`);
      return;
    }

    onRepay(due.id, amount, method, transactionId.trim() || undefined, notes.trim() || undefined);
    onClose();
  };

  const isFullSettlement = amount >= due.remainingBalance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Settle Customer Due</h2>
              <p className="text-xs text-slate-400">Record partial or full payment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer & Due summary */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                <User className="w-4 h-4 text-cyan-400" />
                {due.customerName}
              </div>
              {due.phone && <span className="font-mono text-slate-400">{due.phone}</span>}
            </div>
            <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-700/60">
              <span>Original Bill:</span>
              <span className="font-mono text-white">{formatBDT(due.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total Paid So Far:</span>
              <span className="font-mono text-emerald-400 font-bold">{formatBDT(due.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-amber-300 font-bold text-sm pt-1 border-t border-slate-700">
              <span>Current Outstanding Due:</span>
              <span className="font-mono text-base">{formatBDT(due.remainingBalance)}</span>
            </div>
          </div>

          {/* Amount to pay */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Payment Amount (৳ BDT) *
              </label>
              <button
                type="button"
                onClick={() => setAmount(due.remainingBalance)}
                className="text-[11px] text-cyan-400 hover:underline font-semibold"
              >
                Pay Full (৳{due.remainingBalance})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-amber-400 font-mono text-sm">৳</span>
              <input
                type="number"
                min="1"
                max={due.remainingBalance}
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono font-bold"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              New remaining balance will be:{' '}
              <span className="font-bold text-white font-mono">
                {formatBDT(Math.max(0, due.remainingBalance - amount))}
              </span>
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Payment Method *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                    method === m
                      ? 'bg-amber-400 text-black border-amber-400 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {(method === 'bKash' || method === 'Nagad' || method === 'Bank') && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Transaction ID / Ref #
              </label>
              <input
                type="text"
                placeholder="e.g. 9J471KA9"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Repayment Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Paid in cash at counter"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Repayment History preview */}
          {due.repayments.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">
                Previous Repayments ({due.repayments.length}):
              </span>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {due.repayments.map((r) => (
                  <div
                    key={r.id}
                    className="flex justify-between text-[11px] text-slate-400 bg-slate-800/40 px-2 py-1 rounded"
                  >
                    <span>
                      {formatDateTime(r.timestamp)} ({r.method})
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      +{formatBDT(r.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              className="px-5 py-2 text-sm font-bold text-black bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isFullSettlement ? 'Confirm Full Settlement' : 'Record Partial Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
