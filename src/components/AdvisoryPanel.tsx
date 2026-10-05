import React from 'react';
import { Sparkles, MessageSquare, Send, Globe2, RefreshCw, CheckCheck, AlertCircle } from 'lucide-react';
import { AdvisoryResponse } from '../types/farm.ts';

interface AdvisoryPanelProps {
  advisory: AdvisoryResponse | null;
  isLoading: boolean;
  language: 'en' | 'sw';
  onLanguageChange: (lang: 'en' | 'sw') => void;
  onRefreshAdvisory: () => void;
  onOpenSmsModal: () => void;
}

export const AdvisoryPanel: React.FC<AdvisoryPanelProps> = ({
  advisory,
  isLoading,
  language,
  onLanguageChange,
  onRefreshAdvisory,
  onOpenSmsModal,
}) => {
  const wordCount = advisory?.text ? advisory.text.split(/\s+/).filter(Boolean).length : 0;
  const isOverLimit = wordCount > 80;

  return (
    <section className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-stone-900 text-stone-100 rounded-2xl shadow-md overflow-hidden mb-6 border border-emerald-800">
      {/* Panel Header */}
      <div className="p-4 sm:p-5 border-b border-emerald-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-700/80 border border-emerald-500/40 text-emerald-200 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-white">
                FARMER ADVISORY
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-800/90 text-emerald-200 border border-emerald-600">
                Gemini AI • Max 80 words
              </span>
            </div>
            <p className="text-xs text-emerald-200/70">
              Plain-language synthesis strictly grounded in your soil, satellite &amp; weather data
            </p>
          </div>
        </div>

        {/* English / Swahili Language Toggle */}
        <div className="flex items-center gap-1 bg-emerald-950/80 p-1 rounded-xl border border-emerald-700/60 text-xs">
          <Globe2 className="w-3.5 h-3.5 text-emerald-300 ml-1.5" />
          <button
            onClick={() => onLanguageChange('en')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              language === 'en'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            onClick={() => onLanguageChange('sw')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              language === 'sw'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            Kiswahili
          </button>
        </div>
      </div>

      {/* Advisory Body */}
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="py-6 flex flex-col items-center justify-center gap-3 text-emerald-200">
            <RefreshCw className="w-7 h-7 animate-spin text-emerald-400" />
            <p className="text-xs font-medium">Formulating plain-language farmer advisory with Gemini...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* The Advisory Text Box */}
            <div className="bg-emerald-950/50 rounded-xl p-4 sm:p-5 border border-emerald-800/70 relative">
              <p className="text-sm sm:text-base leading-relaxed text-stone-100 font-medium whitespace-pre-wrap">
                "{advisory?.text || 'No advisory generated yet. Tap Refresh below.'}"
              </p>

              {/* Word Count Badge */}
              <div className="mt-3 pt-3 border-t border-emerald-800/40 flex items-center justify-between text-[11px] text-emerald-300/80">
                <span className="flex items-center gap-1.5">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified: only references visible farm metrics</span>
                </span>
                <span
                  className={`font-mono px-2 py-0.5 rounded ${
                    isOverLimit
                      ? 'bg-red-900/80 text-red-200 font-bold'
                      : 'bg-emerald-900/80 text-emerald-200'
                  }`}
                >
                  {wordCount} / 80 words
                </span>
              </div>
            </div>

            {/* Bottom Actions: Send as SMS + Refresh */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="text-[11px] text-emerald-200/60">
                Generated via: {advisory?.generatedBy || 'gemini-3.8-flash'} • {advisory?.timestamp ? new Date(advisory.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Current'}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onRefreshAdvisory}
                  disabled={isLoading}
                  className="px-3.5 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-700 text-emerald-100 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                  title="Re-generate advisory"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Re-check</span>
                </button>

                <button
                  onClick={onOpenSmsModal}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-extrabold flex items-center gap-2 shadow-sm transition active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Send as SMS</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
