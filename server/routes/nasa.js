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
        tec: "--",
        tecAnomaly: "--",
        pressure: "N/A",
        pressureAnomaly: "N/A",
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

    // NASA provides raw IONEX or NetCDF granules which require complex decoding
    // to extract Total Electron Content (TEC) algorithms. 
    // Since we only want to present REAL data, we will not fabricate pseudo-anomalies.
    // We confirm connection and auth, but return placeholders.
    const hasData = response.data.feed.entry.length > 0;
    
    res.json({
      status: "OK",
      tec: hasData ? "Connected" : "--",
      tecAnomaly: hasData ? "N/A" : "--",
      pressure: "N/A", // Pressure is usually handled by IMS
      pressureAnomaly: "N/A",
      granuleFound: hasData
    });

  } catch (error) {
    console.error('[NASA API] Error fetching GNSS data:', error.message);
    res.status(500).json({ error: 'Failed to fetch NASA GNSS data' });
  }
});

module.exports = router;
