import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  CloudRain,
  Share2,
  AlertTriangle,
  Wind,
  CheckCircle2,
  PauseCircle,
  AlertOctagon,
  Calendar,
  Sparkles,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { FarmProfile, IndiaDecisionsMap, IndiaWeatherData } from '../../types/indiaFarm.ts';
import { speakDecisionAudio, isNortheastMonsoonSeason, getTodayFormattedIST } from '../../utils/indiaFormat.ts';
import { INDIA_THRESHOLDS } from '../../config/indiaThresholds.ts';

interface IndiaParentsViewProps {
  profile: FarmProfile;
  decisions: IndiaDecisionsMap;
  weather: IndiaWeatherData | null;
  advisoryText: string;
  isAdvisoryLoading: boolean;
  onRefreshAdvisory: () => void;
  onOpenProfile: () => void;
}

export const IndiaParentsView: React.FC<IndiaParentsViewProps> = ({
  profile,
  decisions,
  weather,
  advisoryText,
  isAdvisoryLoading,
  onRefreshAdvisory,
  onOpenProfile,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isTamil = profile.advisoryLanguage === 'ta';
  const isMonsoon = isNortheastMonsoonSeason();
  const todayIST = getTodayFormattedIST();

  // Combine decision scripts for voice playback
  const handleReadAloud = async () => {
    if (isSpeaking) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);

    const tamilParts = [
      `வணக்கம். இன்று ${todayIST}. பண்ணை நிலவரம்.`,
      `பாசனம்: ${decisions.irrigate.shortTa}`,
      `மருந்து தெளிப்பு: ${decisions.spray.shortTa}`,
      `நடவு: ${decisions.sow.shortTa}`,
      `மண் நிலை: ${decisions.soilAmendment.shortTa}`,
      `அறுவடை சூழல்: ${decisions.harvest.shortTa}`,
    ];

    const englishParts = [
      `Hello. Today is ${todayIST}. FarmSense daily summary for ${profile.farmName}.`,
      `Irrigation: ${decisions.irrigate.shortEn}`,
      `Spraying: ${decisions.spray.shortEn}`,
      `Sowing: ${decisions.sow.shortEn}`,
      `Soil: ${decisions.soilAmendment.shortEn}`,
      `Harvest: ${decisions.harvest.shortEn}`,
    ];

    if (decisions.alerts.length > 0) {
      tamilParts.push(`வானிலை எச்சரிக்கை: ${decisions.alerts[0].shortTa}`);
      englishParts.push(`Weather alert: ${decisions.alerts[0].shortEn}`);
    }

    await speakDecisionAudio(tamilParts.join(' '), englishParts.join(' '));
    setIsSpeaking(false);
  };

  const getStatusIcon = (status: 'green' | 'amber' | 'red') => {
    if (status === 'green') return <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />;
    if (status === 'amber') return <PauseCircle className="w-8 h-8 text-amber-400 shrink-0" />;
    return <AlertOctagon className="w-8 h-8 text-rose-400 shrink-0" />;
  };

  const getTileBg = (status: 'green' | 'amber' | 'red') => {
    if (status === 'green') return 'bg-emerald-950/60 border-emerald-700/80 text-emerald-100';
    if (status === 'amber') return 'bg-amber-950/60 border-amber-700/80 text-amber-100';
    return 'bg-rose-950/60 border-rose-700/80 text-rose-100';
  };

  // WhatsApp share link (Requirement 6)
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `🌾 *FarmSense - ${profile.farmName} (${todayIST})*\n\n${advisoryText || (isTamil ? decisions.irrigate.shortTa : decisions.irrigate.shortEn)}\n\n• பாசனம்/Irrigation: ${isTamil ? decisions.irrigate.verdictTa : decisions.irrigate.verdictEn}\n• தெளிப்பு/Spray: ${isTamil ? decisions.spray.verdictTa : decisions.spray.verdictEn}\n• நடவு/Sow: ${isTamil ? decisions.sow.verdictTa : decisions.sow.verdictEn}\n\nShared via FarmSense.`
  )}`;

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-12 font-sans">
      {/* 1. Date Header & Voice Bar */}
      <div className="bg-stone-900 border border-emerald-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-semibold uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>{isTamil ? 'இன்றைய தேதி (IST)' : 'Today in Chennai (IST)'}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mt-0.5">
            {todayIST}
          </div>
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-emerald-300 transition mt-1 underline cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{profile.farmName} ({profile.district})</span>
          </button>
        </div>

        {/* Read aloud big button */}
        <button
          onClick={handleReadAloud}
          className={`px-4 py-3 rounded-xl border font-bold text-sm sm:text-base flex items-center gap-2 shadow-md transition active:scale-95 cursor-pointer ${
            isSpeaking
              ? 'bg-amber-600 border-amber-400 text-white animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white'
          }`}
          title="Read decision summary aloud using speech synthesis"
        >
          {isSpeaking ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          <span>{isSpeaking ? (isTamil ? 'நிறுத்துக' : 'Stop Audio') : isTamil ? '🔊 குரலில் கேட்க' : '🔊 Read Aloud'}</span>
        </button>
      </div>

      {/* 2. Northeast Monsoon Banner (1 Oct - 31 Dec) */}
      {isMonsoon && (
        <div className="bg-gradient-to-r from-sky-950 via-indigo-950 to-sky-950 border-2 border-sky-600/80 rounded-2xl p-3.5 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-900 border border-sky-500 flex items-center justify-center text-sky-200 shrink-0">
            <CloudRain className="w-6 h-6 animate-bounce" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-extrabold text-sky-200">
              {isTamil ? '🌧️ வடகிழக்கு பருவமழை காலம் (Northeast Monsoon)' : '🌧️ Northeast Monsoon Season'}
            </h3>
            <p className="text-xs text-sky-300/90 leading-tight mt-0.5">
              {isTamil
                ? 'அக்டோபர் முதல் டிசம்பர் வரை கனமழை மற்றும் புயல் வாய்ப்பு. வயல் வடிகால்களை சுத்தமாக வைக்கவும்.'
                : 'Active season (Oct 1 - Dec 31). Monitor daily rain front and secure farm bunds.'}
            </p>
          </div>
        </div>
      )}

      {/* Rain & Wind Alerts (if active) */}
      {decisions.alerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-rose-950/90 border-2 border-rose-600 rounded-2xl p-3.5 shadow-lg flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-900 border border-rose-500 flex items-center justify-center text-rose-200 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-rose-300" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-1">
              <h4 className="text-sm sm:text-base font-black text-rose-100">
                {isTamil ? alert.titleTa : alert.title}
              </h4>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-900 border border-rose-500 text-rose-200">
                {alert.verdictEn}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-rose-200 font-semibold mt-1">
              {isTamil ? alert.shortTa : alert.shortEn}
            </p>
            {alert.detailsTa && (
              <p className="text-[11px] text-rose-300/90 mt-1 leading-snug">
                ⚠️ {isTamil ? alert.detailsTa : alert.detailsEn}
              </p>
            )}
            <a
              href={INDIA_THRESHOLDS.imdAlerts.imdChennaiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-rose-300 hover:text-white underline mt-1.5"
            >
              <span>{INDIA_THRESHOLDS.imdAlerts.disclaimer}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ))}

      {/* 3. The 7 Decision Tiles (Very large text, icons, strictly under 10 words) */}
      <div className="space-y-3">
        {/* Tile 1: Irrigate */}
        <div className={`p-4 rounded-2xl border-2 shadow-md flex items-center gap-3.5 ${getTileBg(decisions.irrigate.status)}`}>
          {getStatusIcon(decisions.irrigate.status)}
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-300">
              {isTamil ? '1. பாசனம் (Irrigate Today?)' : '1. Irrigate Today?'}
            </div>
            <div className="text-lg sm:text-xl font-black leading-snug mt-0.5">
              {isTamil ? decisions.irrigate.shortTa : decisions.irrigate.shortEn}
            </div>
          </div>
        </div>

        {/* Tile 2: Spray */}
        <div className={`p-4 rounded-2xl border-2 shadow-md flex items-center gap-3.5 ${getTileBg(decisions.spray.status)}`}>
          {getStatusIcon(decisions.spray.status)}
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-300">
              {isTamil ? '2. மருந்து தெளிப்பு (Spray Today?)' : '2. Spray Today?'}
            </div>
            <div className="text-lg sm:text-xl font-black leading-snug mt-0.5">
              {isTamil ? decisions.spray.shortTa : decisions.spray.shortEn}
            </div>
          </div>
        </div>

        {/* Tile 3: Sow / Transplant */}
        <div className={`p-4 rounded-2xl border-2 shadow-md flex items-center gap-3.5 ${getTileBg(decisions.sow.status)}`}>
          {getStatusIcon(decisions.sow.status)}
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-300">
              {isTamil ? '3. நடவு (Sow / Transplant this week?)' : '3. Sow / Transplant this week?'}
            </div>
            <div className="text-lg sm:text-xl font-black leading-snug mt-0.5">
              {isTamil ? decisions.sow.shortTa : decisions.sow.shortEn}
            </div>
          </div>
        </div>

        {/* Tile 4: Soil Amendment */}
        <div className={`p-4 rounded-2xl border-2 shadow-md flex items-center gap-3.5 ${getTileBg(decisions.soilAmendment.status)}`}>
          {getStatusIcon(decisions.soilAmendment.status)}
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-300">
              {isTamil ? '4. மண் உரம் (Soil Amendment?)' : '4. Soil Amendment?'}
            </div>
            <div className="text-lg sm:text-xl font-black leading-snug mt-0.5">
              {isTamil ? decisions.soilAmendment.shortTa : decisions.soilAmendment.shortEn}
            </div>
          </div>
        </div>

        {/* Tile 5: Sell now or hold (primary crops) */}
        {Object.entries(decisions.sell).map(([cropKey, decision]) => (
          <div
            key={cropKey}
            className={`p-4 rounded-2xl border-2 shadow-md flex items-center gap-3.5 ${getTileBg(decision.status)}`}
          >
            {getStatusIcon(decision.status)}
            <div className="flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-300">
                {isTamil ? `5. விலை: ${cropKey} (Sell or Hold?)` : `5. Mandi: ${cropKey.toUpperCase()} (Sell or Hold?)`}
              </div>
              <div className="text-lg sm:text-xl font-black leading-snug mt-0.5">
                {isTamil ? decision.shortTa : decision.shortEn}
              </div>
            </div>
          </div>
        ))}

        {/* Tile 6: Harvest Window */}
        <div className={`p-4 rounded-2xl border-2 shadow-md flex items-center gap-3.5 ${getTileBg(decisions.harvest.status)}`}>
          {getStatusIcon(decisions.harvest.status)}
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-300">
              {isTamil ? '6. அறுவடை கால சூழல் (Harvest Window)' : '6. Harvest Window (Dry Days)'}
            </div>
            <div className="text-lg sm:text-xl font-black leading-snug mt-0.5">
              {isTamil ? decisions.harvest.shortTa : decisions.harvest.shortEn}
            </div>
          </div>
        </div>
      </div>

      {/* 4. WhatsApp Sharing & Advisory Panel */}
      <div className="bg-stone-900 border border-emerald-800/80 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-bold text-white font-serif">
              {isTamil ? 'தினசரி பண்ணை செய்தி (Advisory)' : 'Daily AI Farm Advisory'}
            </h4>
          </div>
          <button
            onClick={onRefreshAdvisory}
            disabled={isAdvisoryLoading}
            className="text-xs text-emerald-400 hover:text-emerald-300 underline disabled:opacity-50 cursor-pointer"
          >
            {isAdvisoryLoading ? '...' : isTamil ? 'மீண்டும் புதுப்பிக்க' : 'Refresh'}
          </button>
        </div>

        <p className="text-sm sm:text-base text-stone-200 leading-relaxed font-medium bg-stone-950/70 p-3.5 rounded-xl border border-stone-800">
          {advisoryText || (isTamil ? decisions.irrigate.reasonTa : decisions.irrigate.reasonEn)}
        </p>

        {/* Share on WhatsApp Button (Requirement 6) */}
        <a
          href={whatsappShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition active:scale-98 cursor-pointer"
        >
          <Share2 className="w-5 h-5" />
          <span>{isTamil ? 'வாட்ஸ்அப்பில் பகிரவும் (Share on WhatsApp)' : 'Share on WhatsApp'}</span>
        </a>
      </div>
    </div>
  );
};
