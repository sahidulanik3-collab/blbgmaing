import React, { useState, useEffect } from 'react';
import { X, Clock, Plus } from 'lucide-react';
import { GamingSession, GamingStation } from '../../types';
import { formatBDT } from '../../utils/formatters';

interface ExtendSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: GamingSession | null;
  station: GamingStation | null;
  onConfirmExtend: (sessionId: string, addedMinutes: number, addedCharge: number) => void;
}

const EXTEND_PRESETS = [
  { label: '+15 Min', minutes: 15 },
  { label: '+30 Min', minutes: 30 },
  { label: '+1 Hour', minutes: 60 },
  { label: '+2 Hours', minutes: 120 },
];

export const ExtendSessionModal: React.FC<ExtendSessionModalProps> = ({
  isOpen,
  onClose,
  session,
  station,
  onConfirmExtend,
}) => {
  const [addedMinutes, setAddedMinutes] = useState<number>(30);
  const [addedCharge, setAddedCharge] = useState<number>(0);

  const computeAutoCharge = (mins: number) => {
    if (!session) return 0;
    const halfRate = station?.halfHourRate ?? Math.round(session.hourlyRate * 0.6);
    const playerMult = session.activePlayers > 1 ? 1 + (session.activePlayers - 1) * 0.5 : 1;
    if (mins === 30) return Math.round(halfRate * playerMult);
    return Math.round((mins / 60) * session.hourlyRate * playerMult);
  };

  useEffect(() => {
    if (isOpen && session) {
      setAddedMinutes(30);
      setAddedCharge(computeAutoCharge(30));
    }
  }, [isOpen, session]);

  if (!isOpen || !session) return null;

  const handleSelectMinutes = (mins: number) => {
    setAddedMinutes(mins);
    setAddedCharge(computeAutoCharge(mins));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addedMinutes <= 0) return;
    onConfirmExtend(session.id, addedMinutes, Math.max(0, addedCharge));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-white text-base">Extend Running Session</h3>
              <p className="text-xs text-slate-400">
                {session.stationName} • {session.customerName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Quick Extend Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {EXTEND_PRESETS.map((p) => (
                <button
                  key={p.minutes}
                  type="button"
                  onClick={() => handleSelectMinutes(p.minutes)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    addedMinutes === p.minutes
                      ? 'bg-cyan-400 text-black border-cyan-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Minutes & Charge */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Extra Minutes *
              </label>
              <input
                type="number"
                min="5"
                step="5"
                required
                value={addedMinutes}
                onChange={(e) => {
                  const m = Math.max(5, parseInt(e.target.value) || 5);
                  setAddedMinutes(m);
                  setAddedCharge(computeAutoCharge(m));
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Extra Charge (৳)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-cyan-400 font-mono text-sm">৳</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={addedCharge}
                  onChange={(e) => setAddedCharge(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 flex justify-between">
            <span>New extra fee added to bill:</span>
            <span className="font-mono font-bold text-white">+{formatBDT(addedCharge)}</span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              Extend (+{addedMinutes}m)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
