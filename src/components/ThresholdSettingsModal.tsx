import React, { useState } from 'react';
import { X, Sliders, RotateCcw, Check, Leaf } from 'lucide-react';
import { ThresholdConfig, CROP_PRESETS, DEFAULT_THRESHOLDS } from '../config/thresholds.ts';

interface ThresholdSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ThresholdConfig;
  onSave: (newConfig: ThresholdConfig) => void;
}

export const ThresholdSettingsModal: React.FC<ThresholdSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [formConfig, setFormConfig] = useState<ThresholdConfig>(config);

  if (!isOpen) return null;

  const handlePresetSelect = (presetKey: string) => {
    const selected = CROP_PRESETS[presetKey];
    if (selected) {
      setFormConfig({ ...selected });
    }
  };

  const handleReset = () => {
    setFormConfig({ ...DEFAULT_THRESHOLDS });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">Tune Agronomic Thresholds</h3>
              <p className="text-xs text-stone-500">Configure decision rules for specific crops &amp; regions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 text-xs">
          {/* Crop Presets */}
          <div>
            <label className="block font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span>Select Crop / Region Preset:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(CROP_PRESETS).map(([key, preset]) => {
                const isSelected = formConfig.cropPresetName === preset.cropPresetName;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handlePresetSelect(key)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-start justify-between gap-1 ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>{preset.cropPresetName}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-stone-200 pt-4 space-y-4">
            {/* Rule 1: Lime Thresholds */}
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
              <span className="font-bold text-stone-800 block">1. Lime Recommendation Thresholds:</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-stone-600 font-medium block mb-1">
                    Strongly Acidic Cutoff (pH):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="3.0"
                    max="7.0"
                    value={formConfig.lime.stronglyAcidicCutoff}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        lime: {
                          ...formConfig.lime,
                          stronglyAcidicCutoff: parseFloat(e.target.value) || 5.5,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 font-mono text-stone-900 bg-white"
                  />
                  <span className="text-[10px] text-stone-400">Below this: Recommend Lime</span>
                </div>

                <div>
                  <label className="text-[11px] text-stone-600 font-medium block mb-1">
                    Moderately Acidic Cutoff (pH):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="4.0"
                    max="8.0"
                    value={formConfig.lime.moderatelyAcidicCutoff}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        lime: {
                          ...formConfig.lime,
                          moderatelyAcidicCutoff: parseFloat(e.target.value) || 6.0,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 font-mono text-stone-900 bg-white"
                  />
                  <span className="text-[10px] text-stone-400">Between: Monitor Soil</span>
                </div>
              </div>
            </div>

            {/* Rule 2: Planting Conditions */}
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
              <span className="font-bold text-stone-800 block">2. Planting This Week Thresholds:</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-stone-600 font-medium block mb-1">
                    Min 7-Day Rain (mm):
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={formConfig.planting.minRain7DaysMm}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        planting: {
                          ...formConfig.planting,
                          minRain7DaysMm: parseFloat(e.target.value) || 20.0,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 font-mono text-stone-900 bg-white"
                  />
                  <span className="text-[10px] text-stone-400">Default: 20 mm for germination</span>
                </div>

                <div>
                  <label className="text-[11px] text-stone-600 font-medium block mb-1">
                    Min Soil pH for Sowing:
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="3.5"
                    max="7.0"
                    value={formConfig.planting.minSoilPh}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        planting: {
                          ...formConfig.planting,
                          minSoilPh: parseFloat(e.target.value) || 5.5,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 font-mono text-stone-900 bg-white"
                  />
                  <span className="text-[10px] text-stone-400">Prevent sowing in scorched soil</span>
                </div>
              </div>
            </div>

            {/* Rule 3: Satellite Cloud Cover */}
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
              <span className="font-bold text-stone-800 block">3. Fresh Satellite View Filter:</span>
              <div>
                <label className="text-[11px] text-stone-600 font-medium block mb-1">
                  Max Cloud Cover Limit (%):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={formConfig.satellite.maxCloudCoverPercent}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        satellite: {
                          ...formConfig.satellite,
                          maxCloudCoverPercent: parseFloat(e.target.value) || 20.0,
                        },
                      })
                    }
                    className="flex-1 accent-emerald-600"
                  />
                  <span className="font-mono font-bold text-stone-800 text-sm w-12 text-right">
                    {formConfig.satellite.maxCloudCoverPercent}%
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 block mt-1">
                  Scenes with cloud cover below this value are considered clear views.
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-stone-100 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-sm transition active:scale-95"
              >
                Apply Thresholds
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
