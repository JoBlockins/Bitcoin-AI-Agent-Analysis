const BASE_URL = 'https://api.coingecko.com/api/v3';

async function fetchWithRetry(url, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res;
    if (res.status === 429) {
      const wait = Math.pow(2, attempt + 1) * 1000;
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  throw new Error('Rate limited by CoinGecko. Please wait a minute and try again.');
}

export async function fetchCurrentPrice() {
  const res = await fetchWithRetry(
    `${BASE_URL}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
  );
  const data = await res.json();
  return {
    price: data.bitcoin.usd,
    change24h: data.bitcoin.usd_24h_change,
    volume24h: data.bitcoin.usd_24h_vol,
    marketCap: data.bitcoin.usd_market_cap,
  };
}

export async function fetchHistoricalPrices(days = 365) {
  const res = await fetchWithRetry(
    `${BASE_URL}/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=daily`
  );
  const data = await res.json();
  const volumes = Object.fromEntries(
    (data.total_volumes || []).map(([ts, vol]) => [ts, vol])
  );
  return data.prices.map(([timestamp, price]) => ({
    date: new Date(timestamp),
    timestamp,
    price,
    volume: volumes[timestamp] || 0,
  }));
}
