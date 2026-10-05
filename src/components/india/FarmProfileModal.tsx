import React, { useState } from 'react';
import { X, Save, MapPin, IndianRupee, Sprout, Calendar, Droplets, Globe2, AlertCircle } from 'lucide-react';
import { FarmProfile, TamilNaduDistrict, IndiaCrop, WaterSource } from '../../types/indiaFarm.ts';
import { INDIA_THRESHOLDS } from '../../config/indiaThresholds.ts';

interface FarmProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FarmProfile;
  onSaveProfile: (profile: FarmProfile) => void;
}

const DISTRICTS: TamilNaduDistrict[] = ['Chennai', 'Thiruvallur', 'Chengalpattu', 'Kancheepuram'];

const CROPS_CONFIG: Array<{ id: IndiaCrop; name: string; nameTa: string }> = [
  { id: 'paddy', name: 'Paddy (Samba / Navarai)', nameTa: 'நெல் (சம்பா / நவரை)' },
  { id: 'groundnut', name: 'Groundnut', nameTa: 'மணிலா / நிலக்கடலை' },
  { id: 'coconut', name: 'Coconut', nameTa: 'தென்னை' },
  { id: 'banana', name: 'Banana', nameTa: 'வாழை' },
  { id: 'tomato', name: 'Tomato', nameTa: 'தக்காளி' },
  { id: 'brinjal', name: 'Brinjal', nameTa: 'கத்தரி' },
  { id: 'bhindi', name: 'Bhindi (Okra)', nameTa: 'வெண்டை' },
  { id: 'jasmine', name: 'Jasmine / Flowers', nameTa: 'மல்லி / பூக்கள்' },
];

const WATER_SOURCES: Array<{ id: WaterSource; name: string; nameTa: string }> = [
  { id: 'borewell', name: 'Borewell', nameTa: 'ஆழ்துளை கிணறு' },
  { id: 'canal', name: 'Canal', nameTa: 'வாய்க்கால் பாசனம்' },
  { id: 'tank', name: 'Eri / Tank', nameTa: 'ஏரி பாசனம்' },
  { id: 'rainfed', name: 'Rainfed (Manavari)', nameTa: 'மானாவாரி' },
];

