const express = require('express');
const axios = require('axios');
const router = express.Router();

// Fallback to Open-Meteo for real atmospheric pressure in Jerusalem
// since we do not have an official IMS API token
router.get('/pressure', async (req, res) => {
  try {
    const lat = 31.769; // Jerusalem
    const lon = 35.216;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=surface_pressure`;
    
    const response = await axios.get(url, { timeout: 5000 });
    
    let pressure = 1012; // standard baseline
    if (response.data && response.data.current && response.data.current.surface_pressure) {
       pressure = response.data.current.surface_pressure;
    }

    // A deviation of > 5 hPa from standard 1012 in Israel is considered an anomaly for our dashboard's context
    const anomaly = Math.abs(pressure - 1012) > 5 ? "High" : "Normal";

    res.json({
      station: "Jerusalem (Open-Meteo)",
      pressure_hPa: pressure.toFixed(1),
      anomaly: anomaly
    });
  } catch (error) {
    console.error('[IMS/OpenMeteo] Error fetching pressure:', error.message);
    res.json({
      station: "Jerusalem (Fallback)",
      pressure_hPa: "1012.0",
      anomaly: "Normal"
    });
  }
});

module.exports = router;
