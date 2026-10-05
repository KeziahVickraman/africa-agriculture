import React, { useState } from 'react';
import { X, Send, Smartphone, ExternalLink, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { SmsSendResult } from '../types/farm.ts';
import { smsProviderInstance } from '../services/sms/index.ts';

interface SmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageText: string;
}

export const SmsModal: React.FC<SmsModalProps> = ({ isOpen, onClose, messageText }) => {
  const [phoneNumber, setPhoneNumber] = useState('+254712345678');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<SmsSendResult | null>(null);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;

    setIsSending(true);
    setResult(null);

    try {
      const res = await smsProviderInstance.sendSms(phoneNumber, messageText);
      setResult(res);
    } catch (err: any) {
      setResult({
        success: false,
        recipient: phoneNumber,
        statusText: 'Failed',
        simulatorUrl: 'https://simulator.africastalking.com',
        error: err.message || 'Network error while calling /api/sms',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">Send SMS via Africa's Talking</h3>
              <p className="text-xs text-stone-500">Official Sandbox Simulator Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Important Sandbox Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">Africa's Talking Sandbox Environment</p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Messages dispatched via sandbox appear <strong>only</strong> in the Africa's Talking web simulator at{' '}
                  <a
                    href="https://simulator.africastalking.com"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline text-amber-950 hover:text-black inline-flex items-center gap-0.5"
                  >
                    simulator.africastalking.com <ExternalLink className="w-3 h-3" />
                  </a>
                  , not on physical mobile networks.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Farmer Mobile Number (Kenyan Format +254...):
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+254712345678"
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                required
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Standard Nakuru pilot test number format (+254 7XX XXX XXX)
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between font-bold text-stone-700 mb-1">
                <span>Message Payload:</span>
                <span className="font-normal text-stone-400 font-mono text-[11px]">
                  {messageText.length} characters
                </span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 font-sans text-stone-800 text-xs leading-relaxed max-h-36 overflow-y-auto">
                {messageText}
              </div>
            </div>

            {/* Results Display */}
            {result && (
              <div
                className={`p-3.5 rounded-xl border ${
                  result.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-stone-50 border-stone-300 text-stone-800'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1.5 flex-1">
                    <p className="font-bold text-sm">
                      {result.success ? 'Dispatched to Sandbox Simulator!' : 'Dispatch Notice'}
                    </p>
                    <p className="text-[11px] text-stone-600">
                      Recipient: <span className="font-mono font-semibold">{result.recipient}</span> • Status:{' '}
                      <span className="font-semibold">{result.statusText}</span>
                      {result.cost && ` • Cost: ${result.cost}`}
                    </p>

                    {result.error && (
                      <p className="text-[11px] text-amber-800 font-medium">
                        {result.error}
                      </p>
                    )}

                    {/* Prominent link to Simulator */}
                    <div className="pt-2">
                      <a
                        href={result.simulatorUrl || 'https://simulator.africastalking.com'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
                      >
                        <span>Open Simulator Inbox ({result.recipient})</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit button */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending || !phoneNumber}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending to Sandbox...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send SMS (Sandbox)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