export const FarmProfileModal: React.FC<FarmProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [formData, setFormData] = useState<FarmProfile>(profile);
  const [coordsInput, setCoordsInput] = useState<string>(`${profile.lat.toFixed(4)}, ${profile.lon.toFixed(4)}`);
  const [coordsError, setCoordsError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCoordsChange = (val: string) => {
    setCoordsInput(val);
    // Parse "lat, lon" or "lat lon"
    const parts = val.split(/[,\s]+/).filter(Boolean);
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lon) && lat >= 8 && lat <= 20 && lon >= 75 && lon <= 85) {
        setFormData((prev) => ({ ...prev, lat, lon }));
        setCoordsError(null);
      } else {
        setCoordsError('Coordinates must be valid numbers in South India / Tamil Nadu.');
      }
    }
  };

  const toggleCrop = (cropId: IndiaCrop) => {
    setFormData((prev) => {
      const exists = prev.crops.includes(cropId);
      const newCrops = exists ? prev.crops.filter((c) => c !== cropId) : [...prev.crops, cropId];
      return { ...prev, crops: newCrops };
    });
  };

  const handleRefPriceChange = (cropId: string, valStr: string) => {
    const val = parseInt(valStr, 10);
    setFormData((prev) => ({
      ...prev,
      referencePrices: {
        ...prev.referencePrices,
        [cropId]: isNaN(val) ? 0 : val,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    onClose();
  };

  const hasPaddy = formData.crops.includes('paddy');
  const isTamil = formData.advisoryLanguage === 'ta';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-stone-900 border border-emerald-800/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-stone-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-emerald-950/80 border-b border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white font-serif">
                {isTamil ? 'குடும்பப் பண்ணை விவரங்கள்' : 'Family Farm Profile (Tamil Nadu)'}
              </h2>
              <p className="text-[11px] text-emerald-300/80">
                {isTamil ? 'சென்னை மற்றும் புறநகர் பண்ணை அமைப்பு' : 'Editable profile saved locally in browser'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Farm Name & State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-emerald-300 mb-1">
                {isTamil ? 'பண்ணையின் பெயர் (Farm Name)' : 'Farm Name'}
              </label>
              <input
                type="text"
                value={formData.farmName}
                onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 focus:outline-none focus:border-emerald-500"
                placeholder="e.g. Vickraman Family Farm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-300 mb-1">
                {isTamil ? 'மாநிலம் (State)' : 'State'}
              </label>
              <input
                type="text"
                value="Tamil Nadu"
                disabled
                className="w-full bg-stone-900/60 border border-stone-800 rounded-lg px-3 py-2 text-stone-400 cursor-not-allowed font-medium"
              />
            </div>
          </div>

          {/* District Picker */}
          <div>
            <label className="block text-xs font-semibold text-emerald-300 mb-1">
              {isTamil ? 'மாவட்டம் (District Picker)' : 'District (Four Coastal / Northern Districts)'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DISTRICTS.map((dist) => (
                <button
                  type="button"
                  key={dist}
                  onClick={() => setFormData({ ...formData, district: dist })}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium text-center transition cursor-pointer ${
                    formData.district === dist
                      ? 'bg-emerald-700 border-emerald-500 text-white shadow-sm'
                      : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-emerald-700'
                  }`}
                >
                  {dist}
                </button>
              ))}
            </div>
          </div>

          {/* Location & Coordinates Input */}
          <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {isTamil ? 'புலத்தின் அமைவிடம் (Coordinates)' : 'Field Coordinates (Lat, Lon)'}
              </label>
              <span className="text-[11px] text-stone-400 font-mono">
                {formData.lat.toFixed(4)}, {formData.lon.toFixed(4)}
              </span>
            </div>

            <input
              type="text"
              value={coordsInput}
              onChange={(e) => handleCoordsChange(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
              placeholder="e.g. 13.0800, 80.2700"
            />

            <p className="text-[11px] text-emerald-400/90 leading-tight">
              📌 <strong>Note:</strong> Long-press your field in Google Maps and paste its coordinates here.
            </p>

            {coordsError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{coordsError}</span>
              </div>
            )}
          </div>

          {/* Area & Water Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-emerald-300 mb-1">
                {isTamil ? 'நிலத்தின் பரப்பளவு (Area in Acres)' : 'Area in Acres'}
              </label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="500"
                value={formData.areaAcres}
                onChange={(e) => setFormData({ ...formData, areaAcres: parseFloat(e.target.value) || 1 })}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-300 mb-1 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                {isTamil ? 'நீர் ஆதாரம் (Water Source)' : 'Water Source'}
              </label>
              <select
                value={formData.waterSource}
                onChange={(e) => setFormData({ ...formData, waterSource: e.target.value as WaterSource })}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 focus:outline-none focus:border-emerald-500"
              >
                {WATER_SOURCES.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} – {w.nameTa}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Crops Multi-Select */}
          <div>
            <label className="block text-xs font-semibold text-emerald-300 mb-1.5 flex items-center gap-1">
              <Sprout className="w-3.5 h-3.5 text-emerald-400" />
              {isTamil ? 'பயிர்கள் (Multi-Select Crops)' : 'Crops Grown (Multi-select)'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CROPS_CONFIG.map((c) => {
                const isSelected = formData.crops.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleCrop(c.id)}
                    className={`px-2.5 py-2 rounded-lg border text-xs text-left transition flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-800/80 border-emerald-500 text-white font-semibold'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-[10px] text-emerald-300/80 font-normal">{c.nameTa}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paddy Sowing Date (only if paddy selected) */}
          {hasPaddy && (
            <div className="bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-800/70 space-y-1.5">
              <label className="block text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                {isTamil ? 'நெல் விதைத்த / நட்ட தேதி (Samba / Navarai Sowing Date)' : 'Paddy Sowing / Transplanting Date'}
              </label>
              <input
                type="date"
                value={formData.paddySowingDate || ''}
                onChange={(e) => setFormData({ ...formData, paddySowingDate: e.target.value })}
                className="w-full bg-stone-950 border border-emerald-800 rounded-lg px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-emerald-300/80">
                Used to compute crop growth stage and identify Samba harvest windows in mid-December to January.
              </p>
            </div>
          )}

          {/* Reference Selling Prices per Crop */}
          <div>
            <label className="block text-xs font-semibold text-emerald-300 mb-1.5 flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
              {isTamil ? 'விற்பனை இலக்கு விலை (Reference Selling Price - ₹ per quintal)' : 'Family Target Selling Price (₹ per quintal)'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {formData.crops.map((cropId) => {
                const cropMeta = CROPS_CONFIG.find((c) => c.id === cropId);
                const currentVal = formData.referencePrices[cropId] ?? INDIA_THRESHOLDS.defaultReferencePrices[cropId] ?? 2000;
                return (
                  <div key={cropId} className="flex items-center justify-between gap-2 bg-stone-950 p-2 rounded-lg border border-stone-800">
                    <span className="text-xs text-stone-300 truncate font-medium">
                      {cropMeta?.name || cropId}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-stone-400 text-xs">₹</span>
                      <input
                        type="number"
                        min="100"
                        step="50"
                        value={currentVal}
                        onChange={(e) => handleRefPriceChange(cropId, e.target.value)}
                        className="w-24 bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs text-right text-stone-100 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <span className="text-[10px] text-stone-400">/qtl</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advisory Language & Timezone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-stone-800">
            <div>
              <label className="block text-xs font-semibold text-emerald-300 mb-1 flex items-center gap-1">
                <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                {isTamil ? 'ஆலோசனை மொழி (Advisory Language)' : 'Advisory Language'}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, advisoryLanguage: 'ta' })}
                  className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-medium transition cursor-pointer ${
                    formData.advisoryLanguage === 'ta'
                      ? 'bg-emerald-700 border-emerald-500 text-white'
                      : 'bg-stone-950 border-stone-800 text-stone-300'
                  }`}
                >
                  தமிழ் (Tamil - Default)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, advisoryLanguage: 'en' })}
                  className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-medium transition cursor-pointer ${
                    formData.advisoryLanguage === 'en'
                      ? 'bg-emerald-700 border-emerald-500 text-white'
                      : 'bg-stone-950 border-stone-800 text-stone-300'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-300 mb-1">
                {isTamil ? 'நேர மண்டலம் (Timezone)' : 'Timezone & Date Format'}
              </label>
              <div className="bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-stone-300 text-xs flex items-center justify-between">
                <span>Asia/Kolkata (IST)</span>
                <span className="text-emerald-400 font-mono">DD/MM/YYYY</span>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-stone-800 text-stone-300 text-xs font-medium hover:bg-stone-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isTamil ? 'சேமிக்கவும் (Save Profile)' : 'Save Farm Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
