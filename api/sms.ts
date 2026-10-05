import { sendSandboxSms } from '../server/smsClient.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader?.('Content-Type', 'application/json');
    return res.status ? res.status(405).json({ error: 'Method not allowed' }) : res.end('Method not allowed');
  }

  const body = req.body || {};
  const to = body.to;
  const message = body.message;

  if (!to || !message) {
    res.setHeader?.('Content-Type', 'application/json');
    return res.status ? res.status(400).json({ error: 'Missing to or message' }) : res.end(JSON.stringify({ error: 'Missing to or message' }));
  }

  try {
    const result = await sendSandboxSms({ to, message });
    res.setHeader?.('Content-Type', 'application/json');
    return res.status ? res.status(200).json(result) : res.end(JSON.stringify(result));
  } catch (err: any) {
    res.setHeader?.('Content-Type', 'application/json');
    return res.status ? res.status(500).json({ error: err.message }) : res.end(JSON.stringify({ error: err.message }));
  }
}
