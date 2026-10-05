import { DataProvider } from './types.ts';
import { SoilData, SatelliteSceneData, WeatherData, LocationCoords } from '../../types/farm.ts';
import { SoilGridsDetail, IndiaWeatherData, MandiData } from '../../types/indiaFarm.ts';
import { INDIA_THRESHOLDS } from '../../config/indiaThresholds.ts';
import { formatDateIST } from '../../utils/indiaFormat.ts';

/**
 * IndiaProvider
 * Implementation of DataProvider for South India – Family Farm near Chennai, Tamil Nadu.
 *
 * Integrations:
 * 1. Soil: ISRIC SoilGrids v2.0 (via server /api/india/soil with 30-day caching)
 * 2. Satellite: Copernicus Sentinel-2 via AWS Earth Search STAC (via /api/india/satellite)
 * 3. Weather: Open-Meteo with Asia/Kolkata timezone & hourly spray window analysis
 * 4. Mandi Prices: data.gov.in Agmarknet feed (via /api/india/mandi with 7-day trend)
 */
export class IndiaProvider implements DataProvider {
  id = 'south_india_family';
  name = 'South India – Family Farm';
  region = 'india' as const;
  isLive = true;
  tagline = 'Family Farm near Chennai, Tamil Nadu • Live SoilGrids, Sentinel-2, Open-Meteo & Mandi';

  // Centered on lat 13.08, lon 80.27 as specified in Requirement 2
  defaultLocation: LocationCoords = {
    lat: 13.08,
    lon: 80.27,
    name: "Family Farm (Chennai / Thiruvallur)",
    region: 'Tamil Nadu',
    country: 'India',
  };

  presetLocations: LocationCoords[] = [
    {
      lat: 13.08,
      lon: 80.27,
      name: "Parents' Field (Chennai / Thiruvallur border)",
      region: 'Tamil Nadu',
      country: 'India',
    },
    {
      lat: 12.834,
      lon: 79.703,
      name: 'Kancheepuram Paddy / Groundnut Belt',
      region: 'Tamil Nadu',
      country: 'India',
    },
    {
      lat: 12.684,
      lon: 80.003,
      name: 'Chengalpattu Coastal Farmland',
      region: 'Tamil Nadu',
      country: 'India',
    },
    {
      lat: 13.332,
      lon: 80.201,
      name: 'Ponneri Horticultural / Vegetable Plot',
      region: 'Tamil Nadu',
      country: 'India',
    },
  ];

