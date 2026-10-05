export default async function handler(req: any, res: any) {
  const isdaConfigured = Boolean(process.env.ISDA_EMAIL && process.env.ISDA_PASSWORD);
  const atConfigured = Boolean(process.env.AT_SANDBOX_API_KEY);
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);

  const healthPayload = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    environment: process.env.NODE_ENV || 'production',
    service: 'FarmSense API Gateway',
    version: '1.0.0',
    integrations: {
      isdaSoil: {
        status: isdaConfigured ? 'configured' : 'demo_fallback_active',
        endpoint: 'https://api.isda-africa.com/isdasoil/v2',
        hasEmail: Boolean(process.env.ISDA_EMAIL),
        hasPassword: Boolean(process.env.ISDA_PASSWORD),
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
