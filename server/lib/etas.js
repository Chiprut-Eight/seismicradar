/**
 * ETAS (Epidemic-Type Aftershock Sequence) implementation stub.
 * Calculates probability of a large event based on recent small events (cluster).
 */

const ETAS_PARAMS = {
  p: 1.1, // Power-law decay exponent (Omori law)
  c: 0.01, // Time offset (prevents singularity at t=0)
  k: 0.02, // Productivity parameter (how many aftershocks an event produces)
  alpha: 0.9, // Magnitude dependence of productivity
  m0: 2.0 // Cutoff magnitude
};

/**
 * Calculates a relative risk multiplier based on a list of recent events.
 * @param {Array} recentEvents Array of {mag: Number, time: Number (epoch ms)}
 * @param {Number} targetTime Epoch ms to calculate rate for (usually Date.now())
 * @returns {Number} multiplier (1.0 = baseline, >1.0 = elevated risk)
 */
function calculateEtasRate(recentEvents, targetTime) {
  let rate = 0;
  
  recentEvents.forEach(ev => {
    if (ev.mag < ETAS_PARAMS.m0) return;
    
    // Time difference in days
    const deltaDays = (targetTime - ev.time) / (1000 * 60 * 60 * 24);
    if (deltaDays <= 0) return;

    // ETAS formula: lambda(t) = mu + Sum [ K * exp(alpha*(M-M0)) / (t-ti+c)^p ]
    const productivity = ETAS_PARAMS.k * Math.exp(ETAS_PARAMS.alpha * (ev.mag - ETAS_PARAMS.m0));
    const temporalDecay = Math.pow(deltaDays + ETAS_PARAMS.c, ETAS_PARAMS.p);
    
    rate += productivity / temporalDecay;
  });

  return rate; // This is the dynamic intensity above background
}

/**
 * Converts ETAS rate into a human-readable probability % (0-100)
 */
function getEtasProbability(rate) {
  // Sigmoid function to map the unbounded rate [0, inf) to [0, 100]
  // Tuned roughly for the stub values
  const prob = (1 - Math.exp(-rate * 5)) * 100;
  return Math.min(Math.max(prob, 0), 100);
}

module.exports = {
  calculateEtasRate,
  getEtasProbability
};
