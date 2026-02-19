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

  // Deduplicate by id
  const seen = new Set();
  const deduped = allMarkets.filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  // Filter to upcoming fixtures only (end date in the future)
  const now = new Date();
  const fixtures = deduped.filter(m => {
    const end = new Date(m.end_date);
    return end > now;
  });

  console.log(`[FETCH] Polymarket: ${fixtures.length} upcoming fixtures (from ${deduped.length} total)`);
  return fixtures;
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
// Kalshi game/fixture series only — excludes futures, awards, season totals
const KALSHI_FIXTURE_TICKERS = [
  'KXNCAAMBGAME', 'KXNCAAWBGAME', // college basketball games
  'KXUEFAGAME', 'KXBRASILEIROGAME', // soccer games
  'KXNHLTOTAL', 'KXNHLGAME', // NHL games
  'KXNBAGAME', 'KXNBAPLAYERGAME', // NBA games
  'KXNFLGAME', 'KXNFLPLAYERGAME', // NFL games
  'KXMLBGAME', // MLB games
  'KXLALIGABTTS', 'KXEPLBTTS', 'KXSOCCERBTTS', // soccer BTTS
  'KXUCL16', 'KXUEL16', // Champions/Europa League fixtures
  'KXUFCFIGHT', // UFC fights
  'KXFIBACHAMPLEAGUEGAME', // FIBA games
];

async function fetchKalshiSportsMarkets() {
  // First discover actual series
  const seriesData = run('kalshi get_series_list');
  let sportsSeries = [];

  if (seriesData?.series) {
    // Only match fixture/game series — look for "Game", "Fight", "BTTS", or known fixture tickers
    sportsSeries = seriesData.series.filter(s => {
      const ticker = s.ticker || '';
      const title = (s.title || '').toLowerCase();
      // Match known fixture tickers
      if (KALSHI_FIXTURE_TICKERS.some(prefix => ticker.startsWith(prefix))) return true;
      // Match series with "game", "fight", "match", "bout" in title
      if (['game', 'fight', 'match', 'bout', 'btts', 'winner?'].some(kw => title.includes(kw))) return true;
      // Match series with "custom" frequency + sports + "game" or team-related words in ticker
      if (s.frequency === 'custom' && s.category === 'Sports' && /GAME|TOTAL|FIGHT|BTTS|ML$/i.test(ticker)) return true;
      return false;
    });
  } else {
    sportsSeries = KALSHI_FIXTURE_TICKERS.map(t => ({ ticker: t, tags: [] }));
  }

  // Cap series and log
  const capped = sportsSeries.slice(0, 50);
  console.log(`[FETCH] Kalshi: ${sportsSeries.length} fixture series found, fetching top ${capped.length}`);

  const allMarkets = [];
  // Fetch in parallel batches of 10
  for (let i = 0; i < capped.length; i += 10) {
    const batch = capped.slice(i, i + 10);
    const results = await Promise.all(batch.map(series => {
      return new Promise(resolve => {
        const data = run(`kalshi get_markets --series_ticker=${series.ticker} --status=open`);
        if (data?.markets?.length) {
          for (const m of data.markets) m._series = series;
          resolve(data.markets);
        } else {
          resolve([]);
        }
      });
    }));
    for (const markets of results) allMarkets.push(...markets);
  }

  // Filter to upcoming fixtures only
  const now = new Date();
  const fixtures = allMarkets.filter(m => {
    const close = new Date(m.expected_expiration_time || m.close_time);
    return close > now;
  });

  console.log(`[FETCH] Kalshi: ${fixtures.length} upcoming fixtures (from ${allMarkets.length} total)`);
  return fixtures;
}

module.exports = { fetchPolymarketMarkets, fetchKalshiSportsMarkets, fetchPolymarketOrderBook };
