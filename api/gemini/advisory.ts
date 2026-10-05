import { generateAdvisory } from '../../server/geminiClient.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader?.('Content-Type', 'application/json');
    return res.status ? res.status(405).json({ error: 'Method not allowed' }) : res.end('Method not allowed');
  }

  try {
    const payload = req.body || {};
    const result = await generateAdvisory(payload);
    res.setHeader?.('Content-Type', 'application/json');
    return res.status ? res.status(200).json(result) : res.end(JSON.stringify(result));
  } catch (err: any) {
    res.setHeader?.('Content-Type', 'application/json');
    return res.status ? res.status(500).json({ error: err.message }) : res.end(JSON.stringify({ error: err.message }));
  }
}
