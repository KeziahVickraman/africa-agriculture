import React from 'react';
import { TrafficCone, CheckCircle2, AlertCircle, AlertTriangle, Sliders, ArrowRight } from 'lucide-react';
import { FarmDecisions } from '../types/farm.ts';
import { ThresholdConfig } from '../config/thresholds.ts';

interface DecisionsPanelProps {
  decisions: FarmDecisions;
  thresholdConfig: ThresholdConfig;
  onOpenThresholds: () => void;
}

export const DecisionsPanel: React.FC<DecisionsPanelProps> = ({
  decisions,
  thresholdConfig,
  onOpenThresholds,
}) => {
  const getTrafficIcon = (status: 'green' | 'amber' | 'red') => {
    switch (status) {
      case 'green':
        return (
          <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-700 flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        );
      case 'amber':
        return (
          <div className="w-10 h-10 rounded-full bg-amber-100 border-2 border-amber-500 text-amber-700 flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
      case 'red':
        return (
          <div className="w-10 h-10 rounded-full bg-red-100 border-2 border-red-500 text-red-700 flex items-center justify-center shrink-0 shadow-sm">
            <AlertCircle className="w-6 h-6" />
          </div>
        );
    }
  };

  const getTrafficBadge = (status: 'green' | 'amber' | 'red', verdict: string) => {
    const colorClasses = {
      green: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      amber: 'bg-amber-50 text-amber-800 border-amber-300',
      red: 'bg-red-50 text-red-800 border-red-300',
    }[status];

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${colorClasses}`}>
        <span
          className={`w-2 h-2 rounded-full ${
            status === 'green' ? 'bg-emerald-600' : status === 'amber' ? 'bg-amber-500' : 'bg-red-600'
          }`}
        />
        {verdict}
      </span>
    );
  };

  const items = [decisions.lime, decisions.planting, decisions.satellite];

  return (
    <section className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold">
            <TrafficCone className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">
              FARM DECISIONS
            </h2>
            <p className="text-xs text-stone-500">
              Transparent agronomic rules • Crop: <span className="font-semibold text-stone-700">{thresholdConfig.cropPresetName}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onOpenThresholds}
          className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition active:scale-95"
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-700" />
          <span>Tune Thresholds</span>
        </button>
      </div>

      {/* 3 Decision Cards */}
      <div className="divide-y divide-stone-100">
        {items.map((decision) => (
          <div
            key={decision.id}
            className={`p-4 sm:p-5 transition hover:bg-stone-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              decision.status === 'red'
                ? 'bg-red-50/20'
                : decision.status === 'amber'
                ? 'bg-amber-50/15'
                : 'bg-emerald-50/10'
            }`}
          >
            <div className="flex items-start gap-3.5 flex-1">
              {getTrafficIcon(decision.status)}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                    {decision.title}
                  </h3>
                  {getTrafficBadge(decision.status, decision.verdict)}
                </div>

                <p className="text-xs font-medium text-stone-700">
                  {decision.recommendation}
                </p>

                <p className="text-[11px] text-stone-500">
                  <span className="font-semibold text-stone-600">Reason:</span> {decision.reason}
                </p>

                <p className="text-[11px] text-stone-400">
                  {decision.details}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer rule logic summary */}
      <div className="p-3 bg-stone-50 border-t border-stone-100 text-[11px] text-stone-500 flex flex-wrap items-center justify-between gap-2">
        <span>
          Rules: Lime (pH &lt; {thresholdConfig.lime.stronglyAcidicCutoff}) • Plant (Rain ≥ {thresholdConfig.planting.minRain7DaysMm}mm &amp; pH ≥ {thresholdConfig.planting.minSoilPh}) • Satellite (Clouds &lt; {thresholdConfig.satellite.maxCloudCoverPercent}%)
        </span>
        <button
          onClick={onOpenThresholds}
          className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
        >
          Change rules &amp; crops <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </section>
  );
};
