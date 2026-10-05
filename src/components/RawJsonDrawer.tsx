import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Code2 } from 'lucide-react';

interface RawJsonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any;
}

export const RawJsonDrawer: React.FC<RawJsonDrawerProps> = ({
  isOpen,
  onClose,
  title,
  data,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-stone-900 text-stone-100 rounded-2xl border border-stone-800 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-800 text-stone-300 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">{title}</h3>
              <p className="text-[11px] text-stone-400">Verifiable raw API telemetry and property dictionary</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* JSON Viewer */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 font-mono text-xs text-emerald-300/90 leading-relaxed bg-stone-950/40 selection:bg-emerald-800 selection:text-white">
          <pre className="whitespace-pre-wrap break-all">
            {jsonString || '// No raw data payload available'}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
          <span>Read directly from service response • Units &amp; fields preserved</span>
          <button
            onClick={onClose}
            className="text-stone-300 hover:text-white font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
