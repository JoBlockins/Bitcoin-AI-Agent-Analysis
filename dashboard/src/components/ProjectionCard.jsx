import SectionExplainer from './SectionExplainer';

export default function ProjectionCard({ projection, currentPrice }) {
  if (!projection) return null;

  const { twoWeek, fourWeek, volatility } = projection;

  const fmtPrice = (n) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const pctChange = (target) => (((target - currentPrice) / currentPrice) * 100).toFixed(1);

  return (
    <div className="card projection-card">
      <h2>Price Projections</h2>

      <div className="projection-section">
        <h3>2-Week Outlook</h3>
        <div className="projection-range">
          <div className="range-item floor">
            <span className="label">Floor (10th pct)</span>
            <span className="value">{fmtPrice(twoWeek.floor)}</span>
            <span className="pct negative">{pctChange(twoWeek.floor)}%</span>
          </div>
          <div className="range-item median">
            <span className="label">Median</span>
            <span className="value">{fmtPrice(twoWeek.median)}</span>
            <span className={`pct ${twoWeek.median >= currentPrice ? 'positive' : 'negative'}`}>
              {pctChange(twoWeek.median)}%
            </span>
          </div>
          <div className="range-item ceiling">
            <span className="label">Ceiling (90th pct)</span>
            <span className="value">{fmtPrice(twoWeek.ceiling)}</span>
            <span className="pct positive">{pctChange(twoWeek.ceiling)}%</span>
          </div>
        </div>
      </div>

      <div className="projection-section">
        <h3>4-Week Outlook</h3>
        <div className="projection-range">
          <div className="range-item floor">
            <span className="label">Floor (10th pct)</span>
            <span className="value">{fmtPrice(fourWeek.floor)}</span>
            <span className="pct negative">{pctChange(fourWeek.floor)}%</span>
          </div>
          <div className="range-item median">
            <span className="label">Median</span>
            <span className="value">{fmtPrice(fourWeek.median)}</span>
            <span className={`pct ${fourWeek.median >= currentPrice ? 'positive' : 'negative'}`}>
              {pctChange(fourWeek.median)}%
            </span>
          </div>
          <div className="range-item ceiling">
            <span className="label">Ceiling (90th pct)</span>
            <span className="value">{fmtPrice(fourWeek.ceiling)}</span>
            <span className="pct positive">{pctChange(fourWeek.ceiling)}%</span>
          </div>
        </div>
      </div>

      <div className="projection-meta">
        <div className="meta-item">
          <span className="label">Annualized Volatility</span>
          <span className="value">{(volatility.annualized * 100).toFixed(1)}%</span>
        </div>
      </div>
      <SectionExplainer text="Projections use Monte Carlo simulation: 1,000 randomized paths based on recent volatility. The floor (10th percentile) is a conservative downside estimate. The ceiling (90th percentile) is the upside. The median is the most likely outcome." />
    </div>
  );
}
