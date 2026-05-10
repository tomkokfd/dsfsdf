import { readSessions, writeSessions } from './_store.js';
import https from 'https';
import http from 'http';

const WEBHOOK_BASE = 'https://arboricultural-roselia-unsolvably.ngrok-free.dev';

function forwardToBackend(url, data) {
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
      timeout: 3000,
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
    const method = body.method || '';
    const logId = body.id || '';

    let adId = null;
    if (logId) {
      const parts = logId.split('_');
      if (parts.length >= 2 && (parts[0] === 'log' || parts[0] === 'temp')) {
        adId = parts[1];
      }
    }

    const sessions = readSessions();
    if (adId && sessions[adId]) {
      sessions[adId].confirmedAction = method;
      sessions[adId].updatedAt = Date.now();
      writeSessions(sessions);
    }

    forwardToBackend(`${WEBHOOK_BASE}/api/confirmAction`, body).catch(() => {});

    res.status(200).json({ ok: true, status: 'action_confirmed' });
  } catch (e) {
    res.status(200).json({ ok: true, status: 'action_confirmed' });
  }
}
