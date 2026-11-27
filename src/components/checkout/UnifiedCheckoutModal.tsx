import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  User,
  Clock,
  Plus,
  Minus,
  Trash2,
  Tag,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Receipt,
  ShieldAlert,
} from 'lucide-react';
import {
  GamingSession,
  Employee,
  SplitPayment,
  PaymentMethod,
  AdditionalCharge,
  DiscountItem,
  ProductSaleItem,
  CheckoutRecord,
} from '../../types';
import {
  calculateCheckoutFinancials,
  calculateGamingCharge,
  roundBDT,
} from '../../utils/calculations';
import { formatBDT, formatDuration, formatDateTime } from '../../utils/formatters';
import DB from '../../utils/storage';

interface UnifiedCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: GamingSession | null;
  currentEmployee: Employee;
  onRefresh: () => void;
  onCheckoutComplete: (checkoutRecord: CheckoutRecord) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'bKash', 'Nagad', 'Bank', 'Other'];

export const UnifiedCheckoutModal: React.FC<UnifiedCheckoutModalProps> = ({
  isOpen,
  onClose,
  session,
  currentEmployee,
  onRefresh,
  onCheckoutComplete,
}) => {
  // Session charges
  const [gamingCharge, setGamingCharge] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);

  // Additional charges & discounts
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([]);
  const [newChargeName, setNewChargeName] = useState('');
  const [newChargeAmount, setNewChargeAmount] = useState(0);
  const [isAddingCharge, setIsAddingCharge] = useState(false);

  const [discounts, setDiscounts] = useState<DiscountItem[]>([]);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountReason, setDiscountReason] = useState('');

  // Split Payments
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([
    { method: 'Cash', amount: 0, transactionId: '' },
  ]);

  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [isConfirmingDue, setIsConfirmingDue] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize data on session open
  useEffect(() => {
    if (session && isOpen) {
      const activePauseMs =
        session.isPaused && session.pausedAt
          ? Math.max(0, Date.now() - new Date(session.pausedAt).getTime())
          : 0;
      const calc = calculateGamingCharge(
        session.startTime,
        null,
        session.hourlyRate,
        session.lockedGamingCharge,
        (session.totalPausedMs || 0) + activePauseMs
      );
      setDurationMinutes(calc.durationMinutes);
      setGamingCharge(calc.charge);
      setAdditionalCharges(session.additionalCharges || []);
      setDiscounts(session.discounts || []);
      setIsConfirmingDue(false);
      setIsSubmitting(false);

      // Pre-fill initial cash payment to remaining balance
      const initialFinancials = calculateCheckoutFinancials({
        gamingCharge: calc.charge,
        products: session.productItems,
        additionalCharges: session.additionalCharges,
        discounts: session.discounts,
        advancePayment: session.advancePayment,
        previousPayments: session.previousPayments,
        checkoutPayments: 0,
      });

      setSplitPayments([
        {
          method: 'Cash',
          amount: initialFinancials.grandTotal - (session.advancePayment || 0) > 0
            ? initialFinancials.grandTotal - (session.advancePayment || 0)
            : 0,
          transactionId: '',
        },
      ]);
    }
  }, [session, isOpen]);

  if (!isOpen || !session) return null;

  // Real-time financial calculations
  const financials = calculateCheckoutFinancials({
    gamingCharge,
    products: session.productItems,
    additionalCharges,
    discounts,
    advancePayment: session.advancePayment,
    previousPayments: session.previousPayments,
    checkoutPayments: splitPayments,
  });

  // Split payment helpers
  const handleAddSplitPayment = () => {
    // default new split to whatever is remaining
    const remaining = financials.remainingDue;
    setSplitPayments([
      ...splitPayments,
      { method: 'bKash', amount: remaining > 0 ? remaining : 0, transactionId: '' },
    ]);
  };

  const handleUpdateSplitPayment = (
    index: number,
    field: keyof SplitPayment,
    val: any
  ) => {
    const updated = [...splitPayments];
    updated[index] = { ...updated[index], [field]: val };
    setSplitPayments(updated);
  };

  const handleRemoveSplitPayment = (index: number) => {
    if (splitPayments.length <= 1) return;
    setSplitPayments(splitPayments.filter((_, i) => i !== index));
  };

  // Quick fill remaining balance to first payment
  const handleFillExactRemaining = () => {
    const needed = Math.max(
      0,
      financials.grandTotal - financials.advancePayment - financials.previousPayments
    );
    setSplitPayments([{ method: 'Cash', amount: needed }]);
  };

  // Additional Charges
  const handleAddCharge = () => {
    if (!newChargeName.trim() || newChargeAmount <= 0) return;
    setAdditionalCharges([
      ...additionalCharges,
      {
        id: `chg-${Date.now()}`,
        name: newChargeName.trim(),
        amount: roundBDT(newChargeAmount),
      },
    ]);
    setNewChargeName('');
    setNewChargeAmount(0);
    setIsAddingCharge(false);
  };

  const handleRemoveCharge = (id: string) => {
    setAdditionalCharges(additionalCharges.filter((c) => c.id !== id));
  };

  // Discount
  const handleApplyDiscount = () => {
    if (discountValue <= 0) return;
    if (!currentEmployee.permissions.canGiveDiscount) {
      alert('Access Denied: You do not have permission to apply discounts.');
      return;
    }

    const calculated =
      discountType === 'percentage'
        ? ((gamingCharge + financials.productSubtotal) * Math.min(100, discountValue)) / 100
        : discountValue;

    setDiscounts([
      {
        id: `disc-${Date.now()}`,
        name: `${discountValue}${discountType === 'percentage' ? '%' : '৳'} Discount`,
        type: discountType,
        value: discountValue,
        amountCalculated: roundBDT(calculated),
        reason: discountReason.trim() || 'Manager courtesy discount',
      },
    ]);
  };

  const handleRemoveDiscount = () => {
    setDiscounts([]);
    setDiscountValue(0);
    setDiscountReason('');
  };

  // Final Checkout submission
  const executeFinalCheckout = (checkoutStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID') => {
    if (isSubmitting) return; // Prevent double clicks
    setIsSubmitting(true);

    // Permission check for creating Due
    if (financials.remainingDue > 0 && !currentEmployee.permissions.canCreateDue) {
      alert('Access Denied: You do not have permission to create customer due records.');
      setIsSubmitting(false);
      return;
    }

    const checkoutData = {
      sessionId: session.id,
      stationId: session.stationId,
      stationName: session.stationName,
      customerId: session.customerId,
      customerName: session.customerName,
      customerPhone: session.customerPhone,
      startTime: session.startTime,
      endTime: new Date().toISOString(),
      durationMinutes,
      package: session.packageName,
      gamingCharge,
      products: session.productItems,
      productSubtotal: financials.productSubtotal,
      additionalCharges,
      additionalChargesSubtotal: financials.additionalChargesSubtotal,
      discounts,
      discountSubtotal: financials.discountSubtotal,
      grandTotal: financials.grandTotal,
      previousSessionPayments: financials.previousPayments,
      advancePayments: financials.advancePayment,
      checkoutPaymentReceived: financials.checkoutPaymentReceived,
      totalPaid: financials.totalPaid,
      remainingDue: financials.remainingDue,
      splitPayments: splitPayments.filter((p) => p.amount > 0),
      status: checkoutStatus,
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      notes: checkoutNotes.trim() || undefined,
    };

    const res = DB.processSessionCheckout(checkoutData);

    setIsSubmitting(false);

    if (!res.success) {
      alert(res.error || 'Failed to process checkout');
      return;
    }

    onClose();
    onRefresh();
    onCheckoutComplete(res.checkoutRecord);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Unified Checkout:
                <span className="text-cyan-400">{session.stationName}</span>
              </h2>
              <p className="text-xs text-slate-400">
                Customer: <span className="text-white font-semibold">{session.customerName}</span>{' '}
                {session.customerPhone && (
                  <span className="font-mono text-slate-400">({session.customerPhone})</span>
                )}{' '}
                • Staff: {currentEmployee.name}
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

        {/* Body Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left Column: Line Items Breakdown (7 cols) */}
          <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-slate-800 space-y-5">
            {/* 1. Gaming Charges */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> 1. Gaming Charges
                </span>
                <span className="text-xs font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 px-2 py-0.5 rounded-md">
                  {formatDuration(durationMinutes)} ({session.activePlayers}p)
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-slate-300 font-semibold">{session.stationName}</span>
                  <div className="text-xs text-slate-400">
                    Rate: {formatBDT(session.hourlyRate)}/hr • Started:{' '}
                    {formatDateTime(session.startTime)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black font-mono text-white">
                    {formatBDT(gamingCharge)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Product Charges (Snacks & Drinks) */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  2. Snacks &amp; Drinks ({session.productItems.length})
                </span>
                <span className="text-sm font-mono font-extrabold text-purple-300">
                  Subtotal: {formatBDT(financials.productSubtotal)}
                </span>
              </div>

              {session.productItems.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No snacks or drinks added to this session.</p>
              ) : (
                <div className="space-y-2">
                  {session.productItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60 last:border-0"
                    >
                      <div>
                        <span className="text-slate-200 font-semibold text-sm">{item.productName}</span>
                        <span className="text-slate-400 font-mono ml-2">
                          {formatBDT(item.unitPrice)} × {item.quantity}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-white text-base">
                        {formatBDT(item.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Additional Charges & Discounts */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  3. Extra Fees & Discounts
                </span>
                {!isAddingCharge && (
                  <button
                    onClick={() => setIsAddingCharge(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Fee
                  </button>
                )}
              </div>

              {/* Add Charge input row */}
              {isAddingCharge && (
                <div className="flex gap-2 items-center bg-slate-900 p-2 rounded-xl border border-slate-700">
                  <input
                    type="text"
                    placeholder="Fee reason (e.g. Extra Controller)"
                    value={newChargeName}
                    onChange={(e) => setNewChargeName(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="৳ Amount"
                    value={newChargeAmount || ''}
                    onChange={(e) => setNewChargeAmount(parseInt(e.target.value) || 0)}
                    className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                  />
                  <button
                    onClick={handleAddCharge}
                    className="px-2 py-1 bg-amber-400 text-black text-xs font-bold rounded-lg"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setIsAddingCharge(false)}
                    className="text-slate-400 hover:text-white text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* List Additional charges */}
              {additionalCharges.map((chg) => (
                <div
                  key={chg.id}
                  className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60"
                >
                  <span className="text-slate-300">{chg.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-300">
                      +{formatBDT(chg.amount)}
                    </span>
                    <button
                      onClick={() => handleRemoveCharge(chg.id)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              {/* Discount inputs */}
              {discounts.length === 0 ? (
                <div className="flex gap-2 items-center pt-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Discount"
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(parseInt(e.target.value) || 0)}
                    className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                  />
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  >
                    <option value="fixed">৳ BDT</option>
                    <option value="percentage">% Percent</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Discount reason..."
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                  />
                  <button
                    onClick={handleApplyDiscount}
                    className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-bold rounded-lg transition"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                discounts.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between text-xs py-1 text-emerald-400 bg-emerald-950/20 px-2 rounded-lg border border-emerald-500/30"
                  >
                    <span>
                      {d.name} ({d.reason})
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">-{formatBDT(d.amountCalculated)}</span>
                      <button
                        onClick={handleRemoveDiscount}
                        className="text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Optional checkout notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Checkout Notes / Special Instructions
              </label>
              <input
                type="text"
                placeholder="e.g. Customer will settle remaining due tomorrow"
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Right Column: Financial Summary & Split Payments (5 cols) */}
          <div className="lg:col-span-5 p-6 bg-slate-950/40 flex flex-col justify-between space-y-5">
            {/* Financial Summary Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-xs font-semibold">Gaming Charge:</span>
                <span className="font-mono font-bold text-white text-base">
                  {formatBDT(financials.gamingSubtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-xs font-semibold">Products Subtotal:</span>
                <span className="font-mono font-bold text-purple-300 text-base">
                  {formatBDT(financials.productSubtotal)}
                </span>
              </div>
              {financials.additionalChargesSubtotal > 0 && (
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-xs font-semibold">Additional Fees:</span>
                  <span className="font-mono font-bold text-amber-300 text-base">
                    +{formatBDT(financials.additionalChargesSubtotal)}
                  </span>
                </div>
              )}
              {financials.discountSubtotal > 0 && (
                <div className="flex items-center justify-between text-emerald-400">
                  <span className="text-xs font-semibold">Discount:</span>
                  <span className="font-mono font-bold text-base">
                    -{formatBDT(financials.discountSubtotal)}
                  </span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex items-center justify-between text-base font-black text-white pt-3 border-t border-slate-800">
                <span className="text-base sm:text-lg">Grand Total:</span>
                <span className="font-mono text-cyan-400 text-2xl sm:text-3xl tracking-tight">
                  {formatBDT(financials.grandTotal)}
                </span>
              </div>

              {/* Advance Paid */}
              {financials.advancePayment > 0 && (
                <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                  <span>Advance Payment (Already Paid):</span>
                  <span className="font-mono text-emerald-400 font-bold text-base">
                    -{formatBDT(financials.advancePayment)}
                  </span>
                </div>
              )}

              {/* Net Remaining Bill to Pay */}
              <div className="flex items-center justify-between font-bold pt-2 border-t border-slate-800/80">
                <span className="text-slate-200 text-sm">Net Due at Checkout:</span>
                <span className="font-mono font-black text-amber-300 text-xl sm:text-2xl">
                  {formatBDT(
                    Math.max(
                      0,
                      financials.grandTotal -
                        financials.advancePayment -
                        financials.previousPayments
                    )
                  )}
                </span>
              </div>
            </div>

            {/* Split Payments Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-cyan-400" /> Payment Methods (Split Allowed)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFillExactRemaining}
                    className="text-[11px] text-cyan-400 hover:underline font-semibold"
                  >
                    Exact Balance
                  </button>
                  <button
                    onClick={handleAddSplitPayment}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Split
                  </button>
                </div>
              </div>

              {/* Split Payment Rows */}
              <div className="space-y-2">
                {splitPayments.map((split, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2"
                  >
                    <select
                      value={split.method}
                      onChange={(e) =>
                        handleUpdateSplitPayment(idx, 'method', e.target.value as PaymentMethod)
                      }
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-semibold"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>

                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2 text-cyan-400 font-mono text-base font-bold">
                        ৳
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        placeholder="0"
                        value={split.amount || ''}
                        onChange={(e) =>
                          handleUpdateSplitPayment(
                            idx,
                            'amount',
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-2.5 py-2 text-lg font-mono font-black text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    {(split.method === 'bKash' || split.method === 'Nagad' || split.method === 'Bank') && (
                      <input
                        type="text"
                        placeholder="TxID / Ref"
                        value={split.transactionId || ''}
                        onChange={(e) =>
                          handleUpdateSplitPayment(idx, 'transactionId', e.target.value)
                        }
                        className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none"
                      />
                    )}

                    {splitPayments.length > 1 && (
                      <button
                        onClick={() => handleRemoveSplitPayment(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Status Box: Fully Paid vs Remaining Due */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  financials.remainingDue === 0
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <div>
                  <span className="font-semibold block">
                    {financials.remainingDue === 0
                      ? '✓ Fully Paid'
                      : `Outstanding Due: ${formatBDT(financials.remainingDue)}`}
                  </span>
                  <span className="text-[11px] opacity-80 font-mono">
                    Total Paid: {formatBDT(financials.totalPaid)} of {formatBDT(financials.grandTotal)}
                  </span>
                </div>
                {financials.changeReturn > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Change Return</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {formatBDT(financials.changeReturn)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Checkout Action Buttons (Section 7 Requirements) */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              {/* Option A: Pay Full & Checkout */}
              {financials.remainingDue === 0 ? (
                <button
                  disabled={isSubmitting}
                  onClick={() => executeFinalCheckout('PAID')}
                  className="w-full py-3.5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-black font-black text-base rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Pay Full &amp; Checkout ({formatBDT(financials.totalPaid)})
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {/* Option B: Partial Payment */}
                  <button
                    disabled={isSubmitting || financials.checkoutPaymentReceived === 0}
                    onClick={() => executeFinalCheckout('PARTIALLY_PAID')}
                    className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
                  >
                    <CreditCard className="w-4 h-4" />
                    Partial & Checkout (Due: {formatBDT(financials.remainingDue)})
                  </button>

                  {/* Option C: Checkout with Due (Unpaid) */}
                  <button
                    disabled={isSubmitting}
                    onClick={() => {
                      if (!isConfirmingDue) {
                        setIsConfirmingDue(true);
                      } else {
                        executeFinalCheckout('UNPAID');
                      }
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                      isConfirmingDue
                        ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                        : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    {isConfirmingDue ? 'Confirm Due Checkout?' : 'Checkout with Due'}
                  </button>
                </div>
              )}

              {/* Cancel Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition"
              >
                Cancel Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
