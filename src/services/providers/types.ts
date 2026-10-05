import { SoilData, SatelliteSceneData, WeatherData, LocationCoords } from '../../types/farm.ts';

export interface DataProvider {
  id: string;
  name: string;
  region: 'africa' | 'india';
  isLive: boolean;
  tagline: string;
  defaultLocation: LocationCoords;
  presetLocations: LocationCoords[];
  getSoil(lat: number, lon: number, forceDemo?: boolean): Promise<SoilData>;
  getLatestScene(lat: number, lon: number): Promise<SatelliteSceneData>;
  getRainForecast(lat: number, lon: number): Promise<WeatherData>;
}

export interface SmsProvider {
  id: string;
  name: string;
  description: string;
  sendSms(to: string, message: string): Promise<{
    success: boolean;
    recipient: string;
    messageId?: string;
    statusText: string;
    cost?: string;
    simulatorUrl: string;
    rawResponse?: any;
    error?: string;
  }>;
}
