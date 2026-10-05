import { DataProvider } from './types.ts';
import { SoilData, SatelliteSceneData, WeatherData, LocationCoords } from '../../types/farm.ts';

export class AfricaProvider implements DataProvider {
  id = 'africa_live';
  name = 'Africa – Live (Kenya Pilot)';
  region = 'africa' as const;
  isLive = true;
  tagline = 'Live iSDAsoil + Digital Earth Africa Sentinel-2 + Open-Meteo';

  // Default to Nakuru, Kenya (lat -0.30, lon 36.07) as instructed
  defaultLocation: LocationCoords = {
    lat: -0.30,
    lon: 36.07,
    name: 'Nakuru Plot (Pilot Farm)',
    region: 'Rift Valley',
    country: 'Kenya',
  };

  presetLocations: LocationCoords[] = [
    {
      lat: -0.30,
      lon: 36.07,
      name: 'Nakuru Maize Farm (Pilot)',
      region: 'Nakuru County',
      country: 'Kenya',
    },
    {
      lat: 0.5143,
      lon: 35.2698,
      name: 'Eldoret Grain Belt',
      region: 'Uasin Gishu',
      country: 'Kenya',
    },
    {
      lat: -0.7172,
      lon: 36.4310,
      name: 'Naivasha Horticultural Plot',
      region: 'Nakuru County',
      country: 'Kenya',
    },
    {
      lat: -0.4244,
      lon: 36.9517,
      name: 'Nyeri Highland Farm',
      region: 'Central Province',
      country: 'Kenya',
    },
  ];

  /**
   * Fetch soil data from server-side iSDAsoil proxy route
   */
  async getSoil(lat: number, lon: number, forceDemo = false): Promise<SoilData> {
    try {
      const url = `/api/soil?lat=${lat}&lon=${lon}${forceDemo ? '&demo=true' : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Soil service HTTP ${response.status}: ${text || response.statusText}`);
      }

