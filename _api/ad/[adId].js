const http = require('http');
const https = require('https');

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://arboricultural-roselia-unsolvably.ngrok-free.dev';

function webhookFetch(urlPath) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, WEBHOOK_URL);
    const lib = url.protocol === 'https:' ? https : http;
    lib.get(url.href, { headers: { 'Accept': 'application/json', 'ngrok-skip-browser-warning': 'true' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        } else {
          resolve({ ok: false, error: 'Ad not found' });
        }
      });
    }).on('error', () => resolve({ ok: false, error: 'Ad not found' }));
  });
}

module.exports = async (req, res) => {
  const { adId } = req.query;

  if (!adId) {
    return res.status(200).json({ ok: false, error: 'No adId provided' });
  }

  try {
    const data = await webhookFetch('/api/ad/' + adId);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(200).json({ ok: false, error: 'Ad not found' });
  }
};
