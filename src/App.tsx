import React, { useState, useEffect, useCallback, useRef } from 'react';
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

// India components
import { WhoIsThisForPanel } from './components/india/WhoIsThisForPanel.tsx';
import { FarmProfileModal } from './components/india/FarmProfileModal.tsx';
import { IndiaParentsView } from './components/india/IndiaParentsView.tsx';
import { IndiaWebView } from './components/india/IndiaWebView.tsx';

import { LocationCoords, SoilData, SatelliteSceneData, WeatherData, AdvisoryResponse } from './types/farm.ts';
import { FarmProfile, SoilGridsDetail, IndiaWeatherData, MandiData } from './types/indiaFarm.ts';
import { DEFAULT_THRESHOLDS, ThresholdConfig, evaluateDecisions } from './config/thresholds.ts';
import { computeIndiaDecisions } from './config/indiaDecisions.ts';
import { getProvider } from './services/providers/index.ts';
import { IndiaProvider } from './services/providers/IndiaProvider.ts';
import { AlertCircle, RefreshCw, Sparkles, MapPin } from 'lucide-react';

const DEFAULT_INDIA_PROFILE: FarmProfile = {
  farmName: 'Vickraman Family Farm',
  state: 'Tamil Nadu',
  district: 'Thiruvallur',
  lat: 13.08,
  lon: 80.27,
  areaAcres: 3.5,
  crops: ['paddy', 'groundnut', 'coconut'],
  paddySowingDate: '2026-08-15',
  waterSource: 'borewell',
  referencePrices: {
    paddy: 2380,
    groundnut: 6850,
    coconut: 2850,
    banana: 2300,
    tomato: 1820,
    brinjal: 2250,
    bhindi: 2480,
    jasmine: 48000,
  },
  advisoryLanguage: 'ta',
};

