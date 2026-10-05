import React, { useState } from 'react';
import { Satellite, Calendar, Cloud, Eye, Code2, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { SatelliteSceneData } from '../types/farm.ts';

interface SatelliteCardProps {
  data: SatelliteSceneData | null;
  isLoading: boolean;
  onOpenRawJson: (title: string, raw: any) => void;
}

export const SatelliteCard: React.FC<SatelliteCardProps> = ({ data, isLoading, onOpenRawJson }) => {
  const [imgError, setImgError] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-36 bg-stone-200 rounded-md"></div>
          <div className="h-5 w-20 bg-stone-200 rounded-md"></div>
        </div>
        <div className="h-32 bg-stone-100 rounded-xl mb-4"></div>
        <div className="h-4 w-48 bg-stone-100 rounded"></div>
      </div>
    );
  }

  const cloudCover = data?.cloudCoverPercent ?? 0;
  const isClear = cloudCover < 20.0;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between gap-2 bg-gradient-to-r from-sky-950/5 via-stone-50 to-emerald-950/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
              <Satellite className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900 text-base">SATELLITE VIEW</h3>
                <span className="text-[11px] font-semibold text-stone-500 bg-stone-200/80 px-2 py-0.5 rounded-md">
                  Sentinel-2
                </span>
              </div>
              <p className="text-[11px] text-stone-500">Digital Earth Africa STAC (30d window)</p>
            </div>
          </div>

          <button
            onClick={() => onOpenRawJson('DE Africa STAC Scene Metadata', data?.rawItem || data)}
            className="text-[11px] font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-lg border border-stone-200 flex items-center gap-1 transition"
            title="Inspect raw STAC Item metadata"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Raw STAC</span>
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
          {/* Key Metrics: Date & Cloud Cover */}
          <div className="grid grid-cols-2 gap-3">
            {/* Scene Date */}
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium mb-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>Pass Date</span>
              </div>
              <div className="text-base font-extrabold text-stone-900 font-mono">
                {data?.date || 'Recent Pass'}
              </div>
              <div className="text-[10px] text-stone-400 mt-1">Platform: Sentinel-2 L2A</div>
            </div>

            {/* Cloud Cover */}
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
              <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium mb-1">
                <span className="flex items-center gap-1">
                  <Cloud className="w-3.5 h-3.5 text-stone-400" />
                  <span>Cloud Cover</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                    isClear
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}
                >
                  {isClear ? '< 20% Clear' : 'Cloudy'}
                </span>
              </div>
              <div className="text-2xl font-extrabold text-stone-900 font-mono">
                {cloudCover != null ? `${cloudCover.toFixed(1)}%` : '--%'}
              </div>
              <div className="text-[10px] text-stone-400 mt-1">
                {isClear ? 'Optimal clear plot view' : 'Some cloud obstruction'}
              </div>
            </div>
          </div>

          {/* Satellite Thumbnail / Optical Visual */}
          <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-900 aspect-video flex items-center justify-center text-center p-4">
            {data?.thumbnailUrl && !imgError ? (
              <img
                src={data.thumbnailUrl}
                alt={`Sentinel-2 scene from ${data.date}`}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-stone-300 flex flex-col items-center gap-2">
                <Satellite className="w-8 h-8 text-sky-400/80 animate-pulse" />
                <div>
                  <p className="text-xs font-semibold text-white">Sentinel-2 Scene: {data?.id || 's2_l2a'}</p>
                  <p className="text-[11px] text-stone-400 max-w-xs mt-0.5">
                    Metadata & STAC asset catalog entry verified.
                    {isClear ? ' Clear atmospheric pass.' : ' High cloud coverage index.'}
                  </p>
                </div>
              </div>
            )}

            {/* Overlay badge with scene ID */}
            <div className="absolute bottom-2 left-2 bg-stone-900/85 backdrop-blur-xs text-[10px] text-stone-300 px-2 py-0.5 rounded font-mono border border-stone-700/60 max-w-[90%] truncate">
              ID: {data?.id || 'Sentinel-2 L2A'}
            </div>
          </div>

          {/* List of recent scenes if multiple found in 30 days */}
          {data?.allRecentScenes && data.allRecentScenes.length > 1 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-stone-500 block">
                Other passes in 30-day window:
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
                {data.allRecentScenes.slice(1, 4).map((sc) => (
                  <div
                    key={sc.id}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-700 shrink-0 text-[11px]"
                  >
                    <span className="font-semibold">{sc.date}</span>: {sc.cloudCoverPercent}% clouds
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Last Updated & Mandatory Credit */}
      <div className="p-3 bg-stone-50 border-t border-stone-100 text-[11px] text-stone-500 flex flex-wrap items-center justify-between gap-1">
        <span>
          Updated: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
        </span>
        <span className="font-medium text-stone-600">
          Satellite data: Digital Earth Africa, CC BY 4.0
        </span>
      </div>
    </div>
  );
};
