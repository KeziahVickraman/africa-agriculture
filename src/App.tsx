import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { MapPicker } from './components/MapPicker.tsx';
import { SoilCard } from './components/SoilCard.tsx';
import { SatelliteCard } from './components/SatelliteCard.tsx';
import { WeatherCard } from './components/WeatherCard.tsx';
import { DecisionsPanel } from './components/DecisionsPanel.tsx';
import { AdvisoryPanel } from './components/AdvisoryPanel.tsx';
import { SmsModal } from './components/SmsModal.tsx';
import { ThresholdSettingsModal } from './components/ThresholdSettingsModal.tsx';
import { RawJsonDrawer } from './components/RawJsonDrawer.tsx';
import { AboutModal } from './components/AboutModal.tsx';

import { LocationCoords, SoilData, SatelliteSceneData, WeatherData, AdvisoryResponse } from './types/farm.ts';
import { DEFAULT_THRESHOLDS, ThresholdConfig, evaluateDecisions } from './config/thresholds.ts';
import { getProvider } from './services/providers/index.ts';
import { AlertCircle, Compass, Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  // Provider / Region Selection: 'africa' (Pilot) vs 'india' (Phase 2)
  const [region, setRegion] = useState<'africa' | 'india'>('africa');
  const currentProvider = getProvider(region);

  // Active farm plot coordinates (Default to Nakuru, Kenya: lat -0.30, lon 36.07)
  const [location, setLocation] = useState<LocationCoords>(currentProvider.defaultLocation);

  // Demo mode toggle (defaults to false for live APIs, or true if user toggles)
  const [demoMode, setDemoMode] = useState<boolean>(false);

  // Decision Threshold Configuration
  const [thresholdConfig, setThresholdConfig] = useState<ThresholdConfig>(() => {
    try {
      const saved = localStorage.getItem('farmsense_thresholds');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_THRESHOLDS;
  });

  // Data states per card (independent loading & failure handling)
  const [soilData, setSoilData] = useState<SoilData | null>(null);
  const [isSoilLoading, setIsSoilLoading] = useState<boolean>(true);

  const [satelliteData, setSatelliteData] = useState<SatelliteSceneData | null>(null);
  const [isSatelliteLoading, setIsSatelliteLoading] = useState<boolean>(true);

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(true);

  // Advisory state
  const [advisoryLanguage, setAdvisoryLanguage] = useState<'en' | 'sw'>('en');
  const [advisory, setAdvisory] = useState<AdvisoryResponse | null>(null);
  const [isAdvisoryLoading, setIsAdvisoryLoading] = useState<boolean>(false);
  const lastAdvisoryKeyRef = React.useRef<string>('');

  // Modals state
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [rawJsonDrawer, setRawJsonDrawer] = useState<{ isOpen: boolean; title: string; data: any }>({
    isOpen: false,
    title: '',
    data: null,
  });

  // Calculate decisions based on current metrics and thresholds
  const soilPh = soilData?.topsoil?.ph?.value;
  const rainTotal = weatherData?.totalRain7DaysMm;
  const cloudCover = satelliteData?.cloudCoverPercent;
  const sceneDate = satelliteData?.date;

  const decisions = evaluateDecisions(soilPh, rainTotal, cloudCover, sceneDate, thresholdConfig);

  // Handle region switch
  const handleRegionChange = (newRegion: 'africa' | 'india') => {
    setRegion(newRegion);
    const provider = getProvider(newRegion);
    setLocation(provider.defaultLocation);
  };

  // Fetch all 3 data sources independently
  const loadFarmData = useCallback(
    async (lat: number, lon: number, isDemo: boolean) => {
      // 1. Fetch Soil Data
      setIsSoilLoading(true);
      currentProvider
        .getSoil(lat, lon, isDemo)
        .then((res) => setSoilData(res))
        .catch((err) => {
          setSoilData({
            source: 'Soil Service',
            credit: 'Soil data: iSDA / Digital Earth Africa, CC BY 4.0',
            timestamp: new Date().toISOString(),
            coords: { lat, lon },
            topsoil: {},
            error: err.message || 'Unable to retrieve soil metrics',
          });
        })
        .finally(() => setIsSoilLoading(false));

      // 2. Fetch Satellite Scene
      setIsSatelliteLoading(true);
      currentProvider
        .getLatestScene(lat, lon)
        .then((res) => setSatelliteData(res))
        .catch((err) => {
          setSatelliteData({
            source: 'Satellite Service',
            credit: 'Satellite data: Digital Earth Africa, CC BY 4.0',
            timestamp: new Date().toISOString(),
            coords: { lat, lon },
            id: 'err',
            date: 'N/A',
            cloudCoverPercent: 100,
            error: err.message || 'Unable to query satellite STAC catalogue',
          });
        })
        .finally(() => setIsSatelliteLoading(false));

      // 3. Fetch Weather Forecast
      setIsWeatherLoading(true);
      currentProvider
        .getRainForecast(lat, lon)
        .then((res) => setWeatherData(res))
        .catch((err) => {
          setWeatherData({
            source: 'Weather Service',
            credit: 'Weather data: Open-Meteo (CC BY 4.0)',
            timestamp: new Date().toISOString(),
            coords: { lat, lon },
            totalRain7DaysMm: 0,
            daily: [],
            error: err.message || 'Unable to query weather forecast',
          });
        })
        .finally(() => setIsWeatherLoading(false));
    },
    [currentProvider]
  );

  // Re-fetch when location, region or demo mode changes
  useEffect(() => {
    loadFarmData(location.lat, location.lon, demoMode);
  }, [location.lat, location.lon, region, demoMode, loadFarmData]);

  // Generate Gemini Advisory when data loads or user requests
  const generateAdvisoryText = useCallback(
    async (lang: 'en' | 'sw') => {
      setIsAdvisoryLoading(true);

      const payload = {
        locationName: location.name || `Plot (${location.lat}, ${location.lon})`,
        coords: { lat: location.lat, lon: location.lon },
        soilPh: soilData?.topsoil?.ph?.value,
        nitrogen: soilData?.topsoil?.nitrogen?.value,
        organicCarbon: soilData?.topsoil?.organicCarbon?.value,
        texture: soilData?.topsoil?.texture?.classification,
        totalRain7DaysMm: weatherData?.totalRain7DaysMm,
        satelliteCloudCoverPercent: satelliteData?.cloudCoverPercent,
        satelliteDate: satelliteData?.date,
        limeDecision: decisions.lime.verdict + ': ' + decisions.lime.reason,
        plantingDecision: decisions.planting.verdict + ': ' + decisions.planting.reason,
        satelliteDecision: decisions.satellite.verdict + ': ' + decisions.satellite.reason,
        language: lang,
      };

      try {
        const response = await fetch('/api/gemini/advisory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Advisory server error: HTTP ${response.status}`);
        }

        const data = await response.json();
        setAdvisory({
          language: lang,
          text: data.text,
          wordCount: data.wordCount,
          timestamp: new Date().toISOString(),
          generatedBy: data.generatedBy,
        });
      } catch {
        // Fallback advisory directly constructed from verified numbers without crashing
        const fallbackText =
          lang === 'sw'
            ? `Ushauri wa Shamba: ${
                decisions.lime.status === 'red'
                  ? 'Weka chokaa kabla ya NPK kwa sababu udongo una asidi kali (pH chini ya 5.5).'
                  : 'pH ya udongo iko salama kwa mbolea.'
              } ${
                decisions.planting.status === 'green'
                  ? `Mvua ya siku 7 inatarajiwa kutosha (${rainTotal?.toFixed(1) || 0} mm); unaweza kupanda.`
                  : `Mvua ni ya chini (${rainTotal?.toFixed(1) || 0} mm); subiri unyevu zaidi kabla ya kupanda.`
              } Satelaiti ina mawingu ya ${cloudCover?.toFixed(0) || 0}%.`
            : `Farm Advisory: ${
                decisions.lime.status === 'red'
                  ? 'Apply agricultural lime prior to NPK due to topsoil acidity (pH < 5.5).'
                  : 'Soil pH is favorable; lime not needed before fertilizer.'
              } ${
                decisions.planting.status === 'green'
                  ? `Forecast rain (${rainTotal?.toFixed(1) || 0} mm) is adequate to plant this week.`
                  : `Forecast rain (${rainTotal?.toFixed(1) || 0} mm) is insufficient; hold planting.`
              } Recent satellite scene cloud cover is ${cloudCover?.toFixed(0) || 0}%.`;

        setAdvisory({
          language: lang,
          text: fallbackText,
          wordCount: fallbackText.split(/\s+/).filter(Boolean).length,
          timestamp: new Date().toISOString(),
          generatedBy: 'advisory-rules',
        });
      } finally {
        setIsAdvisoryLoading(false);
      }
    },
    [location, soilData, weatherData, satelliteData, decisions, rainTotal, cloudCover]
  );

  // Trigger advisory formulation only once when core data settles or changes
  useEffect(() => {
    if (!isSoilLoading && !isSatelliteLoading && !isWeatherLoading) {
      const signature = `${location.lat.toFixed(3)}_${location.lon.toFixed(3)}_${advisoryLanguage}_${soilPh?.toFixed(1) || '0'}_${rainTotal?.toFixed(0) || '0'}`;
      if (signature !== lastAdvisoryKeyRef.current) {
        lastAdvisoryKeyRef.current = signature;
        generateAdvisoryText(advisoryLanguage);
      }
    }
  }, [isSoilLoading, isSatelliteLoading, isWeatherLoading, advisoryLanguage, location.lat, location.lon, soilPh, rainTotal, generateAdvisoryText]);

  // Save new thresholds
  const handleSaveThresholds = (newConfig: ThresholdConfig) => {
    setThresholdConfig(newConfig);
    try {
      localStorage.setItem('farmsense_thresholds', JSON.stringify(newConfig));
    } catch {}
  };

  const handleOpenRawJson = (title: string, data: any) => {
    setRawJsonDrawer({
      isOpen: true,
      title,
      data,
    });
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans pb-16 selection:bg-emerald-200">
      {/* Top Header */}
      <Header
        currentProvider={currentProvider}
        region={region}
        onRegionChange={handleRegionChange}
        demoMode={demoMode}
        onToggleDemoMode={() => setDemoMode(!demoMode)}
        onOpenThresholds={() => setIsThresholdModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        cropPresetName={thresholdConfig.cropPresetName}
      />

      <main className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6">
        {/* Phase 2 Architecture Notification Banner (when India is selected) */}
        {region === 'india' && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
            <Compass className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-sm text-amber-950">
                Phase 2 Architecture Active: Indian Farmhouse Stub
              </p>
              <p className="mt-1 leading-relaxed text-amber-800">
                You are viewing the modular, swappable <code>IndiaProvider</code> stub. The user interface,
                decision matrix, and SMS messaging engine remain identical, ready to connect to the Indian
                Soil Health Card (SHC) API and Copernicus/Bhuvan STAC catalogs for Phase 2 deployment.
              </p>
              <button
                onClick={() => handleRegionChange('africa')}
                className="mt-2 text-xs font-bold text-amber-900 underline hover:text-black"
              >
                Switch back to Live Africa Pilot (Nakuru, Kenya)
              </button>
            </div>
          </div>
        )}

        {/* 1. Map & Plot Selector (Step 1) */}
        <MapPicker
          location={location}
          onLocationChange={(newLoc) => setLocation(newLoc)}
          presets={currentProvider.presetLocations}
          isLoading={isSoilLoading || isSatelliteLoading || isWeatherLoading}
        />

        {/* 2. Decisions Panel (Step 3: Traffic Lights) */}
        <DecisionsPanel
          decisions={decisions}
          thresholdConfig={thresholdConfig}
          onOpenThresholds={() => setIsThresholdModalOpen(true)}
        />

        {/* 3. Three Live Data Cards (Step 2: Soil, Satellite, Weather) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Card A: Soil (iSDAsoil) */}
          <SoilCard
            data={soilData}
            isLoading={isSoilLoading}
            onOpenRawJson={handleOpenRawJson}
          />

          {/* Card B: Satellite (Digital Earth Africa) */}
          <SatelliteCard
            data={satelliteData}
            isLoading={isSatelliteLoading}
            onOpenRawJson={handleOpenRawJson}
          />

          {/* Card C: Weather (Open-Meteo) */}
          <WeatherCard
            data={weatherData}
            isLoading={isWeatherLoading}
            onOpenRawJson={handleOpenRawJson}
          />
        </div>

        {/* 4. AI Advisory Panel (Step 4 & 5: Gemini max 80 words + Send SMS) */}
        <AdvisoryPanel
          advisory={advisory}
          isLoading={isAdvisoryLoading}
          language={advisoryLanguage}
          onLanguageChange={(lang) => {
            setAdvisoryLanguage(lang);
            generateAdvisoryText(lang);
          }}
          onRefreshAdvisory={() => {
            lastAdvisoryKeyRef.current = '';
            generateAdvisoryText(advisoryLanguage);
          }}
          onOpenSmsModal={() => setIsSmsModalOpen(true)}
        />
      </main>

      {/* Modals & Drawers */}
      <SmsModal
        isOpen={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
        messageText={advisory?.text || ''}
      />

      <ThresholdSettingsModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        config={thresholdConfig}
        onSave={handleSaveThresholds}
      />

      <RawJsonDrawer
        isOpen={rawJsonDrawer.isOpen}
        onClose={() => setRawJsonDrawer({ ...rawJsonDrawer, isOpen: false })}
        title={rawJsonDrawer.title}
        data={rawJsonDrawer.data}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  );
}
