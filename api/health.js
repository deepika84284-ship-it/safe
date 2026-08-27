export default function handler(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const data = {
    status: 'ok',
    service: 'SafeCart Threat Registry Engine',
    version: '2.2.0',
    timestamp: new Date().toISOString()
  };
  if (typeof res.json === 'function') return res.json(data);
  res.end(JSON.stringify(data));
}
