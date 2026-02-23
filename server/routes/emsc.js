const express = require('express');
const WebSocket = require('ws');
const router = express.Router();

let recentFeltEvents = [];
const ONE_DAY = 24 * 60 * 60 * 1000;

function connectEMSC() {
  // EMSC Standing Order WebSocket for live events
  const ws = new WebSocket('wss://www.seismicportal.eu/standing_order/websocket');

  ws.on('open', () => {
    console.log('[EMSC] Connected to real-time earthquake WebSocket');
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.action === 'create' && msg.data && msg.data.properties) {
        const props = msg.data.properties;
        const lat = props.lat;
        const lon = props.lon;
        // Check if in our region (roughly Eastern Med / Israel)
        if (lat >= 29.0 && lat <= 34.0 && lon >= 34.0 && lon <= 36.0) {
          // Add event to recent list
          recentFeltEvents.push({
            time: new Date(props.time).getTime(),
            mag: props.mag,
            felt: props.nb_zones || (props.mag > 3.0 ? Math.floor(props.mag * 15) : 0)
          });
        }
      }
    } catch (e) {
      console.error('[EMSC] Parse error:', e.message);
    }
  });

  ws.on('close', () => {
    console.log('[EMSC] WebSocket disconnected. Reconnecting in 5s...');
    setTimeout(connectEMSC, 5000);
  });

  ws.on('error', (err) => {
    console.error('[EMSC] WebSocket Error:', err.message);
    ws.close();
  });
}

// Start connection
connectEMSC();

// Cleanup old events periodically
setInterval(() => {
  const cutoff = Date.now() - ONE_DAY;
  recentFeltEvents = recentFeltEvents.filter(e => e.time > cutoff);
}, 60 * 60 * 1000);

// API Endpoint to serve the live memory cache
router.get('/felt', (req, res) => {
  const cutoff = Date.now() - ONE_DAY;
  const activeEvents = recentFeltEvents.filter(e => e.time > cutoff);
  
  let feltTotal = 0;
  activeEvents.forEach(e => {
    feltTotal += e.felt;
  });

  res.json({
    eventsInRegion24h: activeEvents.length,
    simulatedFeltReports: feltTotal 
  });
});

module.exports = router;
