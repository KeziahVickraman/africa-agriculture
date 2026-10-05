import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Compass, Check, RefreshCw } from 'lucide-react';
import { LocationCoords } from '../types/farm.ts';

interface MapPickerProps {
  location: LocationCoords;
  onLocationChange: (loc: LocationCoords) => void;
  presets: LocationCoords[];
  isLoading: boolean;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  location,
  onLocationChange,
  presets,
  isLoading,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [inputLat, setInputLat] = useState(location.lat.toString());
  const [inputLon, setInputLon] = useState(location.lon.toString());
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isManualExpanded, setIsManualExpanded] = useState(false);

  // Sync inputs when external location changes
  useEffect(() => {
    setInputLat(location.lat.toString());
    setInputLon(location.lon.toString());
  }, [location.lat, location.lon]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Custom pulse farm pin icon
    const customIcon = L.divIcon({
      className: 'custom-farm-marker',
      html: `
        <div style="position: relative; width: 32px; height: 32px;">
          <div style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(16, 185, 129, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; inset: 2px; border-radius: 9999px; background: #047857; border: 2px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    const map = L.map(mapContainerRef.current, {
      center: [location.lat, location.lon],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    const marker = L.marker([location.lat, location.lon], {
      icon: customIcon,
      draggable: true,
    }).addTo(map);

    // Click on map to move marker
    map.on('click', (e: L.LeafletMouseEvent) => {
      const newLat = Number(e.latlng.lat.toFixed(5));
      const newLon = Number(e.latlng.lng.toFixed(5));
      marker.setLatLng([newLat, newLon]);
      onLocationChange({
        lat: newLat,
        lon: newLon,
        name: `Plot (${newLat.toFixed(3)}, ${newLon.toFixed(3)})`,
      });
    });

    // Drag marker
    marker.on('dragend', () => {
      const latlng = marker.getLatLng();
      const newLat = Number(latlng.lat.toFixed(5));
      const newLon = Number(latlng.lng.toFixed(5));
      onLocationChange({
        lat: newLat,
        lon: newLon,
        name: `Plot (${newLat.toFixed(3)}, ${newLon.toFixed(3)})`,
      });
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update map view when location prop changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    const currentCenter = mapInstanceRef.current.getCenter();
    const distance = Math.hypot(currentCenter.lat - location.lat, currentCenter.lng - location.lon);

    markerRef.current.setLatLng([location.lat, location.lon]);

    // Only pan if coordinate moved noticeably
    if (distance > 0.001) {
      mapInstanceRef.current.setView([location.lat, location.lon], mapInstanceRef.current.getZoom(), {
        animate: true,
      });
    }
  }, [location.lat, location.lon]);

  // Handle GPS button click
  const handleUseGps = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your device browser.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lon = Number(pos.coords.longitude.toFixed(5));
        onLocationChange({
          lat,
          lon,
          name: `My GPS Location (${lat.toFixed(3)}, ${lon.toFixed(3)})`,
        });
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(`GPS Notice: ${err.message}. Using default pilot location.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handle manual coordinate form submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(inputLat);
    const lon = parseFloat(inputLon);

    if (isNaN(lat) || isNaN(lon)) {
      alert('Please enter valid numeric latitude and longitude.');
      return;
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      alert('Latitude must be between -90 and 90, Longitude between -180 and 180.');
      return;
    }

    onLocationChange({
      lat: Number(lat.toFixed(5)),
      lon: Number(lon.toFixed(5)),
      name: `Custom Plot (${lat.toFixed(3)}, ${lon.toFixed(3)})`,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden mb-6">
      {/* Top Banner / Location Status */}
      <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 bg-stone-50/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900">
                {location.name || 'Selected Farm Plot'}
              </h2>
              {isLoading && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Fetching live data...
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 font-mono">
              Lat: <span className="font-semibold text-stone-800">{location.lat.toFixed(4)}°</span>, Lon:{' '}
              <span className="font-semibold text-stone-800">{location.lon.toFixed(4)}°</span>
            </p>
          </div>
        </div>

        {/* Action Buttons: GPS + Manual Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUseGps}
            disabled={gpsLoading}
            className="h-10 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            <Navigation className={`w-4 h-4 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{gpsLoading ? 'Locating...' : 'Use My GPS'}</span>
          </button>
          <button
            onClick={() => setIsManualExpanded(!isManualExpanded)}
            className="h-10 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium border border-stone-200 transition active:scale-95"
            title="Type coordinates manually"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {gpsError && (
        <div className="mx-4 mt-3 p-2.5 text-xs rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-between">
          <span>{gpsError}</span>
          <button onClick={() => setGpsError(null)} className="text-amber-900 font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* Manual Coordinate Form (Collapsible) */}
      {isManualExpanded && (
        <form
          onSubmit={handleManualSubmit}
          className="p-4 bg-stone-100/70 border-b border-stone-200 flex flex-wrap items-center gap-3 text-xs"
        >
          <span className="font-semibold text-stone-700">Enter Coordinates:</span>
          <div className="flex items-center gap-1.5">
            <label className="text-stone-500">Lat:</label>
            <input
              type="number"
              step="any"
              value={inputLat}
              onChange={(e) => setInputLat(e.target.value)}
              className="w-24 px-2 py-1.5 rounded-lg border border-stone-300 bg-white font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="-0.30"
              required
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-stone-500">Lon:</label>
            <input
              type="number"
              step="any"
              value={inputLon}
              onChange={(e) => setInputLon(e.target.value)}
              className="w-24 px-2 py-1.5 rounded-lg border border-stone-300 bg-white font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="36.07"
              required
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white font-semibold rounded-lg transition"
          >
            Apply
          </button>
        </form>
      )}

      {/* Interactive Map (Leaflet) */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="w-full h-56 sm:h-72 z-10 bg-stone-200 cursor-crosshair"
          title="Tap anywhere to select farm plot"
        />
        <div className="absolute bottom-2 left-2 z-20 pointer-events-none bg-stone-900/80 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md shadow-xs">
          Tap or drag pin to choose farm coordinates
        </div>
      </div>

      {/* Quick Presets Carousel */}
      <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-semibold text-stone-500 whitespace-nowrap pl-1">
          Quick Plots:
        </span>
        {presets.map((preset) => {
          const isSelected =
            Math.abs(preset.lat - location.lat) < 0.001 &&
            Math.abs(preset.lon - location.lon) < 0.001;

          return (
            <button
              key={`${preset.name}-${preset.lat}`}
              onClick={() => onLocationChange(preset)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 border active:scale-95 ${
                isSelected
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-200" />}
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
