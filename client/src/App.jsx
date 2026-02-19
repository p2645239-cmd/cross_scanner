import React, { useState, useEffect, useRef, useCallback } from 'react';

const BG = '#0D1117', SURF = '#161B22', SURF2 = '#0D1117', BORD = '#21262D';
const TEXT = '#C9D1D9', MUTED = '#8B949E', GREEN = '#00D4A0', BLUE = '#4A9DFF', RED = '#FF4D4D', AMBER = '#F5A623';
const MONO = "'JetBrains Mono','Fira Code','SF Mono',monospace";
const SANS = "'Inter',-apple-system,sans-serif";

const SPORT_EMOJIS = { Basketball:'🏀', Football:'🏈', Soccer:'⚽', Baseball:'⚾', Hockey:'🏒', Tennis:'🎾', F1:'🏎️', MMA:'🥊', Esports:'🎮', Golf:'⛳', Other:'🏅' };

function fmt$(v) { return v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v/1e3).toFixed(0)}K` : `$${v.toFixed(0)}`; }
function fmtPrice(p) { return p != null ? (p * 100).toFixed(1) + '¢' : '—'; }
function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso), now = new Date(), diff = d - now;
  if (diff < 0) return 'Live';
  if (diff < 3600000) return `${Math.round(diff/60000)}m`;
  if (diff < 86400000) return `${Math.round(diff/3600000)}h`;
  if (diff < 604800000) return `${Math.round(diff/86400000)}d`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sportFilter, setSportFilter] = useState('All');
  const [showFilter, setShowFilter] = useState('all'); // all, matched, arbs
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(60);
  const [expanded, setExpanded] = useState(null);
  const [orderBook, setOrderBook] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async (force = false) => {
    try {
      const url = force ? '/api/refresh' : '/api/markets';
      const res = await fetch(url);
      if (force) {
        // Refresh returns summary only, re-fetch full data
        const res2 = await fetch('/api/markets');
        const d = await res2.json();
        setData(d);
      } else {
        const d = await res.json();
        setData(d);
      }
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (autoRefresh > 0) {
      intervalRef.current = setInterval(() => fetchData(), autoRefresh * 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, fetchData]);

  const fetchOrderBook = async (tokenId) => {
    try {
      const res = await fetch(`/api/orderbook/polymarket/${tokenId}`);
      const d = await res.json();
      setOrderBook(d);
    } catch { setOrderBook(null); }
  };

  // Filter markets
  const markets = data?.markets || [];
  const filtered = markets.filter(m => {
    if (sportFilter !== 'All' && m.sport !== sportFilter) return false;
    if (showFilter === 'matched' && m.type !== 'matched') return false;
    if (showFilter === 'arbs' && !m.arb) return false;
    if (search) {
      const q = search.toLowerCase();
      const text = `${m.event} ${m.polymarket?.question || ''} ${m.kalshi?.title || ''} ${m.league}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  const sports = ['All', ...new Set(markets.map(m => m.sport))].sort();
  const s = data?.summary;

  return (
    <div style={{ background: BG, minHeight: '100vh', color: TEXT, fontFamily: SANS }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORD}`, padding: '0 24px', background: SURF }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: MONO, fontSize: 13, letterSpacing: 3, color: GREEN, fontWeight: 700 }}>⚡ CROSS SCANNER</span>
            {autoRefresh > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${GREEN}`, animation: 'pulse 2s infinite' }} />
                <span style={{ fontFamily: MONO, fontSize: 9, color: GREEN, letterSpacing: 1 }}>LIVE</span>
              </span>
            )}
            {s && <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>updated {new Date(s.lastRefresh).toLocaleTimeString()} ({s.fetchTimeMs}ms)</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontFamily: MONO, color: MUTED }}>Refresh:</span>
            {[{ label: 'OFF', value: 0 }, { label: '30s', value: 30 }, { label: '60s', value: 60 }].map(o => (
              <button key={o.value} onClick={() => setAutoRefresh(o.value)} style={{
                background: autoRefresh === o.value ? `${GREEN}20` : 'transparent',
                border: `1px solid ${autoRefresh === o.value ? GREEN : BORD}`,
                color: autoRefresh === o.value ? GREEN : MUTED,
                fontFamily: MONO, fontSize: 10, padding: '4px 10px', borderRadius: 3, cursor: 'pointer',
              }}>{o.label}</button>
            ))}
            <button onClick={() => { setLoading(true); fetchData(true); }} style={{
              background: `linear-gradient(135deg, ${GREEN}, ${BLUE})`, color: '#000',
              border: 'none', borderRadius: 4, padding: '6px 16px',
              fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: 1, cursor: 'pointer',
            }}>↻ REFRESH</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1600, margin: '0 auto', padding: 20 }}>
        {/* Summary */}
        {s && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'TOTAL MARKETS', value: s.totalMarkets, color: TEXT },
              { label: 'POLYMARKET', value: s.polymarketCount, color: '#7B61FF' },
              { label: 'KALSHI', value: s.kalshiCount, color: BLUE },
              { label: 'MATCHED', value: s.matchedCount, color: AMBER },
              { label: 'ARBS ≥0.5%', value: s.arbCount, color: s.arbCount > 0 ? GREEN : MUTED },
              { label: 'BEST ARB', value: s.bestArb > 0 ? `${s.bestArb.toFixed(2)}%` : '—', color: s.bestArb >= 2 ? GREEN : s.bestArb > 0 ? AMBER : MUTED },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: SURF, border: `1px solid ${BORD}`, borderRadius: 4, padding: '12px 16px' }}>
                <div style={{ fontSize: 9, fontFamily: MONO, color: MUTED, letterSpacing: 2, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 22, fontFamily: MONO, fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Sport filter */}
          {sports.map(sp => (
            <button key={sp} onClick={() => setSportFilter(sp)} style={{
              background: sportFilter === sp ? `${BLUE}20` : 'transparent',
              border: `1px solid ${sportFilter === sp ? BLUE : BORD}`,
              color: sportFilter === sp ? BLUE : MUTED,
              fontFamily: MONO, fontSize: 10, padding: '5px 12px', borderRadius: 3, cursor: 'pointer',
            }}>{sp === 'All' ? '🌐 All' : `${SPORT_EMOJIS[sp] || '🏅'} ${sp}`}</button>
          ))}
          <div style={{ width: 1, height: 20, background: BORD, margin: '0 4px' }} />
          {/* Show filter */}
          {[{ label: 'All', value: 'all' }, { label: 'Matched', value: 'matched' }, { label: '🔥 Arbs Only', value: 'arbs' }].map(f => (
            <button key={f.value} onClick={() => setShowFilter(f.value)} style={{
              background: showFilter === f.value ? (f.value === 'arbs' ? `${GREEN}20` : `${AMBER}20`) : 'transparent',
              border: `1px solid ${showFilter === f.value ? (f.value === 'arbs' ? GREEN : AMBER) : BORD}`,
              color: showFilter === f.value ? (f.value === 'arbs' ? GREEN : AMBER) : MUTED,
              fontFamily: MONO, fontSize: 10, padding: '5px 12px', borderRadius: 3, cursor: 'pointer',
            }}>{f.label}</button>
          ))}
          <div style={{ flex: 1 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events..."
            style={{ background: SURF, border: `1px solid ${BORD}`, color: TEXT, fontFamily: MONO, fontSize: 11, padding: '6px 12px', borderRadius: 4, width: 250 }} />
          <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>{filtered.length} results</span>
        </div>

        {/* Loading / Error */}
        {loading && !data && <div style={{ textAlign: 'center', padding: 60, color: MUTED, fontFamily: MONO }}>Loading markets...</div>}
        {error && <div style={{ textAlign: 'center', padding: 20, color: RED, fontFamily: MONO, fontSize: 12 }}>Error: {error}</div>}

        {/* Market Table */}
        {filtered.length > 0 && (
          <div style={{ background: SURF, border: `1px solid ${BORD}`, borderRadius: 6, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0A0D14' }}>
                  {['EVENT', 'START', 'TYPE', 'POLYMARKET', 'KALSHI', 'SPREAD', 'ARB', 'VOLUME'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: h === 'EVENT' ? 'left' : 'center', fontFamily: MONO, fontSize: 9, color: MUTED, letterSpacing: 2, borderBottom: `1px solid ${BORD}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => {
                  const isExp = expanded === i;
                  const hasArb = m.arb && m.arb.percentage >= 0.5;
                  const arbColor = hasArb ? (m.arb.percentage >= 2 ? GREEN : AMBER) : 'transparent';
                  return (
                    <React.Fragment key={i}>
                      <tr onClick={() => { setExpanded(isExp ? null : i); setOrderBook(null); }}
                        style={{
                          borderBottom: `1px solid ${BORD}`, cursor: 'pointer',
                          borderLeft: hasArb ? `3px solid ${arbColor}` : '3px solid transparent',
                          background: hasArb ? `${arbColor}08` : 'transparent',
                        }}
                        onMouseEnter={e => { if (!hasArb) e.currentTarget.style.background = '#12161F'; }}
                        onMouseLeave={e => { if (!hasArb) e.currentTarget.style.background = 'transparent'; }}>
                        {/* Event */}
                        <td style={{ padding: '10px 12px', maxWidth: 400 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 16 }}>{SPORT_EMOJIS[m.sport] || '🏅'}</span>
                            <div>
                              <div style={{ fontSize: 9, fontFamily: MONO, color: BLUE, letterSpacing: 1, marginBottom: 2 }}>{m.league}</div>
                              <div style={{ fontSize: 12, color: TEXT, lineHeight: 1.3 }}>{m.event?.slice(0, 80)}{m.event?.length > 80 ? '…' : ''}</div>
                              {m.type !== 'matched' && (
                                <span style={{ fontSize: 8, fontFamily: MONO, color: m.type === 'polymarket_only' ? '#7B61FF' : BLUE, letterSpacing: 1 }}>
                                  {m.type === 'polymarket_only' ? 'POLY ONLY' : 'KALSHI ONLY'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Start */}
                        <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: MONO, fontSize: 11, color: MUTED }}>{fmtTime(m.startTime)}</td>
                        {/* Type */}
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          <span style={{ fontFamily: MONO, fontSize: 9, color: MUTED, background: `${BORD}60`, padding: '2px 6px', borderRadius: 2, letterSpacing: 1 }}>{m.marketType?.toUpperCase()}</span>
                        </td>
                        {/* Polymarket */}
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          {m.polymarket ? (
                            <div style={{ fontFamily: MONO, fontSize: 11 }}>
                              <span style={{ color: GREEN }}>{fmtPrice(m.polymarket.yesPrice)}</span>
                              <span style={{ color: MUTED }}> / </span>
                              <span style={{ color: RED }}>{fmtPrice(m.polymarket.noPrice)}</span>
                            </div>
                          ) : <span style={{ color: BORD }}>—</span>}
                        </td>
                        {/* Kalshi */}
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          {m.kalshi ? (
                            <div style={{ fontFamily: MONO, fontSize: 11 }}>
                              <span style={{ color: GREEN }}>{fmtPrice(m.kalshi.yesBid)}</span>
                              <span style={{ color: MUTED, fontSize: 9 }}>-{fmtPrice(m.kalshi.yesAsk)}</span>
                              <span style={{ color: MUTED }}> / </span>
                              <span style={{ color: RED }}>{fmtPrice(m.kalshi.noBid)}</span>
                              <span style={{ color: MUTED, fontSize: 9 }}>-{fmtPrice(m.kalshi.noAsk)}</span>
                            </div>
                          ) : <span style={{ color: BORD }}>—</span>}
                        </td>
                        {/* Spread */}
                        <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: MONO, fontSize: 11 }}>
                          {m.polymarket && m.kalshi ? (
                            <span style={{ color: Math.abs(m.polymarket.yesPrice - m.kalshi.lastPrice) > 0.03 ? AMBER : MUTED }}>
                              {((m.polymarket.yesPrice - m.kalshi.lastPrice) * 100).toFixed(1)}¢
                            </span>
                          ) : <span style={{ color: BORD }}>—</span>}
                        </td>
                        {/* Arb */}
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          {hasArb ? (
                            <span style={{
                              fontFamily: MONO, fontSize: 11, fontWeight: 700,
                              color: m.arb.percentage >= 2 ? '#000' : arbColor,
                              background: m.arb.percentage >= 2 ? GREEN : `${arbColor}20`,
                              padding: '3px 8px', borderRadius: 3,
                            }}>{m.arb.percentage.toFixed(2)}%</span>
                          ) : <span style={{ color: BORD, fontFamily: MONO, fontSize: 10 }}>—</span>}
                        </td>
                        {/* Volume */}
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          <div style={{ fontFamily: MONO, fontSize: 10 }}>
                            {m.polymarket && <div style={{ color: '#7B61FF' }}>{fmt$(m.polymarket.volume)}</div>}
                            {m.kalshi && <div style={{ color: BLUE }}>{fmt$(m.kalshi.volume)}</div>}
                          </div>
                        </td>
                      </tr>
                      {/* Expanded */}
                      {isExp && (
                        <tr>
                          <td colSpan={8} style={{ padding: 0, background: '#0A0D14' }}>
                            <div style={{ padding: 20 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: m.arb ? '1fr 1fr 1fr' : '1fr 1fr', gap: 16 }}>
                                {/* Polymarket detail */}
                                <div style={{ background: SURF, border: `1px solid ${BORD}`, borderTop: '2px solid #7B61FF', borderRadius: 4, padding: 16 }}>
                                  <div style={{ fontFamily: MONO, fontSize: 10, color: '#7B61FF', letterSpacing: 2, marginBottom: 12 }}>POLYMARKET</div>
                                  {m.polymarket ? (
                                    <>
                                      <div style={{ fontSize: 11, color: TEXT, marginBottom: 12, lineHeight: 1.5 }}>{m.polymarket.question}</div>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                                        <div style={{ background: BG, padding: 8, borderRadius: 3 }}>
                                          <div style={{ fontSize: 9, fontFamily: MONO, color: MUTED, letterSpacing: 1 }}>YES</div>
                                          <div style={{ fontSize: 18, fontFamily: MONO, fontWeight: 700, color: GREEN }}>{fmtPrice(m.polymarket.yesPrice)}</div>
                                        </div>
                                        <div style={{ background: BG, padding: 8, borderRadius: 3 }}>
                                          <div style={{ fontSize: 9, fontFamily: MONO, color: MUTED, letterSpacing: 1 }}>NO</div>
                                          <div style={{ fontSize: 18, fontFamily: MONO, fontWeight: 700, color: RED }}>{fmtPrice(m.polymarket.noPrice)}</div>
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', gap: 12, fontSize: 10, fontFamily: MONO, color: MUTED, marginBottom: 8 }}>
                                        <span>Vol: {fmt$(m.polymarket.volume)}</span>
                                        <span>24h: {fmt$(m.polymarket.volume24h)}</span>
                                        <span>Liq: {fmt$(m.polymarket.liquidity)}</span>
                                      </div>
                                      {m.polymarket.yesTokenId && (
                                        <button onClick={(e) => { e.stopPropagation(); fetchOrderBook(m.polymarket.yesTokenId); }}
                                          style={{ background: '#1C2333', border: `1px solid ${BORD}`, borderRadius: 3, color: '#7B61FF', fontSize: 9, fontFamily: MONO, padding: '4px 10px', cursor: 'pointer', letterSpacing: 1 }}>
                                          📊 ORDER BOOK
                                        </button>
                                      )}
                                      <a href={`https://polymarket.com/event/${m.polymarket.slug}`} target="_blank" rel="noopener noreferrer"
                                        style={{ display: 'inline-block', marginLeft: 8, fontSize: 9, fontFamily: MONO, color: '#7B61FF', textDecoration: 'none' }}>↗ VIEW ON POLY</a>
                                    </>
                                  ) : <div style={{ color: MUTED, fontSize: 11 }}>Not available on Polymarket</div>}
                                </div>

                                {/* Kalshi detail */}
                                <div style={{ background: SURF, border: `1px solid ${BORD}`, borderTop: `2px solid ${BLUE}`, borderRadius: 4, padding: 16 }}>
                                  <div style={{ fontFamily: MONO, fontSize: 10, color: BLUE, letterSpacing: 2, marginBottom: 12 }}>KALSHI</div>
                                  {m.kalshi ? (
                                    <>
                                      <div style={{ fontSize: 11, color: TEXT, marginBottom: 12, lineHeight: 1.5 }}>{m.kalshi.title}</div>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                                        <div style={{ background: BG, padding: 8, borderRadius: 3 }}>
                                          <div style={{ fontSize: 9, fontFamily: MONO, color: MUTED, letterSpacing: 1 }}>YES BID / ASK</div>
                                          <div style={{ fontSize: 16, fontFamily: MONO, fontWeight: 700, color: GREEN }}>
                                            {fmtPrice(m.kalshi.yesBid)} <span style={{ color: MUTED, fontSize: 11 }}>/ {fmtPrice(m.kalshi.yesAsk)}</span>
                                          </div>
                                        </div>
                                        <div style={{ background: BG, padding: 8, borderRadius: 3 }}>
                                          <div style={{ fontSize: 9, fontFamily: MONO, color: MUTED, letterSpacing: 1 }}>NO BID / ASK</div>
                                          <div style={{ fontSize: 16, fontFamily: MONO, fontWeight: 700, color: RED }}>
                                            {fmtPrice(m.kalshi.noBid)} <span style={{ color: MUTED, fontSize: 11 }}>/ {fmtPrice(m.kalshi.noAsk)}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', gap: 12, fontSize: 10, fontFamily: MONO, color: MUTED, marginBottom: 8 }}>
                                        <span>Vol: {fmt$(m.kalshi.volume)}</span>
                                        <span>24h: {fmt$(m.kalshi.volume24h)}</span>
                                        <span>OI: {fmt$(m.kalshi.openInterest)}</span>
                                        <span>Last: {fmtPrice(m.kalshi.lastPrice)}</span>
                                      </div>
                                      <a href={`https://kalshi.com/markets/${m.kalshi.ticker}`} target="_blank" rel="noopener noreferrer"
                                        style={{ fontSize: 9, fontFamily: MONO, color: BLUE, textDecoration: 'none' }}>↗ VIEW ON KALSHI</a>
                                    </>
                                  ) : <div style={{ color: MUTED, fontSize: 11 }}>Not available on Kalshi</div>}
                                </div>

                                {/* Arb detail */}
                                {m.arb && (
                                  <div style={{ background: SURF, border: `1px solid ${BORD}`, borderTop: `2px solid ${GREEN}`, borderRadius: 4, padding: 16 }}>
                                    <div style={{ fontFamily: MONO, fontSize: 10, color: GREEN, letterSpacing: 2, marginBottom: 12 }}>💰 ARBITRAGE</div>
                                    <div style={{ fontSize: 28, fontFamily: MONO, fontWeight: 700, color: GREEN, textShadow: `0 0 20px ${GREEN}40`, marginBottom: 12 }}>
                                      {m.arb.percentage.toFixed(2)}%
                                    </div>
                                    <div style={{ fontSize: 11, color: TEXT, lineHeight: 1.8, marginBottom: 12 }}>
                                      {m.arb.best.description}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                                      <div style={{ background: BG, padding: 8, borderRadius: 3 }}>
                                        <div style={{ fontSize: 9, fontFamily: MONO, color: MUTED, letterSpacing: 1 }}>COST</div>
                                        <div style={{ fontSize: 16, fontFamily: MONO, fontWeight: 700, color: AMBER }}>{fmtPrice(m.arb.best.cost)}</div>
                                      </div>
                                      <div style={{ background: BG, padding: 8, borderRadius: 3 }}>
                                        <div style={{ fontSize: 9, fontFamily: MONO, color: MUTED, letterSpacing: 1 }}>PROFIT</div>
                                        <div style={{ fontSize: 16, fontFamily: MONO, fontWeight: 700, color: GREEN }}>{fmtPrice(m.arb.best.profit)}</div>
                                      </div>
                                    </div>
                                    <div style={{ fontSize: 10, fontFamily: MONO, color: MUTED, marginBottom: 8 }}>
                                      Max size: ~{fmt$(m.arb.maxSize)}
                                    </div>
                                    {m.arb.allStrategies.length > 1 && (
                                      <div style={{ marginTop: 8 }}>
                                        <div style={{ fontSize: 9, fontFamily: MONO, color: MUTED, letterSpacing: 1, marginBottom: 4 }}>ALL STRATEGIES</div>
                                        {m.arb.allStrategies.map((s, j) => (
                                          <div key={j} style={{ fontSize: 10, color: TEXT, padding: '4px 0', borderBottom: `1px solid ${BORD}20` }}>
                                            <span style={{ color: GREEN, fontFamily: MONO }}>{s.percentage.toFixed(2)}%</span> — {s.description}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Order Book */}
                              {orderBook && (
                                <div style={{ marginTop: 16, background: SURF, border: `1px solid ${BORD}`, borderRadius: 4, padding: 16 }}>
                                  <div style={{ fontFamily: MONO, fontSize: 10, color: '#7B61FF', letterSpacing: 2, marginBottom: 12 }}>📊 POLYMARKET ORDER BOOK</div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                      <div style={{ fontSize: 9, fontFamily: MONO, color: GREEN, letterSpacing: 1, marginBottom: 6 }}>BIDS</div>
                                      {(orderBook.bids || []).slice(0, 10).map((b, j) => (
                                        <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontFamily: MONO, fontSize: 10 }}>
                                          <span style={{ color: GREEN }}>{(b.price * 100).toFixed(1)}¢</span>
                                          <span style={{ color: MUTED }}>{fmt$(b.size)}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 9, fontFamily: MONO, color: RED, letterSpacing: 1, marginBottom: 6 }}>ASKS</div>
                                      {(orderBook.asks || []).slice(0, 10).map((a, j) => (
                                        <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontFamily: MONO, fontSize: 10 }}>
                                          <span style={{ color: RED }}>{(a.price * 100).toFixed(1)}¢</span>
                                          <span style={{ color: MUTED }}>{fmt$(a.size)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length === 0 && data && (
          <div style={{ textAlign: 'center', padding: 60, color: MUTED, fontFamily: MONO }}>
            No markets match your filters
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}
