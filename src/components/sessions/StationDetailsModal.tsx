import React from 'react';
import {
  X,
  Pause,
  Play,
  Plus,
  ShoppingBag,
  CreditCard,
  Hourglass,
  Edit2,
  Trash2,
  User,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { GamingStation, GamingSession, QueueBooking, Employee } from '../../types';
import { formatBDT, formatDateTime } from '../../utils/formatters';
import { LiveSessionTimerInfo } from '../../utils/calculations';

interface StationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: GamingStation | null;
  session: GamingSession | null;
  timerInfo: LiveSessionTimerInfo | null;
  stationQueues: QueueBooking[];
  currentEmployee: Employee;
  onStartDirect: (station: GamingStation) => void;
  onBookQueue: (station: GamingStation) => void;
  onStartFromQueue: (queueId: string) => void;
  onRemoveQueue: (queueId: string) => void;
  onTogglePause: (sessionId: string) => void;
  onOpenExtend: (session: GamingSession, station: GamingStation) => void;
  onOpenAddProducts: (session: GamingSession) => void;
  onOpenCheckout: (session: GamingSession) => void;
  onCancelSession: (sessionId: string) => void;
  onEditStation: (station: GamingStation) => void;
}

export const StationDetailsModal: React.FC<StationDetailsModalProps> = ({
  isOpen,
  onClose,
  station,
  session,
  timerInfo,
  stationQueues,
  currentEmployee,
  onStartDirect,
  onBookQueue,
  onStartFromQueue,
  onRemoveQueue,
  onTogglePause,
  onOpenExtend,
  onOpenAddProducts,
  onOpenCheckout,
  onCancelSession,
  onEditStation,
}) => {
  if (!isOpen || !station) return null;

  const isOccupied = station.status === 'occupied' && !!session && !!timerInfo;
  const productSubtotal = session
    ? session.productItems.reduce((acc, p) => acc + p.lineTotal, 0)
    : 0;

  const totalChargeSoFar = isOccupied
    ? Math.max(
        0,
        timerInfo!.currentCharge +
          productSubtotal -
          (session!.discounts || []).reduce((a, d) => a + d.amountCalculated, 0)
      )
    : 0;

  const paymentStatusLabel = !session
    ? 'AVAILABLE'
    : session.advancePayment >= totalChargeSoFar && totalChargeSoFar > 0
    ? 'PAID'
    : session.advancePayment > 0
    ? 'PARTIAL'
    : 'UNPAID';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0D111A] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Top Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-black text-white tracking-tight">{station.name}</h2>
              <button
                title="Edit Station Rates & Packages"
                onClick={() => {
                  onClose();
                  onEditStation(station);
                }}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 rounded-lg transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {station.subtitle || station.type} • 30m:{' '}
              {formatBDT(station.halfHourRate ?? Math.round(station.hourlyRate * 0.6))} • 1h:{' '}
              {formatBDT(station.hourlyRate)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isOccupied ? (
              <span
                className={`text-[11px] font-bold px-3 py-1 rounded-full border uppercase tracking-wide ${
                  timerInfo!.isTimeFinished
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                    : timerInfo!.isPaused
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                    : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                }`}
              >
                {timerInfo!.isTimeFinished
                  ? 'TIME FINISHED'
                  : timerInfo!.isPaused
                  ? 'PAUSED'
                  : 'LIVE'}
              </span>
            ) : (
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase">
                AVAILABLE
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Active Session View */}
          {isOccupied && session && timerInfo ? (
            <>
              {/* Huge Digital Clock */}
              <div className="text-center py-2">
                <div
                  className={`text-5xl font-black font-mono tracking-wider ${
                    timerInfo.isTimeFinished
                      ? 'text-rose-400'
                      : timerInfo.isPaused
                      ? 'text-amber-300'
                      : 'text-cyan-300'
                  }`}
                >
                  {timerInfo.remainingClock}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {timerInfo.isTimeFinished
                    ? 'Time finished'
                    : timerInfo.isPaused
                    ? 'Timer paused'
                    : timerInfo.hasBookedDuration
                    ? `Remaining time (${session.bookedMinutes}m booked)`
                    : 'Elapsed open time'}
                </p>

                {/* Progress bar */}
                {timerInfo.hasBookedDuration && (
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full transition-all ${
                        timerInfo.isTimeFinished ? 'bg-rose-500' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${timerInfo.progressPercent}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Customer Highlight Box */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                  CUSTOMER
                </span>
                <div className="text-2xl font-black text-cyan-300 mt-0.5">
                  {session.customerName}
                </div>
                {session.customerPhone && (
                  <div className="text-sm font-mono text-slate-300 mt-0.5">
                    {session.customerPhone}
                  </div>
                )}
                <div className="text-[11px] text-slate-500 mt-1">
                  {session.activePlayers} Player{session.activePlayers > 1 ? 's' : ''} •{' '}
                  {session.packageName || 'Hourly Rate'}
                </div>
              </div>

              {/* Detailed Info Rows (like Screenshot 2) */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Started</span>
                  <span className="font-mono text-slate-200">{formatDateTime(session.startTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Elapsed</span>
                  <span className="font-mono font-bold text-white">{timerInfo.elapsedClock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gaming Charge</span>
                  <span className="font-mono font-bold text-white">
                    {formatBDT(timerInfo.currentCharge)}{' '}
                    <span className="text-slate-400 font-normal">
                      (paid {formatBDT(session.advancePayment)})
                    </span>
                  </span>
                </div>
                {productSubtotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">
                      Snacks & Drinks ({session.productItems.reduce((a, b) => a + b.quantity, 0)})
                    </span>
                    <span className="font-mono font-bold text-purple-300">
                      {formatBDT(productSubtotal)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment</span>
                  <span
                    className={`font-mono font-bold ${
                      paymentStatusLabel === 'PAID'
                        ? 'text-emerald-400'
                        : paymentStatusLabel === 'PARTIAL'
                        ? 'text-amber-300'
                        : 'text-rose-400'
                    }`}
                  >
                    {paymentStatusLabel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Staff</span>
                  <span className="text-slate-200 font-semibold">{session.createdByEmployeeName}</span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="space-y-2.5">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onTogglePause(session.id)}
                    className="py-2.5 px-3 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition"
                  >
                    {timerInfo.isPaused ? (
                      <>
                        <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="w-3.5 h-3.5 text-cyan-400" />
                        Pause
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onOpenExtend(session, station)}
                    className="py-2.5 px-3 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    Extend
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenAddProducts(session);
                    }}
                    className="py-2.5 px-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-xl text-xs font-bold text-purple-200 flex items-center justify-center gap-1.5 transition"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    + Products
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCheckout(session);
                    }}
                    className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
                  >
                    <CreditCard className="w-4 h-4" />
                    End &amp; settle ({formatBDT(totalChargeSoFar)})
                  </button>

                  <button
                    onClick={() => {
                      if (
                        confirm(
                          'Cancel this active session? Any attached snacks will be restored to stock.'
                        )
                      ) {
                        onCancelSession(session.id);
                        onClose();
                      }
                    }}
                    className="px-3 py-2.5 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Available Station View */
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-center space-y-3">
              <p className="text-sm text-slate-300">
                Station is currently <span className="text-emerald-400 font-bold">FREE</span> and ready
                for players.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onStartDirect(station);
                }}
                className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition"
              >
                <Play className="w-4 h-4 fill-black" />
                Start New Session
              </button>
            </div>
          )}

          {/* QUEUE SECTION (Matches Screenshot 2) */}
          <div className="bg-amber-950/15 border border-amber-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                <Hourglass className="w-4 h-4" />
                <span>QUEUE ({stationQueues.length})</span>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onBookQueue(station);
                }}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add to Queue
              </button>
            </div>

            {stationQueues.length === 0 ? (
              <p className="text-xs text-slate-400">
                No one waiting — next customer can book this seat now and wait here.
              </p>
            ) : (
              <div className="space-y-2">
                {stationQueues.map((q, index) => (
                  <div
                    key={q.id}
                    className="bg-slate-900/90 border border-amber-500/25 rounded-xl p-3 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px]">
                          #{index + 1}
                        </span>
                        <span className="font-bold text-white truncate">{q.customerName}</span>
                        {q.customerPhone && (
                          <span className="text-slate-400 font-mono text-[11px]">
                            ({q.customerPhone})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {q.packageName || `${q.bookedMinutes}m`} • {q.players}P •{' '}
                        <span className="text-cyan-300 font-mono font-bold">
                          {formatBDT(q.lockedPrice)}
                        </span>
                        {q.advancePayment > 0 && (
                          <span className="text-emerald-400 ml-1">
                            (Adv: {formatBDT(q.advancePayment)})
                          </span>
                        )}
                      </p>
                      {q.notes && <p className="text-[10px] text-amber-300/80 mt-0.5">{q.notes}</p>}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        title={
                          isOccupied
                            ? 'End current session first to start this queued player'
                            : 'Start this queued session now'
                        }
                        onClick={() => onStartFromQueue(q.id)}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 transition ${
                          isOccupied
                            ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Start
                      </button>
                      <button
                        title="Remove from queue"
                        onClick={() => onRemoveQueue(q.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