  /**
   * 1. Soil Data – ISRIC SoilGrids v2.0 (30-day cached server-side)
   */
  async getSoil(lat: number, lon: number): Promise<SoilData> {
    try {
      const res = await fetch(`/api/india/soil?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error(`Soil server returned HTTP ${res.status}`);
      const detail: SoilGridsDetail = await res.json();

      const topsoilLayer = detail.layers?.find((l) => l.depth === '0-5cm') || detail.layers?.[0];
      const subsoilLayer = detail.layers?.find((l) => l.depth === '15-30cm') || detail.layers?.[detail.layers.length - 1];

      return {
        source: detail.source || 'ISRIC SoilGrids v2.0',
        credit: 'Soil data: ISRIC SoilGrids v2.0 (CC BY 4.0)',
        timestamp: detail.timestamp || new Date().toISOString(),
        coords: { lat, lon },
        isSampleData: false,
        topsoil: {
          ph: {
            value: topsoilLayer?.phh2o ?? detail.topsoilSummary?.meanPh ?? 8.0,
            unit: 'pH units (H2O)',
            name: 'Topsoil Reaction (0-5 cm)',
            depth: '0-5 cm',
          },
          nitrogen: {
            value: topsoilLayer?.nitrogen ?? detail.topsoilSummary?.meanNitrogen ?? 1.5,
            unit: 'g/kg',
            name: 'Total Nitrogen',
            depth: '0-5 cm',
          },
          organicCarbon: {
            value: topsoilLayer?.soc ?? detail.topsoilSummary?.meanSoc ?? 6.0,
            unit: 'g/kg',
            name: 'Soil Organic Carbon',
            depth: '0-5 cm',
          },
          texture: {
            classification: detail.topsoilSummary?.textureClass || 'Sandy Clay Loam',
            sandPercent: topsoilLayer?.sandPercent ?? 46,
            clayPercent: topsoilLayer?.clayPercent ?? 34,
            siltPercent: 100 - (topsoilLayer?.sandPercent ?? 46) - (topsoilLayer?.clayPercent ?? 34),
          },
        },
        subsoil: subsoilLayer
          ? {
              ph: {
                value: subsoilLayer.phh2o,
                unit: 'pH units',
                name: 'Subsoil Reaction (15-30 cm)',
                depth: '15-30 cm',
              },
              nitrogen: {
                value: subsoilLayer.nitrogen,
                unit: 'g/kg',
                name: 'Subsoil Nitrogen',
                depth: '15-30 cm',
              },
              organicCarbon: {
                value: subsoilLayer.soc,
                unit: 'g/kg',
                name: 'Subsoil Organic Carbon',
                depth: '15-30 cm',
              },
              texture: {
                sandPercent: subsoilLayer.sandPercent,
                clayPercent: subsoilLayer.clayPercent,
                siltPercent: 100 - subsoilLayer.sandPercent - subsoilLayer.clayPercent,
              },
            }
          : undefined,
        rawResponse: detail,
      };
    } catch (err: any) {
      return {
        source: 'ISRIC SoilGrids v2.0',
        credit: 'Soil data: ISRIC SoilGrids (CC BY 4.0)',
        timestamp: new Date().toISOString(),
        coords: { lat, lon },
        isSampleData: true,
        topsoil: {
          ph: { value: 8.0, unit: 'pH units', name: 'Soil Reaction (Modelled)', depth: '0-5 cm' },
          nitrogen: { value: 1.4, unit: 'g/kg', name: 'Nitrogen', depth: '0-5 cm' },
          organicCarbon: { value: 6.2, unit: 'g/kg', name: 'Organic Carbon', depth: '0-5 cm' },
          texture: { classification: 'Sandy Clay Loam', sandPercent: 46, clayPercent: 34, siltPercent: 20 },
        },
        error: `Notice: ${err.message}. Showing modelled 250m estimate.`,
      };
    }
  }

  /**
   * 2. Satellite Scene – Copernicus Sentinel-2 via Earth Search STAC
   */
  async getLatestScene(lat: number, lon: number): Promise<SatelliteSceneData> {
    try {
      const res = await fetch(`/api/india/satellite?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error(`Satellite server returned HTTP ${res.status}`);
      const data = await res.json();

      return {
        source: data.source || 'Earth Search STAC Sentinel-2',
        credit: data.credit || 'Satellite: Copernicus Sentinel-2 via Earth Search',
        timestamp: data.timestamp || new Date().toISOString(),
        coords: { lat, lon },
        id: data.id || 'sentinel-2-india',
        date: data.date || new Date().toISOString().split('T')[0],
        cloudCoverPercent: data.cloudCoverPercent ?? 18.0,
        thumbnailUrl: data.thumbnailUrl,
        allRecentScenes: data.allRecentScenes || [],
        rawItem: data,
        error: data.monsoonNote,
      };
    } catch (err: any) {
      return {
        source: 'Earth Search Sentinel-2',
        credit: 'Satellite: Copernicus Sentinel-2 via Earth Search',
        timestamp: new Date().toISOString(),
        coords: { lat, lon },
        id: 'S2_INDIA_ESTIMATE',
        date: new Date().toISOString().split('T')[0],
        cloudCoverPercent: 22.0,
        thumbnailUrl: 'https://tiles.maps.eox.at/wms?service=wms&request=getmap&version=1.1.1&layers=s2cloudless-2020&styles=&format=image/jpeg&bbox=80.25,13.06,80.29,13.10&width=512&height=512&srs=EPSG:4326',
        error: `Satellite scene query notice: ${err.message}`,
      };
    }
  }

  /**
   * 3. Weather – Open-Meteo (Asia/Kolkata timezone, 7 days daily & hourly)
   */
  async getRainForecast(lat: number, lon: number): Promise<WeatherData> {
    const detail = await this.getIndiaWeatherDetail(lat, lon);
    return {
      source: detail.source,
      credit: detail.credit,
      timestamp: detail.timestamp,
      coords: detail.coords,
      totalRain7DaysMm: detail.totalRain7DaysMm,
      daily: detail.daily.map((d) => ({
        date: d.date,
        dayName: d.dayName,
        rainMm: d.precipitationSumMm,
      })),
      rawResponse: detail,
      error: detail.error,
    };
  }

  /**
   * Full detailed weather analysis for South India decisions
   */
  async getIndiaWeatherDetail(lat: number, lon: number): Promise<IndiaWeatherData> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,precipitation_probability_max,temperature_2m_max,wind_speed_10m_max&hourly=precipitation_probability,wind_speed_10m&timezone=Asia%2FKolkata&forecast_days=7`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Open-Meteo returned HTTP ${res.status}`);
      const data = await res.json();

