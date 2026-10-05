export interface LocationCoords {
  lat: number;
  lon: number;
  name?: string;
  region?: string;
  country?: string;
}

export interface SoilPropertyReading {
  value: number;
  unit: string;
  name: string;
  depth: string;
  raw?: any;
}

export interface SoilData {
  source: string;
  credit: string;
  timestamp: string;
  isSampleData?: boolean;
  coords: { lat: number; lon: number };
  topsoil: {
    ph?: SoilPropertyReading;
    nitrogen?: SoilPropertyReading;
    organicCarbon?: SoilPropertyReading;
    texture?: {
      classification?: string;
      sandPercent?: number;
      clayPercent?: number;
      siltPercent?: number;
      raw?: any;
    };
  };
  subsoil?: {
    ph?: SoilPropertyReading;
    nitrogen?: SoilPropertyReading;
    organicCarbon?: SoilPropertyReading;
    texture?: {
      classification?: string;
      sandPercent?: number;
      clayPercent?: number;
      siltPercent?: number;
    };
  };
  rawResponse?: any;
  error?: string;
}

export interface SatelliteSceneData {
  source: string;
  credit: string;
  timestamp: string;
  isSampleData?: boolean;
  coords: { lat: number; lon: number };
  id: string;
  date: string;
  cloudCoverPercent: number;
  thumbnailUrl?: string;
  previewUrl?: string;
  platform?: string;
  bbox?: number[];
  allRecentScenes?: Array<{
    id: string;
    date: string;
    cloudCoverPercent: number;
    thumbnailUrl?: string;
  }>;
  rawItem?: any;
  error?: string;
}

export interface WeatherDayForecast {
  date: string;
  dayName: string;
  rainMm: number;
}

export interface WeatherData {
  source: string;
  credit: string;
  timestamp: string;
  isSampleData?: boolean;
  coords: { lat: number; lon: number };
  totalRain7DaysMm: number;
  daily: WeatherDayForecast[];
  elevation?: number;
  rawResponse?: any;
  error?: string;
}

export interface DecisionItem {
  id: 'lime' | 'planting' | 'satellite';
  title: string;
  status: 'green' | 'amber' | 'red';
  verdict: string;
  recommendation: string;
  reason: string;
  details: string;
}

export interface FarmDecisions {
  lime: DecisionItem;
  planting: DecisionItem;
  satellite: DecisionItem;
}

export interface AdvisoryResponse {
  language: 'en' | 'sw';
  text: string;
  wordCount: number;
  timestamp: string;
  generatedBy?: string;
}

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  recipient: string;
  cost?: string;
  statusText: string;
  simulatorUrl: string;
  rawResponse?: any;
  error?: string;
}
