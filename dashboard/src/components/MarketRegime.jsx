import SectionExplainer from './SectionExplainer';

const fmt = (n) =>
  n != null
    ? '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : '—';

const pct = (n) =>
  n != null ? (n >= 0 ? '+' : '') + n.toFixed(1) + '%' : '—';

const STATUS_COLORS = {
  ABOVE: 'positive', RISING: 'positive',
  POSITIVE: 'positive',
  BELOW: 'negative', FALLING: 'negative',
  NEGATIVE: 'negative',
  TESTING: 'caution', FLAT: 'caution',
  MIXED: 'caution',
  UNKNOWN: 'caution',
};

function Badge({ status }) {
  const color = STATUS_COLORS[status] || 'caution';
  const label = status.replace(/_/g, ' ');
  return <span className={`regime-badge regime-${color}`}>{label}</span>;
}

function MetricCard({ name, status, values, interpretation }) {
  return (
    <div className="regime-metric">
      <div className="regime-metric-header">
        <span className="regime-metric-name">{name}</span>
      </div>
      <Badge status={status} />
      {values.length > 0 && (
        <div className="regime-metric-values">
          {values.map((v) => (
            <div key={v.label} className="regime-metric-value-row">
              <span className="label">{v.label}</span>
              <span className="value">{v.value}</span>
            </div>
          ))}
        </div>
      )}
      <p className="regime-metric-interp">{interpretation}</p>
    </div>
  );
}

export default function MarketRegime({ regime }) {
  if (!regime) return null;

  const { currentPrice, priceVsMa200, weeklyTrend, ma200Slope, bias } = regime;
  const biasColor = STATUS_COLORS[bias] || 'caution';

  const metrics = [
    {
      name: 'Price vs 200-DMA',
      status: priceVsMa200.status,
      values: [
        { label: 'Price', value: fmt(currentPrice) },
        { label: '200-DMA', value: fmt(priceVsMa200.ma200) },
        { label: 'Distance', value: pct(priceVsMa200.priceDiff) },
      ],
      interpretation: priceVsMa200.status === 'ABOVE'
        ? 'Price is above the long-term average — positive positioning.'
        : priceVsMa200.status === 'BELOW'
        ? 'Price is below the long-term average — negative positioning.'
        : 'Price is testing the 200-DMA — decision point.',
    },
    {
      name: 'Weekly Close vs 50-Week MA',
      status: weeklyTrend.status,
      values: [
        { label: 'Weekly Close', value: fmt(weeklyTrend.weeklyClose) },
        { label: '50-Week MA', value: fmt(weeklyTrend.weeklyMa) },
      ],
      interpretation: weeklyTrend.status === 'ABOVE'
        ? 'Weekly closes above 50-week MA — macro uptrend.'
        : weeklyTrend.status === 'BELOW'
        ? 'Weekly closes below 50-week MA — macro downtrend.'
        : 'Weekly close is testing the 50-week MA.',
    },
    {
      name: '200-DMA Slope',
      status: ma200Slope.status,
      values: [
        { label: '30-Day Change', value: pct(ma200Slope.change) },
      ],
      interpretation: ma200Slope.status === 'RISING'
        ? 'The long-term average is rising — uptrend confirmed.'
        : ma200Slope.status === 'FALLING'
        ? 'The long-term average is falling — downtrend confirmed.'
        : 'The long-term average is flat — no clear directional bias.',
    },
  ];

  return (
    <div className="card regime-card">
      <h2>Market Regime</h2>

      <div className={`regime-verdict regime-verdict-${biasColor}`}>
        <span className="regime-verdict-label">Bias:</span>
        <span className={`regime-verdict-badge regime-${biasColor}`}>{bias}</span>
      </div>

      <div className="regime-grid">
        {metrics.map((m) => (
          <MetricCard key={m.name} {...m} />
        ))}
      </div>

      <SectionExplainer>
        <p><strong>Price vs 200-DMA</strong> — When price is above the 200-day moving average, momentum favors buyers. Below it, sellers are in control.</p>
        <p><strong>Weekly Close vs 50-Week MA</strong> — This filters out daily noise. Above = macro uptrend. Below = macro downtrend.</p>
        <p><strong>200-DMA Slope</strong> — A rising slope confirms a sustained uptrend. Falling confirms downtrend. Flat means the market is transitioning.</p>
        <p>The bias is determined by agreement between price/200-DMA and weekly trend. If they agree, the bias is clear. If they conflict, it's neutral.</p>
      </SectionExplainer>
    </div>
  );
}