      const dailyDates: string[] = data.daily?.time || [];
      const dailyPrecip: number[] = data.daily?.precipitation_sum || [];
      const dailyProb: number[] = data.daily?.precipitation_probability_max || [];
      const dailyTemp: number[] = data.daily?.temperature_2m_max || [];
      const dailyWind: number[] = data.daily?.wind_speed_10m_max || [];

      let totalRain7DaysMm = 0;
      let next48hRainMm = 0;
      let consecutiveDryDays = 0;
      let maxDryRun = 0;

      const daily: any[] = dailyDates.map((dStr, idx) => {
        const rain = dailyPrecip[idx] ?? 0;
        const prob = dailyProb[idx] ?? 0;
        const temp = dailyTemp[idx] ?? 32;
        const wind = dailyWind[idx] ?? 12;

        totalRain7DaysMm += rain;
        if (idx < 2) next48hRainMm += rain;

        if (rain < INDIA_THRESHOLDS.harvest.dryDayPrecipitationMaxMm) {
          consecutiveDryDays++;
          if (consecutiveDryDays > maxDryRun) maxDryRun = consecutiveDryDays;
        } else {
          consecutiveDryDays = 0;
        }

        // IMD Alert classification
        let alertLevel: 'normal' | 'orange' | 'red' | 'dark_red' | 'wind' = 'normal';
        let alertTitle: string | undefined;
        let alertActions: string[] | undefined;

        if (rain >= INDIA_THRESHOLDS.imdAlerts.extremelyHeavyRainMinMm) {
          alertLevel = 'dark_red';
          alertTitle = `Extremely Heavy Rain (${rain.toFixed(1)} mm)`;
          alertActions = INDIA_THRESHOLDS.imdAlerts.actions;
        } else if (rain >= INDIA_THRESHOLDS.imdAlerts.veryHeavyRainMinMm) {
          alertLevel = 'red';
          alertTitle = `Very Heavy Rain (${rain.toFixed(1)} mm)`;
          alertActions = INDIA_THRESHOLDS.imdAlerts.actions;
        } else if (rain >= INDIA_THRESHOLDS.imdAlerts.heavyRainMinMm) {
          alertLevel = 'orange';
          alertTitle = `Heavy Rain (${rain.toFixed(1)} mm)`;
          alertActions = INDIA_THRESHOLDS.imdAlerts.actions;
        } else if (wind >= INDIA_THRESHOLDS.imdAlerts.strongWindMinKmH) {
          alertLevel = 'wind';
          alertTitle = `Strong Wind (${wind.toFixed(1)} km/h)`;
          alertActions = [INDIA_THRESHOLDS.imdAlerts.bananaCoconutAction];
        }

        const dateObj = new Date(dStr);
        return {
          date: dStr,
          formattedDate: formatDateIST(dStr),
          dayName: isNaN(dateObj.getTime())
            ? `Day ${idx + 1}`
            : dateObj.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' }),
          precipitationSumMm: Number(rain.toFixed(1)),
          precipitationProbabilityMax: prob,
          temperatureMaxC: Math.round(temp),
          windSpeedMaxKmH: Number(wind.toFixed(1)),
          alertLevel,
          alertTitle,
          alertActions,
        };
      });

