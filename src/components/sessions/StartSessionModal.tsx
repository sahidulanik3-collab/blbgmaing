import React, { useState, useEffect } from 'react';
import { X, Play, Clock, Hourglass, Gamepad2 } from 'lucide-react';
import { GamingStation, Employee, PaymentMethod, StationPackage } from '../../types';
import { formatBDT } from '../../utils/formatters';
import { buildDefaultPackages } from '../../utils/storage';

interface StartSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: GamingStation | null;
  mode?: 'start' | 'queue';
  queuePosition?: number;
  currentEmployee: Employee;
  onStartSession: (data: {
    stationId: string;
    customerName: string;
    customerPhone: string;
    players: number;
    advancePayment: number;
    advanceMethod: PaymentMethod;
    discountAmount: number;
    packageId?: string;
    packageName?: string;
    bookedMinutes?: number;
    lockedGamingCharge?: number;
    hourlyRateOverride?: number;
    isCustomTime: boolean;
    customStartTime?: string;
    customEndTime?: string;
    notes?: string;
  }) => void;
}

const HOUR_PRESETS = [
  { label: 'Package Rate', minutes: 0 },
  { label: '30 Mins', minutes: 30 },
  { label: '1 Hour', minutes: 60 },
  { label: '1.5 Hours', minutes: 90 },
  { label: '2 Hours', minutes: 120 },
  { label: '3 Hours', minutes: 180 },
  { label: 'Open Timer', minutes: -1 },
];

