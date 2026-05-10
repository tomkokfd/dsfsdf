import { readSessions, getSession } from './_store.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const logId = data.id || '';
    let adId = null;

    if (logId) {
      const parts = logId.split('_');
      if (parts.length >= 2) {
        if (parts[0] === 'log' || parts[0] === 'temp') {
          adId = parts[1];
        }
      }
    }

    if (adId) {
      const session = getSession(adId);
      if (session && session.status && session.status !== 'wait') {
        const resp = session.data
          ? { method: session.status, error: session.data }
          : { method: session.status };
        return res.status(200).json(resp);
      }
    }

    const sessions = readSessions();
    for (const sid in sessions) {
      const s = sessions[sid];
      if (s.logId === logId && s.status && s.status !== 'wait') {
        const resp = s.data ? { method: s.status, error: s.data } : { method: s.status };
        return res.status(200).json(resp);
      }
    }

    res.status(200).json({ method: 'wait' });
  } catch (e) {
    res.status(200).json({ method: 'wait' });
  }
}