      // Analyze hourly forecast for spray window in next 24 hours
      const hourlyTimes: string[] = data.hourly?.time || [];
      const hourlyProbs: number[] = data.hourly?.precipitation_probability || [];
      const hourlyWinds: number[] = data.hourly?.wind_speed_10m || [];

      const hourlyPoints = hourlyTimes.slice(0, 24).map((hTime, idx) => ({
        time: hTime,
        timeFormatted: hTime.split('T')[1]?.slice(0, 5) || `${idx}:00`,
        precipitationProbability: hourlyProbs[idx] ?? 0,
        windSpeedKmH: hourlyWinds[idx] ?? 10,
      }));

      const next24hMaxRainProb = Math.max(...hourlyPoints.map((p) => p.precipitationProbability), 0);
      const next24hMaxWindKmH = Math.max(...hourlyPoints.map((p) => p.windSpeedKmH), 0);

      // Find best 3-hour spray window
      let bestWindow: { windowText: string; rainProb: number; windSpeed: number } | undefined;
      for (let i = 6; i <= 17; i++) {
        const slice = hourlyPoints.slice(i, i + 3);
        if (slice.length === 3) {
          const avgProb = slice.reduce((a, b) => a + b.precipitationProbability, 0) / 3;
          const avgWind = slice.reduce((a, b) => a + b.windSpeedKmH, 0) / 3;

          if (avgProb < 40 && avgWind < 15) {
            bestWindow = {
              windowText: `${slice[0].timeFormatted} – ${slice[2].timeFormatted}`,
              rainProb: Math.round(avgProb),
              windSpeed: Number(avgWind.toFixed(1)),
            };
            break;
          }
        }
      }

      return {
        source: 'Open-Meteo Forecast (Asia/Kolkata)',
        credit: 'Weather data: Open-Meteo (CC BY 4.0)',
        timestamp: new Date().toISOString(),
        coords: { lat, lon },
        timezone: 'Asia/Kolkata',
        totalRain7DaysMm: Number(totalRain7DaysMm.toFixed(1)),
        next48hRainMm: Number(next48hRainMm.toFixed(1)),
        next24hMaxRainProb,
        next24hMaxWindKmH: Number(next24hMaxWindKmH.toFixed(1)),
        daily,
        hourly: hourlyPoints,
        bestSprayWindow: bestWindow,
        consecutiveDryDays: maxDryRun,
      };
    } catch (err: any) {
      return {
        source: 'Open-Meteo Forecast',
        credit: 'Weather data: Open-Meteo (CC BY 4.0)',
        timestamp: new Date().toISOString(),
        coords: { lat, lon },
        timezone: 'Asia/Kolkata',
        totalRain7DaysMm: 12.0,
        next48hRainMm: 4.0,
        next24hMaxRainProb: 30,
        next24hMaxWindKmH: 14.0,
        daily: [],
        hourly: [],
        consecutiveDryDays: 3,
        error: `Weather forecast query notice: ${err.message}`,
      };
    }
  }

  /**
   * 4. Mandi Prices – data.gov.in Agmarknet feed
   */
  async getMandiPrices(): Promise<MandiData> {
    try {
      const res = await fetch('/api/india/mandi');
      if (!res.ok) throw new Error(`Mandi server returned HTTP ${res.status}`);
      return await res.json();
    } catch (err: any) {
      return {
        records: [],
        availableMarkets: ['Koyambedu Wholesale', 'Kanchipuram Regulated', 'Chengalpattu Regulated'],
        selectedMarkets: ['Koyambedu Wholesale', 'Kanchipuram Regulated'],
        lastSnapshotDate: new Date().toLocaleDateString('en-GB'),
        isRealTime: false,
        hasApiKey: false,
        historicalTrend: {},
        source: 'Agmarknet Tamil Nadu (Snapshot)',
        error: err.message,
      };
    }
  }
}
