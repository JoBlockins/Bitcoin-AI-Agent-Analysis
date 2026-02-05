export function evaluateAction({ indicators, regime, currentPrice }) {
  if (!indicators || !regime) {
    return { action: 'WAIT', confidence: 0, conditions: [], reason: 'Insufficient data' };
  }

  const conditions = [];

  // 1. Regime bias
  const regimeBias = regime.bias;
  const regimePositive = regimeBias === 'POSITIVE';
  const regimeNegative = regimeBias === 'NEGATIVE';
  conditions.push({
    name: 'Regime',
    met: regimePositive,
    caution: regimeNegative,
    value: regimeBias,
    favorable: 'POSITIVE or MIXED',
    description: regimePositive
      ? 'Trend is with you'
      : regimeNegative
      ? 'Trend is against you'
      : 'Trend is unclear',
  });

  // 2. RSI
  const rsi = indicators.currentRsi;
  const rsiOk = rsi < 70;
  const rsiOverbought = rsi >= 70;
  const rsiOversold = rsi <= 30;
  conditions.push({
    name: 'RSI',
    met: rsiOk,
    caution: rsiOverbought,
    value: rsi?.toFixed(1),
    favorable: '< 70',
    description: rsiOverbought
      ? 'Overbought — potential exhaustion'
      : rsiOversold
      ? 'Oversold — potential bounce'
      : 'Neutral range',
  });

  // 3. Price vs Support/Resistance
  const support = indicators.supportResistance?.support;
  const resistance = indicators.supportResistance?.resistance;
  let pricePosition = 'unknown';
  let priceConditionMet = false;

  if (support && resistance && currentPrice) {
    const range = resistance - support;
    const positionInRange = range > 0 ? (currentPrice - support) / range : 0.5;
    pricePosition = positionInRange <= 0.4 ? 'Near support' :
                    positionInRange >= 0.6 ? 'Near resistance' : 'Mid-range';
    priceConditionMet = positionInRange <= 0.5;
  } else if (support && currentPrice) {
    const distFromSupport = ((currentPrice - support) / support) * 100;
    pricePosition = distFromSupport < 5 ? 'Near support' : 'Above support';
    priceConditionMet = distFromSupport < 10;
  }

  conditions.push({
    name: 'Price Position',
    met: priceConditionMet,
    caution: pricePosition === 'Near resistance',
    value: pricePosition,
    favorable: 'Closer to support',
    description: pricePosition === 'Near support'
      ? 'Defined downside risk'
      : pricePosition === 'Near resistance'
      ? 'Limited upside before resistance'
      : 'No strong level nearby',
  });

  // 4. MACD trend
  const macdTrend = indicators.macd?.trend || 'Neutral';
  const macdRising = macdTrend.includes('Rising');
  const macdFalling = macdTrend.includes('Falling');
  conditions.push({
    name: 'MACD',
    met: macdRising || macdTrend === 'Neutral',
    caution: macdFalling,
    value: macdTrend,
    favorable: 'Rising or Neutral',
    description: macdRising
      ? 'Momentum confirming'
      : macdFalling
      ? 'Momentum fading'
      : 'Momentum neutral',
  });

  // 5. Volume
  const volumeStatus = indicators.volumeContext?.status || 'UNKNOWN';
  const volumeOk = volumeStatus !== 'BELOW_AVERAGE';
  conditions.push({
    name: 'Volume',
    met: volumeOk,
    caution: volumeStatus === 'BELOW_AVERAGE',
    value: volumeStatus.replace(/_/g, ' '),
    favorable: 'Average or above',
    description: volumeStatus === 'BELOW_AVERAGE'
      ? 'Low conviction in moves'
      : volumeStatus === 'ELEVATED'
      ? 'High conviction'
      : 'Normal activity',
  });

  // 6. Distance from mean (overextension check)
  const ma200 = regime.priceVsMa200?.ma200;
  let overextended = false;
  let distanceFromMean = null;
  if (ma200 && currentPrice) {
    distanceFromMean = ((currentPrice - ma200) / ma200) * 100;
    overextended = distanceFromMean > 20;
  }
  conditions.push({
    name: 'Extension',
    met: !overextended,
    caution: overextended,
    value: distanceFromMean !== null ? `${distanceFromMean >= 0 ? '+' : ''}${distanceFromMean.toFixed(1)}% from 200-DMA` : 'Unknown',
    favorable: 'Within 20% of mean',
    description: overextended
      ? 'Overextended — mean reversion risk'
      : 'Within normal range',
  });

  // Evaluate action
  const metCount = conditions.filter(c => c.met).length;
  const cautionCount = conditions.filter(c => c.caution).length;
  const totalConditions = conditions.length;

  // CAUTION triggers (any of these)
  if (regimeNegative) {
    return {
      action: 'CAUTION',
      confidence: cautionCount / totalConditions,
      conditions,
      reason: 'Regime is negative — trend is against you',
    };
  }

  if (rsiOverbought && macdFalling) {
    return {
      action: 'CAUTION',
      confidence: cautionCount / totalConditions,
      conditions,
      reason: 'Overbought with fading momentum',
    };
  }

  if (overextended) {
    return {
      action: 'CAUTION',
      confidence: cautionCount / totalConditions,
      conditions,
      reason: 'Price overextended from mean',
    };
  }

  // FAVORABLE triggers (most conditions met)
  if (metCount >= 5 && regimePositive) {
    return {
      action: 'FAVORABLE',
      confidence: metCount / totalConditions,
      conditions,
      reason: 'Multiple conditions align positively',
    };
  }

  if (metCount >= 4 && !regimeNegative) {
    return {
      action: 'FAVORABLE',
      confidence: metCount / totalConditions,
      conditions,
      reason: 'Most conditions are favorable',
    };
  }

  // Default: WAIT
  return {
    action: 'WAIT',
    confidence: 0.5,
    conditions,
    reason: cautionCount > 0
      ? 'Mixed signals — no clear edge'
      : 'Conditions are neutral',
  };
}
