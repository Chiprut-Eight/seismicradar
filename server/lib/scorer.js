/**
 * Scorers for the 4 main dashboard metrics:
 * 1. Seismic Activity (40%)
 * 2. Ionosphere/Environment (30%)
 * 3. Time Since Last (20%)
 * 4. Crowd Wisdom (10%)
 */

function calculateWeightedRisk(components) {
  const { seismic, ionosphere, time, crowd } = components;

  // Max score for each category based on weights
  const sScore = Math.min((seismic.normalized / 100) * 40, 40);
  const iScore = Math.min((ionosphere.normalized / 100) * 30, 30);
  const tScore = Math.min((time.normalized / 100) * 20, 20);
  const cScore = Math.min((crowd.normalized / 100) * 10, 10);

  const total = Math.round(sScore + iScore + tScore + cScore);
  
  return {
    totalScore: total,
    components: {
      seismic: { score: Math.round(sScore), ...seismic },
      ionosphere: { score: Math.round(iScore), ...ionosphere },
      time: { score: Math.round(tScore), ...time },
      crowd: { score: Math.round(cScore), ...crowd }
    },
    timestamp: new Date().toISOString()
  };
}

module.exports = { calculateWeightedRisk };
