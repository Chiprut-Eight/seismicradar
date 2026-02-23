const express = require('express');
const axios = require('axios');
const router = express.Router();

// Stub for Israel Meteorological Service (IMS) open API
router.get('/pressure', async (req, res) => {
  try {
    // Normally you'd need an IMS API token: `Authorization: ApiToken ${process.env.IMS_TOKEN}`
    // Since we don't have one, we stub the response based on typical Jerusalem pressure
    
    // Simulate typical pressure (1000 - 1020 hPa)
    const basePressure = 1012;
    const randomVariation = (Math.random() * 4) - 2; 
    const currentPressure = (basePressure + randomVariation).toFixed(1);

    res.json({
      station: "Jerusalem (IMS Stub)",
      pressure_hPa: currentPressure,
      anomaly: Math.abs(randomVariation) > 3 ? "High" : "Normal"
    });
  } catch (error) {
    console.error('IMS API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch IMS data' });
  }
});

module.exports = router;
