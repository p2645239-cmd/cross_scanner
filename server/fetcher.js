// Data fetcher — calls sports-skills CLI and parses JSON output
const { execSync } = require('child_process');

function run(cmd) {
  try {
    const out = execSync(`sports-skills ${cmd}`, { encoding: 'utf8', timeout: 30000 });
    const parsed = JSON.parse(out);
    if (!parsed.status) return null;
    return parsed.data;
  } catch (e) {
    console.error(`[FETCH] Failed: sports-skills ${cmd}:`, e.message?.slice(0, 200));
    return null;
  }
}

// ─── Polymarket ─────────────────────────────────────────────────────────
async function fetchPolymarketMarkets() {
  const allMarkets = [];
  // Fetch in batches
  for (let offset = 0; offset < 500; offset += 100) {
    const data = run(`polymarket get_sports_markets --limit=100 --offset=${offset}`);
    if (!data?.markets?.length) break;
    allMarkets.push(...data.markets);
    if (data.markets.length < 100) break;
  }
  console.log(`[FETCH] Polymarket: ${allMarkets.length} markets`);
  return allMarkets;
}

function fetchPolymarketOrderBook(tokenId) {
  return run(`polymarket get_order_book --token_id=${tokenId}`);
}

// ─── Kalshi ─────────────────────────────────────────────────────────────
async function fetchKalshiSportsMarkets() {
  const seriesData = run('kalshi get_series_list');
  if (!seriesData?.series) return [];

  // Filter to sports series
  const sportsSeries = seriesData.series.filter(s =>
    s.category === 'Sports' || (s.tags && s.tags.some(t => ['Soccer', 'Basketball', 'Football', 'Baseball', 'Hockey', 'Tennis', 'MMA', 'Golf', 'Racing'].includes(t)))
  );

  console.log(`[FETCH] Kalshi: ${sportsSeries.length} sports series found`);

  const allMarkets = [];
  for (const series of sportsSeries) {
    const data = run(`kalshi get_markets --series_ticker=${series.ticker} --status=open`);
    if (data?.markets?.length) {
      for (const m of data.markets) {
        m._series = series;
      }
      allMarkets.push(...data.markets);
    }
  }

  console.log(`[FETCH] Kalshi: ${allMarkets.length} total markets`);
  return allMarkets;
}

module.exports = { fetchPolymarketMarkets, fetchKalshiSportsMarkets, fetchPolymarketOrderBook };
