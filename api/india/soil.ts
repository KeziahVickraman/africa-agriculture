import { getIsricSoil } from '../../server/indiaClient.ts';

export default async function handler(req: any, res: any) {
  const latStr = req.query?.lat as string;
  const lonStr = req.query?.lon as string;
  const lat = parseFloat(latStr || '13.08');
  const lon = parseFloat(lonStr || '80.27');

  try {
    const data = await getIsricSoil(lat, lon);
    res.setHeader?.('Content-Type', 'application/json');
    res.setHeader?.('Cache-Control', 'public, max-age=86400');
    if (res.status && typeof res.status === 'function') {
      return res.status(200).json(data);
    }
    res.statusCode = 200;
    return res.end(JSON.stringify(data));
  } catch (err: any) {
    res.setHeader?.('Content-Type', 'application/json');
    if (res.status && typeof res.status === 'function') {
      return res.status(500).json({ error: err.message });
    }
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: err.message }));
  }
}
