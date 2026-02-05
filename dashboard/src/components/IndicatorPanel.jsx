import SectionExplainer from './SectionExplainer';

export default function IndicatorPanel({ indicators }) {
  if (!indicators) return null;

  const { currentRsi, trend, supportResistance, sma20, sma50 } = indicators;
  const latestSma20 = sma20.filter((v) => v !== null).slice(-1)[0];
  const latestSma50 = sma50.filter((v) => v !== null).slice(-1)[0];

  const rsiLabel =
    currentRsi > 70 ? 'Overbought' : currentRsi < 30 ? 'Oversold' : 'Neutral';
  const rsiClass =
    currentRsi > 70 ? 'negative' : currentRsi < 30 ? 'positive' : '';

  return (
    <div className="card indicator-panel">
      <h2>Technical Indicators</h2>
      <div className="indicator-grid">
        <div className="indicator-item">
          <span className="label">Trend (SMA 20/50)</span>
          <span className={`value ${trend === 'Up' ? 'positive' : 'negative'}`}>
            {trend}
          </span>
        </div>
        <div className="indicator-item">
          <span className="label">RSI (14)</span>
          <span className={`value ${rsiClass}`}>
            {currentRsi?.toFixed(1)} — {rsiLabel}
          </span>
        </div>
        <div className="indicator-item">
          <span className="label">SMA 20</span>
          <span className="value">${latestSma20?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="indicator-item">
          <span className="label">SMA 50</span>
          <span className="value">${latestSma50?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="indicator-item">
          <span className="label">Support</span>
          <span className="value">
            {supportResistance.support
              ? `$${supportResistance.support.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
              : 'N/A'}
          </span>
        </div>
        <div className="indicator-item">
          <span className="label">Resistance</span>
          <span className="value">
            {supportResistance.resistance
              ? `$${supportResistance.resistance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
              : 'N/A'}
          </span>
        </div>
      </div>
      <SectionExplainer text="Trend shows whether the 20-day MA is above the 50-day (up) or below (down). RSI measures momentum: above 70 is overbought, below 30 is oversold. Support is where buyers have stepped in; resistance is where sellers have appeared." />
    </div>
  );
}
