import React from 'react';
import { Sprout, Globe, Sliders, Info, ShieldCheck, Sparkles } from 'lucide-react';
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
}

export const Header: React.FC<HeaderProps> = ({
  currentProvider,
  region,
  onRegionChange,
  demoMode,
  onToggleDemoMode,
  onOpenThresholds,
  onOpenAbout,
  cropPresetName,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-emerald-900 text-stone-100 shadow-md border-b border-emerald-800">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Top row: Brand & Quick actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center text-emerald-200 shadow-inner">
              <Sprout className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white font-serif">
                  FarmSense
                </h1>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-800/80 border border-emerald-600 text-emerald-200">
                  {region === 'africa' ? 'Pilot Phase 1' : 'Phase 2 Architecture'}
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 hidden sm:block">
                Smallholder Farm Decision Assistant • Live African Geo-APIs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Threshold tuning button */}
            <button
              onClick={onOpenThresholds}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-800/70 hover:bg-emerald-700/80 border border-emerald-700 text-emerald-100 text-xs font-medium flex items-center gap-1.5 transition active:scale-95"
              title="Tune Decision Thresholds & Crops"
            >
              <Sliders className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">Rules & Crop</span>
            </button>

            {/* About / Info */}
            <button
              onClick={onOpenAbout}
              className="p-2 rounded-lg bg-emerald-800/70 hover:bg-emerald-700/80 border border-emerald-700 text-emerald-100 transition active:scale-95"
              title="API credits & architecture info"
            >
              <Info className="w-4 h-4 text-emerald-300" />
            </button>
          </div>
        </div>

        {/* Second row: Swappable Region Selector + Demo Mode Toggle */}
        <div className="mt-3 pt-2.5 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Swappable Data Provider Region Selector */}
          <div className="flex items-center gap-1 bg-emerald-950/60 p-1 rounded-lg border border-emerald-800">
            <span className="text-[11px] font-medium text-emerald-300/80 px-1.5 flex items-center gap-1">
              <Globe className="w-3 h-3" /> Region:
            </span>
            <button
              onClick={() => onRegionChange('africa')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                region === 'africa'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-300 hover:text-white hover:bg-emerald-900/60'
              }`}
            >
              Africa – Live (Kenya)
            </button>
            <button
              onClick={() => onRegionChange('india')}
              className={`px-2.5 py-1 rounded font-medium transition flex items-center gap-1 ${
                region === 'india'
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'text-emerald-300 hover:text-white hover:bg-emerald-900/60'
              }`}
            >
              India – Coming Soon
            </button>
          </div>

          {/* Demo Mode Toggle */}
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
        </div>
      </div>
    </header>
  );
};
