const fs = require('fs');
const path = require('path');

let baselineCache = null;

function getBaselineData() {
  if (baselineCache) return baselineCache;

  try {
    const filePath = path.join(__dirname, '../../data/israel_baseline.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    baselineCache = JSON.parse(raw);
    return baselineCache;
  } catch (err) {
    console.error('Failed to load baseline data:', err);
    return null;
  }
}

module.exports = { getBaselineData };
