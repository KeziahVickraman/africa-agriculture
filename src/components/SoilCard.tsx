import React, { useState } from 'react';
import { Layers, HelpCircle, Code2, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { SoilData } from '../types/farm.ts';

interface SoilCardProps {
  data: SoilData | null;
  isLoading: boolean;
  onOpenRawJson: (title: string, raw: any) => void;
}

export const SoilCard: React.FC<SoilCardProps> = ({ data, isLoading, onOpenRawJson }) => {
  const [showSubsoil, setShowSubsoil] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-36 bg-stone-200 rounded-md"></div>
          <div className="h-5 w-20 bg-stone-200 rounded-md"></div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="h-20 bg-stone-100 rounded-xl"></div>
          <div className="h-20 bg-stone-100 rounded-xl"></div>
          <div className="h-20 bg-stone-100 rounded-xl"></div>
          <div className="h-20 bg-stone-100 rounded-xl"></div>
        </div>
        <div className="h-4 w-48 bg-stone-100 rounded"></div>
      </div>
    );
  }

  const topsoil = data?.topsoil;
  const subsoil = data?.subsoil;
  const hasSubsoil = Boolean(subsoil?.ph?.value || subsoil?.nitrogen?.value);

  // Formatting helper for pH rating
  const getPhBadge = (ph?: number) => {
    if (ph == null) return null;
    if (ph < 5.5) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
          Strongly Acidic
        </span>
      );
    }
    if (ph <= 6.0) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
          Moderately Acidic
        </span>
      );
    }
    if (ph <= 7.2) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          Optimal Range
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
        Alkaline
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between gap-2 bg-gradient-to-r from-amber-950/5 via-stone-50 to-emerald-950/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900 text-base">SOIL METRICS</h3>
                <span className="text-[11px] font-semibold text-stone-500 bg-stone-200/80 px-2 py-0.5 rounded-md">
                  iSDAsoil
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Topsoil layer (0–20 cm) {hasSubsoil && '• Subsoil (20-50 cm)'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenRawJson('iSDAsoil Raw API Response', data?.rawResponse || data)}
            className="text-[11px] font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-lg border border-stone-200 flex items-center gap-1 transition"
            title="Inspect raw JSON returned from iSDA API"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Raw JSON</span>
          </button>
        </div>

        {/* Independent Error Display */}
        {data?.error && (
          <div className="m-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{data.error}</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Displaying benchmark sample soil profile for Nakuru pilot coordinates.
              </p>
            </div>
          </div>
        )}

        {/* 4 Core Topsoil Indicators (0-20 cm) */}
        <div className="p-4 sm:p-5 grid grid-cols-2 gap-3">
          {/* 1. pH */}
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium mb-1">
                <span>Topsoil pH</span>
                {getPhBadge(topsoil?.ph?.value)}
              </div>
              <div className="text-2xl font-extrabold text-stone-900 tracking-tight font-mono">
                {topsoil?.ph?.value != null ? topsoil.ph.value.toFixed(2) : '--'}
              </div>
            </div>
            <div className="text-[10px] text-stone-400 mt-2">
              Unit: {topsoil?.ph?.unit || 'pH (H2O)'} • 0–20 cm
            </div>
          </div>

          {/* 2. Nitrogen */}
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 flex flex-col justify-between">
            <div>
              <div className="text-[11px] text-stone-500 font-medium mb-1">Total Nitrogen (N)</div>
              <div className="text-2xl font-extrabold text-stone-900 tracking-tight font-mono">
                {topsoil?.nitrogen?.value != null ? topsoil.nitrogen.value.toFixed(2) : '--'}
              </div>
            </div>
            <div className="text-[10px] text-stone-400 mt-2">
              Unit: {topsoil?.nitrogen?.unit || 'g/kg'} • 0–20 cm
            </div>
          </div>

          {/* 3. Organic Carbon */}
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 flex flex-col justify-between">
            <div>
              <div className="text-[11px] text-stone-500 font-medium mb-1">Organic Carbon (SOC)</div>
              <div className="text-2xl font-extrabold text-stone-900 tracking-tight font-mono">
                {topsoil?.organicCarbon?.value != null ? topsoil.organicCarbon.value.toFixed(1) : '--'}
              </div>
            </div>
            <div className="text-[10px] text-stone-400 mt-2">
              Unit: {topsoil?.organicCarbon?.unit || 'g/kg'} • 0–20 cm
            </div>
          </div>

          {/* 4. Texture */}
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 flex flex-col justify-between">
            <div>
              <div className="text-[11px] text-stone-500 font-medium mb-1">Soil Texture Class</div>
              <div className="text-sm font-bold text-stone-900 leading-snug line-clamp-2">
                {topsoil?.texture?.classification || 'Sandy Clay Loam'}
              </div>
            </div>
            <div className="text-[10px] text-stone-500 mt-2 flex items-center gap-1 font-mono">
              <span>S:{topsoil?.texture?.sandPercent ?? 52}%</span>
              <span>C:{topsoil?.texture?.clayPercent ?? 28}%</span>
              <span>Si:{topsoil?.texture?.siltPercent ?? 20}%</span>
            </div>
          </div>
        </div>

        {/* Subsoil (20-50 cm) Collapsible Section */}
        {hasSubsoil && (
          <div className="px-4 pb-2">
            <button
              onClick={() => setShowSubsoil(!showSubsoil)}
              className="w-full py-2 px-3 rounded-xl bg-stone-100/70 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center justify-between transition"
            >
              <span>Subsoil Layer (20–50 cm) Data</span>
              {showSubsoil ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showSubsoil && (
              <div className="mt-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-stone-500 block">Subsoil pH</span>
                  <span className="font-bold text-stone-800 font-mono">
                    {subsoil?.ph?.value != null ? subsoil.ph.value.toFixed(2) : '--'}
                  </span>
                  <span className="text-[9px] text-stone-400 block">{subsoil?.ph?.unit || 'pH'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Subsoil Nitrogen</span>
                  <span className="font-bold text-stone-800 font-mono">
                    {subsoil?.nitrogen?.value != null ? subsoil.nitrogen.value.toFixed(2) : '--'}
                  </span>
                  <span className="text-[9px] text-stone-400 block">{subsoil?.nitrogen?.unit || 'g/kg'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Subsoil Organic C</span>
                  <span className="font-bold text-stone-800 font-mono">
                    {subsoil?.organicCarbon?.value != null ? subsoil.organicCarbon.value.toFixed(1) : '--'}
                  </span>
                  <span className="text-[9px] text-stone-400 block">{subsoil?.organicCarbon?.unit || 'g/kg'}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Last Updated & Mandatory Credit */}
      <div className="p-3 bg-stone-50 border-t border-stone-100 text-[11px] text-stone-500 flex flex-wrap items-center justify-between gap-1">
        <span>
          Updated: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
        </span>
        <span className="font-medium text-stone-600">
          Soil data: iSDA / Digital Earth Africa, CC BY 4.0
        </span>
      </div>
    </div>
  );
};
