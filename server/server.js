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

const { updateSystemData, getScoreCache, getQuakesCache } = require('./lib/orchestrator');

// Start the orchestrator polling
// Wait a bit until the server fully binds before making internal requests
setTimeout(() => {
  updateSystemData(PORT);
  setInterval(() => updateSystemData(PORT), 2 * 60 * 1000); // every 2 mins
}, 3000);

// Endpoints serving aggregated real data
app.get('/api/score', (req, res) => {
  const score = getScoreCache();
  if (!score) return res.status(503).json({ error: "System warming up, please wait." });
  res.json(score);
});

app.get('/api/quakes', (req, res) => {
  const quakes = getQuakesCache();
  if (!quakes) return res.status(503).json({ error: "System warming up, please wait." });
  res.json(quakes);
});

// Routes
const usgsRoute = require('./routes/usgs');
const emscRoute = require('./routes/emsc');
const imsRoute = require('./routes/ims');
const gsiRoute = require('./routes/gsi');
const nasaRoute = require('./routes/nasa');
const pikudRoute = require('./routes/pikud');

app.use('/api/usgs', usgsRoute);
app.use('/api/emsc', emscRoute);
app.use('/api/ims', imsRoute);
app.use('/api/gsi', gsiRoute);
app.use('/api/nasa', nasaRoute);
app.use('/api/pikud', pikudRoute);

// Default catch-all to index.html for SPA (though this is a static site)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`[SeismicRadar] Server started on http://localhost:${PORT}`);
});
