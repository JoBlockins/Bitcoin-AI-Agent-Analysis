import { useState, useEffect, useCallback } from 'react';
import { fetchCurrentPrice, fetchHistoricalPrices } from '../services/coingecko';
import { computeAllIndicators } from '../analysis/technicalIndicators';
import { computeProjection } from '../analysis/statisticalModel';
import { computeMarketRegime } from '../analysis/marketRegime';
import { evaluateAction } from '../analysis/actionFramework';
import ActionPanel from './ActionPanel';
import MarketSummary from './MarketSummary';
import MarketRegime from './MarketRegime';
import PriceChart from './PriceChart';
import ProjectionCard from './ProjectionCard';
import IndicatorPanel from './IndicatorPanel';
import MomentumPanel from './MomentumPanel';

export default function Dashboard() {
  const [marketData, setMarketData] = useState(null);
  const [indicators, setIndicators] = useState(null);
  const [projection, setProjection] = useState(null);
  const [regime, setRegime] = useState(null);
  const [action, setAction] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [cooldown, setCooldown] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [current, historical] = await Promise.all([
        fetchCurrentPrice(),
        fetchHistoricalPrices(365),
      ]);

      setMarketData(current);
      setHistoricalData(historical);

      const prices = historical.map((d) => d.price);
      const indicatorResults = computeAllIndicators(historical);
      const projectionResults = computeProjection(prices, 28);
      const regimeResult = computeMarketRegime(historical);

      setIndicators(indicatorResults);
      setProjection(projectionResults);
      setRegime(regimeResult);

      const actionResult = evaluateAction({
        indicators: indicatorResults,
        regime: regimeResult,
        currentPrice: current.price,
      });
      setAction(actionResult);

      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 30000);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Machine-readable data for agents
  useEffect(() => {
    if (!marketData || !indicators || !projection || !regime || !action) return;

    const agentData = {
      timestamp: new Date().toISOString(),
      action: {
        verdict: action.action,
        reason: action.reason,
        confidence: action.confidence,
        conditions: action.conditions.map(c => ({
          name: c.name,
          met: c.met,
          caution: c.caution,
          value: c.value,
        })),
      },
      price: {
        current: marketData.price,
        change_24h_pct: marketData.change24h,
      },
      regime: {
        bias: regime.bias,
        price_vs_200dma: regime.priceVsMa200.status,
        price_vs_200dma_pct: regime.priceVsMa200.priceDiff,
        weekly_trend: regime.weeklyTrend.status,
        ma200_slope: regime.ma200Slope.status,
      },
      indicators: {
        rsi: indicators.currentRsi,
        trend: indicators.trend,
        support: indicators.supportResistance.support,
        resistance: indicators.supportResistance.resistance,
        macd_trend: indicators.macd?.trend,
        macd_histogram: indicators.macd?.latest?.histogram,
        volume_status: indicators.volumeContext?.status,
        volume_ratio: indicators.volumeContext?.ratio,
      },
      projections: {
        two_week: {
          floor: projection.twoWeek.floor,
          median: projection.twoWeek.median,
          ceiling: projection.twoWeek.ceiling,
        },
        four_week: {
          floor: projection.fourWeek.floor,
          median: projection.fourWeek.median,
          ceiling: projection.fourWeek.ceiling,
        },
        volatility_annualized: projection.volatility.annualized,
      },
    };

    let el = document.getElementById('agent-data');
    if (!el) {
      el = document.createElement('script');
      el.id = 'agent-data';
      el.type = 'application/json';
      document.body.appendChild(el);
    }
    el.textContent = JSON.stringify(agentData);
  }, [marketData, indicators, projection, regime, action]);

  if (error) {
    return (
      <div className="dashboard">
        <div className="card error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Bitcoin Analysis</h1>
        <div className="header-actions">
          {lastUpdated && (
            <span className="last-updated">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button onClick={loadData} disabled={loading || cooldown} className="refresh-btn">
            {loading ? 'Loading...' : cooldown ? 'Wait 30s...' : 'Refresh'}
          </button>
        </div>
      </header>

      {loading && !marketData ? (
        <div className="loading">
          <div className="spinner" />
          <p>Fetching market data...</p>
        </div>
      ) : (
        <>
          <ActionPanel evaluation={action} />
          <MarketSummary marketData={marketData} historicalData={historicalData} />
          <MarketRegime regime={regime} />
          <div className="two-col">
            <ProjectionCard projection={projection} currentPrice={marketData?.price} />
            <IndicatorPanel indicators={indicators} />
          </div>
          <MomentumPanel macd={indicators?.macd} volumeContext={indicators?.volumeContext} />
          <PriceChart
            chartData={indicators?.chartData}
            projectionDays={projection?.projectionDays}
          />
        </>
      )}

      <footer className="disclaimer">
        This analysis is for informational purposes only. Projections are based on historical
        volatility and statistical modeling — they are not financial advice.
      </footer>
    </div>
  );
}
