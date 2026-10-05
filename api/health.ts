export default async function handler(req: any, res: any) {
  const isdaConfigured = Boolean(process.env.ISDA_EMAIL && process.env.ISDA_PASSWORD);
  const atConfigured = Boolean(process.env.AT_SANDBOX_API_KEY);
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);

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

  const healthPayload = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    environment: process.env.NODE_ENV || 'production',
    service: 'FarmSense API Gateway',
    version: '1.0.0',
    integrations: {
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
      geminiAi: {
        status: geminiConfigured ? 'configured' : 'rule_fallback_active',
        model: 'gemini-3.8-flash',
        hasApiKey: geminiConfigured,
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
