const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// Mock endpoints for testing the frontend while the actual routes are being built
app.get('/api/score', (req, res) => {
  const mockScore = {
    totalScore: Math.floor(Math.random() * 20) + 15,
    components: {
      seismic: {
        score: Math.floor(Math.random() * 40),
        events48h: Math.floor(Math.random() * 15) + 5,
        baseline: 12.5,
        etasProb: (Math.random() * 10 + 2).toFixed(1),
        maxMag: (Math.random() * 2 + 2).toFixed(1)
      },
      ionosphere: {
        score: "-",
        tec: "חסר API",
        tecAnomaly: "חסר",
        pressure: "חסר",
        pressureAnomaly: "ממתין לחיבור"
      },
      time: {
        score: 18,
        lastMajorDate: "2018-07-04",
        dsfActive: "שקט",
        carmelActive: "שקט"
      },
      crowd: {
        score: Math.floor(Math.random() * 10),
        felt24h: Math.floor(Math.random() * 50),
        felt1h: Math.floor(Math.random() * 5),
        avg: 12
      }
    },
    timestamp: new Date().toISOString()
  };
  res.json(mockScore);
});

app.get('/api/quakes', (req, res) => {
  res.json({
    count: 5,
    features: [
      { properties: { mag: 2.4, place: "15 km N of Tiberias", time: Date.now() - 3600000, type: "earthquake" }, geometry: { coordinates: [35.5, 32.9, 5] }, source: "GSI" },
      { properties: { mag: 3.1, place: "Dead Sea", time: Date.now() - 86400000, type: "earthquake" }, geometry: { coordinates: [35.4, 31.5, 12] }, source: "GSI" },
      { properties: { mag: 1.8, place: "Gulf of Aqaba", time: Date.now() - 120000000, type: "earthquake" }, geometry: { coordinates: [34.9, 29.3, 8] }, source: "USGS" },
      { properties: { mag: 4.2, place: "Cyprus region", time: Date.now() - 170000000, type: "earthquake" }, geometry: { coordinates: [33.0, 34.5, 25] }, source: "EMSC" },
      { properties: { mag: 2.0, place: "Carmel Fault", time: Date.now() - 250000000, type: "earthquake" }, geometry: { coordinates: [35.0, 32.7, 10] }, source: "GSI" }
    ]
  });
});

// Routes
const usgsRoute = require('./routes/usgs');
const emscRoute = require('./routes/emsc');
const imsRoute = require('./routes/ims');
const gsiRoute = require('./routes/gsi');

app.use('/api/usgs', usgsRoute);
app.use('/api/emsc', emscRoute);
app.use('/api/ims', imsRoute);
app.use('/api/gsi', gsiRoute);

// Default catch-all to index.html for SPA (though this is a static site)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`[SeismicRadar] Server started on http://localhost:${PORT}`);
});
