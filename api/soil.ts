import type { IncomingMessage, ServerResponse } from 'http';
import { getLiveSoilData, getSampleSoilData } from '../server/isdaClient.ts';

export default async function handler(req: any, res: any) {
  // Support both Express/Vercel standard request objects
  const url = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
  const latStr = url.searchParams.get('lat') || req.query?.lat;
  const lonStr = url.searchParams.get('lon') || req.query?.lon;
  const forceDemo = url.searchParams.get('demo') === 'true' || req.query?.demo === 'true';

  const lat = parseFloat(latStr || '-0.30');
  const lon = parseFloat(lonStr || '36.07');

  const hasCredentials = Boolean(process.env.ISDA_EMAIL && process.env.ISDA_PASSWORD);

  if (forceDemo || !hasCredentials) {
    const sample = getSampleSoilData(lat, lon);
    res.setHeader?.('Content-Type', 'application/json');
    return res.status ? res.status(200).json(sample) : res.end(JSON.stringify(sample));
  }

  try {
    const liveData = await getLiveSoilData(lat, lon);
    res.setHeader?.('Content-Type', 'application/json');
    return res.status ? res.status(200).json(liveData) : res.end(JSON.stringify(liveData));
  } catch (err: any) {
    const fallbackSample = getSampleSoilData(lat, lon);
    const payload = {
      ...fallbackSample,
      error: `Live iSDA Soil notice: ${err.message}`,
      fallbackUsed: true,
    };
    res.setHeader?.('Content-Type', 'application/json');
    return res.status ? res.status(200).json(payload) : res.end(JSON.stringify(payload));
  }
}
