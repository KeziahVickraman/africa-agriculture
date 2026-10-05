import { getMandiData } from '../../server/indiaClient.ts';

export default async function handler(req: any, res: any) {
  try {
    const data = await getMandiData();
    res.setHeader?.('Content-Type', 'application/json');
    res.setHeader?.('Cache-Control', 'public, max-age=1800');
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
