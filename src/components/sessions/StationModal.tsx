import React, { useState, useEffect } from 'react';
import { X, Gamepad2, Plus, Trash2, Sparkles, Clock } from 'lucide-react';
import { GamingStation, StationPackage, StationType } from '../../types';
import { buildDefaultPackages } from '../../utils/storage';
import { formatBDT } from '../../utils/formatters';

interface StationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStation?: GamingStation | null;
  onSave: (station: GamingStation) => void;
}

const STATION_TYPES: StationType[] = ['PS5', 'PS4', 'Xbox', 'Pandora', 'PC', 'Racing', 'VR', 'Billiards', 'Other'];

export const StationModal: React.FC<StationModalProps> = ({
  isOpen,
  onClose,
  initialStation,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [type, setType] = useState<StationType>('PS5');
  const [hourlyRate, setHourlyRate] = useState<number>(100);
  const [halfHourRate, setHalfHourRate] = useState<number>(60);
  const [packages, setPackages] = useState<StationPackage[]>([]);
  const [notes, setNotes] = useState('');

  // Quick add custom package inputs
  const [pkgLabel, setPkgLabel] = useState('');
  const [pkgPlayers, setPkgPlayers] = useState<number>(1);
  const [pkgMinutes, setPkgMinutes] = useState<number>(60);
  const [pkgPrice, setPkgPrice] = useState<number>(100);

  useEffect(() => {
    if (isOpen) {
      if (initialStation) {
        setName(initialStation.name);
        setSubtitle(initialStation.subtitle || '');
        setType(initialStation.type);
        setHourlyRate(initialStation.hourlyRate);
        setHalfHourRate(initialStation.halfHourRate ?? Math.round(initialStation.hourlyRate * 0.6));
        setPackages(
          initialStation.packages && initialStation.packages.length > 0
            ? initialStation.packages
            : buildDefaultPackages(
                initialStation.hourlyRate,
                initialStation.halfHourRate ?? Math.round(initialStation.hourlyRate * 0.6)
              )
        );
        setNotes(initialStation.notes || '');
      } else {
        setName('');
        setSubtitle('PlayStation 5');
        setType('PS5');
        setHourlyRate(100);
        setHalfHourRate(60);
        setPackages(buildDefaultPackages(100, 60));
        setNotes('');
      }
    }
  }, [initialStation, isOpen]);

  if (!isOpen) return null;

  const handleRegeneratePackages = () => {
    setPackages(buildDefaultPackages(hourlyRate, halfHourRate));
  };

  const handleAddPackage = () => {
    if (!pkgLabel.trim() || pkgMinutes <= 0) return;
    setPackages([
      ...packages,
      {
        id: `pkg-${Date.now()}`,
        label: pkgLabel.trim(),
        players: pkgPlayers || 1,
        durationMinutes: pkgMinutes,
        price: Math.max(0, pkgPrice),
      },
    ]);
    setPkgLabel('');
  };

  const handleUpdatePackage = (id: string, field: keyof StationPackage, val: any) => {
    setPackages(packages.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
  };

  const handleRemovePackage = (id: string) => {
    setPackages(packages.filter((p) => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a station name.');
      return;
    }

    const station: GamingStation = {
      id: initialStation?.id || `st-${Date.now()}`,
      name: name.trim(),
      subtitle: subtitle.trim() || undefined,
      type,
      hourlyRate: Math.max(0, hourlyRate),
      halfHourRate: Math.max(0, halfHourRate),
      packages: packages.length > 0 ? packages : buildDefaultPackages(hourlyRate, halfHourRate),
      status: initialStation?.status || 'available',
      currentSessionId: initialStation?.currentSessionId,
      notes: notes.trim() || undefined,
    };

    onSave(station);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {initialStation ? `Edit Station — ${initialStation.name}` : 'Add New Gaming Station'}
              </h2>
              <p className="text-xs text-slate-400">
                Set 30-min rate, 1-hour rate & dropdown packages for quick session start
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Station Name & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Station / Seat Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PS5 Seat 1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Platform / Model Subtitle
              </label>
              <input
                type="text"
                placeholder="e.g. PlayStation 5, RTX 4080"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Type & Base Rates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as StationType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {STATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                30 Min Price (৳) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-amber-400 font-mono text-sm">৳</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={halfHourRate}
                  onChange={(e) => setHalfHourRate(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cyan-300 mb-1">
                1 Hour Price (৳) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-cyan-400 font-mono text-sm">৳</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* Configured Dropdown Packages */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Pre-Configured Session Packages ({packages.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Shown directly in the Package dropdown when starting a session or queue
                </p>
              </div>
              <button
                type="button"
                onClick={handleRegeneratePackages}
                className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition"
              >
                <Sparkles className="w-3 h-3" />
                Auto-fill from Rates
              </button>
            </div>

            {/* Existing Packages List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="grid grid-cols-12 gap-2 items-center bg-slate-800/60 border border-slate-700/70 rounded-xl p-2 text-xs"
                >
                  <input
                    type="text"
                    value={pkg.label}
                    onChange={(e) => handleUpdatePackage(pkg.id, 'label', e.target.value)}
                    className="col-span-5 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-medium"
                  />
                  <div className="col-span-2 flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      value={pkg.players}
                      onChange={(e) =>
                        handleUpdatePackage(pkg.id, 'players', Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-center font-mono text-white"
                    />
                    <span className="text-[10px] text-slate-400">p</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    <input
                      type="number"
                      min="5"
                      value={pkg.durationMinutes}
                      onChange={(e) =>
                        handleUpdatePackage(
                          pkg.id,
                          'durationMinutes',
                          Math.max(5, parseInt(e.target.value) || 30)
                        )
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-center font-mono text-white"
                    />
                    <span className="text-[10px] text-slate-400">m</span>
                  </div>
                  <div className="col-span-2 relative">
                    <span className="absolute left-1.5 top-1 text-cyan-400 font-mono">৳</span>
                    <input
                      type="number"
                      min="0"
                      value={pkg.price}
                      onChange={(e) =>
                        handleUpdatePackage(pkg.id, 'price', Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-4 pr-1 py-1 text-right font-mono font-bold text-cyan-300"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePackage(pkg.id)}
                    className="col-span-1 flex justify-center text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Custom Package Row */}
            <div className="grid grid-cols-12 gap-2 items-center bg-slate-950/60 border border-dashed border-slate-700 rounded-xl p-2 text-xs">
              <input
                type="text"
                placeholder="Custom pkg (e.g. 2 Hours VIP)"
                value={pkgLabel}
                onChange={(e) => setPkgLabel(e.target.value)}
                className="col-span-5 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
              />
              <input
                type="number"
                min="1"
                title="Players"
                value={pkgPlayers}
                onChange={(e) => setPkgPlayers(Math.max(1, parseInt(e.target.value) || 1))}
                className="col-span-2 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-center font-mono text-white"
              />
              <input
                type="number"
                min="10"
                title="Minutes"
                value={pkgMinutes}
                onChange={(e) => setPkgMinutes(Math.max(10, parseInt(e.target.value) || 60))}
                className="col-span-2 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-center font-mono text-white"
              />
              <input
                type="number"
                min="0"
                title="Price BDT"
                value={pkgPrice}
                onChange={(e) => setPkgPrice(Math.max(0, parseInt(e.target.value) || 0))}
                className="col-span-2 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-right font-mono text-cyan-300"
              />
              <button
                type="button"
                onClick={handleAddPackage}
                className="col-span-1 h-7 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg flex items-center justify-center"
                title="Add Package"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Hardware / Station Notes
            </label>
            <input
              type="text"
              placeholder="e.g. 4K 120Hz OLED, 2 DualSense controllers"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

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
              className="px-5 py-2 text-sm font-bold text-black bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center gap-2"
            >
              <Gamepad2 className="w-4 h-4" />
              {initialStation ? 'Save Station' : 'Create Station'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
