import React from 'react';
import { X, Sprout, Globe, CheckCircle2, Shield, ExternalLink, Cpu } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold">
              <Sprout className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">About FarmSense</h3>
              <p className="text-xs text-stone-500">Architecture, Pilot &amp; Data Sources</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 text-xs text-stone-700 leading-relaxed max-h-[70vh] overflow-y-auto">
          <div>
            <h4 className="font-bold text-sm text-stone-900 mb-1">Architecture &amp; Pilot Overview</h4>
            <p>
              <strong>FarmSense</strong> is a mobile-first decision support tool engineered for smallholder farmers.
              <strong>Phase 1</strong> operates live across Africa with a pilot deployment in <strong>Nakuru, Kenya</strong>.
              The application utilizes a decoupled, pluggable <code>DataProvider</code> and <code>SmsProvider</code> architecture,
              allowing the entire data tier to seamlessly switch in <strong>Phase 2</strong> to an Indian farmhouse (or any global farm).
            </p>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2">
            <h5 className="font-bold text-stone-900 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>Live Data Sources &amp; Mandatory Credits:</span>
            </h5>
            <ul className="space-y-1.5 text-[11px] text-stone-600">
              <li>
                <strong>1. Soil Property Data:</strong> iSDAsoil API v2 (0–20 cm topsoil &amp; 20–50 cm subsoil pH, N, organic carbon, texture).
                <div className="text-stone-500 italic">"Soil data: iSDA / Digital Earth Africa, CC BY 4.0"</div>
              </li>
              <li>
                <strong>2. Satellite Imagery:</strong> Digital Earth Africa STAC Search API (Sentinel-2 L2A optical scenes, cloud cover %, pass date).
                <div className="text-stone-500 italic">"Satellite data: Digital Earth Africa, CC BY 4.0"</div>
              </li>
              <li>
                <strong>3. Weather Forecast:</strong> Open-Meteo 7-day cumulative precipitation and daily distribution.
                <div className="text-stone-500 italic">"Weather data: Open-Meteo (CC BY 4.0)"</div>
              </li>
              <li>
                <strong>4. Messaging Gateway:</strong> Africa's Talking Sandbox SMS Gateway. Dispatched alerts simulate live to{' '}
                <a
                  href="https://simulator.africastalking.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 underline font-semibold"
                >
                  simulator.africastalking.com
                </a>.
              </li>
              <li>
                <strong>5. Plain-Language Advisory:</strong> Gemini AI (<code>gemini-3.8-flash</code>) generating strict, non-hallucinated farmer summaries in English and Swahili (max 80 words).
              </li>
            </ul>
          </div>

          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-emerald-950 space-y-1">
            <h5 className="font-bold text-xs flex items-center gap-1.5 text-emerald-900">
              <Shield className="w-4 h-4 text-emerald-700" />
              <span>Security &amp; Secret Isolation</span>
            </h5>
            <p className="text-[11px] leading-relaxed">
              In accordance with security requirements, sensitive credentials (<code>ISDA_EMAIL</code>,{' '}
              <code>ISDA_PASSWORD</code>, <code>AT_SANDBOX_API_KEY</code>, and <code>GEMINI_API_KEY</code>)
              are held exclusively in server-side proxy routes (<code>/api/soil</code>, <code>/api/sms</code>, and <code>/api/gemini/advisory</code>).
              The browser bundle never receives credentials.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-xl text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
