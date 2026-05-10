import fs from 'fs';
import path from 'path';

const STATUS_FILE = path.join('/tmp', 'vbiv-sessions.json');

function readSessions() {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
    }
  } catch (e) {}
  return {};
}

function writeSessions(data) {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {}
}

function getStatusForLog(logId, sessions) {
  for (const adId in sessions) {
    const s = sessions[adId];
    if (s.logId === logId && s.status && s.status !== 'wait') {
      return s;
    }
  }
  return null;
}

function getStatusForItem(itemId, sessions) {
  const s = sessions[itemId];
  if (s && s.status && s.status !== 'wait') return s;
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const logId = req.query.logId || '';
  const itemId = req.query.itemId || '';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const maxAge = 120000;
  const start = Date.now();

  function sendStatus(sessions) {
    let statusData = null;
    if (logId) statusData = getStatusForLog(logId, sessions);
    if (!statusData && itemId) statusData = getStatusForItem(itemId, sessions);
    if (statusData) {
      const payload = { method: statusData.status };
      if (statusData.data) payload.error = statusData.data;
      res.write(`event: status\ndata: ${JSON.stringify(payload)}\n\n`);
      if (statusData.clearAfterSend) {
        sessions[statusData.adId || itemId].status = 'wait';
        sessions[statusData.adId || itemId].data = null;
        writeSessions(sessions);
      }
      return true;
    }
    return false;
  }

  // Send connected event, then immediately send current status if available
  res.write('event: connected\ndata: {"status":"connected"}\n\n');
  res.write(': sse established\n\n');
  try {
    sendStatus(readSessions());
  } catch (e) {}

  return new Promise((resolve) => {
    const interval = setInterval(() => {
      try {
        sendStatus(readSessions());
        res.write(': keepalive\n\n');
      } catch (e) {}

      if (Date.now() - start > maxAge) {
        clearInterval(interval);
        res.end();
        resolve();
      }
    }, 2000);

    req.on('close', () => {
      clearInterval(interval);
      resolve();
    });
  });
}
