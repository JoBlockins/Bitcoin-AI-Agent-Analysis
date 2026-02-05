export function sma(prices, period) {
  const result = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / period);
    }
  }
  return result;
}

export function bollingerBands(prices, period = 20, stdDevMultiplier = 2) {
  const middle = sma(prices, period);
  const upper = [];
  const lower = [];

  for (let i = 0; i < prices.length; i++) {
    if (middle[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = middle[i];
      const variance = slice.reduce((sum, p) => sum + (p - mean) ** 2, 0) / period;
      const stdDev = Math.sqrt(variance);
      upper.push(mean + stdDevMultiplier * stdDev);
      lower.push(mean - stdDevMultiplier * stdDev);
    }
  }

  return { upper, middle, lower };
}

export function rsi(prices, period = 14) {
  const result = [];
  const gains = [];
  const losses = [];

  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }

  let prevAvgGain = 0;
  let prevAvgLoss = 0;

  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      result.push(null);
    } else {
      let avgGain, avgLoss;
      if (i === period) {
        avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
      } else {
        avgGain = (prevAvgGain * (period - 1) + gains[i - 1]) / period;
        avgLoss = (prevAvgLoss * (period - 1) + losses[i - 1]) / period;
      }
      prevAvgGain = avgGain;
      prevAvgLoss = avgLoss;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }

  return result;
}

export function ema(prices, period) {
  const result = [];
  const k = 2 / (period + 1);
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      const seed = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
      result.push(seed);
    } else {
      result.push(prices[i] * k + result[i - 1] * (1 - k));
    }
  }
  return result;
}

export function macd(prices, fast = 12, slow = 26, signal = 9) {
  const emaFast = ema(prices, fast);
  const emaSlow = ema(prices, slow);

  const macdLine = prices.map((_, i) =>
    emaFast[i] !== null && emaSlow[i] !== null ? emaFast[i] - emaSlow[i] : null
  );

  const validMacd = macdLine.filter((v) => v !== null);
  const signalLine = ema(validMacd, signal);

  const result = [];
  let si = 0;
  for (let i = 0; i < prices.length; i++) {
    if (macdLine[i] === null) {
      result.push({ macd: null, signal: null, histogram: null });
    } else {
      const sig = signalLine[si] ?? null;
      result.push({
        macd: macdLine[i],
        signal: sig,
        histogram: sig !== null ? macdLine[i] - sig : null,
      });
      si++;
    }
  }
  return result;
}

export function computeVolumeContext(historicalData) {
  if (!historicalData || historicalData.length < 30) {
    return { status: 'UNKNOWN', ratio: null, avg30d: null, current: null };
  }

  const volumes = historicalData.map((d) => d.volume || 0);
  const current = volumes[volumes.length - 1];
  const avg30d = volumes.slice(-30).reduce((a, b) => a + b, 0) / 30;

  if (avg30d === 0) {
    return { status: 'UNKNOWN', ratio: null, avg30d: null, current };
  }

  const ratio = current / avg30d;
  let status;
  if (ratio >= 2) {
    status = 'ELEVATED';
  } else if (ratio >= 1.1) {
    status = 'ABOVE_AVERAGE';
  } else if (ratio >= 0.9) {
    status = 'AVERAGE';
  } else {
    status = 'BELOW_AVERAGE';
  }

  return { status, ratio, avg30d, current };
}

export function findSupportResistance(prices, windowSize = 5) {
  const supports = [];
  const resistances = [];

  for (let i = windowSize; i < prices.length - windowSize; i++) {
    const window = prices.slice(i - windowSize, i + windowSize + 1);
    const current = prices[i];

    if (current === Math.min(...window)) {
      supports.push(current);
    }
    if (current === Math.max(...window)) {
      resistances.push(current);
    }
  }

  const recentSupports = supports.slice(-5);
  const recentResistances = resistances.slice(-5);

  return {
    support: recentSupports.length > 0 ? Math.max(...recentSupports) : null,
    resistance: recentResistances.length > 0 ? Math.min(...recentResistances) : null,
  };
}

export function computeAllIndicators(priceData) {
  const closes = priceData.map((d) => d.price ?? d.close);

  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const bb = bollingerBands(closes, 20, 2);
  const rsiValues = rsi(closes, 14);
  const sr = findSupportResistance(closes, 5);
  const macdValues = macd(closes);
  const volumeContext = computeVolumeContext(priceData);

  const currentRsi = rsiValues.filter((v) => v !== null).slice(-1)[0];
  const trend = sma20.slice(-1)[0] > sma50.slice(-1)[0] ? 'Up' : 'Down';

  const latestMacd = macdValues.filter((v) => v.macd !== null).slice(-1)[0];
  const prevMacd = macdValues.filter((v) => v.macd !== null).slice(-2)[0];

  let macdTrend = 'Neutral';
  if (latestMacd && prevMacd) {
    if (latestMacd.histogram > 0 && latestMacd.histogram > prevMacd.histogram) {
      macdTrend = 'Rising';
    } else if (latestMacd.histogram < 0 && latestMacd.histogram < prevMacd.histogram) {
      macdTrend = 'Falling';
    } else if (latestMacd.histogram > 0) {
      macdTrend = 'Rising (weakening)';
    } else if (latestMacd.histogram < 0) {
      macdTrend = 'Falling (weakening)';
    }
  }

  return {
    sma20,
    sma50,
    bollingerBands: bb,
    rsi: rsiValues,
    currentRsi,
    trend,
    supportResistance: sr,
    macd: {
      values: macdValues,
      latest: latestMacd,
      trend: macdTrend,
    },
    volumeContext,
    chartData: priceData.map((d, i) => ({
      ...d,
      sma20: sma20[i],
      sma50: sma50[i],
      bbUpper: bb.upper[i],
      bbMiddle: bb.middle[i],
      bbLower: bb.lower[i],
      rsi: rsiValues[i],
    })),
  };
}
