import SectionExplainer from './SectionExplainer';

const fmt = (n) =>
  n >= 1e9
    ? `$${(n / 1e9).toFixed(1)}B`
    : n >= 1e6
    ? `$${(n / 1e6).toFixed(1)}M`
    : `$${n.toLocaleString()}`;

const STATUS_COLORS = {
  ELEVATED: 'positive',
  ABOVE_AVERAGE: 'positive',
  AVERAGE: '',
  BELOW_AVERAGE: 'negative',
  UNKNOWN: '',
};

const STATUS_LABELS = {
  ELEVATED: 'Elevated (2x+)',
  ABOVE_AVERAGE: 'Above Average',
  AVERAGE: 'Average',
  BELOW_AVERAGE: 'Below Average',
  UNKNOWN: 'Unknown',
};

export default function MomentumPanel({ macd, volumeContext }) {
  if (!macd && !volumeContext) return null;

  const macdColor = macd?.trend?.includes('Rising') ? 'positive' :
                    macd?.trend?.includes('Falling') ? 'negative' : '';

  const volColor = STATUS_COLORS[volumeContext?.status] || '';
  const volLabel = STATUS_LABELS[volumeContext?.status] || 'Unknown';

  return (
    <div className="card momentum-panel">
      <h2>Momentum & Volume</h2>

      <div className="momentum-grid">
        <div className="momentum-section">
          <h3>MACD (12, 26, 9)</h3>
          <div className="momentum-details">
            <div className="detail-row">
              <span className="label">Trend</span>
              <span className={`value ${macdColor}`}>{macd?.trend || '—'}</span>
            </div>
            <div className="detail-row">
              <span className="label">MACD Line</span>
              <span className="value">{macd?.latest?.macd?.toFixed(0) || '—'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Signal Line</span>
              <span className="value">{macd?.latest?.signal?.toFixed(0) || '—'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Histogram</span>
              <span className={`value ${macd?.latest?.histogram > 0 ? 'positive' : macd?.latest?.histogram < 0 ? 'negative' : ''}`}>
                {macd?.latest?.histogram?.toFixed(0) || '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="momentum-section">
          <h3>Volume Context</h3>
          <div className="momentum-details">
            <div className="detail-row">
              <span className="label">Status</span>
              <span className={`value ${volColor}`}>{volLabel}</span>
            </div>
            <div className="detail-row">
              <span className="label">vs 30-Day Avg</span>
              <span className={`value ${volColor}`}>
                {volumeContext?.ratio ? `${(volumeContext.ratio * 100).toFixed(0)}%` : '—'}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">24h Volume</span>
              <span className="value">{volumeContext?.current ? fmt(volumeContext.current) : '—'}</span>
            </div>
            <div className="detail-row">
              <span className="label">30-Day Avg</span>
              <span className="value">{volumeContext?.avg30d ? fmt(volumeContext.avg30d) : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <SectionExplainer>
        <p><strong>MACD</strong> measures momentum by comparing fast and slow moving averages. When the histogram is positive and growing, momentum is rising. When negative and falling, momentum is falling. "Weakening" means the trend is still intact but losing steam.</p>
        <p><strong>Volume Context</strong> shows whether current trading activity confirms price moves. High volume on a move = conviction. Low volume = suspect. "Elevated" (2x+ average) often signals significant market events.</p>
      </SectionExplainer>
    </div>
  );
}
