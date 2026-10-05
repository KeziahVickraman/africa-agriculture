import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Users, HeartHandshake } from 'lucide-react';

interface WhoIsThisForPanelProps {
  language: 'ta' | 'en';
}

const STORAGE_KEY = 'farmsense_who_is_this_for_open';

export const WhoIsThisForPanel: React.FC<WhoIsThisForPanelProps> = ({ language }) => {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved !== null ? JSON.parse(saved) : false; // collapsed by default
    } catch {
      return false;
    }
  });

  const toggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const isTamil = language === 'ta';

  return (
    <div className="bg-emerald-950/40 border border-emerald-800/70 rounded-xl overflow-hidden shadow-sm transition">
      <button
        onClick={toggleOpen}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-emerald-900/30 transition cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-800/80 border border-emerald-600/50 flex items-center justify-center text-emerald-300">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-emerald-200">
            {isTamil ? 'யாருக்கானது இந்த செயலி? (Who is this for?)' : 'Who is this for? & Why was it built?'}
          </span>
        </div>
        <div className="text-emerald-400">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-emerald-900/60 bg-emerald-950/30 text-xs sm:text-sm text-stone-200 space-y-3">
          {isTamil ? (
            <>
              <div>
                <span className="font-semibold text-emerald-300 block mb-0.5">யாருக்கு:</span>
                <p className="text-stone-300 leading-relaxed font-sans">
                  "சென்னை அருகே விவசாயம் செய்யும் குடும்பத்திற்கு."
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  (சிங்கப்பூரிலிருந்து குடும்பத்தினர் வழிகாட்ட, தொலைபேசி வழியே தங்கள் வயலை நிர்வகிக்கும் குடும்பத்திற்கு).
                </p>
              </div>
              <div>
                <span className="font-semibold text-emerald-300 block mb-0.5">ஏன்:</span>
                <p className="text-stone-300 leading-relaxed font-sans">
                  "தண்ணீர் பாய்ச்சவா, மருந்து தெளிக்கவா, விற்கவா என்று தினமும் முடிவு செய்யவும், மழை மற்றும் புயலுக்குத் தயாராகவும்."
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="font-semibold text-emerald-300 block mb-0.5">Who:</span>
                <p className="text-stone-300 leading-relaxed">
                  "A farming family near Chennai, Tamil Nadu, managing their field from a phone, with family abroad helping from Singapore."
                </p>
              </div>
              <div>
                <span className="font-semibold text-emerald-300 block mb-0.5">Why:</span>
                <p className="text-stone-300 leading-relaxed">
                  "To decide each day whether to irrigate, spray or sell, and to prepare for northeast monsoon rain and cyclones, without guessing or travelling to the mandi."
                </p>
              </div>
            </>
          )}

          <div className="pt-2 border-t border-emerald-900/40 flex items-center gap-1.5 text-[11px] text-emerald-400/80">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Chennai Family Farm • Cross-border coordination between Tamil Nadu & Singapore</span>
          </div>
        </div>
      )}
    </div>
  );
};
