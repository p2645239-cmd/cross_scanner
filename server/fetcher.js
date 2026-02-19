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
const https = require('https');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function fetchPolymarketMarkets() {
  const allMarkets = [];
  const GAMMA = 'https://gamma-api.polymarket.com/markets';
  const types = ['moneyline', 'spreads', 'totals', 'both_teams_to_score', 'first_half_moneyline', 'first_half_spreads', 'first_half_totals'];

  // Fetch fixture markets by type, sorted by end date (upcoming first)
  for (const type of types) {
    try {
      const url = `${GAMMA}?limit=100&active=true&closed=false&sports_market_types=${type}&order=endDate&ascending=false`;
      const markets = await httpGet(url);
      if (Array.isArray(markets)) {
        // Normalize gamma API format to match sports-skills format
        for (const m of markets) {
          allMarkets.push({
            id: m.id,
            question: m.question,
            description: m.description || '',
            slug: m.slug,
            status: 'active',
            outcomes: parseOutcomes(m),
            volume: parseFloat(m.volume) || 0,
            volume_24h: parseFloat(m.volume24hr) || 0,
            liquidity: parseFloat(m.liquidity) || 0,
            start_date: m.startDate,
            end_date: m.endDate,
            sports_market_type: m.sportsMarketType || type,
            game_id: m.events?.[0]?.gameId || '',
            clob_token_ids: parseJsonField(m.clobTokenIds),
            tags: [],
          });
        }
      }
    } catch (e) {
      console.error(`[FETCH] Polymarket ${type} failed:`, e.message);
    }
  }

  // Also fetch via sports-skills for any we might have missed (futures, props)
  const data = run('polymarket get_sports_markets --limit=100');
  if (data?.markets) {
    const existingIds = new Set(allMarkets.map(m => m.id));
    for (const m of data.markets) {
      if (!existingIds.has(m.id)) allMarkets.push(m);
    }
  }

  // Deduplicate by id
  const seen = new Set();
  const deduped = allMarkets.filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  console.log(`[FETCH] Polymarket: ${deduped.length} markets (${types.length} fixture types + fallback)`);
  return deduped;
}

function parseOutcomes(m) {
  try {
    const names = JSON.parse(m.outcomes || '[]');
    const prices = JSON.parse(m.outcomePrices || '[]');
    const tokenIds = parseJsonField(m.clobTokenIds);
    return names.map((name, i) => ({
      name,
      price: parseFloat(prices[i]) || 0,
      clob_token_id: tokenIds[i] || '',
    }));
  } catch { return []; }
}

function parseJsonField(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
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
