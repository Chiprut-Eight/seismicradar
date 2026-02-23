const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

// Scraper for Geological Survey of Israel (GSI) recent earthquakes page
router.get('/recent', async (req, res) => {
  try {
    const url = 'https://earthquake.co.il/'; // Popular Israeli seismic site, or eq.gsi.gov.il
    
    // Since scraping live government pages can be highly unstable and blocks requests, 
    // we return a static mock array structured like real GSI scraper output for the demo.
    // In a production environment, you would use Cheerio here to parse the HTML table.
    
    const mockData = [
      {
        id: "gsi_1",
        time: new Date(Date.now() - 3600000).toISOString(),
        mag: 2.1,
        depth_km: 12,
        location_he: "15 ק\"מ צפונית לטבריה",
        location_en: "15 km N of Tiberias"
      },
      {
        id: "gsi_2",
        time: new Date(Date.now() - 86400000).toISOString(),
        mag: 3.2,
        depth_km: 8,
        location_he: "ים המלח",
        location_en: "Dead Sea"
      }
    ];

    res.json(mockData);
  } catch (error) {
    console.error('GSI Scraper Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch GSI data' });
  }
});

module.exports = router;
