import { DataProvider } from './types.ts';
import { SoilData, SatelliteSceneData, WeatherData, LocationCoords } from '../../types/farm.ts';

/**
 * IndiaProvider (Phase 2 Stub)
 *
 * Designed for user's personal farmhouse in India (e.g. Maharashtra, Karnataka, or Punjab).
 * In Phase 2, this class will implement the exact same DataProvider interface,
 * allowing instant zero-downtime swapping of the data layer.
 */
export class IndiaProvider implements DataProvider {
  id = 'india_phase2';
  name = 'India – Coming Soon (Phase 2)';
  region = 'india' as const;
  isLive = false;
  tagline = 'Phase 2 Architecture: Swappable to Indian Farmhouse';

  // Default coordinate for user's farmhouse (e.g., Pune / Western Ghats horticultural belt)
  defaultLocation: LocationCoords = {
    lat: 18.5204,
    lon: 73.8567,
    name: 'Farmhouse (Western India)',
    region: 'Maharashtra',
    country: 'India',
  };

  presetLocations: LocationCoords[] = [
    {
      lat: 18.5204,
      lon: 73.8567,
      name: 'Pune Farmhouse Estate',
      region: 'Maharashtra',
      country: 'India',
    },
    {
      lat: 19.9975,
      lon: 73.7898,
      name: 'Nashik Vineyard / Farm',
      region: 'Maharashtra',
      country: 'India',
    },
    {
      lat: 13.0827,
      lon: 80.2707,
      name: 'Southern Farmland',
      region: 'Tamil Nadu',
      country: 'India',
    },
    {
      lat: 30.7333,
      lon: 76.7794,
      name: 'Punjab Agro Hub',
      region: 'Punjab',
      country: 'India',
    },
  ];

  /**
   * TODO: Phase 2 Soil Data Implementation
   *
   * Integration targets for Indian Farmhouse:
   * 1. India Soil Health Card (SHC) API (soilhealth.dac.gov.in)
   * 2. ICAR - NBSS&LUP (National Bureau of Soil Survey & Land Use Planning)
   * 3. Bhuvan Soil Information System (ISRO)
   * 4. Local IoT soil probe integration (e.g., RS485 NPK sensor / LoRaWAN gateway)
   */
  async getSoil(lat: number, lon: number): Promise<SoilData> {
    // TODO: Connect to Indian Soil Health Card API or ICAR GeoPortal
    return {
      source: 'India Provider Stub (Phase 2 Architecture)',
      credit: 'Soil data: ICAR / Soil Health Card Portal (Coming in Phase 2)',
      timestamp: new Date().toISOString(),
      coords: { lat, lon },
      isSampleData: true,
      topsoil: {
        ph: {
          value: 6.8,
          unit: 'pH units',
          name: 'Soil Reaction (Neutral Black Cotton Soil)',
          depth: '0-20 cm',
        },
        nitrogen: {
          value: 2.1,
          unit: 'g/kg',
          name: 'Available Nitrogen (Kharif benchmark)',
          depth: '0-20 cm',
        },
        organicCarbon: {
          value: 8.5,
          unit: 'g/kg',
          name: 'Organic Carbon',
          depth: '0-20 cm',
        },
        texture: {
          classification: 'Clay Loam / Vertisol (Black Cotton Soil)',
          sandPercent: 20,
          clayPercent: 45,
          siltPercent: 35,
        },
      },
      error: 'Phase 2: India soil provider stub active. To implement, plug in Soil Health Card API or Bhuvan endpoint in src/services/providers/IndiaProvider.ts.',
    };
  }

  /**
   * TODO: Phase 2 Satellite Scene Implementation
   *
   * Integration targets:
   * 1. Copernicus Data Space Ecosystem (CDSE) STAC API: https://catalogue.dataspace.copernicus.eu/stac
   * 2. ISRO Bhuvan Carto/Resourcesat WMS/WFS APIs
   * 3. AWS Sentinel-2 open registry STAC (earth-search.aws.element84.com)
   */
  async getLatestScene(lat: number, lon: number): Promise<SatelliteSceneData> {
    // TODO: Call Copernicus Data Space or AWS Earth Search STAC for India coordinates
    return {
      source: 'Copernicus Data Space STAC (India Target - Phase 2)',
      credit: 'Satellite data: Copernicus Sentinel-2 / ISRO Bhuvan',
      timestamp: new Date().toISOString(),
      coords: { lat, lon },
      id: 'india-s2-stub',
      date: new Date().toISOString().split('T')[0],
      cloudCoverPercent: 12.0,
      isSampleData: true,
      error: 'Phase 2: Connect AWS Earth Search or Copernicus Data Space STAC API for live Indian satellite scenes.',
    };
  }

  /**
   * TODO: Phase 2 Weather Implementation
   *
   * Open-Meteo works globally, including anywhere in India!
   * Optionally in Phase 2, integrate India Meteorological Department (IMD) Mausam API.
   */
  async getRainForecast(lat: number, lon: number): Promise<WeatherData> {
    // Open-Meteo has global coverage and works directly for India coordinates too!
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&forecast_days=7&timezone=auto`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Open-Meteo query failed');
      const data = await response.json();
      const dailyDates: string[] = data.daily?.time || [];
      const dailyPrecip: number[] = data.daily?.precipitation_sum || [];

      let totalRainMm = 0;
      const dailyList = dailyDates.map((dStr, idx) => {
        const rainVal = dailyPrecip[idx] ?? 0;
        totalRainMm += rainVal;
        return {
          date: dStr,
          dayName: new Date(dStr).toLocaleDateString('en-US', { weekday: 'short' }),
          rainMm: Number(rainVal.toFixed(1)),
        };
      });

      return {
        source: 'Open-Meteo Weather Forecast (India)',
        credit: 'Weather data: Open-Meteo (Global CC BY 4.0)',
        timestamp: new Date().toISOString(),
        coords: { lat, lon },
        totalRain7DaysMm: Number(totalRainMm.toFixed(1)),
        daily: dailyList,
        rawResponse: data,
      };
    } catch {
      return {
        source: 'Open-Meteo Forecast',
        credit: 'Weather data: Open-Meteo (CC BY 4.0)',
        timestamp: new Date().toISOString(),
        coords: { lat, lon },
        totalRain7DaysMm: 15.0,
        daily: [],
        error: 'Unable to fetch weather forecast for Indian coordinates.',
      };
    }
  }
}
