import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Users,
  Shield,
  RotateCcw,
  Check,
  Building,
  Palette,
  Image as ImageIcon,
  Gamepad2,
  Plus,
  Edit2,
  Trash2,
  Upload,
} from 'lucide-react';
import { AppSettings, Employee, GamingStation, ThemeColor, WallpaperId } from '../../types';
import { THEME_PALETTES, WALLPAPER_PRESETS } from '../../utils/theme';
import { formatBDT } from '../../utils/formatters';
import { StationModal } from '../sessions/StationModal';
import { StaffModal } from './StaffModal';
import DB from '../../utils/storage';

interface SettingsViewProps {
  settings: AppSettings;
  stations: GamingStation[];
  employees: Employee[];
  currentEmployee: Employee;
  onRefresh: () => void;
}

type SettingsSubPage = 'stations' | 'appearance' | 'shop' | 'staff';

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  stations,
  employees,
  currentEmployee,
  onRefresh,
}) => {
  const [subPage, setSubPage] = useState<SettingsSubPage>('stations');
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Station Add/Edit Modal
  const [stationModalState, setStationModalState] = useState<{
    isOpen: boolean;
    station: GamingStation | null;
  }>({ isOpen: false, station: null });

  // Staff Add/Edit Modal
  const [staffModalState, setStaffModalState] = useState<{
    isOpen: boolean;
    employee: Employee | null;
  }>({ isOpen: false, employee: null });

  const savePartialSettings = (updates: Partial<AppSettings>) => {
    const next = { ...formData, ...updates };
    setFormData(next);
    DB.saveSettings(next);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    onRefresh();
  };

  const handleSaveShopForm = (e: React.FormEvent) => {
    e.preventDefault();
    DB.saveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    onRefresh();
  };

  const handleSwitchEmployee = (emp: Employee) => {
    DB.setCurrentUser(emp);
    onRefresh();
  };

  const handleSaveStation = (station: GamingStation) => {
    DB.saveStation(station);
    onRefresh();
  };

  const handleDeleteStation = (station: GamingStation) => {
    if (station.status === 'occupied') {
      alert(`Cannot remove "${station.name}" while a gaming session is active!`);
      return;
    }
    if (confirm(`Remove gaming station "${station.name}"?`)) {
      const res = DB.deleteStation(station.id);
      if (!res.success) alert(res.error);
      onRefresh();
    }
  };

  const handleUploadWallpaperFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      alert('Please choose an image smaller than 2.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      savePartialSettings({ wallpaperId: 'custom', customWallpaperUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleResetData = () => {
    if (
      confirm(
        'Are you sure you want to reload all initial sample data? Current test transactions will be re-seeded.'
      )
    ) {
      localStorage.clear();
      DB.init();
      window.location.reload();
    }
  };

  const subNavItems: { id: SettingsSubPage; label: string; icon: React.ReactNode }[] = [
    { id: 'stations', label: 'Stations & Pricing', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'appearance', label: 'Theme & Wallpaper', icon: <Palette className="w-4 h-4" /> },
    { id: 'shop', label: 'Shop & Receipts', icon: <Building className="w-4 h-4" /> },
    { id: 'staff', label: 'Staff & Roles', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            Settings Center
          </h2>
          <p className="text-xs text-slate-400">
            Manage gaming stations, color theme, background wallpaper, shop details &amp; staff
          </p>
        </div>

        {savedSuccess && (
          <span className="text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
            <Check className="w-4 h-4" /> Saved &amp; Applied!
          </span>
        )}
      </div>

      {/* Multi-Page Settings Layout: Left Settings Menu + Right Content Page */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Settings Sub-Page Navigation */}
        <div className="lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 flex lg:flex-col gap-1 overflow-x-auto">
          {subNavItems.map((item) => {
            const active = subPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSubPage(item.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition text-left ${
                  active
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Sub-Page Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* ================= SUB-PAGE 1: STATIONS & PRICING ================= */}
          {subPage === 'stations' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-cyan-400" />
                    Stations &amp; Packages Manager ({stations.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Add, edit, or remove PS5, PS4, Xbox, Pandora, PC, VR &amp; Billiards stations and configure 30m/1h rates
                  </p>
                </div>

                <button
                  onClick={() => setStationModalState({ isOpen: true, station: null })}
                  className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add New Station
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stations.map((st) => (
                  <div
                    key={st.id}
                    className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{st.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono font-bold">
                            {st.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {st.subtitle || st.notes || 'Standard station setup'}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          st.status === 'occupied'
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {st.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs bg-slate-900/90 rounded-xl p-2.5 border border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-500 block">30 Min Rate</span>
                        <span className="font-mono font-bold text-amber-300">
                          {formatBDT(st.halfHourRate ?? Math.round(st.hourlyRate * 0.6))}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">1 Hour Rate</span>
                        <span className="font-mono font-bold text-cyan-300">
                          {formatBDT(st.hourlyRate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Packages</span>
                        <span className="font-mono font-bold text-white">
                          {st.packages?.length || 4} presets
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => setStationModalState({ isOpen: true, station: st })}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                        Edit Details &amp; Rates
                      </button>
                      <button
                        onClick={() => handleDeleteStation(st)}
                        disabled={st.status === 'occupied'}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= SUB-PAGE 2: THEME & BACKGROUND WALLPAPER ================= */}
          {subPage === 'appearance' && (
            <div className="space-y-6">
              {/* Color Theme Picker */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Palette className="w-4 h-4 text-cyan-400" />
                    Accent Color Theme
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Customize the highlight &amp; sidebar accent color across the app
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {(Object.keys(THEME_PALETTES) as ThemeColor[]).map((colorKey) => {
                    const p = THEME_PALETTES[colorKey];
                    const selected = (formData.themeColor || 'cyan') === colorKey;
                    return (
                      <button
                        key={colorKey}
                        type="button"
                        onClick={() => savePartialSettings({ themeColor: colorKey })}
                        className={`p-3 rounded-xl border text-left transition flex flex-col gap-2 ${
                          selected
                            ? 'bg-slate-800 border-white shadow-lg'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="w-6 h-6 rounded-full shadow-md"
                            style={{ backgroundColor: p.hex }}
                          />
                          {selected && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-xs font-bold text-white">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Background Wallpaper Picker */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                    App Background Wallpaper
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pick a gaming lounge preset or upload your own shop wallpaper image
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {WALLPAPER_PRESETS.map((wp) => {
                    const selected = (formData.wallpaperId || 'obsidian') === wp.id;
                    return (
                      <button
                        key={wp.id}
                        type="button"
                        onClick={() => savePartialSettings({ wallpaperId: wp.id as WallpaperId })}
                        className={`rounded-xl border overflow-hidden text-left transition ${
                          selected
                            ? 'border-cyan-400 ring-2 ring-cyan-400/30'
                            : 'border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="h-20 w-full relative" style={wp.style}>
                          {selected && (
                            <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <div className="p-2.5 bg-slate-950/90">
                          <span className="font-bold text-white text-xs block">{wp.name}</span>
                          <span className="text-[10px] text-slate-400">{wp.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Image Wallpaper Upload or URL */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">Custom Wallpaper Image</span>
                    <label className="cursor-pointer px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition">
                      <Upload className="w-3.5 h-3.5" />
                      Upload Image from PC
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadWallpaperFile}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Or paste image URL (https://...)"
                      value={formData.customWallpaperUrl || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, customWallpaperUrl: e.target.value })
                      }
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        savePartialSettings({
                          wallpaperId: 'custom',
                          customWallpaperUrl: formData.customWallpaperUrl,
                        })
                      }
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs rounded-xl transition"
                    >
                      Apply URL
                    </button>
                  </div>

                  {/* Dim / Darkness Overlay Slider */}
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <span className="text-xs text-slate-400">
                      Background Dim / Readability Overlay: <strong className="text-white">{formData.wallpaperDim ?? 75}%</strong>
                    </span>
                    <input
                      type="range"
                      min="25"
                      max="95"
                      value={formData.wallpaperDim ?? 75}
                      onChange={(e) =>
                        savePartialSettings({ wallpaperDim: parseInt(e.target.value) || 75 })
                      }
                      className="w-40 accent-cyan-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SUB-PAGE 3: SHOP & RECEIPT SETTINGS ================= */}
          {subPage === 'shop' && (
            <div className="space-y-6">
              <form
                onSubmit={handleSaveShopForm}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5"
              >
                <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Building className="w-4 h-4 text-cyan-400" />
                  Shop Branding &amp; Receipt Configuration
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Shop Name
                    </label>
                    <input
                      type="text"
                      value={formData.shopName}
                      onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Shop Phone
                    </label>
                    <input
                      type="text"
                      value={formData.shopPhone}
                      onChange={(e) => setFormData({ ...formData, shopPhone: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Shop Address
                  </label>
                  <input
                    type="text"
                    value={formData.shopAddress}
                    onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Receipt Footer Message
                  </label>
                  <input
                    type="text"
                    value={formData.receiptFooter}
                    onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Inventory Rules */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Inventory &amp; Printer Settings
                  </h3>

                  <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="font-semibold text-white text-xs block">
                        Allow Negative Stock
                      </span>
                      <p className="text-[11px] text-slate-400">
                        When disabled, products with zero stock cannot be sold or added to sessions.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allowNegativeStock}
                        onChange={(e) =>
                          setFormData({ ...formData, allowNegativeStock: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="font-semibold text-white text-xs block">
                        Thermal Printer Paper Width
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Receipt layout format for thermal POS printers
                      </p>
                    </div>
                    <select
                      value={formData.thermalReceiptWidth}
                      onChange={(e) =>
                        setFormData({ ...formData, thermalReceiptWidth: e.target.value as any })
                      }
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    >
                      <option value="80mm">80mm (Standard POS)</option>
                      <option value="58mm">58mm (Compact Thermal)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-slate-800">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Save Shop Settings
                  </button>
                </div>
              </form>

              {/* Danger Zone: Data Reset */}
              <div className="bg-slate-900/90 border border-rose-900/30 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-rose-400 text-xs block">Reset Sample Data</span>
                  <p className="text-[11px] text-slate-500">
                    Re-populates realistic sample stations, products, dues, and sessions.
                  </p>
                </div>
                <button
                  onClick={handleResetData}
                  className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Demo Data
                </button>
              </div>
            </div>
          )}

          {/* ================= SUB-PAGE 4: STAFF & PERMISSIONS ================= */}
          {subPage === 'staff' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      Owner &amp; Staff Accounts ({employees.length})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Add or remove staff, edit Owner or Staff details, and switch active POS account
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/30">
                    Active: {currentEmployee.name}
                  </span>
                  <button
                    onClick={() => setStaffModalState({ isOpen: true, employee: null })}
                    className="px-3.5 py-2 bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add Staff
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {employees.map((emp) => {
                  const isCurrent = emp.id === currentEmployee.id;
                  const isOwner = emp.role === 'Owner';
                  return (
                    <div
                      key={emp.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition ${
                        isCurrent
                          ? 'bg-purple-500/10 border-purple-500/50 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{emp.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                  ACTIVE NOW
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                              {emp.phone || 'No phone'} • PIN: {emp.pin}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              isOwner
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {emp.role}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 grid grid-cols-2 gap-1 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                          <span>Products: {emp.permissions.canManageProducts ? '✓' : '✕'}</span>
                          <span>Adjust Stock: {emp.permissions.canAdjustStock ? '✓' : '✕'}</span>
                          <span>Discounts: {emp.permissions.canGiveDiscount ? '✓' : '✕'}</span>
                          <span>Create Due: {emp.permissions.canCreateDue ? '✓' : '✕'}</span>
                          <span>Settle Due: {emp.permissions.canSettleDues ? '✓' : '✕'}</span>
                          <span>Accounts: {emp.permissions.canViewAccounting ? '✓' : '✕'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() => handleSwitchEmployee(emp)}
                          disabled={isCurrent}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            isCurrent
                              ? 'bg-emerald-500/15 text-emerald-300 cursor-default'
                              : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {isCurrent ? '✓ Using Account' : 'Switch To'}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setStaffModalState({ isOpen: true, employee: emp })}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-purple-400" />
                            Edit
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Remove "${emp.name}" (${emp.role})?`)) {
                                const res = DB.deleteEmployee(emp.id);
                                if (!res.success) alert(res.error);
                                onRefresh();
                              }
                            }}
                            disabled={isCurrent}
                            title={
                              isCurrent
                                ? 'Switch to another account before removing'
                                : 'Remove account'
                            }
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-30 text-rose-400 border border-rose-500/30 rounded-xl transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Station Modal */}
      <StationModal
        isOpen={stationModalState.isOpen}
        onClose={() => setStationModalState({ isOpen: false, station: null })}
        initialStation={stationModalState.station}
        onSave={handleSaveStation}
      />

      {/* Add / Edit Staff & Owner Modal */}
      <StaffModal
        isOpen={staffModalState.isOpen}
        onClose={() => setStaffModalState({ isOpen: false, employee: null })}
        initialEmployee={staffModalState.employee}
        onSave={(emp) => {
          DB.saveEmployee(emp);
          onRefresh();
        }}
      />
    </div>
  );
};
