import { sma } from './technicalIndicators';

export function computeMarketRegime(priceData) {
  const prices = priceData.map((d) => d.price ?? d.close);
  const currentPrice = prices[prices.length - 1];

  // Price vs 200-DMA
  const ma200Values = sma(prices, 200);
  const ma200 = ma200Values.filter((v) => v !== null).slice(-1)[0] ?? null;
  let priceVsMa200 = { status: 'UNKNOWN', ma200, priceDiff: null };
  if (ma200 !== null) {
    const pctDiff = ((currentPrice - ma200) / ma200) * 100;
    const status = Math.abs(pctDiff) <= 1 ? 'TESTING' : pctDiff > 0 ? 'ABOVE' : 'BELOW';
    priceVsMa200 = { status, ma200, priceDiff: pctDiff };
  }

  // Weekly Close vs 50-Week MA
  const weeklyCandles = aggregateToWeekly(priceData);
  const weeklyCloses = weeklyCandles.map((w) => w.close);
  const weekly50Ma = sma(weeklyCloses, 50);
  const latestWeeklyClose = weeklyCloses[weeklyCloses.length - 1];
  const latestWeekly50 = weekly50Ma.filter((v) => v !== null).slice(-1)[0] ?? null;
  let weeklyTrend = { status: 'UNKNOWN', weeklyClose: latestWeeklyClose, weeklyMa: latestWeekly50 };
  if (latestWeekly50 !== null) {
    const pctDiff = ((latestWeeklyClose - latestWeekly50) / latestWeekly50) * 100;
    const status = Math.abs(pctDiff) <= 2 ? 'TESTING' : pctDiff > 0 ? 'ABOVE' : 'BELOW';
    weeklyTrend = { status, weeklyClose: latestWeeklyClose, weeklyMa: latestWeekly50, pctDiff };
  }

  // Bias verdict
  const bothAbove = priceVsMa200.status === 'ABOVE' && weeklyTrend.status === 'ABOVE';
  const bothBelow = priceVsMa200.status === 'BELOW' && weeklyTrend.status === 'BELOW';
  const bias = bothAbove ? 'POSITIVE' : bothBelow ? 'NEGATIVE' : 'MIXED';

  // 200-DMA Slope
  const validMa200 = ma200Values.filter((v) => v !== null);
  let ma200Slope = { status: 'UNKNOWN', change: null };
  if (validMa200.length >= 31) {
    const today = validMa200[validMa200.length - 1];
    const prev = validMa200[validMa200.length - 31];
    const changePct = ((today - prev) / prev) * 100;
    const status = Math.abs(changePct) < 0.5 ? 'FLAT' : changePct > 0 ? 'RISING' : 'FALLING';
    ma200Slope = { status, change: changePct };
  }

  return {
    currentPrice,
    priceVsMa200,
    weeklyTrend,
    ma200Slope,
    bias,
  };
}

function aggregateToWeekly(priceData) {
  const weeks = [];
  let current = null;

  for (const d of priceData) {
    const date = new Date(d.date);
    const day = date.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() + mondayOffset);
    const weekKey = weekStart.toISOString().slice(0, 10);

    if (!current || current.key !== weekKey) {
      if (current) weeks.push(current);
      current = { key: weekKey, close: d.price ?? d.close };
    } else {
      current.close = d.price ?? d.close;
    }
  }
  if (current) weeks.push(current);
  return weeks;
}
