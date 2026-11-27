import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Monitor,
  Car,
  Headphones,
  CircleDot,
  Tv,
  Plus,
  Play,
  ShoppingBag,
  CreditCard,
  Hourglass,
  Pause,
  Info,
} from 'lucide-react';
import {
  GamingStation,
  GamingSession,
  Employee,
  Product,
  QueueBooking,
} from '../../types';
import { formatBDT } from '../../utils/formatters';
import { calculateLiveSessionTimer } from '../../utils/calculations';
import { StartSessionModal } from './StartSessionModal';
import { AddProductsModal } from './AddProductsModal';
import { StationModal } from './StationModal';
import { ExtendSessionModal } from './ExtendSessionModal';
import { StationDetailsModal } from './StationDetailsModal';
import DB from '../../utils/storage';

interface StationGridProps {
  stations: GamingStation[];
  sessions: GamingSession[];
  queues: QueueBooking[];
  products: Product[];
  currentEmployee: Employee;
  onOpenCheckout: (session: GamingSession) => void;
  onRefresh: () => void;
}

export const StationGrid: React.FC<StationGridProps> = ({
  stations,
  sessions,
  queues,
  products,
  currentEmployee,
  onOpenCheckout,
  onRefresh,
}) => {
  const [filterType, setFilterType] = useState<string>('All');
  const [nowMs, setNowMs] = useState<number>(Date.now());

  // Modals state
  const [sessionModalState, setSessionModalState] = useState<{
    station: GamingStation;
    mode: 'start' | 'queue';
  } | null>(null);
  const [selectedSessionIdForProducts, setSelectedSessionIdForProducts] = useState<string | null>(
    null
  );
  const [stationModalState, setStationModalState] = useState<{
    isOpen: boolean;
    station: GamingStation | null;
  }>({ isOpen: false, station: null });
  const [extendModalState, setExtendModalState] = useState<{
    session: GamingSession;
    station: GamingStation;
  } | null>(null);
  const [detailsStationId, setDetailsStationId] = useState<string | null>(null);

  // Live 1-second timer tick for smooth digital clocks
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStationIcon = (type: string) => {
    switch (type) {
      case 'PS5':
      case 'PS4':
      case 'Xbox':
      case 'Pandora':
        return <Gamepad2 className="w-5 h-5" />;
      case 'PC':
        return <Monitor className="w-5 h-5" />;
      case 'Racing':
        return <Car className="w-5 h-5" />;
      case 'VR':
        return <Headphones className="w-5 h-5" />;
      case 'Billiards':
        return <CircleDot className="w-5 h-5" />;
      default:
        return <Tv className="w-5 h-5" />;
    }
  };

  const handleStartOrQueueSubmit = (data: any) => {
    if (!sessionModalState) return;
    if (sessionModalState.mode === 'queue') {
      const station = sessionModalState.station;
      const basePrice = data.lockedGamingCharge ?? station.hourlyRate;
      const lockedPrice = Math.max(0, basePrice - (data.discountAmount || 0));

      DB.addToQueue({
        stationId: station.id,
        stationName: station.name,
        customerName: data.customerName,
        customerPhone: data.customerPhone || undefined,
        players: data.players,
        packageId: data.packageId,
        packageName: data.packageName,
        bookedMinutes: data.bookedMinutes || 60,
        basePrice,
        discountAmount: data.discountAmount || 0,
        lockedPrice,
        advancePayment: data.advancePayment || 0,
        advanceMethod: data.advanceMethod || 'Cash',
        isCustomTime: data.isCustomTime,
        customStartTime: data.customStartTime,
        customEndTime: data.customEndTime,
        notes: data.notes,
        createdByEmployeeId: currentEmployee.id,
        createdByEmployeeName: currentEmployee.name,
      });
    } else {
      const customWindow =
        data.isCustomTime && data.customStartTime && data.customEndTime
          ? `${data.customStartTime} - ${data.customEndTime}`
          : undefined;

      DB.startSession(
        data.stationId,
        data.customerName,
        data.customerPhone,
        data.players,
        data.advancePayment,
        currentEmployee,
        data.packageId,
        data.packageName,
        data.hourlyRateOverride,
        {
          bookedMinutes: data.bookedMinutes,
          lockedGamingCharge: data.lockedGamingCharge,
          discountAmount: data.discountAmount,
          advanceMethod: data.advanceMethod,
          isCustomTime: data.isCustomTime,
          customTimeWindow: customWindow,
          notes: data.notes,
        }
      );
    }
    onRefresh();
  };

  const handleStartFromQueue = (queueId: string) => {
    const res = DB.startQueuedSession(queueId, currentEmployee);
    if (!res.success) {
      alert(res.error || 'Could not start queued session.');
      return;
    }
    setDetailsStationId(null);
    onRefresh();
  };

  const handleRemoveQueue = (queueId: string) => {
    DB.removeFromQueue(queueId);
    onRefresh();
  };

  const handleTogglePause = (sessionId: string) => {
    DB.togglePauseSession(sessionId);
    onRefresh();
  };

  const handleConfirmExtend = (sessionId: string, addedMinutes: number, addedCharge: number) => {
    DB.extendSession(sessionId, addedMinutes, addedCharge, currentEmployee);
    onRefresh();
  };

  const handleCancelSession = (sessionId: string) => {
    DB.cancelActiveSession(sessionId, currentEmployee);
    onRefresh();
  };

  const handleSaveStation = (station: GamingStation) => {
    DB.saveStation(station);
    onRefresh();
  };

  const filteredStations = stations.filter((st) => {
    return filterType === 'All' || st.type === filterType;
  });

  const occupiedCount = stations.filter((s) => s.status === 'occupied').length;
  const availableCount = stations.filter((s) => s.status === 'available').length;
  const totalWaitingQueue = queues.filter((q) => q.status === 'waiting').length;

  // Details modal lookup
  const detailsStation = detailsStationId
    ? stations.find((s) => s.id === detailsStationId) || null
    : null;
  const detailsSession =
    detailsStation && detailsStation.status === 'occupied'
      ? sessions.find((s) => s.stationId === detailsStation.id && s.status === 'active') || null
      : null;
  const detailsTimer = detailsSession ? calculateLiveSessionTimer(detailsSession, nowMs) : null;
  const detailsQueues = detailsStation
    ? queues.filter((q) => q.stationId === detailsStation.id && q.status === 'waiting')
    : [];

  return (
    <div className="space-y-6">
      {/* Top Controls & Status Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4">
        {/* Status Counts */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            {occupiedCount} In-Game
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {availableCount} Available
          </div>
          {totalWaitingQueue > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Hourglass className="w-3.5 h-3.5" />
              {totalWaitingQueue} In Queue
            </div>
          )}
        </div>

        {/* Station Type Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['All', 'PS5', 'PS4', 'Xbox', 'Pandora', 'PC', 'Racing', 'VR', 'Billiards'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  filterType === t
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Compact Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStations.map((station) => {
          const isOccupied = station.status === 'occupied';
          const session = isOccupied
            ? sessions.find((s) => s.stationId === station.id && s.status === 'active')
            : null;
          const stationQueueList = queues.filter(
            (q) => q.stationId === station.id && q.status === 'waiting'
          );

          const timerInfo = session ? calculateLiveSessionTimer(session, nowMs) : null;
          const productSubtotal = session
            ? session.productItems.reduce((acc, p) => acc + p.lineTotal, 0)
            : 0;
          const productCount = session
            ? session.productItems.reduce((acc, p) => acc + p.quantity, 0)
            : 0;

          const isFinished = Boolean(timerInfo?.isTimeFinished);
          const isPaused = Boolean(timerInfo?.isPaused);

          return (
            <div
              key={station.id}
              onClick={() => setDetailsStationId(station.id)}
              className={`cursor-pointer rounded-2xl border transition relative overflow-hidden flex flex-col justify-between group ${
                isFinished
                  ? 'bg-[#11141E] border-rose-500/60 shadow-lg shadow-rose-500/10'
                  : isOccupied
                  ? 'bg-[#111520] border-cyan-500/40 hover:border-cyan-400/70 shadow-lg shadow-cyan-500/5'
                  : 'bg-[#0F131C] border-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                {/* 1. Big Station Name + Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight leading-tight group-hover:text-cyan-300 transition">
                      {station.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {station.subtitle || station.type} •{' '}
                      <span className="font-mono text-slate-300">
                        {formatBDT(station.halfHourRate ?? Math.round(station.hourlyRate * 0.6))}/30m
                      </span>{' '}
                      • <span className="font-mono text-slate-300">{formatBDT(station.hourlyRate)}/1h</span>
                    </p>
                  </div>

                  {isOccupied && timerInfo ? (
                    <span
                      className={`shrink-0 text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase tracking-wider text-center leading-tight ${
                        isFinished
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                          : isPaused
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                          : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                      }`}
                    >
                      {isFinished ? (
                        <>
                          TIME
                          <br />
                          FINISHED
                        </>
                      ) : isPaused ? (
                        'PAUSED'
                      ) : (
                        'LIVE'
                      )}
                    </span>
                  ) : (
                    <span className="shrink-0 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 uppercase tracking-wider">
                      AVAILABLE
                    </span>
                  )}
                </div>

                {/* 2. Huge Timer + Highlighted Customer Box (Occupied) OR Ready State (Available) */}
                {isOccupied && session && timerInfo ? (
                  <div className="space-y-3">
                    {/* Giant Timer */}
                    <div className="text-center py-1">
                      <div
                        className={`text-4xl sm:text-[42px] font-black font-mono tracking-wider leading-none ${
                          isFinished
                            ? 'text-rose-400'
                            : isPaused
                            ? 'text-amber-300'
                            : 'text-cyan-300'
                        }`}
                      >
                        {timerInfo.remainingClock}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        {isFinished
                          ? 'Time finished'
                          : isPaused
                          ? 'Session paused'
                          : timerInfo.hasBookedDuration
                          ? 'Remaining time'
                          : 'Elapsed time'}
                      </p>
                    </div>

                    {/* Customer Highlight Box (matches Screenshot 1) */}
                    <div className="bg-[#0B0E15] border border-slate-800/90 rounded-2xl p-3 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                        CUSTOMER
                      </span>
                      <div className="text-xl font-extrabold text-cyan-300 leading-tight truncate mt-0.5">
                        {session.customerName}
                      </div>
                      {session.customerPhone && (
                        <div className="text-xs font-mono text-slate-400 mt-0.5">
                          {session.customerPhone}
                        </div>
                      )}
                    </div>

                    {/* Compact Info Strip (Bill + Snacks + Queue badge + Click hint) */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">
                          {formatBDT(timerInfo.currentCharge + productSubtotal)}
                        </span>
                        {productCount > 0 && (
                          <span className="text-purple-300 font-semibold">
                            • {productCount} snacks
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {stationQueueList.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                            ⏳ {stationQueueList.length} Queue
                          </span>
                        )}
                        <span className="text-slate-500 flex items-center gap-0.5 group-hover:text-cyan-400 transition">
                          <Info className="w-3 h-3" /> Details
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-5 text-center space-y-2">
                    <div className="w-11 h-11 rounded-2xl bg-slate-800/70 text-slate-400 flex items-center justify-center mx-auto">
                      {getStationIcon(station.type)}
                    </div>
                    <p className="text-xs text-slate-400">Ready for next session</p>
                    {stationQueueList.length > 0 && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                        <Hourglass className="w-3.5 h-3.5" />
                        #1 Next: {stationQueueList[0].customerName}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Compact Action Buttons */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="pt-3 border-t border-slate-800/80"
                >
                  {isOccupied && session ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedSessionIdForProducts(session.id)}
                        className="flex-1 py-2 px-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        + Products
                      </button>

                      <button
                        onClick={() => onOpenCheckout(session)}
                        className="flex-1 py-2 px-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 shadow-md shadow-emerald-500/15 transition"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        End &amp; settle
                      </button>

                      <button
                        title="Add customer to Queue"
                        onClick={() => setSessionModalState({ station, mode: 'queue' })}
                        className="py-2 px-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-center transition"
                      >
                        <Hourglass className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : stationQueueList.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartFromQueue(stationQueueList[0].id)}
                        className="flex-1 py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition truncate"
                      >
                        <Play className="w-3.5 h-3.5 fill-black shrink-0" />
                        <span className="truncate">Start #1 ({stationQueueList[0].customerName})</span>
                      </button>
                      <button
                        onClick={() => setSessionModalState({ station, mode: 'start' })}
                        className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
                      >
                        + New
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSessionModalState({ station, mode: 'start' })}
                        className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-1.5 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        Start Session
                      </button>
                      <button
                        title="Pre-book into queue"
                        onClick={() => setSessionModalState({ station, mode: 'queue' })}
                        className="py-2.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition"
                      >
                        <Hourglass className="w-3.5 h-3.5" />
                        Queue
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <StartSessionModal
        isOpen={!!sessionModalState}
        onClose={() => setSessionModalState(null)}
        station={sessionModalState?.station || null}
        mode={sessionModalState?.mode || 'start'}
        queuePosition={
          sessionModalState
            ? queues.filter(
                (q) => q.stationId === sessionModalState.station.id && q.status === 'waiting'
              ).length + 1
            : 1
        }
        currentEmployee={currentEmployee}
        onStartSession={handleStartOrQueueSubmit}
      />

      <AddProductsModal
        isOpen={!!selectedSessionIdForProducts}
        onClose={() => setSelectedSessionIdForProducts(null)}
        session={
          selectedSessionIdForProducts
            ? sessions.find((s) => s.id === selectedSessionIdForProducts) || null
            : null
        }
        products={products}
        currentEmployee={currentEmployee}
        onRefresh={onRefresh}
      />

      <StationModal
        isOpen={stationModalState.isOpen}
        onClose={() => setStationModalState({ isOpen: false, station: null })}
        initialStation={stationModalState.station}
        onSave={handleSaveStation}
      />

      <ExtendSessionModal
        isOpen={!!extendModalState}
        onClose={() => setExtendModalState(null)}
        session={extendModalState?.session || null}
        station={extendModalState?.station || null}
        onConfirmExtend={handleConfirmExtend}
      />

      <StationDetailsModal
        isOpen={!!detailsStation}
        onClose={() => setDetailsStationId(null)}
        station={detailsStation}
        session={detailsSession}
        timerInfo={detailsTimer}
        stationQueues={detailsQueues}
        currentEmployee={currentEmployee}
        onStartDirect={(st) => setSessionModalState({ station: st, mode: 'start' })}
        onBookQueue={(st) => setSessionModalState({ station: st, mode: 'queue' })}
        onStartFromQueue={handleStartFromQueue}
        onRemoveQueue={handleRemoveQueue}
        onTogglePause={handleTogglePause}
        onOpenExtend={(sess, st) => setExtendModalState({ session: sess, station: st })}
        onOpenAddProducts={(sess) => setSelectedSessionIdForProducts(sess.id)}
        onOpenCheckout={onOpenCheckout}
        onCancelSession={handleCancelSession}
        onEditStation={(st) => setStationModalState({ isOpen: true, station: st })}
      />
    </div>
  );
};
