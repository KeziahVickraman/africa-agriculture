import express from 'express';
import { getLiveSoilData, getSampleSoilData } from './isdaClient.ts';
import { sendSandboxSms } from './smsClient.ts';
import { generateAdvisory, GenerateAdvisoryParams } from './geminiClient.ts';

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

/**
 * GET /api/config-status
 * Check which integrations are configured without revealing secrets
 */
router.get('/config-status', (req, res) => {
  const hasIsda = Boolean(process.env.ISDA_EMAIL && process.env.ISDA_PASSWORD);
  const hasAt = Boolean(process.env.AT_SANDBOX_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);

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
    },
  });
});

/**
 * GET /api/soil
 * Query iSDAsoil API server-side with cached JWT
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
    // Return sample benchmark data for pilot location
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
    // Provide structured error with fallback demo data so user can inspect problem and still use app
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
 * Generate concise, smallholder farmer advisory
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
