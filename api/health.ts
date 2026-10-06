import { probeDataGovIn } from '../server/indiaClient.ts';

export default async function handler(req: any, res: any) {
  const isdaConfigured = Boolean(process.env.ISDA_EMAIL && process.env.ISDA_PASSWORD);
  const atConfigured = Boolean(process.env.AT_SANDBOX_API_KEY);
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const dataGovInKey = process.env.DATA_GOV_IN_API_KEY?.trim();

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

  const healthPayload = {
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
  };

  res.setHeader?.('Content-Type', 'application/json');
  res.setHeader?.('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (res.status && typeof res.status === 'function') {
    return res.status(200).json(healthPayload);
  }

  res.statusCode = 200;
  return res.end(JSON.stringify(healthPayload));
}