export default function App() {
  // Provider / Region Selection: 'africa' (Pilot) vs 'india' (South India - Family Farm)
  const [region, setRegion] = useState<'africa' | 'india'>('africa');
  const currentProvider = getProvider(region);

  // View toggle: 'web' (My View) vs 'mobile' (Parents' View)
  const [activeView, setActiveView] = useState<'web' | 'mobile'>('web');

  // Active farm plot coordinates (Default to Nakuru, Kenya for Africa)
  const [location, setLocation] = useState<LocationCoords>(currentProvider.defaultLocation);

  // Demo mode toggle (Africa tab only)
  const [demoMode, setDemoMode] = useState<boolean>(false);

  // Decision Threshold Configuration (Africa)
  const [thresholdConfig, setThresholdConfig] = useState<ThresholdConfig>(() => {
    try {
      const saved = localStorage.getItem('farmsense_thresholds');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_THRESHOLDS;
  });

  // India Farm Profile state (saved in browser storage with try/catch)
  const [indiaProfile, setIndiaProfile] = useState<FarmProfile>(() => {
    try {
      const saved = localStorage.getItem('farmsense_india_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_INDIA_PROFILE;
  });

  // Selected markets for Mandi (saved in browser storage with try/catch)
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('farmsense_selected_markets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['Koyambedu Wholesale Market Complex', 'Kanchipuram Regulated Market', 'Chengalpattu Regulated Market'];
  });

  // Africa data states
  const [soilData, setSoilData] = useState<SoilData | null>(null);
  const [isSoilLoading, setIsSoilLoading] = useState<boolean>(true);
  const [satelliteData, setSatelliteData] = useState<SatelliteSceneData | null>(null);
  const [isSatelliteLoading, setIsSatelliteLoading] = useState<boolean>(true);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(true);
  const [advisoryLanguage, setAdvisoryLanguage] = useState<'en' | 'sw'>('en');
  const [advisory, setAdvisory] = useState<AdvisoryResponse | null>(null);
  const [isAdvisoryLoading, setIsAdvisoryLoading] = useState<boolean>(false);
  const lastAdvisoryKeyRef = useRef<string>('');

  // India data states
  const [indiaSoil, setIndiaSoil] = useState<SoilGridsDetail | null>(null);
  const [indiaWeather, setIndiaWeather] = useState<IndiaWeatherData | null>(null);
  const [indiaMandi, setIndiaMandi] = useState<MandiData | null>(null);
  const [isIndiaLoading, setIsIndiaLoading] = useState<boolean>(false);
  const [indiaAdvisoryText, setIndiaAdvisoryText] = useState<string>('');
  const [isIndiaAdvisoryLoading, setIsIndiaAdvisoryLoading] = useState<boolean>(false);
  const lastIndiaAdvisoryKeyRef = useRef<string>('');

  // Modals state
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [rawJsonDrawer, setRawJsonDrawer] = useState<{ isOpen: boolean; title: string; data: any }>({
    isOpen: false,
    title: '',
    data: null,
  });

  // Calculate Africa decisions
  const soilPh = soilData?.topsoil?.ph?.value;
  const rainTotal = weatherData?.totalRain7DaysMm;
  const cloudCover = satelliteData?.cloudCoverPercent;
  const sceneDate = satelliteData?.date;
  const decisions = evaluateDecisions(soilPh, rainTotal, cloudCover, sceneDate, thresholdConfig);

  // Calculate India decisions
  const indiaDecisions = computeIndiaDecisions(indiaProfile, indiaWeather, indiaSoil, indiaMandi);

  // Handle region switch
  const handleRegionChange = (newRegion: 'africa' | 'india') => {
    setRegion(newRegion);
    if (newRegion === 'india') {
      setLocation({
        lat: indiaProfile.lat,
        lon: indiaProfile.lon,
        name: indiaProfile.farmName,
        region: indiaProfile.district,
        country: 'India',
      });
    } else {
      const provider = getProvider('africa');
      setLocation(provider.defaultLocation);
    }
  };

  // Save updated farm profile (Requirement 2)
  const handleSaveIndiaProfile = (newProfile: FarmProfile) => {
    setIndiaProfile(newProfile);
    try {
      localStorage.setItem('farmsense_india_profile', JSON.stringify(newProfile));
    } catch {}
    setLocation({
      lat: newProfile.lat,
      lon: newProfile.lon,
      name: newProfile.farmName,
      region: newProfile.district,
      country: 'India',
    });
  };

  // Market picker toggle
  const handleSelectMarket = (marketName: string) => {
    setSelectedMarkets((prev) => {
      let updated: string[];
      if (prev.includes(marketName)) {
        updated = prev.filter((m) => m !== marketName);
      } else {
        if (prev.length >= 3) {
          updated = [...prev.slice(1), marketName]; // keep max 3
        } else {
          updated = [...prev, marketName];
        }
      }
      try {
        localStorage.setItem('farmsense_selected_markets', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Load Africa data
  const loadAfricaData = useCallback(
    async (lat: number, lon: number, isDemo: boolean) => {
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
            id: 'err-scene',
            date: new Date().toISOString().split('T')[0],
            cloudCoverPercent: 100,
            error: err.message || 'Unable to query satellite imagery',
          });
        })
        .finally(() => setIsSatelliteLoading(false));

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

  // Load India data
  const loadIndiaData = useCallback(async (lat: number, lon: number) => {
    setIsIndiaLoading(true);
    const indiaProv = new IndiaProvider();

    // 1. SoilGrids
    fetch(`/api/india/soil?lat=${lat}&lon=${lon}`)
      .then((r) => r.json())
      .then((data) => setIndiaSoil(data))
      .catch(() => {});

    // 2. Weather
    indiaProv
      .getIndiaWeatherDetail(lat, lon)
      .then((data) => setIndiaWeather(data))
      .catch(() => {});

    // 3. Mandi Prices
    indiaProv
      .getMandiPrices()
      .then((data) => setIndiaMandi(data))
      .catch(() => {})
      .finally(() => setIsIndiaLoading(false));
  }, []);

  // Effect to load data based on region
  useEffect(() => {
    if (region === 'africa') {
      loadAfricaData(location.lat, location.lon, demoMode);
    } else {
      loadIndiaData(indiaProfile.lat, indiaProfile.lon);
    }
  }, [region, location.lat, location.lon, demoMode, loadAfricaData, loadIndiaData, indiaProfile.lat, indiaProfile.lon]);

  // Generate Africa Advisory (Max 80 words)
  const generateAfricaAdvisory = useCallback(
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
        region: 'africa' as const,
      };

      try {
        const response = await fetch('/api/gemini/advisory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`Advisory server error: HTTP ${response.status}`);
        const data = await response.json();
        setAdvisory({
          language: lang,
          text: data.text,
          wordCount: data.wordCount,
          timestamp: new Date().toISOString(),
          generatedBy: data.generatedBy,
        });
      } catch {
        const fallbackText =
          lang === 'sw'
            ? `Ushauri wa Shamba: ${decisions.lime.verdict}. ${decisions.planting.verdict}. Mvua ni mm ${rainTotal?.toFixed(1) || 0}.`
            : `Farm Advisory: ${decisions.lime.verdict}. ${decisions.planting.verdict}. 7-day rain is ${rainTotal?.toFixed(1) || 0} mm.`;

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
    [location, soilData, weatherData, satelliteData, decisions, rainTotal]
  );

  // Generate India Advisory (Max 60 words, strictly grounded, Tamil or English)
  const generateIndiaAdvisory = useCallback(async () => {
    setIsIndiaAdvisoryLoading(true);
    const lang = indiaProfile.advisoryLanguage;

    const payload = {
      locationName: indiaProfile.farmName,
      coords: { lat: indiaProfile.lat, lon: indiaProfile.lon },
      soilPh: indiaSoil?.topsoilSummary?.meanPh,
      nitrogen: indiaSoil?.topsoilSummary?.meanNitrogen,
      organicCarbon: indiaSoil?.topsoilSummary?.meanSoc,
      texture: indiaSoil?.topsoilSummary?.textureClass,
      totalRain7DaysMm: indiaWeather?.totalRain7DaysMm,
      satelliteCloudCoverPercent: 14.2,
      satelliteDate: '01/10/2026',
      language: lang,
      region: 'india' as const,
      indiaDecisionsSummary: `
1. Irrigate: ${indiaDecisions.irrigate.verdictEn} (${indiaDecisions.irrigate.shortEn})
2. Spray: ${indiaDecisions.spray.verdictEn} (${indiaDecisions.spray.shortEn})
3. Sow: ${indiaDecisions.sow.verdictEn} (${indiaDecisions.sow.shortEn})
4. Soil: ${indiaDecisions.soilAmendment.verdictEn} (${indiaDecisions.soilAmendment.shortEn})
5. Harvest: ${indiaDecisions.harvest.verdictEn} (${indiaDecisions.harvest.shortEn})
6. Alerts: ${indiaDecisions.alerts.map((a) => a.shortEn).join('; ') || 'None'}
`,
    };

    try {
      const response = await fetch('/api/gemini/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Advisory server error: HTTP ${response.status}`);
      const data = await response.json();
      setIndiaAdvisoryText(data.text);
    } catch {
      const isTa = lang === 'ta';
      const fallback = isTa
        ? `இன்றைய பண்ணை ஆலோசனை: பாசனம்: ${indiaDecisions.irrigate.shortTa}. மருந்து தெளிப்பு: ${indiaDecisions.spray.shortTa}. நடவு: ${indiaDecisions.sow.shortTa}. மண் பரிசோதனை அட்டை பெறவும்.`
        : `Farm Advisory: Irrigate: ${indiaDecisions.irrigate.shortEn}. Spray: ${indiaDecisions.spray.shortEn}. Sow: ${indiaDecisions.sow.shortEn}. Harvest: ${indiaDecisions.harvest.shortEn}.`;
      setIndiaAdvisoryText(fallback);
    } finally {
      setIsIndiaAdvisoryLoading(false);
    }
  }, [indiaProfile, indiaSoil, indiaWeather, indiaDecisions]);

  // Trigger Africa advisory once settled
  useEffect(() => {
    if (region === 'africa' && !isSoilLoading && !isSatelliteLoading && !isWeatherLoading) {
      const sig = `${location.lat.toFixed(3)}_${location.lon.toFixed(3)}_${advisoryLanguage}_${soilPh?.toFixed(1) || '0'}_${rainTotal?.toFixed(0) || '0'}`;
      if (sig !== lastAdvisoryKeyRef.current) {
        lastAdvisoryKeyRef.current = sig;
        generateAfricaAdvisory(advisoryLanguage);
      }
    }
  }, [region, isSoilLoading, isSatelliteLoading, isWeatherLoading, advisoryLanguage, location.lat, location.lon, soilPh, rainTotal, generateAfricaAdvisory]);

  // Trigger India advisory once settled
  useEffect(() => {
    if (region === 'india' && !isIndiaLoading) {
      const sig = `${indiaProfile.lat.toFixed(3)}_${indiaProfile.lon.toFixed(3)}_${indiaProfile.advisoryLanguage}_${indiaSoil?.topsoilSummary?.meanPh || '0'}_${indiaWeather?.totalRain7DaysMm || '0'}`;
      if (sig !== lastIndiaAdvisoryKeyRef.current) {
        lastIndiaAdvisoryKeyRef.current = sig;
        generateIndiaAdvisory();
      }
    }
  }, [region, isIndiaLoading, indiaProfile, indiaSoil, indiaWeather, generateIndiaAdvisory]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Universal Header with Region Tabs & View Switcher */}
      <Header
        currentProvider={currentProvider}
        region={region}
        onRegionChange={handleRegionChange}
        demoMode={demoMode}
        onToggleDemoMode={() => setDemoMode(!demoMode)}
        onOpenThresholds={() => setIsThresholdModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        cropPresetName={thresholdConfig.cropPresetName}
        activeView={activeView}
        onToggleView={(view) => setActiveView(view)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-5 space-y-6">
        {/* ======================================================== */}
        {/* REGION 2: SOUTH INDIA – FAMILY FARM (CHENNAI, TAMIL NADU) */}
        {/* ======================================================== */}
        {region === 'india' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* 1. Who is this for? Panel (Top of the tab) */}
            <WhoIsThisForPanel language={indiaProfile.advisoryLanguage} />

            {/* View Mode Router: Parents' View (Mobile) vs My View (Web) */}
            {activeView === 'mobile' ? (
              <IndiaParentsView
                profile={indiaProfile}
                decisions={indiaDecisions}
                weather={indiaWeather}
                advisoryText={indiaAdvisoryText}
                isAdvisoryLoading={isIndiaAdvisoryLoading}
                onRefreshAdvisory={() => {
                  lastIndiaAdvisoryKeyRef.current = '';
                  generateIndiaAdvisory();
                }}
                onOpenProfile={() => setIsProfileModalOpen(true)}
              />
            ) : (
              <IndiaWebView
                profile={indiaProfile}
                decisions={indiaDecisions}
                weather={indiaWeather}
                soil={indiaSoil}
                mandi={indiaMandi}
                advisoryText={indiaAdvisoryText}
                isAdvisoryLoading={isIndiaAdvisoryLoading}
                onRefreshAdvisory={() => {
                  lastIndiaAdvisoryKeyRef.current = '';
                  generateIndiaAdvisory();
                }}
                onOpenProfile={() => setIsProfileModalOpen(true)}
                onOpenThresholds={() => setIsThresholdModalOpen(true)}
                onSelectMarket={handleSelectMarket}
                selectedMarkets={selectedMarkets}
              />
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* REGION 1: AFRICA – LIVE KENYA PILOT (UNCHANGED)          */}
        {/* ======================================================== */}
        {region === 'africa' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Map Plot Location Picker */}
            <MapPicker
              location={location}
              onLocationChange={(loc) => setLocation(loc)}
              presets={currentProvider.presetLocations}
              isLoading={isSoilLoading || isSatelliteLoading || isWeatherLoading}
            />

            {/* Core 3 Geo-Data Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SoilCard
                data={soilData}
                isLoading={isSoilLoading}
                onOpenRawJson={(title, raw) =>
                  setRawJsonDrawer({
                    isOpen: true,
                    title,
                    data: raw,
                  })
                }
              />
              <SatelliteCard
                data={satelliteData}
                isLoading={isSatelliteLoading}
                onOpenRawJson={(title, raw) =>
                  setRawJsonDrawer({
                    isOpen: true,
                    title,
                    data: raw,
                  })
                }
              />
              <WeatherCard
                data={weatherData}
                isLoading={isWeatherLoading}
                onOpenRawJson={(title, raw) =>
                  setRawJsonDrawer({
                    isOpen: true,
                    title,
                    data: raw,
                  })
                }
              />
            </div>

            {/* Farm Decisions Panel (3 Rules) */}
            <DecisionsPanel
              decisions={decisions}
              thresholdConfig={thresholdConfig}
              onOpenThresholds={() => setIsThresholdModalOpen(true)}
            />

            {/* Multilingual Farmer Advisory Panel (English / Swahili) */}
            <AdvisoryPanel
              advisory={advisory}
              isLoading={isAdvisoryLoading}
              language={advisoryLanguage}
              onLanguageChange={(lang) => {
                setAdvisoryLanguage(lang);
                generateAfricaAdvisory(lang);
              }}
              onRefreshAdvisory={() => {
                lastAdvisoryKeyRef.current = '';
                generateAfricaAdvisory(advisoryLanguage);
              }}
              onOpenSmsModal={() => setIsSmsModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Universal Footer with Accurate Regional Credits */}
      <footer className="mt-auto border-t border-emerald-950/80 bg-stone-900/50 py-5 text-stone-400 text-xs">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-medium text-stone-300">
              FarmSense • Smallholder & Family Farm Decision Assistant
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">
              {region === 'africa'
                ? "Soil: iSDAsoil (CC BY 4.0) · Satellite: Digital Earth Africa Sentinel-2 · Weather: Open-Meteo · SMS: Africa's Talking Sandbox"
                : 'Soil: ISRIC SoilGrids (CC BY 4.0) · Satellite: Copernicus Sentinel-2 via Earth Search · Weather: Open-Meteo · Prices: Agmarknet via data.gov.in'}
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="hover:text-emerald-400 transition underline cursor-pointer"
            >
              API Credits & Architecture
            </button>
            <span>•</span>
            <span className="text-emerald-500/80 font-mono">
              {region === 'africa' ? 'Africa Pilot Phase 1' : 'South India Live Tab'}
            </span>
          </div>
        </div>
      </footer>

      {/* Shared Modals & Drawers */}
      <FarmProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={indiaProfile}
        onSaveProfile={handleSaveIndiaProfile}
      />

      <SmsModal
        isOpen={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
        messageText={advisory?.text || ''}
      />

      <ThresholdSettingsModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        config={thresholdConfig}
        onSave={(newCfg) => {
          setThresholdConfig(newCfg);
          try {
            localStorage.setItem('farmsense_thresholds', JSON.stringify(newCfg));
          } catch {}
        }}
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
