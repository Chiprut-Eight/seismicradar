const express = require('express');
const axios = require('axios');
const router = express.Router();

const ISRAEL_LAT = 31.5;
const ISRAEL_LON = 35.0;
const RADIUS_KM = 500;

// Earth radius in km for distance calculation
const R = 6371;

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) { return deg * (Math.PI / 180); }

router.get('/recent', async (req, res) => {
  try {
    // Fetch all events from USGS in the last 7 days to ensure we have data,
    // then filter by 500km radius around Israel.
    const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';
    const response = await axios.get(url);

    const features = response.data.features || [];
    const localEvents = features.filter(f => {
      const [lon, lat] = f.geometry.coordinates;
      const dist = getDistanceFromLatLonInKm(ISRAEL_LAT, ISRAEL_LON, lat, lon);
      return dist <= RADIUS_KM;
    });

    res.json({ count: localEvents.length, features: localEvents });
  } catch (error) {
    console.error('USGS API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch USGS data' });
  }
});

module.exports = router;
