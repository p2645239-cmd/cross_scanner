// Arbitrage calculator

function calculateArb(polymarket, kalshi) {
  if (!polymarket || !kalshi) return null;
  if (polymarket.yesPrice == null || kalshi.yesBid == null) return null;

  const strategies = [];

  // Strategy 1: Buy YES on Polymarket + Buy NO on Kalshi
  // Polymarket YES price = what you pay for YES
  // Kalshi NO ask = what you pay for NO (noAsk)
  if (polymarket.yesPrice > 0 && kalshi.noAsk > 0) {
    const cost1 = polymarket.yesPrice + kalshi.noAsk;
    if (cost1 < 1.0) {
      const profit1 = 1.0 - cost1;
      const pct1 = (profit1 / cost1) * 100;
      strategies.push({
        direction: 'poly_yes_kalshi_no',
        description: `Buy YES on Polymarket @ ${polymarket.yesPrice.toFixed(3)} + Buy NO on Kalshi @ ${kalshi.noAsk.toFixed(3)}`,
        cost: cost1,
        profit: profit1,
        percentage: pct1,
        polyAction: 'BUY YES',
        polyPrice: polymarket.yesPrice,
        kalshiAction: 'BUY NO',
        kalshiPrice: kalshi.noAsk,
      });
    }
  }

  // Strategy 2: Buy NO on Polymarket + Buy YES on Kalshi
  if (polymarket.noPrice > 0 && kalshi.yesAsk > 0) {
    const cost2 = polymarket.noPrice + kalshi.yesAsk;
    if (cost2 < 1.0) {
      const profit2 = 1.0 - cost2;
      const pct2 = (profit2 / cost2) * 100;
      strategies.push({
        direction: 'poly_no_kalshi_yes',
        description: `Buy NO on Polymarket @ ${polymarket.noPrice.toFixed(3)} + Buy YES on Kalshi @ ${kalshi.yesAsk.toFixed(3)}`,
        cost: cost2,
        profit: profit2,
        percentage: pct2,
        polyAction: 'BUY NO',
        polyPrice: polymarket.noPrice,
        kalshiAction: 'BUY YES',
        kalshiPrice: kalshi.yesAsk,
      });
    }
  }

  // Strategy 3: Use Kalshi bid prices (selling)
  // Buy YES on Polymarket + Sell YES on Kalshi (= buy at poly price, sell at kalshi bid)
  if (polymarket.yesPrice > 0 && kalshi.yesBid > 0 && kalshi.yesBid > polymarket.yesPrice) {
    const profit3 = kalshi.yesBid - polymarket.yesPrice;
    const pct3 = (profit3 / polymarket.yesPrice) * 100;
    strategies.push({
      direction: 'cross_yes',
      description: `Buy YES on Polymarket @ ${polymarket.yesPrice.toFixed(3)} + Sell YES on Kalshi @ ${kalshi.yesBid.toFixed(3)}`,
      cost: polymarket.yesPrice,
      profit: profit3,
      percentage: pct3,
      polyAction: 'BUY YES',
      polyPrice: polymarket.yesPrice,
      kalshiAction: 'SELL YES',
      kalshiPrice: kalshi.yesBid,
    });
  }

  // Strategy 4: Buy NO on Polymarket + Sell NO on Kalshi
  if (polymarket.noPrice > 0 && kalshi.noBid > 0 && kalshi.noBid > polymarket.noPrice) {
    const profit4 = kalshi.noBid - polymarket.noPrice;
    const pct4 = (profit4 / polymarket.noPrice) * 100;
    strategies.push({
      direction: 'cross_no',
      description: `Buy NO on Polymarket @ ${polymarket.noPrice.toFixed(3)} + Sell NO on Kalshi @ ${kalshi.noBid.toFixed(3)}`,
      cost: polymarket.noPrice,
      profit: profit4,
      percentage: pct4,
      polyAction: 'BUY NO',
      polyPrice: polymarket.noPrice,
      kalshiAction: 'SELL NO',
      kalshiPrice: kalshi.noBid,
    });
  }

  if (!strategies.length) return null;

  // Return best strategy
  const best = strategies.sort((a, b) => b.percentage - a.percentage)[0];
  return {
    exists: best.percentage >= 0.5,
    percentage: Math.round(best.percentage * 100) / 100,
    best,
    allStrategies: strategies.filter(s => s.percentage >= 0.5),
    maxSize: Math.min(polymarket.liquidity || 0, kalshi.openInterest || 0),
  };
}

function findAllArbs(matched, minPct = 0.5) {
  const arbs = [];
  for (const pair of matched) {
    const arb = calculateArb(pair.polymarket, pair.kalshi);
    if (arb && arb.exists && arb.percentage >= minPct) {
      arbs.push({ ...pair, arb });
    }
  }
  return arbs.sort((a, b) => b.arb.percentage - a.arb.percentage);
}

module.exports = { calculateArb, findAllArbs };
