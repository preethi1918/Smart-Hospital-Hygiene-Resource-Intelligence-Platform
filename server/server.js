// Express + WebSocket Server
// Smart Hospital Hygiene & Resource Intelligence Platform

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const HospitalSimulationEngine = require('./simulationEngine');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Spring Boot Backend Proxy (forwards structure & auth endpoints)
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8080';
function proxyToSpringBoot(req, res) {
  const targetUrl = new URL(req.originalUrl, BACKEND_URL);
  const proxyReq = http.request(targetUrl, {
    method: req.method,
    headers: {
      ...req.headers,
      host: targetUrl.host
    }
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`[Backend Proxy Error] ${req.method} ${req.originalUrl}:`, err.message);
    if (!res.headersSent) {
      res.status(502).json({
        timestamp: new Date().toISOString(),
        status: 502,
        success: false,
        message: `Failed to communicate with Spring Boot backend: ${err.message}`
      });
    }
  });

  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const bodyStr = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
    proxyReq.setHeader('Content-Type', 'application/json');
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyStr));
    proxyReq.write(bodyStr);
  }
  proxyReq.end();
}

// Intercept Spring Boot Structure, Linen, Auth, and QR routes
app.use(['/api/hospitals*', '/api/buildings*', '/api/floors*', '/api/wards*', '/api/rooms*', '/api/beds*', '/api/linen*', '/api/auth*', '/api/qr*'], (req, res) => {
  proxyToSpringBoot(req, res);
});

// WebSocket Server
const wss = new WebSocketServer({ server });

function broadcast(data) {
  const payload = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(payload);
    }
  });
}

// Initialize Hospital Simulation Engine
const engine = new HospitalSimulationEngine(broadcast);
engine.start();

wss.on('connection', ws => {
  // Send immediate state snapshot upon client connection
  ws.send(JSON.stringify({
    type: 'INIT_STATE',
    data: {
      zones: engine.zones,
      resources: engine.resources,
      alerts: engine.alerts,
      systemStats: engine.getSystemStats()
    }
  }));

  ws.on('message', message => {
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    } catch (e) {
      console.error('Error handling WS client message:', e);
    }
  });
});

// REST API Endpoints
app.get('/api/status', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    zones: engine.zones,
    resources: engine.resources,
    alerts: engine.alerts,
    systemStats: engine.getSystemStats()
  });
});

app.get('/api/zones', (req, res) => {
  res.json(engine.zones);
});

app.get('/api/zones/:id', (req, res) => {
  const zone = engine.zones.find(z => z.id === req.params.id);
  if (!zone) return res.status(404).json({ error: 'Zone not found' });
  res.json(zone);
});

app.get('/api/alerts', (req, res) => {
  res.json(engine.alerts);
});

app.post('/api/alerts/:id/acknowledge', (req, res) => {
  const { staffName } = req.body;
  const alert = engine.acknowledgeAlert(req.params.id, staffName);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  res.json({ success: true, alert });
});

app.post('/api/alerts/:id/resolve', (req, res) => {
  const { resolutionNote } = req.body;
  const alert = engine.resolveAlert(req.params.id, resolutionNote);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  res.json({ success: true, alert });
});

app.post('/api/actions/refill-dispenser', (req, res) => {
  const { dispenserId } = req.body;
  if (!dispenserId) return res.status(400).json({ error: 'dispenserId required' });
  const result = engine.refillDispenser(dispenserId);
  if (!result) return res.status(404).json({ error: 'Dispenser not found' });
  res.json({ success: true, dispenser: result });
});

app.post('/api/actions/empty-bin', (req, res) => {
  const { binId } = req.body;
  if (!binId) return res.status(400).json({ error: 'binId required' });
  const result = engine.emptyBioBin(binId);
  if (!result) return res.status(404).json({ error: 'Bin not found' });
  res.json({ success: true, bin: result });
});

app.post('/api/actions/start-uvc', (req, res) => {
  const { uvcId, durationMinutes } = req.body;
  if (!uvcId) return res.status(400).json({ error: 'uvcId required' });
  const result = engine.startUvcCycle(uvcId, durationMinutes);
  if (!result) return res.status(404).json({ error: 'UVC unit not found' });
  res.json({ success: true, uvcUnit: result });
});

app.post('/api/actions/simulate-anomaly', (req, res) => {
  const { anomalyType, zoneId } = req.body;
  const alert = engine.injectAnomaly(anomalyType, zoneId);
  res.json({ success: true, alert, anomalyType, zoneId });
});

app.post('/api/actions/reset', (req, res) => {
  engine.resetAll();
  res.json({ success: true, message: 'All hospital zones and simulation data reset to optimal baseline.' });
});

// Route aliases for Mobile & React QR Scanner
app.get(['/scanner', '/scan'], (req, res) => {
  res.sendFile(path.join(__dirname, '../public/scan.html'));
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🏥 Smart Hospital Hygiene & Resource Intelligence Platform`);
  console.log(`🌐 Live Server listening on: http://localhost:${PORT}`);
  console.log(`📡 WebSocket stream active on: ws://localhost:${PORT}`);
  console.log(`=======================================================`);
});
