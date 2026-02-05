function logReturns(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]));
  }
  return returns;
}

function randomNormal() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function monteCarloSimulation(prices, daysForward = 28, numSimulations = 1000) {
  const returns = logReturns(prices);
  const mu = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + (r - mu) ** 2, 0) / (returns.length - 1);
  const sigma = Math.sqrt(variance);

  const lastPrice = prices[prices.length - 1];
  const simulations = [];

  for (let sim = 0; sim < numSimulations; sim++) {
    const path = [lastPrice];
    for (let d = 1; d <= daysForward; d++) {
      const drift = (mu - 0.5 * sigma * sigma);
      const shock = sigma * randomNormal();
      const nextPrice = path[d - 1] * Math.exp(drift + shock);
      path.push(nextPrice);
    }
    simulations.push(path);
  }

  return simulations;
}

function getPercentile(values, pct) {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor(pct / 100 * (sorted.length - 1));
  return sorted[idx];
}

export function computeProjection(prices, daysForward = 28) {
  const simulations = monteCarloSimulation(prices, daysForward);

  const projectionDays = [];
  for (let d = 0; d <= daysForward; d++) {
    const dayPrices = simulations.map((sim) => sim[d]);
    projectionDays.push({
      day: d,
      p10: getPercentile(dayPrices, 10),
      p25: getPercentile(dayPrices, 25),
      median: getPercentile(dayPrices, 50),
      p75: getPercentile(dayPrices, 75),
      p90: getPercentile(dayPrices, 90),
    });
  }

  const finalDay = projectionDays[projectionDays.length - 1];
  const twoWeekDay = projectionDays[Math.min(14, projectionDays.length - 1)];

  const returns = logReturns(prices);
  const dailyVol = Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length);

  return {
    projectionDays,
    twoWeek: {
      floor: twoWeekDay.p10,
      ceiling: twoWeekDay.p90,
      median: twoWeekDay.median,
    },
    fourWeek: {
      floor: finalDay.p10,
      ceiling: finalDay.p90,
      median: finalDay.median,
    },
    volatility: {
      daily: dailyVol,
      annualized: dailyVol * Math.sqrt(365),
    },
  };
}
