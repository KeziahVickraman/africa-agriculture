import express from 'express';
import { getLiveSoilData, getSampleSoilData } from './isdaClient.ts';
import { sendSandboxSms } from './smsClient.ts';
import { generateAdvisory, GenerateAdvisoryParams } from './geminiClient.ts';
import { getIsricSoil, getEarthSearchSentinel, getMandiData, probeDataGovIn } from './indiaClient.ts';

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

/**
 * GET /api/health
 * Comprehensive health status of FarmSense API Gateway and all regional integrations:
 * Africa: isdaSoil, africasTalking, digitalEarthAfrica, openMeteo
 * India: soilGrids, earthSearch, openMeteoIndia, dataGovIn
 */
router.get('/health', async (req, res) => {
  const isdaConfigured = Boolean(process.env.ISDA_EMAIL && process.env.ISDA_PASSWORD);
  const atConfigured = Boolean(process.env.AT_SANDBOX_API_KEY);
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const dataGovInKey = process.env.DATA_GOV_IN_API_KEY?.trim();

  // iSDA login probe
  let isdaStatus: string = 'demo_fallback_active';
  let isdaStatusCode: number | null = null;

  if (isdaConfigured) {
    try {
      const bodyParams = new URLSearchParams();
      bodyParams.append('username', (process.env.ISDA_EMAIL || '').trim());
      bodyParams.append('password', (process.env.ISDA_PASSWORD || '').trim());

      const loginRes = await fetch('https://api.isda-africa.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: bodyParams.toString(),
      });

      isdaStatusCode = loginRes.status;

      if (loginRes.ok) {
        const data = await loginRes.json().catch(() => ({}));
        const hasToken = Boolean(data?.access_token || data?.token || data?.jwt);
        isdaStatus = hasToken ? 'online' : 'auth_failed';
      } else {
        isdaStatus = 'auth_failed';
      }
    } catch {
      isdaStatus = 'auth_failed';
      isdaStatusCode = 500;
    }
  }

  // data.gov.in Agmarknet probe (Requirement 3: 401/403 -> auth_failed, 429 -> rate_limited, 5xx -> upstream_error, 200 with 0 records -> no_data_today)
  const dataGovInProbe = await probeDataGovIn(dataGovInKey);

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    environment: process.env.NODE_ENV || 'production',
    service: 'FarmSense API Gateway',
    version: '1.1.0',
    integrations: {
      // Africa Integrations
      isdaSoil: {
        status: isdaStatus,
        endpoint: 'https://api.isda-africa.com/isdasoil/v2',
        loginEndpoint: 'https://api.isda-africa.com/login',
        ...(isdaStatusCode !== null ? { statusCode: isdaStatusCode } : {}),
        hasCredentials: isdaConfigured,
      },
      africasTalking: {
        status: atConfigured ? 'configured' : 'simulator_preview_only',
        endpoint: 'https://api.sandbox.africastalking.com/version1/messaging',
        simulatorUrl: 'https://simulator.africastalking.com',
        username: process.env.AT_SANDBOX_USERNAME || 'sandbox',
        hasApiKey: atConfigured,
      },
      digitalEarthAfrica: {
        status: 'online',
        endpoint: 'https://explorer.digitalearth.africa/stac/search',
        authRequired: false,
      },
      openMeteo: {
        status: 'online',
        endpoint: 'https://api.open-meteo.com/v1/forecast',
        authRequired: false,
      },

      // South India Integrations
      soilGrids: {
        status: 'online',
        endpoint: 'https://rest.isric.org/soilgrids/v2.0',
        caching: '30-day server cache active',
        authRequired: false,
      },
      earthSearch: {
        status: 'online',
        endpoint: 'https://earth-search.aws.element84.com/v1',
        authRequired: false,
      },
      openMeteoIndia: {
        status: 'online',
        timezone: 'Asia/Kolkata',
        endpoint: 'https://api.open-meteo.com/v1/forecast',
        authRequired: false,
      },
      dataGovIn: {
        status: dataGovInProbe.status,
        ...(dataGovInProbe.statusCode != null ? { statusCode: dataGovInProbe.statusCode } : {}),
        ...(dataGovInProbe.errorBodySnippet ? { errorBodySnippet: dataGovInProbe.errorBodySnippet } : {}),
        hasApiKey: dataGovInProbe.hasApiKey,
        resourceId: '9ef84268-d588-465a-a308-a864a43d0070',
      },

      // Shared AI
      geminiAi: {
        status: geminiConfigured ? 'configured' : 'rule_fallback_active',
        model: 'gemini-3.8-flash',
        hasApiKey: geminiConfigured,
      },
    },
  });
});

