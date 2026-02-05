import SectionExplainer from './SectionExplainer';

function computeSma(prices, period) {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function pctChange(prices, days) {
  if (prices.length < days + 1) return null;
  const old = prices[prices.length - 1 - days];
  const now = prices[prices.length - 1];
  return ((now - old) / old) * 100;
}

export default function MarketSummary({ marketData, historicalData }) {
  if (!marketData) return null;

  const { price, change24h, volume24h, marketCap } = marketData;
  const isPositive = change24h >= 0;

  const fmt = (n) =>
    n >= 1e12
      ? `$${(n / 1e12).toFixed(2)}T`
      : n >= 1e9
      ? `$${(n / 1e9).toFixed(2)}B`
      : n >= 1e6
      ? `$${(n / 1e6).toFixed(2)}M`
      : `$${n.toLocaleString()}`;

  const prices = historicalData ? historicalData.map((d) => d.price) : [];
  const sma30 = computeSma(prices, 30);
  const sma90 = computeSma(prices, 90);
  const sma30Diff = sma30 ? ((price - sma30) / sma30) * 100 : null;
  const sma90Diff = sma90 ? ((price - sma90) / sma90) * 100 : null;

  const change7d = pctChange(prices, 7);
  const change30d = pctChange(prices, 30);

  return (
    <div className="card market-summary">
      <h2>Bitcoin Market</h2>
      <div className="summary-columns">
        <div className="summary-column">
          <div className="summary-item">
            <span className="label">Price</span>
            <span className="value price">${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          {sma30 && (
            <div className="summary-sub-row">
              <span className="label">30-Day MA</span>
              <span className="summary-sub-value">
                ${sma30.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className={`summary-diff ${sma30Diff >= 0 ? 'positive' : 'negative'}`}>
                {sma30Diff >= 0 ? '+' : ''}{sma30Diff.toFixed(1)}%
              </span>
            </div>
          )}
          {sma90 && (
            <div className="summary-sub-row">
              <span className="label">90-Day MA</span>
              <span className="summary-sub-value">
                ${sma90.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className={`summary-diff ${sma90Diff >= 0 ? 'positive' : 'negative'}`}>
                {sma90Diff >= 0 ? '+' : ''}{sma90Diff.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        <div className="summary-column">
          <div className="summary-item">
            <span className="label">24h Change</span>
            <span className={`value ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '+' : ''}{change24h.toFixed(2)}%
            </span>
          </div>
          {change7d !== null && (
            <div className="summary-sub-row">
              <span className="label">7-Day</span>
              <span className={`summary-sub-value ${change7d >= 0 ? 'positive' : 'negative'}`}>
                {change7d >= 0 ? '+' : ''}{change7d.toFixed(2)}%
              </span>
            </div>
          )}
          {change30d !== null && (
            <div className="summary-sub-row">
              <span className="label">30-Day</span>
              <span className={`summary-sub-value ${change30d >= 0 ? 'positive' : 'negative'}`}>
                {change30d >= 0 ? '+' : ''}{change30d.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        <div className="summary-column">
          <div className="summary-item">
            <span className="label">24h Volume</span>
            <span className="value">{fmt(volume24h)}</span>
          </div>
        </div>

        <div className="summary-column">
          <div className="summary-item">
            <span className="label">Market Cap</span>
            <span className="value">{fmt(marketCap)}</span>
          </div>
        </div>
      </div>
      <SectionExplainer text="The market summary shows Bitcoin's current state. Moving averages show the average price over those periods. When price is above the MA, it suggests an uptrend; below suggests a downtrend. The percentage shows how far price is from that average." />
    </div>
  );
}