export const StartSessionModal: React.FC<StartSessionModalProps> = ({
  isOpen,
  onClose,
  station,
  mode = 'start',
  queuePosition = 1,
  currentEmployee,
  onStartSession,
}) => {
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [durationPreset, setDurationPreset] = useState<number>(0); // 0 = follow package
  const [players, setPlayers] = useState<number>(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [advancePayment, setAdvancePayment] = useState<number>(0);
  const [advanceMethod, setAdvanceMethod] = useState<PaymentMethod>('Cash');
  const [isCustomTime, setIsCustomTime] = useState<boolean>(false);
  const [customStartTime, setCustomStartTime] = useState<string>('19:00');
  const [customEndTime, setCustomEndTime] = useState<string>('20:00');
  const [customPriceOverride, setCustomPriceOverride] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');

  const packages: StationPackage[] =
    station?.packages && station.packages.length > 0
      ? station.packages
      : station
      ? buildDefaultPackages(
          station.hourlyRate,
          station.halfHourRate ?? Math.round(station.hourlyRate * 0.6)
        )
      : [];

  useEffect(() => {
    if (station && isOpen) {
      const defaultPkg = packages[1] || packages[0]; // prefer 1 Player • 1 Hour
      setSelectedPackageId(defaultPkg?.id || '');
      setDurationPreset(0);
      setPlayers(defaultPkg?.players || 1);
      setCustomerName('');
      setCustomerPhone('');
      setDiscountAmount(0);
      setAdvancePayment(0);
      setAdvanceMethod('Cash');
      setIsCustomTime(false);

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const startStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const endDate = new Date(now.getTime() + 60 * 60000);
      const endStr = `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
      setCustomStartTime(startStr);
      setCustomEndTime(endStr);
      setCustomPriceOverride(null);
      setNotes('');
    }
  }, [station, isOpen, mode]);

  if (!isOpen || !station) return null;

  const activePkg = packages.find((p) => p.id === selectedPackageId) || packages[0];

  const calculateCustomWindowMinutes = () => {
    const [sh, sm] = customStartTime.split(':').map(Number);
    const [eh, em] = customEndTime.split(':').map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 60;
    let diff = eh * 60 + em - (sh * 60 + sm);
    if (diff <= 0) diff += 24 * 60;
    return Math.max(15, diff);
  };

  let effectiveMinutes: number | undefined = activePkg?.durationMinutes || 60;
  let basePrice = activePkg?.price ?? station.hourlyRate;

  if (isCustomTime) {
    effectiveMinutes = calculateCustomWindowMinutes();
    const halfRate = station.halfHourRate ?? Math.round(station.hourlyRate * 0.6);
    const autoPrice =
      effectiveMinutes === 30
        ? halfRate
        : Math.round((effectiveMinutes / 60) * station.hourlyRate * (players > 1 ? 1 + (players - 1) * 0.5 : 1));
    basePrice = customPriceOverride !== null ? customPriceOverride : autoPrice;
  } else if (durationPreset === -1) {
    effectiveMinutes = undefined;
    basePrice = 0;
  } else if (durationPreset > 0) {
    effectiveMinutes = durationPreset;
    const halfRate = station.halfHourRate ?? Math.round(station.hourlyRate * 0.6);
    const playerMultiplier = players > 1 ? 1 + (players - 1) * 0.5 : 1;
    if (durationPreset === 30) {
      basePrice = Math.round(halfRate * playerMultiplier);
    } else {
      basePrice = Math.round((durationPreset / 60) * station.hourlyRate * playerMultiplier);
    }
  }

  const netTotal = Math.max(0, basePrice - discountAmount);

  const handlePackageChange = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    setDurationPreset(0);
    setCustomPriceOverride(null);
    const pkg = packages.find((p) => p.id === pkgId);
    if (pkg) {
      setPlayers(pkg.players);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'queue' && !customerName.trim()) {
      alert('Please enter customer name for the queue booking.');
      return;
    }

    onStartSession({
      stationId: station.id,
      customerName: customerName.trim() || 'Walk-in Gamer',
      customerPhone: customerPhone.trim(),
      players,
      advancePayment: Math.max(0, advancePayment),
      advanceMethod,
      discountAmount: Math.max(0, discountAmount),
      packageId: isCustomTime ? 'custom' : durationPreset === -1 ? 'open' : activePkg?.id,
      packageName: isCustomTime
        ? `Custom (${customStartTime} - ${customEndTime})`
        : durationPreset === -1
        ? 'Open Timer'
        : durationPreset > 0
        ? `${players}P • ${durationPreset} mins`
        : activePkg?.label,
      bookedMinutes: effectiveMinutes,
      lockedGamingCharge: effectiveMinutes ? basePrice : undefined,
      hourlyRateOverride: station.hourlyRate,
      isCustomTime,
      customStartTime: isCustomTime ? customStartTime : undefined,
      customEndTime: isCustomTime ? customEndTime : undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0F141E] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                mode === 'queue'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              }`}
            >
              {mode === 'queue' ? <Hourglass className="w-5 h-5" /> : <Gamepad2 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                {mode === 'queue' ? `Book queue — ${station.name}` : `Start Session — ${station.name}`}
              </h2>
              <p className="text-xs text-slate-400">
                30m: {formatBDT(station.halfHourRate ?? Math.round(station.hourlyRate * 0.6))} • 1h:{' '}
                {formatBDT(station.hourlyRate)}
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Queue Info Banner */}
          {mode === 'queue' && (
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 leading-relaxed">
              This customer will be <span className="font-bold text-amber-300">#{queuePosition} in queue</span> for{' '}
              <span className="font-bold">{station.name}</span>. The current player&apos;s timer keeps running — this
              booking does NOT start a timer yet.
            </div>
          )}

          {/* Package Dropdown */}
          {!isCustomTime && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Package</label>
              <select
                value={selectedPackageId}
                onChange={(e) => handlePackageChange(e.target.value)}
                className="w-full bg-slate-900 border border-cyan-500/70 rounded-xl px-3 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-cyan-400"
              >
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.label} — {formatBDT(pkg.price)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Duration / Hours Pills */}
          {!isCustomTime && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Duration / Hours
              </label>
              <div className="flex flex-wrap gap-1.5">
                {HOUR_PRESETS.filter((p) => !(mode === 'queue' && p.minutes === -1)).map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setDurationPreset(preset.minutes)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      durationPreset === preset.minutes
                        ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Players */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Players</label>
            <input
              type="number"
              min="1"
              max="8"
              value={players}
              onChange={(e) => setPlayers(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Customer name {mode === 'queue' ? '*' : ''}
              </label>
              <input
                type="text"
                required={mode === 'queue'}
                placeholder="e.g. Rahim"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Phone (optional)
              </label>
              <input
                type="tel"
                placeholder="01..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Discount, Advance Paid & Method */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Discount ৳</label>
              <input
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Advance paid ৳</label>
              <input
                type="number"
                min="0"
                value={advancePayment}
                onChange={(e) => setAdvancePayment(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Method</label>
              <select
                value={advanceMethod}
                onChange={(e) => setAdvanceMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Cash">Cash</option>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Bank">Bank</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Custom Time Window Toggle Box */}
          <div
            onClick={() => setIsCustomTime(!isCustomTime)}
            className={`cursor-pointer rounded-xl border p-3 transition ${
              isCustomTime
                ? 'bg-cyan-950/40 border-cyan-500/50'
                : 'bg-teal-950/20 border-teal-800/40 hover:border-teal-700/60'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                checked={isCustomTime}
                onChange={(e) => setIsCustomTime(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="mt-0.5 w-4 h-4 rounded accent-cyan-400"
              />
              <div className="text-xs leading-snug">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Set a custom time
                  <span className="font-normal text-slate-400">
                    — book a fixed window, e.g. play from 7:00 PM to 8:00 PM, instead of a plain duration.
                  </span>
                </span>
              </div>
            </div>

            {isCustomTime && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-cyan-900/50"
              >
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={customStartTime}
                    onChange={(e) => setCustomStartTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">End Time</label>
                  <input
                    type="time"
                    value={customEndTime}
                    onChange={(e) => setCustomEndTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Price (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={customPriceOverride ?? basePrice}
                    onChange={(e) => setCustomPriceOverride(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-cyan-300 font-mono font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notes (optional)
            </label>
            <input
              type="text"
              placeholder={mode === 'queue' ? 'e.g. waiting outside, call when free' : 'e.g. FIFA tournament'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Price Snapshot Summary Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-300">
            {effectiveMinutes ? (
              <div>
                <span className="text-slate-400">
                  {mode === 'queue' ? 'Total when started:' : 'Locked session total:'}
                </span>{' '}
                <span className="font-mono font-bold text-white text-sm">{formatBDT(netTotal)}</span>{' '}
                • <span className="font-semibold">{effectiveMinutes} minutes</span> •{' '}
                <span className="text-slate-400">price is locked in this booking snapshot</span>
              </div>
            ) : (
              <div>
                <span className="font-bold text-cyan-400">Open Timer Mode:</span> Billed live at{' '}
                <span className="font-mono font-bold text-white">{formatBDT(station.hourlyRate)}/hr</span>{' '}
                (Stop anytime & pay at checkout).
              </div>
            )}
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 ${
              mode === 'queue'
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-cyan-500/20'
            }`}
          >
            {mode === 'queue' ? (
              <>
                <Hourglass className="w-4 h-4" />
                Add to queue as #{queuePosition}
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-black" />
                Start Session ({effectiveMinutes ? formatBDT(netTotal) : 'Open Timer'})
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
