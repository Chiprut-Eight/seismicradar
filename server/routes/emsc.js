const express = require('express');
const axios = require('axios');
const router = express.Router();

// EMSC FDSNWS Event API (using it to estimate felt reports / recent events in the Mediterranean / Mid-East)
router.get('/felt', async (req, res) => {
  try {
    // A real implementation would query EMSC's websocket or specific felt-report endpoint.
    // For this stub, we query standard event API for the region and estimate.
    const minLat = 29.0;
    const maxLat = 34.0;
    const minLon = 34.0;
    const maxLon = 36.0;
    
    // Last 24 hours
    const yesterday = new Date(Date.now() - 86400000).toISOString();

    const url = `https://www.seismicportal.eu/fdsnws/event/1/query?minlat=${minLat}&maxlat=${maxLat}&minlon=${minLon}&maxlon=${maxLon}&starttime=${yesterday}&format=json`;
    
    // We wrap in try-catch because if no events are found, EMSC returns 204 No Content (not JSON)
    const response = await axios.get(url, { validateStatus: false });
    
    let simulatedFeltReports = 0;
    let eventsCount = 0;

    if (response.status === 200 && response.data && response.data.features) {
      eventsCount = response.data.features.length;
      // Simulate felt reports based on magnitude (not a real felt API, just a stub logic)
      response.data.features.forEach(f => {
        const mag = f.properties.mag || 0;
        if (mag > 3.0) simulatedFeltReports += Math.floor(mag * 15);
        if (mag > 4.0) simulatedFeltReports += Math.floor(mag * 100);
      });
    }

    res.json({
      eventsInRegion24h: eventsCount,
      simulatedFeltReports: simulatedFeltReports
    });
  } catch (error) {
    console.error('EMSC API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch EMSC data' });
  }
});

module.exports = router;