      const data: SoilData = await response.json();
      return data;
    } catch (err: any) {
      console.warn('Soil service fetch error:', err);
      // Independent card error handling: return error inside structured response so app does not crash
      return {
        source: 'iSDAsoil API',
        credit: 'Soil data: iSDA / Digital Earth Africa, CC BY 4.0',
        timestamp: new Date().toISOString(),
        coords: { lat, lon },
        topsoil: {},
        error: `Soil service: ${err.message || 'Unable to connect to /api/soil endpoint'}`,
      };
    }
  }

  /**
   * Fetch Sentinel-2 scenes from Digital Earth Africa STAC API (CORS open, keyless)
   */
  async getLatestScene(lat: number, lon: number): Promise<SatelliteSceneData> {
    const bboxRadius = 0.05; // ±0.05° bbox as instructed
    const minLon = (lon - bboxRadius).toFixed(4);
    const minLat = (lat - bboxRadius).toFixed(4);
    const maxLon = (lon + bboxRadius).toFixed(4);
    const maxLat = (lat + bboxRadius).toFixed(4);

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const datetimeStr = `${thirtyDaysAgo.toISOString().split('T')[0]}/${today.toISOString().split('T')[0]}`;
    const stacUrl = `https://explorer.digitalearth.africa/stac/search?collections=s2_l2a&bbox=${minLon},${minLat},${maxLon},${maxLat}&limit=5&datetime=${datetimeStr}`;

    try {
      const response = await fetch(stacUrl);

      if (!response.ok) {
        throw new Error(`DE Africa STAC HTTP ${response.status}: ${response.statusText}`);
      }

      const stacData = await response.json();
      const features = stacData.features || [];

      if (features.length === 0) {
        // Return clear status when no passes found in 30 days
        return {
          source: 'Digital Earth Africa STAC (Sentinel-2 L2A)',
          credit: 'Satellite data: Digital Earth Africa, CC BY 4.0',
          timestamp: new Date().toISOString(),
          coords: { lat, lon },
          id: 'no-scene-found',
          date: 'None in last 30 days',
          cloudCoverPercent: 100,
          error: 'No Sentinel-2 orbital passes detected over this bounding box in the last 30 days.',
          rawItem: stacData,
        };
      }

      // Sort results by cloud cover (eo:cloud_cover) and date
      const sortedFeatures = [...features].sort((a, b) => {
        const cloudA = a.properties?.['eo:cloud_cover'] ?? 100;
        const cloudB = b.properties?.['eo:cloud_cover'] ?? 100;
        // Prioritize clear scenes (< 20%), then most recent date
        if (Math.abs(cloudA - cloudB) > 5) {
          return cloudA - cloudB;
        }
        const dateA = new Date(a.properties?.datetime || 0).getTime();
        const dateB = new Date(b.properties?.datetime || 0).getTime();
        return dateB - dateA;
      });

      const bestItem = sortedFeatures[0];
      const cloudCover = bestItem.properties?.['eo:cloud_cover'] ?? 0;
      const sceneDate = bestItem.properties?.datetime
        ? new Date(bestItem.properties.datetime).toISOString().split('T')[0]
        : 'Recent pass';

      // Find thumbnail or preview asset if available
      const assets = bestItem.assets || {};
      const thumbnailUrl =
        assets.thumbnail?.href ||
        assets.rendered_preview?.href ||
        assets.visual?.href ||
        assets.overview?.href;

      const recentScenesList = sortedFeatures.map((f) => ({
        id: f.id,
        date: f.properties?.datetime ? new Date(f.properties.datetime).toLocaleDateString() : 'Pass',
        cloudCoverPercent: Math.round(f.properties?.['eo:cloud_cover'] ?? 0),
        thumbnailUrl: f.assets?.thumbnail?.href || f.assets?.rendered_preview?.href,
      }));

      return {
        source: 'Digital Earth Africa STAC (Sentinel-2 L2A)',
        credit: 'Satellite data: Digital Earth Africa, CC BY 4.0',
        timestamp: new Date().toISOString(),
        coords: { lat, lon },
        id: bestItem.id,
        date: sceneDate,
        cloudCoverPercent: Number(cloudCover.toFixed(1)),
        thumbnailUrl,
        platform: bestItem.properties?.platform || 'Sentinel-2',
        bbox: bestItem.bbox,
        allRecentScenes: recentScenesList,
        rawItem: bestItem,
      };
    } catch (err: any) {
      console.warn('DE Africa STAC fetch error:', err);
      // Independent card error handling
      return {
        source: 'Digital Earth Africa STAC',
        credit: 'Satellite data: Digital Earth Africa, CC BY 4.0',
        timestamp: new Date().toISOString(),
        coords: { lat, lon },
        id: 'stac-unavailable',
        date: 'Error',
        cloudCoverPercent: 100,
        error: `Satellite service: ${err.message || 'DE Africa STAC search failed. Check network.'}`,
      };
    }
  }

  /**
   * Fetch 7-day rainfall forecast from Open-Meteo (keyless)
   */
  async getRainForecast(lat: number, lon: number): Promise<WeatherData> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&forecast_days=7&timezone=auto`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Open-Meteo HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const dailyDates: string[] = data.daily?.time || [];
      const dailyPrecip: number[] = data.daily?.precipitation_sum || [];

      let totalRainMm = 0;
      const dailyList = dailyDates.map((dStr, idx) => {
        const rainVal = dailyPrecip[idx] ?? 0;
        totalRainMm += rainVal;
        const dObj = new Date(dStr);
        const dayName = dObj.toLocaleDateString('en-US', { weekday: 'short' });
        return {
          date: dStr,
          dayName,
          rainMm: Number(rainVal.toFixed(1)),
        };
      });

      return {
        source: 'Open-Meteo Weather Forecast (7-day)',
        credit: 'Weather data: Open-Meteo (CC BY 4.0)',
        timestamp: new Date().toISOString(),
        coords: { lat, lon },
        totalRain7DaysMm: Number(totalRainMm.toFixed(1)),
        daily: dailyList,
        elevation: data.elevation,
        rawResponse: data,
      };
    } catch (err: any) {
      console.warn('Open-Meteo fetch error:', err);
      return {
        source: 'Open-Meteo Weather Forecast',
        credit: 'Weather data: Open-Meteo (CC BY 4.0)',
        timestamp: new Date().toISOString(),
        coords: { lat, lon },
        totalRain7DaysMm: 0,
        daily: [],
        error: `Weather service: ${err.message || 'Open-Meteo forecast failed.'}`,
      };
    }
  }
}
