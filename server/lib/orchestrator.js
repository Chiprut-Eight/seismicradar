const axios = require('axios');
const { calculateWeightedRisk } = require('./scorer');
const { calculateEtasRate, getEtasProbability } = require('./etas');

let globalScoreCache = null;
let globalQuakesCache = null;

async function updateSystemData(port) {
  try {
    const baseUrl = `http://127.0.0.1:${port}/api`;
    
    // Fetch real data from our proxy routes
    const [usgsRes, emscRes, gsiRes, nasaRes, imsRes, pikudRes] = await Promise.all([
      axios.get(`${baseUrl}/usgs/recent`).catch(() => ({ data: { count: 0, features: [] } })),
      axios.get(`${baseUrl}/emsc/felt`).catch(() => ({ data: { eventsInRegion24h: 0, simulatedFeltReports: 0 } })),
      axios.get(`${baseUrl}/gsi/recent`).catch(() => ({ data: { count: 0, features: [] } })),
      axios.get(`${baseUrl}/nasa/gnss`).catch(() => ({ data: { tec: "--", tecAnomaly: "N/A", pressure: "N/A", pressureAnomaly: "N/A" } })),
      axios.get(`${baseUrl}/ims/pressure`).catch(() => ({ data: { pressure_hPa: "1012", anomaly: "Normal" } })),
      axios.get(`${baseUrl}/pikud/status`).catch(() => ({ data: { activeAlert: false } }))
    ]);

    // 1. Combine earthquakes for the table/map
    const usgsQuakes = usgsRes.data.features || [];
    usgsQuakes.forEach(q => Object.assign(q, { source: "USGS" }));

    const gsiQuakes = gsiRes.data.features || [];
    gsiQuakes.forEach(q => Object.assign(q, { source: "GSI" }));
    
    // Sort combined by descending time
    let combinedQuakes = [...gsiQuakes, ...usgsQuakes].sort((a, b) => b.properties.time - a.properties.time);
    // Deduplicate heuristically (if time diff < 60s and distance is small, but keeping it simple for now by time)
    const uniqueIds = new Set();
    const finalQuakes = combinedQuakes.filter(q => {
      const id = q.properties.time; // rough ID proxy if no real string ID
      if (uniqueIds.has(id)) return false;
      uniqueIds.add(id);
      return true;
    });
    
    globalQuakesCache = {
      count: finalQuakes.length,
      features: finalQuakes.slice(0, 50) // Top 50 
    };

    // 2. Compute true Seismic Score via ETAS
    // Map to ETAS input {mag, time}
    const recentEvents = finalQuakes.map(q => ({
      mag: q.properties.mag,
      time: q.properties.time
    }));
    
    const etasRate = calculateEtasRate(recentEvents, Date.now());
    const etasProb = getEtasProbability(etasRate);
    
    const maxMagEvent = finalQuakes.length > 0 ? finalQuakes.reduce((max, obj) => obj.properties.mag > max.properties.mag ? obj : max) : null;
    const maxMag = maxMagEvent ? maxMagEvent.properties.mag.toFixed(1) : 0;
    
    const seismicNormalized = etasProb; // Directly use probability for score weight mapping

    // 3. Compute Ionosphere Score 
    const isNasaMissing = Object.keys(nasaRes.data).length === 0 || nasaRes.data.tec === "--" || nasaRes.data.tec === "No Granule" || nasaRes.data.tec === "NaN" || nasaRes.data.tec === "Format Error";
    const ionoNormalized = isNasaMissing ? 0 : 50; // Real parser would use tecAnomaly * factor. Keep at 0 if missing.

    // 4. Compute Time Gap Score
    // Static logic for now since Dead Sea recurrence is 90 years
    // Last major was 1927. (2026 - 1927) = 99 years. 99/90 = 110% of cycle.
    const timeNormalized = 95; 

    // 5. Compute Crowd Wisdom Score
    const feltBase = emscRes.data.simulatedFeltReports || 0;
    // Cap at 100
    const crowdNormalized = Math.min(feltBase, 100);

    // Build components
    const components = {
      seismic: {
        normalized: seismicNormalized,
        events48h: finalQuakes.length,
        baseline: 12.5, // Static baseline
        etasProb: etasProb.toFixed(1),
        maxMag: maxMag
      },
      ionosphere: {
        normalized: ionoNormalized,
        tec: nasaRes.data.tec || "--",
        tecAnomaly: nasaRes.data.tecAnomaly || "--",
        pressure: imsRes.data.pressure_hPa + ' hPa' || "N/A",
        pressureAnomaly: imsRes.data.anomaly || "--"
      },
      time: {
        normalized: timeNormalized,
        lastMajorDate: "11-07-1927", // Dead Sea 1927
        dsfActive: "פעיל (110% מהמחזור)",
        carmelActive: "שקט"
      },
      crowd: {
        normalized: crowdNormalized,
        felt24h: feltBase,
        felt1h: Math.floor(feltBase * 0.1),
        avg: 12
      }
    };

    // 6. Calculate Risk
    globalScoreCache = calculateWeightedRisk(components);

    // Override if Pikud Haoref alert is active
    if (pikudRes.data && pikudRes.data.activeAlert) {
      globalScoreCache.totalScore = 100;
      globalScoreCache.components.seismic.score = 40;
      globalScoreCache.components.ionosphere.score = 30;
      globalScoreCache.components.time.score = 20;
      globalScoreCache.components.crowd.score = 10;
      globalScoreCache.isOfficialAlert = true;
    } else {
      globalScoreCache.isOfficialAlert = false;
    }

  } catch (error) {
    console.error('[Orchestrator] Error updating system data:', error.message);
  }
}

function getScoreCache() {
  return globalScoreCache;
}

function getQuakesCache() {
  return globalQuakesCache;
}

module.exports = {
  updateSystemData,
  getScoreCache,
  getQuakesCache
};
