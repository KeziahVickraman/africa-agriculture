export type TamilNaduDistrict = 'Chennai' | 'Thiruvallur' | 'Chengalpattu' | 'Kancheepuram';

export type IndiaCrop =
  | 'paddy'
  | 'groundnut'
  | 'coconut'
  | 'banana'
  | 'tomato'
  | 'brinjal'
  | 'bhindi'
  | 'jasmine';

export type WaterSource = 'borewell' | 'canal' | 'tank' | 'rainfed';

export interface FarmProfile {
  farmName: string;
  state: 'Tamil Nadu';
  district: TamilNaduDistrict;
  lat: number;
  lon: number;
  areaAcres: number;
  crops: IndiaCrop[];
  paddySowingDate?: string; // YYYY-MM-DD
  waterSource: WaterSource;
  referencePrices: Record<string, number>; // in ₹ per quintal
  advisoryLanguage: 'ta' | 'en';
}

export interface SoilDepthLayer {
  depth: '0-5cm' | '5-15cm' | '15-30cm';
  phh2o: number; // e.g. 8.1
  nitrogen: number; // e.g. 1.8 g/kg
  soc: number; // soil organic carbon, e.g. 6.5 g/kg
  clayPercent: number; // e.g. 35%
  sandPercent: number; // e.g. 45%
}

export interface SoilGridsDetail {
  source: string;
  credit: string;
  timestamp: string;
  coords: { lat: number; lon: number };
  isCached30Days?: boolean;
  isModelEstimateNotice: string;
  layers: SoilDepthLayer[];
  topsoilSummary: {
    meanPh: number;
    meanNitrogen: number;
    meanSoc: number;
    meanClay: number;
    meanSand: number;
    textureClass: string;
  };
  error?: string;
}

export interface HourlyWeatherPoint {
  time: string; // ISO
  timeFormatted: string; // e.g. 06:00
  precipitationProbability: number; // %
  windSpeedKmH: number; // km/h
}

export interface IndiaDailyForecast {
  date: string; // ISO
  formattedDate: string; // DD/MM/YYYY
  dayName: string; // e.g. Mon
  precipitationSumMm: number;
  precipitationProbabilityMax: number;
  temperatureMaxC: number;
  windSpeedMaxKmH: number;
  alertLevel: 'normal' | 'orange' | 'red' | 'dark_red' | 'wind';
  alertTitle?: string;
  alertActions?: string[];
}

export interface IndiaWeatherData {
  source: string;
  credit: string;
  timestamp: string;
  coords: { lat: number; lon: number };
  timezone: 'Asia/Kolkata';
  totalRain7DaysMm: number;
  next48hRainMm: number;
  next24hMaxRainProb: number;
  next24hMaxWindKmH: number;
  daily: IndiaDailyForecast[];
  hourly: HourlyWeatherPoint[];
  bestSprayWindow?: {
    windowText: string;
    rainProb: number;
    windSpeed: number;
  };
  consecutiveDryDays: number;
  error?: string;
}

export interface MandiRecord {
  market: string;
  district: string;
  commodity: string;
  variety: string;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  isStateWide: boolean;
}

export interface MandiData {
  records: MandiRecord[];
  availableMarkets: string[];
  selectedMarkets?: string[];
  lastSnapshotDate: string | null;
  isRealTime: boolean;
  hasApiKey: boolean;
  historicalTrend: Record<string, Array<{ date: string; modal_price: number }>>;
  source: string;
  error?: string;
  errorCode?: string;
  errorSnippet?: string;
}

export interface DecisionResult {
  id: string;
  title: string;
  titleTa: string;
  status: 'green' | 'amber' | 'red';
  icon: 'check' | 'pause' | 'alert';
  verdictEn: string;
  verdictTa: string;
  shortEn: string; // strictly under 10 words
  shortTa: string; // strictly under 10 words
  reasonEn: string;
  reasonTa: string;
  thresholdNote: string;
  detailsEn?: string;
  detailsTa?: string;
}

export interface IndiaDecisionsMap {
  irrigate: DecisionResult;
  spray: DecisionResult;
  sow: DecisionResult;
  soilAmendment: DecisionResult;
  sell: Record<string, DecisionResult>;
  harvest: DecisionResult;
  alerts: DecisionResult[];
}
