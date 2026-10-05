import React from 'react';
import { CloudRain, Droplets, Calendar, AlertTriangle, Code2 } from 'lucide-react';
import { WeatherData } from '../types/farm.ts';

interface WeatherCardProps {
  data: WeatherData | null;
  isLoading: boolean;
  onOpenRawJson: (title: string, raw: any) => void;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ data, isLoading, onOpenRawJson }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-36 bg-stone-200 rounded-md"></div>
          <div className="h-5 w-20 bg-stone-200 rounded-md"></div>
        </div>
        <div className="h-24 bg-stone-100 rounded-xl mb-4"></div>
        <div className="h-4 w-48 bg-stone-100 rounded"></div>
      </div>
    );
  }

  const totalRain = data?.totalRain7DaysMm ?? 0;
  const isSufficient = totalRain >= 20.0;
  const daily = data?.daily || [];

  // Find max rain in the week to scale bar heights
  const maxDailyRain = Math.max(...daily.map((d) => d.rainMm), 10);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between gap-2 bg-gradient-to-r from-blue-950/5 via-stone-50 to-emerald-950/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <CloudRain className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900 text-base">WEATHER FORECAST</h3>
                <span className="text-[11px] font-semibold text-stone-500 bg-stone-200/80 px-2 py-0.5 rounded-md">
                  7-Day Rain
                </span>
              </div>
              <p className="text-[11px] text-stone-500">Open-Meteo High-Resolution Model</p>
            </div>
          </div>

          <button
            onClick={() => onOpenRawJson('Open-Meteo 7-Day Forecast', data?.rawResponse || data)}
            className="text-[11px] font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-lg border border-stone-200 flex items-center gap-1 transition"
            title="Inspect raw Open-Meteo JSON"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Raw Forecast</span>
          </button>
        </div>

        {/* Independent Error Display */}
        {data?.error && (
          <div className="m-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{data.error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Cumulative 7-Day Total Highlight Banner */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium mb-0.5">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span>7-Day Expected Rainfall</span>
              </div>
              <div className="text-3xl font-extrabold text-stone-900 tracking-tight font-mono">
                {totalRain.toFixed(1)}{' '}
                <span className="text-base font-normal text-stone-500">mm</span>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                  isSufficient
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}
              >
                {isSufficient ? '≥ 20 mm Adequate' : '< 20 mm Low Moisture'}
              </span>
              <p className="text-[10px] text-stone-400 mt-1">Germination baseline: 20 mm</p>
            </div>
          </div>

          {/* Daily Precipitation Breakdown Bars */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600 mb-2">
              <span>Daily Rain Distribution</span>
              <span className="text-stone-400 font-normal">Next 7 days</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 pt-4 pb-1">
              {daily.map((day, idx) => {
                const heightPercent = Math.max(12, Math.round((day.rainMm / maxDailyRain) * 100));
                const isHeavy = day.rainMm >= 10;
                const isModerate = day.rainMm >= 3;

                return (
                  <div key={day.date || idx} className="flex flex-col items-center gap-1.5">
                    {/* Numeric value */}
                    <span className="text-[10px] font-mono font-medium text-stone-700">
                      {day.rainMm.toFixed(0)}
                    </span>

                    {/* Bar container */}
                    <div className="w-full h-16 bg-stone-100 rounded-lg flex items-end p-0.5">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-md transition-all ${
                          isHeavy
                            ? 'bg-blue-600'
                            : isModerate
                            ? 'bg-blue-400'
                            : day.rainMm > 0
                            ? 'bg-blue-300'
                            : 'bg-stone-200'
                        }`}
                        title={`${day.dayName}: ${day.rainMm} mm`}
                      />
                    </div>

                    {/* Day name label */}
                    <span className="text-[10px] font-semibold text-stone-500 uppercase">
                      {day.dayName.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer: Last Updated & Mandatory Credit */}
      <div className="p-3 bg-stone-50 border-t border-stone-100 text-[11px] text-stone-500 flex flex-wrap items-center justify-between gap-1">
        <span>
          Updated: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
        </span>
        <span className="font-medium text-stone-600">
          Weather data: Open-Meteo (CC BY 4.0)
        </span>
      </div>
    </div>
  );
};
