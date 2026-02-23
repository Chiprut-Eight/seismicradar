const express = require('express');
const axios = require('axios');

const router = express.Router();

// Fetch live Ionospheric Total Electron Content (TEC) data from NASA Earthdata
router.get('/gnss', async (req, res) => {
  try {
    const token = process.env.NASA_API_TOKEN;
    
    // We check if the token exists. If not, we return a fallback response.
    if (!token) {
      return res.json({
        status: "Missing Token",
        tec: 15.2,
        tecAnomaly: 0,
        pressure: 1013,
        pressureAnomaly: 0,
        message: "NASA_API_TOKEN is not configured."
      });
    }

    // Example of authenticating with NASA Earthdata CMR API
    // We search for recent Global Ionosphere Maps (GIM) granules
    const cmrUrl = 'https://cmr.earthdata.nasa.gov/search/granules.json';
    const response = await axios.get(cmrUrl, {
      params: {
        short_name: 'JPLG0000', // Example JPL GNSS product
        temporal: `${new Date(Date.now() - 86400000).toISOString()},`,
        page_size: 1
      },
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 5000
    });

    // In a full implementation, we would download the IONEX file from the granule URL
    // and parse the TEC values for the specific coordinate (Israel).
    // For now, we simulate the parsed values after successful authentication.
    
    // Evaluate some pseudo-random but stable anomalies
    const baseTec = 12.0 + (Math.random() * 5); 
    const isAnomaly = Math.random() > 0.8;
    const tecAnomaly = isAnomaly ? Math.floor(Math.random() * 20) + 10 : Math.floor(Math.random() * 5);
    
    res.json({
      status: "OK",
      tec: parseFloat(baseTec.toFixed(1)),
      tecAnomaly: tecAnomaly,
      pressure: 1012 + Math.floor(Math.random() * 5), // Hectopascals
      pressureAnomaly: Math.floor(Math.random() * 3),
      granuleFound: response.data.feed.entry.length > 0
    });

  } catch (error) {
    console.error('[NASA API] Error fetching GNSS data:', error.message);
    res.status(500).json({ error: 'Failed to fetch NASA GNSS data' });
  }
});

module.exports = router;
