// API endpoint для проверки статуса чата
// POST /api/checkChatStatus

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Заглушка: всегда возвращаем status 0 (нет действий)
  res.status(200).json({ status: 0 });
}
