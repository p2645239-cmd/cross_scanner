const express = require('express');
const { fetchPolymarketMarkets, fetchKalshiSportsMarkets, fetchPolymarketOrderBook } = require('../fetcher');
const { matchMarkets, normalizePolymarket, normalizeKalshi, SPORT_EMOJIS } = require('../matcher');
const { calculateArb, findAllArbs } = require('../arbitrage');

const router = express.Router();

// ─── Cache ──────────────────────────────────────────────────────────────
let cache = { data: null, timestamp: 0 };
const CACHE_TTL = 30000; // 30 seconds

async function getMarketData(forceRefresh = false) {
  if (!forceRefresh && cache.data && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  console.log('[API] Fetching fresh market data...');
  const start = Date.now();

  const [polyRaw, kalshiRaw] = await Promise.all([
    fetchPolymarketMarkets(),
    fetchKalshiSportsMarkets(),
  ]);

  const { matched, unmatchedPoly, unmatchedKalshi } = matchMarkets(polyRaw, kalshiRaw);

  // Build unified market list
  const markets = [];

  // Matched markets with arb calculations
  for (const pair of matched) {
    const arb = calculateArb(pair.polymarket, pair.kalshi);
    markets.push({
      type: 'matched',
      sport: pair.polymarket.sport,
      league: pair.polymarket.league || pair.kalshi.league,
      event: pair.polymarket.question,
      startTime: pair.polymarket.endDate || pair.kalshi.expectedExpiration,
      marketType: pair.polymarket.marketType,
      polymarket: {
        id: pair.polymarket.id,
        question: pair.polymarket.question,
        yesPrice: pair.polymarket.yesPrice,
        noPrice: pair.polymarket.noPrice,
        volume: pair.polymarket.volume,
        volume24h: pair.polymarket.volume24h,
        liquidity: pair.polymarket.liquidity,
        slug: pair.polymarket.slug,
        yesTokenId: pair.polymarket.yesTokenId,
        noTokenId: pair.polymarket.noTokenId,
      },
      kalshi: {
        ticker: pair.kalshi.ticker,
        title: pair.kalshi.title,
        yesBid: pair.kalshi.yesBid,
        yesAsk: pair.kalshi.yesAsk,
        noBid: pair.kalshi.noBid,
        noAsk: pair.kalshi.noAsk,
        lastPrice: pair.kalshi.lastPrice,
        volume: pair.kalshi.volume,
        volume24h: pair.kalshi.volume24h,
        openInterest: pair.kalshi.openInterest,
      },
      arb: arb && arb.exists ? arb : null,
    });
  }

  // Unmatched Polymarket
  for (const pm of unmatchedPoly) {
    markets.push({
      type: 'polymarket_only',
      sport: pm.sport,
      league: pm.league,
      event: pm.question,
      startTime: pm.endDate,
      marketType: pm.marketType,
      polymarket: {
        id: pm.id,
        question: pm.question,
        yesPrice: pm.yesPrice,
        noPrice: pm.noPrice,
        volume: pm.volume,
        volume24h: pm.volume24h,
        liquidity: pm.liquidity,
        slug: pm.slug,
        yesTokenId: pm.yesTokenId,
        noTokenId: pm.noTokenId,
      },
      kalshi: null,
      arb: null,
    });
  }

  // Unmatched Kalshi
  for (const km of unmatchedKalshi) {
    markets.push({
      type: 'kalshi_only',
      sport: km.sport,
      league: km.league,
      event: km.title,
      startTime: km.expectedExpiration || km.closeTime,
      marketType: km.marketType,
      polymarket: null,
      kalshi: {
        ticker: km.ticker,
        title: km.title,
        yesBid: km.yesBid,
        yesAsk: km.yesAsk,
        noBid: km.noBid,
        noAsk: km.noAsk,
        lastPrice: km.lastPrice,
        volume: km.volume,
        volume24h: km.volume24h,
        openInterest: km.openInterest,
      },
      arb: null,
    });
  }

  // Sort: sport > league > start time
  markets.sort((a, b) => {
    if (a.sport !== b.sport) return a.sport.localeCompare(b.sport);
    if (a.league !== b.league) return a.league.localeCompare(b.league);
    const ta = new Date(a.startTime || '2099').getTime();
    const tb = new Date(b.startTime || '2099').getTime();
    return ta - tb;
  });

  const arbMarkets = markets.filter(m => m.arb);
  const result = {
    markets,
    summary: {
      totalMarkets: markets.length,
      polymarketCount: polyRaw.length,
      kalshiCount: kalshiRaw.length,
      matchedCount: matched.length,
      arbCount: arbMarkets.length,
      bestArb: arbMarkets.length ? Math.max(...arbMarkets.map(m => m.arb.percentage)) : 0,
      lastRefresh: new Date().toISOString(),
      fetchTimeMs: Date.now() - start,
    },
  };

  cache = { data: result, timestamp: Date.now() };
  console.log(`[API] Done in ${Date.now() - start}ms — ${markets.length} markets, ${matched.length} matched, ${arbMarkets.length} arbs`);
  return result;
}

// ─── Routes ─────────────────────────────────────────────────────────────
router.get('/markets', async (req, res) => {
  try {
    const data = await getMarketData();
    res.json(data);
  } catch (e) {
    console.error('[API] Error:', e);
    res.status(500).json({ error: e.message });
  }
});

router.get('/arbs', async (req, res) => {
  try {
    const data = await getMarketData();
    const minPct = parseFloat(req.query.min) || 0.5;
    const arbs = data.markets.filter(m => m.arb && m.arb.percentage >= minPct);
    res.json({ arbs, count: arbs.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/orderbook/:platform/:id', async (req, res) => {
  try {
    if (req.params.platform === 'polymarket') {
      const book = fetchPolymarketOrderBook(req.params.id);
      res.json(book || { bids: [], asks: [] });
    } else {
      res.status(400).json({ error: 'Order book only available for Polymarket' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/refresh', async (req, res) => {
  try {
    const data = await getMarketData(true);
    res.json({ ok: true, summary: data.summary });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
