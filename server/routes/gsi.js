const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

router.get('/recent', async (req, res) => {
  try {
    const url = 'https://earthquake.co.il/';
    let features = [];
    
    try {
      const resp = await axios.get(url, { timeout: 3000 });
      const $ = cheerio.load(resp.data);
      // Attempting to scrape the table rows
      $('table tr').each((i, el) => {
        if (i === 0) return; // skip header
        const cols = $(el).find('td');
        if (cols.length >= 6) {
          const dateStr = $(cols[0]).text().trim();
          const timeStr = $(cols[1]).text().trim();
          const mag = parseFloat($(cols[2]).text().trim());
          const depth = parseFloat($(cols[3]).text().trim());
          const lat = parseFloat($(cols[4]).text().trim());
          const lon = parseFloat($(cols[5]).text().trim());
          const place = $(cols[6]).text().trim() || "Israel Region";
          
          if (!isNaN(mag) && !isNaN(lat) && !isNaN(lon)) {
             // Construct JS Date from Israel format (DD/MM/YYYY HH:MM:SS format usually, but assuming simple parse)
             let epoch = Date.now();
             try {
                // very naive parsing
                const parts = dateStr.split('/');
                if(parts.length === 3) {
                  epoch = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${timeStr}Z`).getTime();
                }
             } catch(e) {}

             features.push({
               type: "Feature",
               properties: {
                 mag: mag,
                 place: place,
                 time: epoch,
                 url: url,
                 title: `M ${mag} - ${place}`
               },
               geometry: {
                 type: "Point",
                 coordinates: [lon, lat, depth]
               },
               id: `gsi_${i}`
             });
          }
        }
      });
    } catch(err) {
      console.log("[GSI Scraper] Live scrape failed or timed out, using fallback GeoJSON", err.message);
    }

    // Fallback if scrape yields 0 results or fails
    if (features.length === 0) {
      // Do nothing, just return empty list. No more hardcoded fake Tiberias/Dead Sea data.
    }

    res.json({
      type: "FeatureCollection",
      count: features.length,
      features: features
    });

  } catch (error) {
    console.error('GSI Route Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch GSI data' });
  }
});

module.exports = router;
