const express = require('express');
const axios = require('axios');
const zlib = require('zlib');
const router = express.Router();

// Parse NASA IONEX format to extract TEC at specifically LAT=32.5, LON=35.0 (Israel)
// IONEX files contain grids with "LAT/LON1/LON2/DLON/H" headers followed by TEC values.
function extractIsraelTEC(ionexText) {
  const lines = ionexText.split('\n');
  let inIsraelLat = false;
  let tecValue = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Look for map block LAT/LON1/LON2/DLON/H
    // Example:  32.5 -180.0  180.0    5.0  450.0        LAT/LON1/LON2/DLON/H
    if (line.includes('LAT/LON1/LON2/DLON/H')) {
      const parts = line.trim().split(/\s+/);
      const lat = parseFloat(parts[0]);
      
      // Check if this latitude block bounds Israel (30.0 to 35.0)
      if (lat >= 30.0 && lat <= 35.0) {
        inIsraelLat = true;
        
        // The data lines follow. We need longitude around 35.0.
        // Longitudes usually go from -180 to 180 in steps of 5.
        // -180 is index 0. So lon 35.0 is index (35 - (-180)) / 5 = 215 / 5 = 43.
        // The values are printed with 16 per line (format 16I5).
        // 43 / 16 = 2 (so it's on the 3rd data line under the header), index 43 % 16 = 11.
        
        // This is a simplified extraction logic for production.
        const lonTargetIndex = Math.floor((35.0 - parseFloat(parts[1])) / parseFloat(parts[3]));
        
        const lineOffset = Math.floor(lonTargetIndex / 16) + 1; // +1 to skip header
        const valLine = lines[i + lineOffset];
        
        if (valLine) {
           const valIndex = lonTargetIndex % 16;
           // each value is 5 chars wide
           const tecStr = valLine.substring(valIndex * 5, (valIndex * 5) + 5);
           const parsed = parseInt(tecStr.trim(), 10);
           // TEC units are often 0.1 TECU according to IONEX standard (EXPONENT is usually -1)
           // If we find it, break early
           if (!isNaN(parsed)) {
              tecValue = parsed * 0.1;
              break;
           }
        }
      } else {
        inIsraelLat = false;
      }
    }
  }
  return tecValue;
}

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

    // 1. Search for recent Global Ionosphere Maps (GIM) granules
    const cmrUrl = 'https://cmr.earthdata.nasa.gov/search/granules.json';
    const cmrResponse = await axios.get(cmrUrl, {
      params: {
        short_name: 'GNSS_IGS_AC_ion_VTEC_comp', // Official IGS Combined GNSS Ionospheric Product
        sort_key: '-start_date', // Always get the most recent data available, even if delayed
        page_size: 1
      },
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 5000
    });

    const entries = cmrResponse.data.feed.entry || [];
    const hasData = entries.length > 0;
    
    let downloadUrl = null;
    if (hasData) {
       const links = entries[0].links || [];
       const dataLink = links.find(l => l.rel === "http://esipfed.org/ns/fedsearch/1.1/data#");
       if (dataLink) downloadUrl = dataLink.href;
    }

    let tecVal = "--";
    let anomalyVal = "--";
    
    if (downloadUrl) {
       try {
         // 2. Fetch the actual IONEX file (often .gz)
         const fileRes = await axios.get(downloadUrl, {
           headers: { 'Authorization': `Bearer ${token}` },
           responseType: 'arraybuffer',
           timeout: 10000
         });
         
         // 3. Decompress and Parse
         let ionexText = "";
         try {
           ionexText = zlib.gunzipSync(fileRes.data).toString('utf-8');
         } catch(e) {
           // If it's not gzipped (maybe raw or .Z which we can't easily parse in pure JS)
           ionexText = fileRes.data.toString('utf-8'); 
         }
         
         const extractedTec = extractIsraelTEC(ionexText);
         if (extractedTec !== null) {
            tecVal = extractedTec.toFixed(1);
            // Example baseline logic: 10-20 TECU is normal mid-lat day
            anomalyVal = (extractedTec > 25.0) ? "High" : "Normal";
         } else {
            tecVal = "ללא נתונים כרגע";
         }
       } catch (err) {
         console.error('[NASA] File Download/Parse error:', err.message);
         tecVal = "Auth/Data Error";
       }
    } else {
       tecVal = "No Granule";
    }

    res.json({
      status: "OK",
      tec: tecVal,
      tecAnomaly: anomalyVal,
      pressure: "N/A", // Handled by IMS now
      pressureAnomaly: "N/A",
      granuleFound: hasData
    });

  } catch (error) {
    console.error('[NASA API] Error fetching GNSS data:', error.message);
    res.status(500).json({ error: 'Failed to fetch NASA GNSS data' });
  }
});

module.exports = router;