/**
 * GET /api/config-status
 */
router.get('/config-status', (req, res) => {
  const hasIsda = Boolean(process.env.ISDA_EMAIL && process.env.ISDA_PASSWORD);
  const hasAt = Boolean(process.env.AT_SANDBOX_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasDataGovIn = Boolean(process.env.DATA_GOV_IN_API_KEY);

  res.json({
    status: 'ok',
    integrations: {
      isdaSoil: {
        configured: hasIsda,
        emailSet: Boolean(process.env.ISDA_EMAIL),
        service: 'iSDAsoil API v2 (api.isda-africa.com)',
      },
      africasTalking: {
        configured: hasAt,
        username: process.env.AT_SANDBOX_USERNAME || 'sandbox',
        simulatorUrl: 'https://simulator.africastalking.com',
      },
      geminiAi: {
        configured: hasGemini,
        model: 'gemini-3.8-flash',
      },
      dataGovIn: {
        configured: hasDataGovIn,
        resource: 'National Mandi Prices - Agmarknet',
      },
    },
  });
});

/**
 * GET /api/soil
 * Query iSDAsoil API server-side with cached JWT (Africa)
 */
router.get('/soil', async (req, res) => {
  const latStr = req.query.lat as string;
  const lonStr = req.query.lon as string;
  const forceDemo = req.query.demo === 'true';

  const lat = parseFloat(latStr || '-0.30');
  const lon = parseFloat(lonStr || '36.07');

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Invalid latitude or longitude parameters' });
  }

  const hasCredentials = Boolean(process.env.ISDA_EMAIL && process.env.ISDA_PASSWORD);

  if (forceDemo || !hasCredentials) {
    const sample = getSampleSoilData(lat, lon);
    return res.json({
      ...sample,
      notice: !hasCredentials
        ? 'Running in Demo/Benchmark mode: ISDA_EMAIL and ISDA_PASSWORD not detected in environment.'
        : undefined,
    });
  }

  try {
    const liveData = await getLiveSoilData(lat, lon);
    return res.json(liveData);
  } catch (err: any) {
    console.error('Error fetching live iSDA soil data:', err.message);
    const fallbackSample = getSampleSoilData(lat, lon);
    return res.status(200).json({
      ...fallbackSample,
      error: `Live iSDA Soil service notice: ${err.message}`,
      fallbackUsed: true,
      rawResponse: {
        liveServiceError: err.message,
        benchmarkUsed: true,
      },
    });
  }
});

/**
 * GET /api/india/soil
 * Query ISRIC SoilGrids v2.0 with 30-day caching
 */
router.get('/india/soil', async (req, res) => {
  const latStr = req.query.lat as string;
  const lonStr = req.query.lon as string;
  const lat = parseFloat(latStr || '13.08');
  const lon = parseFloat(lonStr || '80.27');

  try {
    const soilData = await getIsricSoil(lat, lon);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.json(soilData);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/india/satellite
 * Query Earth Search Sentinel-2 STAC for farm coordinates
 */
router.get('/india/satellite', async (req, res) => {
  const latStr = req.query.lat as string;
  const lonStr = req.query.lon as string;
  const lat = parseFloat(latStr || '13.08');
  const lon = parseFloat(lonStr || '80.27');

  try {
    const sceneData = await getEarthSearchSentinel(lat, lon);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.json(sceneData);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/india/mandi
 * Query data.gov.in Agmarknet mandi prices with 7-day trend
 */
router.get('/india/mandi', async (req, res) => {
  try {
    const mandiData = await getMandiData();
    res.setHeader('Cache-Control', 'public, max-age=1800');
    return res.json(mandiData);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/sms
 * Send SMS advisory via Africa's Talking Sandbox
 */
router.post('/sms', async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: "to" phone number and "message" body are required.',
    });
  }

  try {
    const result = await sendSandboxSms({ to, message });
    return res.json(result);
  } catch (err: any) {
    console.error('Error sending sandbox SMS:', err);
    return res.status(500).json({
      success: false,
      error: `SMS Gateway Error: ${err.message}`,
      simulatorUrl: 'https://simulator.africastalking.com',
    });
  }
});

/**
 * POST /api/gemini/advisory
 * Generate concise, smallholder farmer advisory (multilingual: en, sw, ta)
 */
router.post('/gemini/advisory', async (req, res) => {
  try {
    const payload: GenerateAdvisoryParams = req.body;
    const result = await generateAdvisory(payload);
    return res.json(result);
  } catch (err: any) {
    console.error('Error generating Gemini advisory:', err);
    return res.status(500).json({
      error: `Advisory generation error: ${err.message}`,
    });
  }
});

export default router;
