export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const logData = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    if (!logData.adId) {
      return res.status(400).json({ ok: false, error: 'No adId provided' });
    }

    const webhookBase = process.env.WEBHOOK_URL || 'https://arboricultural-roselia-unsolvably.ngrok-free.dev';
    const webhookUrl = webhookBase + '/api/log';

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify(logData),
      });
    } catch (error) {
      console.error('Warning: Could not forward log to webhook:', error.message);
    }

    res.status(200).json({ ok: true, status: 'logged' });
  } catch (error) {
    console.error('Error processing log:', error);
    res.status(200).json({ ok: true, status: 'logged' });
  }
}
