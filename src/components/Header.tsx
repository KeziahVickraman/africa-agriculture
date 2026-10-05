import React from 'react';
import { Sprout, Globe, Sliders, Info, Smartphone, Monitor, Edit3 } from 'lucide-react';
import { DataProvider } from '../services/providers/types.ts';

interface HeaderProps {
  currentProvider: DataProvider;
  region: 'africa' | 'india';
  onRegionChange: (region: 'africa' | 'india') => void;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  onOpenThresholds: () => void;
  onOpenAbout: () => void;
  cropPresetName: string;
  activeView: 'web' | 'mobile';
  onToggleView: (view: 'web' | 'mobile') => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProvider,
  region,
  onRegionChange,
  demoMode,
  onToggleDemoMode,
  onOpenThresholds,
  onOpenAbout,
  activeView,
  onToggleView,
  onOpenProfile,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-emerald-950 text-stone-100 shadow-lg border-b border-emerald-800/80">
      <div className="max-w-5xl mx-auto px-4 py-3">
        {/* Top row: Brand, View Mode Toggle & Quick actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-800/90 border border-emerald-500/50 flex items-center justify-center text-emerald-200 shadow-inner">
              <Sprout className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white font-serif">
                  FarmSense
                </h1>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-800/80 border border-emerald-600 text-emerald-200">
                  {region === 'africa' ? 'Kenya Pilot' : 'Tamil Nadu Farm'}
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 hidden sm:block">
                {region === 'africa'
                  ? 'Smallholder Farm Decision Assistant • Live African Geo-APIs'
                  : "South India Family Farm • Chennai / Tamil Nadu • Parents' Decision Portal"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* View Mode Switcher: Parents' View (Mobile) vs My View (Web) */}
            <div className="flex items-center bg-stone-900/90 p-0.5 rounded-lg border border-emerald-800/80 text-xs">
              <button
                onClick={() => onToggleView('mobile')}
                className={`px-2.5 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  activeView === 'mobile'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="Parents' View: Large text, audio voice read-aloud & 7 decision tiles"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Parents' (Mobile)</span>
              </button>
              <button
                onClick={() => onToggleView('web')}
                className={`px-2.5 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  activeView === 'web'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="My View: Full dashboard with soil depth table, 7-day rain chart & mandi prices"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">My View (Web)</span>
              </button>
            </div>

            {/* Farm Profile button (India region) */}
            {region === 'india' && onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700 text-emerald-100 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="Edit Farm Profile (District, Crops, Coordinates, Sowing Date)"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden md:inline">Farm Profile</span>
              </button>
            )}

            {/* Threshold tuning button */}
            <button
              onClick={onOpenThresholds}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700 text-emerald-100 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Tune Decision Thresholds & Rules"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden md:inline">Rules</span>
            </button>

            {/* About / Info */}
            <button
              onClick={onOpenAbout}
              className="p-2 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700 text-emerald-100 transition active:scale-95 cursor-pointer"
              title="API credits & architecture info"
            >
              <Info className="w-4 h-4 text-emerald-300" />
            </button>
          </div>
        </div>

        {/* Second row: Swappable Region Tabs */}
        <div className="mt-3 pt-2.5 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Swappable Data Provider Region Selector */}
          <div className="flex items-center gap-1 bg-emerald-950/90 p-1 rounded-xl border border-emerald-800 shadow-inner">
            <span className="text-[11px] font-semibold text-emerald-300/90 px-1.5 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-emerald-400" /> Region Tab:
            </span>
            <button
              onClick={() => onRegionChange('africa')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                region === 'africa'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-300 hover:text-white hover:bg-emerald-900/60'
              }`}
            >
              Africa – Live (Kenya)
            </button>
            <button
              onClick={() => onRegionChange('india')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                region === 'india'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-emerald-300 hover:text-white hover:bg-emerald-900/60'
              }`}
            >
              South India – Family Farm
            </button>
          </div>

          {/* Demo Mode Toggle (Africa only) or District/Timezone Indicator */}
          {region === 'africa' ? (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
                <input
                  type="checkbox"
                  checked={demoMode}
                  onChange={onToggleDemoMode}
                  className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                />
                <span className="text-[11px] font-medium text-stone-200">
                  Demo Mode {demoMode ? '(Sample Benchmark)' : '(Live APIs)'}
                </span>
              </label>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-stone-300">
              <span className="bg-stone-900 px-2.5 py-1 rounded-lg border border-stone-800 font-mono text-emerald-400">
                Asia/Kolkata (IST)
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
