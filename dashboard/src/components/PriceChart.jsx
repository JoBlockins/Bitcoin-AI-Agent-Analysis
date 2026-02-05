import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import SectionExplainer from './SectionExplainer';

const formatDate = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const formatPrice = (v) => (v ? `$${Math.round(v).toLocaleString()}` : '');

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-date">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {formatPrice(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function PriceChart({ chartData, projectionDays }) {
  if (!chartData?.length) return null;

  const historical = chartData.map((d) => ({
    dateLabel: formatDate(d.date),
    price: d.price,
    sma20: d.sma20,
    sma50: d.sma50,
    bbUpper: d.bbUpper,
    bbLower: d.bbLower,
  }));

  const lastDate = chartData[chartData.length - 1].date;
  const projection = projectionDays
    ? projectionDays.slice(1).map((d) => {
        const futureDate = new Date(lastDate);
        futureDate.setDate(futureDate.getDate() + d.day);
        return {
          dateLabel: formatDate(futureDate),
          median: d.median,
          projectionRange: [d.p10, d.p90],
        };
      })
    : [];

  const bridge = {
    dateLabel: formatDate(lastDate),
    price: chartData[chartData.length - 1].price,
    median: chartData[chartData.length - 1].price,
    projectionRange: [chartData[chartData.length - 1].price, chartData[chartData.length - 1].price],
  };

  const combined = [...historical, bridge, ...projection];

  return (
    <div className="card chart-container">
      <h2>Price Chart & Projection</h2>
      <ResponsiveContainer width="100%" height={450}>
        <ComposedChart data={combined} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="dateLabel"
            stroke="#888"
            tick={{ fontSize: 11 }}
            interval={Math.floor(combined.length / 10)}
          />
          <YAxis
            stroke="#888"
            tickFormatter={formatPrice}
            domain={['auto', 'auto']}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          <Line type="monotone" dataKey="bbUpper" stroke="#555" strokeDasharray="4 4" dot={false} name="BB Upper" />
          <Line type="monotone" dataKey="bbLower" stroke="#555" strokeDasharray="4 4" dot={false} name="BB Lower" />

          <Line type="monotone" dataKey="sma20" stroke="#f59e0b" dot={false} strokeWidth={1} name="SMA 20" />
          <Line type="monotone" dataKey="sma50" stroke="#8b5cf6" dot={false} strokeWidth={1} name="SMA 50" />

          <Line type="monotone" dataKey="price" stroke="#3b82f6" dot={false} strokeWidth={2} name="BTC Price" />

          <Area type="monotone" dataKey="projectionRange" fill="#3b82f6" fillOpacity={0.1} stroke="none" name="90% Range" />

          <Line type="monotone" dataKey="median" stroke="#10b981" strokeDasharray="6 3" dot={false} strokeWidth={2} name="Projected Median" />
        </ComposedChart>
      </ResponsiveContainer>
      <SectionExplainer text="The solid blue line is Bitcoin's price. Yellow and purple lines are the 20 and 50-day moving averages. Dashed gray lines are Bollinger Bands showing volatility. The shaded projection area shows the statistically modeled 90% price range. The green dashed line is the projected median." />
    </div>
  );
}
