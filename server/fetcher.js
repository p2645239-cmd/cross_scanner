// Data fetcher — calls sports-skills CLI and parses JSON output
const { execSync } = require('child_process');

function run(cmd) {
  try {
    const out = execSync(`sports-skills ${cmd}`, { encoding: 'utf8', timeout: 30000, maxBuffer: 50 * 1024 * 1024 });
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
// Known Kalshi sports series prefixes — faster than listing all series
const KALSHI_SPORTS_TICKERS = [
  'KXNBA', 'KXNFL', 'KXMLB', 'KXNHL', 'KXCBB', 'KXWNBA',
  'KXEPL', 'KXLALIGA', 'KXSOCCER', 'KXMLS', 'KXUCL', 'KXBUNDESLIGA', 'KXSERIEA', 'KXLIGUE1',
  'KXTENNIS', 'KXUFC', 'KXGOLF', 'KXPGA', 'KXNASCAR', 'KXF1',
  'KXLALIGABTTS', 'KXEPLBTTS', 'KXSOCCERBTTS',
];

async function fetchKalshiSportsMarkets() {
  // First discover actual series
  const seriesData = run('kalshi get_series_list');
  let sportsSeries = [];

  if (seriesData?.series) {
    sportsSeries = seriesData.series.filter(s =>
      s.category === 'Sports' ||
      (s.tags && s.tags.some(t => ['Soccer', 'Basketball', 'Football', 'Baseball', 'Hockey', 'Tennis', 'MMA', 'Golf', 'Racing'].includes(t))) ||
      KALSHI_SPORTS_TICKERS.some(prefix => s.ticker.startsWith(prefix))
    );
  } else {
    // Fallback: try known tickers directly
    sportsSeries = KALSHI_SPORTS_TICKERS.map(t => ({ ticker: t, tags: [] }));
  }

  console.log(`[FETCH] Kalshi: ${sportsSeries.length} sports series found`);

  const allMarkets = [];
  // Fetch markets per series (limit to avoid excessive calls)
  for (const series of sportsSeries.slice(0, 40)) {
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
