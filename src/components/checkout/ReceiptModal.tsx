import React, { useRef } from 'react';
import { X, Printer, Download, Share2, Check } from 'lucide-react';
import { CheckoutRecord, AppSettings } from '../../types';
import { formatBDT, formatDateTime, formatDuration } from '../../utils/formatters';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: any; // CheckoutRecord or QuickSaleRecord
  settings: AppSettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
  settings,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [isThermalMode, setIsThermalMode] = React.useState(true);

  if (!isOpen || !receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyTextReceipt = () => {
    const textReceipt = `
========================================
           ${settings.shopName}
${settings.shopAddress}
Phone: ${settings.shopPhone}
========================================
Receipt #: ${receiptData.receiptNumber}
Date: ${formatDateTime(receiptData.timestamp || receiptData.date)}
Customer: ${receiptData.customerName || 'Walk-in'}
Station: ${receiptData.stationName || 'Walk-in Quick Sale'}
Staff: ${receiptData.employeeName}
----------------------------------------
${
  receiptData.gamingCharge > 0
    ? `Gaming Charge (${formatDuration(receiptData.durationMinutes)}): ${formatBDT(
        receiptData.gamingCharge
      )}\n`
    : ''
}${
      (receiptData.products || [])
        .map(
          (p: any) =>
            `${p.productName} x${p.quantity} @ ${formatBDT(p.unitPrice)} = ${formatBDT(
              p.lineTotal
            )}`
        )
        .join('\n')
    }
----------------------------------------
Grand Total: ${formatBDT(receiptData.grandTotal)}
Total Paid: ${formatBDT(receiptData.totalPaid || receiptData.paidAmount)}
Remaining Due: ${formatBDT(receiptData.remainingDue || 0)}
========================================
${settings.receiptFooter}
========================================
`;
    navigator.clipboard.writeText(textReceipt.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsThermalMode(true)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                isThermalMode ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400'
              }`}
            >
              80mm Thermal
            </button>
            <button
              onClick={() => setIsThermalMode(false)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                !isThermalMode ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Standard A4
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-6 bg-slate-950/80 overflow-y-auto max-h-[70vh] flex justify-center">
          <div
            id="printable-receipt"
            className={`bg-white text-black font-mono p-6 shadow-2xl rounded-sm ${
              isThermalMode ? 'w-80 text-xs' : 'w-full text-sm'
            }`}
          >
            {/* Shop Brand Header */}
            <div className="text-center pb-3 border-b-2 border-dashed border-black">
              <h1 className="text-base font-black tracking-tight uppercase">
                {settings.shopName}
              </h1>
              <p className="text-[10px] leading-tight mt-0.5">{settings.shopAddress}</p>
              <p className="text-[10px] font-bold mt-0.5">Contact: {settings.shopPhone}</p>
            </div>

            {/* Receipt Metadata */}
            <div className="py-2.5 border-b border-dashed border-black text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>Receipt:</span>
                <span className="font-bold">{receiptData.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formatDateTime(receiptData.timestamp || receiptData.date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-bold">{receiptData.customerName || 'Walk-in'}</span>
              </div>
              {receiptData.stationName && (
                <div className="flex justify-between">
                  <span>Station:</span>
                  <span className="font-bold">{receiptData.stationName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Served by:</span>
                <span>{receiptData.employeeName}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-black text-[11px]">
              <div className="flex justify-between font-bold border-b border-black pb-1 mb-1">
                <span>Item</span>
                <span>Total</span>
              </div>

              {/* Gaming Charge if present */}
              {receiptData.gamingCharge > 0 && (
                <div className="flex justify-between py-0.5">
                  <div>
                    <span className="font-bold">Gaming Session</span>
                    <div className="text-[10px] text-gray-700">
                      Duration: {formatDuration(receiptData.durationMinutes)}
                    </div>
                  </div>
                  <span className="font-bold">{formatBDT(receiptData.gamingCharge)}</span>
                </div>
              )}

              {/* Products Breakdown */}
              {(receiptData.products || []).map((p: any, idx: number) => (
                <div key={idx} className="flex justify-between py-0.5">
                  <div>
                    <span>{p.productName}</span>
                    <div className="text-[10px] text-gray-700">
                      {p.quantity} × {formatBDT(p.unitPrice)}
                    </div>
                  </div>
                  <span className="font-bold">{formatBDT(p.lineTotal)}</span>
                </div>
              ))}

              {/* Additional charges */}
              {(receiptData.additionalCharges || []).map((chg: any, idx: number) => (
                <div key={idx} className="flex justify-between py-0.5">
                  <span>{chg.name}</span>
                  <span className="font-bold">+{formatBDT(chg.amount)}</span>
                </div>
              ))}

              {/* Discounts */}
              {(receiptData.discounts || []).map((d: any, idx: number) => (
                <div key={idx} className="flex justify-between py-0.5 text-black">
                  <span>Discount ({d.reason || 'Promo'})</span>
                  <span className="font-bold">-{formatBDT(d.amountCalculated)}</span>
                </div>
              ))}
            </div>

            {/* Bill Summary */}
            <div className="py-2 border-b-2 border-dashed border-black text-[11px] space-y-1">
              <div className="flex justify-between font-black text-sm">
                <span>GRAND TOTAL:</span>
                <span>{formatBDT(receiptData.grandTotal)}</span>
              </div>

              {receiptData.advancePayments > 0 && (
                <div className="flex justify-between text-[10px]">
                  <span>Advance Paid:</span>
                  <span>-{formatBDT(receiptData.advancePayments)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold pt-1 border-t border-dotted border-gray-400">
                <span>Paid Amount:</span>
                <span>{formatBDT(receiptData.totalPaid || receiptData.paidAmount)}</span>
              </div>

              {/* Payment Methods */}
              {(receiptData.splitPayments || []).length > 0 && (
                <div className="text-[10px] text-gray-700 space-y-0.5 pl-2">
                  {receiptData.splitPayments.map((sp: any, i: number) => (
                    <div key={i} className="flex justify-between">
                      <span>• {sp.method}:</span>
                      <span>{formatBDT(sp.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Remaining Due */}
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
                <span>REMAINING DUE:</span>
                <span className={receiptData.remainingDue > 0 ? 'underline' : ''}>
                  {formatBDT(receiptData.remainingDue || 0)}
                </span>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="text-center pt-3 text-[10px] space-y-1">
              <p className="font-bold">{settings.receiptFooter}</p>
              <p className="text-[9px] text-gray-600">Powered by BLB Gaming Management</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
          <button
            onClick={handleCopyTextReceipt}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Text Receipt'}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 transition"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
};
