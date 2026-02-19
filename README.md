# ⚡ Cross Scanner

Real-time cross-platform arbitrage scanner for prediction markets. Compares live prices across **Polymarket** and **Kalshi** to find mispriced sports events.

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-18%2B-blue)
![Python](https://img.shields.io/badge/python-3.10%2B-blue)

---

## 🎯 What It Does

- Pulls **500+ Polymarket** and **1000+ Kalshi** sports markets in real-time
- **Smart matches** equivalent markets across platforms using team name aliases and fuzzy matching
- **Detects arbitrage** opportunities ≥0.5% with 4 strategy types
- **Auto-refreshes** every 30–60 seconds with live price updates
- Shows **order book depth** from Polymarket for volume analysis

## 📊 Sports Coverage

| Sport | Leagues | Emoji |
|-------|---------|-------|
| Basketball | NBA, WNBA, NCAA | 🏀 |
| Football | NFL, NCAA | 🏈 |
| Soccer | EPL, La Liga, Champions League, MLS, Serie A, Bundesliga, Ligue 1 | ⚽ |
| Baseball | MLB | ⚾ |
| Hockey | NHL | 🏒 |
| Tennis | ATP, WTA | 🎾 |
| MMA | UFC | 🥊 |
| Motorsport | F1, NASCAR | 🏎️ |
| Golf | PGA | ⛳ |
| Esports | Various | 🎮 |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **sports-skills** CLI

### Install

```bash
# Clone the repo
git clone https://github.com/p2645239-cmd/cross_scanner.git
cd cross_scanner

# Install Python data provider (no API keys needed)
pip install sports-skills

# Install Node dependencies
npm run setup

# Build the frontend
npm run build

# Start the server
npm start
```

The dashboard will be available at **http://localhost:3002**

### Development Mode

```bash
npm run dev
```

Runs the Express server with nodemon (auto-restart) and Vite dev server with hot reload on port 3003.

---

## 🏗️ Architecture

```
cross_scanner/
├── server/
│   ├── index.js            # Express server (port 3002)
│   ├── fetcher.js          # sports-skills CLI wrapper — pulls data from both platforms
│   ├── matcher.js          # Market matching engine — pairs equivalent markets
│   ├── arbitrage.js        # Arb calculator — 4 strategy types
│   └── routes/
│       └── api.js          # REST API endpoints with 30s caching
├── client/
│   ├── src/
│   │   ├── App.jsx         # React dashboard (dark theme)
│   │   └── main.jsx        # Entry point
│   ├── index.html
│   └── vite.config.js
└── package.json
```

### Data Flow

```
Polymarket API ──→ sports-skills CLI ──→ fetcher.js ──→ matcher.js ──→ arbitrage.js ──→ REST API ──→ React UI
Kalshi API ──────→ sports-skills CLI ──↗
```

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/markets` | GET | All markets from both platforms, matched where possible, with arb data |
| `/api/arbs?min=0.5` | GET | Only markets with arbitrage opportunities above threshold |
| `/api/orderbook/polymarket/:tokenId` | GET | Polymarket order book (bids/asks with sizes) |
| `/api/refresh` | GET | Force a fresh data pull (bypasses 30s cache) |

### Market Response Format

```json
{
  "markets": [
    {
      "type": "matched",
      "sport": "Basketball",
      "league": "NBA",
      "event": "Will the Oklahoma City Thunder win the 2026 NBA Finals?",
      "startTime": "2026-07-01T00:00:00Z",
      "marketType": "moneyline",
      "polymarket": {
        "yesPrice": 0.355,
        "noPrice": 0.645,
        "volume": 4024255,
        "liquidity": 338462
      },
      "kalshi": {
        "yesBid": 0.40,
        "yesAsk": 0.41,
        "noBid": 0.60,
        "noAsk": 0.61,
        "volume": 1074979,
        "openInterest": 1074979
      },
      "arb": {
        "exists": true,
        "percentage": 1.2,
        "best": {
          "description": "Buy YES on Polymarket @ 0.355 + Buy NO on Kalshi @ 0.60",
          "cost": 0.955,
          "profit": 0.045
        }
      }
    }
  ],
  "summary": {
    "totalMarkets": 1500,
    "matchedCount": 45,
    "arbCount": 3,
    "bestArb": 2.1
  }
}
```

---

## 💰 Arbitrage Strategies

The scanner checks 4 types of cross-platform arbitrage:

| # | Strategy | Condition |
|---|----------|-----------|
| 1 | Buy YES (Poly) + Buy NO (Kalshi) | `yesPrice_poly + noAsk_kalshi < 1.0` |
| 2 | Buy NO (Poly) + Buy YES (Kalshi) | `noPrice_poly + yesAsk_kalshi < 1.0` |
| 3 | Buy YES (Poly) + Sell YES (Kalshi) | `yesBid_kalshi > yesPrice_poly` |
| 4 | Buy NO (Poly) + Sell NO (Kalshi) | `noBid_kalshi > noPrice_poly` |

Arbs over 50% are filtered as likely false matches.

---

## 🔧 Market Matcher

The matcher pairs equivalent markets across platforms using:

1. **Team name aliases** — 80+ teams across NBA, NFL, MLB, NHL, and major soccer leagues with common abbreviations and nicknames
2. **Sport & league detection** — keyword-based classification
3. **Market type matching** — moneyline, spread, total, props, BTTS
4. **Fuzzy text matching** — fallback for markets without recognized team names

### Adding Team Aliases

Edit `TEAM_ALIASES` in `server/matcher.js`:

```js
'team full name': ['abbreviation', 'short name', 'nickname'],
```

---

## ⚠️ Limitations

- **REST polling** — data refreshes every 30-60s. Not fast enough for sharp arbs on major markets, but viable for niche/low-liquidity events.
- **Matcher accuracy** — fuzzy matching can produce false positives. Arbs are capped at 50% to filter obvious mismatches.
- **Read-only** — this tool finds opportunities but does not execute trades. Use separate tooling for order placement.
- **No API keys required** — all data is from public, read-only endpoints via [sports-skills](https://sports-skills.sh).

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/better-matching`)
3. Commit your changes (`git commit -m 'Improve soccer team matching'`)
4. Push to the branch (`git push origin feature/better-matching`)
5. Open a Pull Request

**Priority areas:**
- Expanding team aliases (especially international soccer)
- Improving match accuracy
- Adding more platforms
- WebSocket support for faster updates

---

## 📜 License

MIT

---

## 🙏 Credits

- [sports-skills](https://sports-skills.sh) — Open-source sports data CLI by [machina-sports](https://github.com/machina-sports/sports-skills)
- [Polymarket](https://polymarket.com) — Crypto-native prediction market
- [Kalshi](https://kalshi.com) — CFTC-regulated prediction exchange
