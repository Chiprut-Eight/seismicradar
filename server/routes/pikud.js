const express = require('express');
const pikudHaoref = require('pikud-haoref-api');
const router = express.Router();

let activeEarthquakeAlert = false;
let currentAlertData = null;

// Poll Pikud Haoref API every 2 seconds
setInterval(() => {
  pikudHaoref.getActiveAlerts((err, alert) => {
    if (err) {
      console.error('[PikudHaoref] Error fetching alerts:', err.message);
      return;
    }
    
    // An earthquake alert usually contains specific titles or categories 
    // Depending on the pikud-haoref-api version, cat '1' is earthquake
    if (alert && alert.cities && alert.cities.length > 0) {
      const isEarthquake = alert.title && alert.title.includes('רעידת אדמה');
      if (isEarthquake || alert.cat === '1') {
        activeEarthquakeAlert = true;
        currentAlertData = alert;
      } else {
        // Different alert (missile etc), ignore for this seismic dashboard
        activeEarthquakeAlert = false;
        currentAlertData = null;
      }
    } else {
      activeEarthquakeAlert = false;
      currentAlertData = null;
    }
  });
}, 2000);

router.get('/status', (req, res) => {
  res.json({
    activeAlert: activeEarthquakeAlert,
    data: currentAlertData
  });
});

module.exports = router;
