import { setSessionStatus, readSessions } from './_store.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const adId = body.adId || body.item || '';
    const status = body.status || 'wait';
    const data = body.data || null;

    if (!adId) {
      return res.status(400).json({ ok: false, error: 'No adId provided' });
    }

    setSessionStatus(adId, status, data);
    res.status(200).json({ ok: true, status: 'set', method: status });
  } catch (e) {
    res.status(200).json({ ok: true, status: 'set' });
  }
}
