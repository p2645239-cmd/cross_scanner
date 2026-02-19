import React, { useState, useEffect, useRef, useCallback } from 'react';

const BG = '#0D1117';
const SURF = '#161B22';
const BORD = '#21262D';
const TEXT = '#C9D1D9';
const MUTED = '#8B949E';
const GREEN = '#3FB950';
const GREEN_BG = 'rgba(63,185,80,0.08)';
const GREEN_BG2 = 'rgba(63,185,80,0.15)';
const RED = '#F85149';
const BLUE = '#58A6FF';
const MONO = "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace";
const SANS = "'Inter', -apple-system, sans-serif";

const SPORT_EMOJI = {
  Basketball: '🏀', Football: '🏈', Soccer: '⚽', Baseball: '⚾',
  Hockey: '🏒', Tennis: '🎾', F1: '🏎️', Esports: '🎮', Other: '📊'
};

const SPORTS = ['All', 'Basketball', 'Football', 'Soccer', 'Baseball', 'Hockey', 'Tennis', 'Other'];
const INTERVALS = [{ label: '30s', ms: 30000 }, { label: '60s', ms: 60000 }, { label: 'Off', ms: 0 }];

function relativeTime(dateStr) {
  if (!dateStr) return '—';
  const diff = new Date(dateStr) - new Date();
  if (diff < 0) return 'Live';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function price(v, digits = 1) {
  if (v == null) return '—';
  return `${(v * 100).toFixed(digits)}¢`;
}

function SummaryBar({ summary }) {
  if (!summary) return null;
  const items = [
    { label: 'Total Markets', value: summary.totalMarkets },
    { label: 'Matched', value: summary.matchedMarkets },
    { label: 'Arb Opportunities', value: summary.arbCount, color: summary.arbCount > 0 ? GREEN : TEXT },
    { label: 'Best Arb', value: summary.bestArb > 0 ? `${summary.bestArb}%` : 'None', color: summary.bestArb > 0 ? GREEN : MUTED },
  ];
  return (
    <div style={{ display: 'flex', gap: 24, padding: '12px 20px', background: SURF, borderBottom: `1px solid ${BORD}`, flexWrap: 'wrap' }}>
      {items.map(i => (
        <div key={i.label} style={{ fontFamily: MONO }}>
          <span style={{ color: MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{i.label}</span>
          <div style={{ color: i.color || TEXT, fontSize: 20, fontWeight: 600 }}>{i.value}</div>
        </div>
      ))}
    </div>
  );
}

function MarketRow({ market, expanded, onToggle }) {
  const hasArb = market.arb?.exists;
  const arbPct = market.arb?.percentage || 0;
  const borderColor = arbPct >= 2 ? GREEN : arbPct >= 0.5 ? 'rgba(63,185,80,0.6)' : 'transparent';
  const rowBg = arbPct >= 2 ? GREEN_BG2 : hasArb ? GREEN_BG : 'transparent';

  const pm = market.polymarket;
  const km = market.kalshi;

  return (
    <>
      <tr onClick={onToggle} style={{ cursor: 'pointer', background: rowBg, borderLeft: `3px solid ${borderColor}` }}>
        <td style={td}>
          <span style={{ marginRight: 6 }}>{SPORT_EMOJI[market.sport] || '📊'}</span>
          <span style={{ background: BORD, padding: '2px 6px', borderRadius: 3, fontSize: 10, color: MUTED, marginRight: 8, fontFamily: MONO }}>{market.league}</span>
          <span style={{ color: TEXT, fontSize: 13 }}>{market.event?.slice(0, 60)}{market.event?.length > 60 ? '…' : ''}</span>
        </td>
        <td style={{ ...td, fontFamily: MONO, color: MUTED, fontSize: 12 }}>{relativeTime(market.startTime)}</td>
        <td style={{ ...td, fontSize: 11, color: MUTED }}>{market.marketType}</td>
        <td style={{ ...td, fontFamily: MONO, fontSize: 13 }}>
          {pm ? <><span style={{ color: GREEN }}>{price(pm.yesPrice)}</span> / <span style={{ color: RED }}>{price(pm.noPrice)}</span></> : <span style={{ color: MUTED }}>—</span>}
        </td>
        <td style={{ ...td, fontFamily: MONO, fontSize: 13 }}>
          {km ? <><span style={{ color: GREEN }}>{price(km.yesBid)}-{price(km.yesAsk)}</span> / <span style={{ color: RED }}>{price(km.noBid)}-{price(km.noAsk)}</span></> : <span style={{ color: MUTED }}>—</span>}
        </td>
        <td style={{ ...td, fontFamily: MONO, fontSize: 13, color: MUTED }}>{market.spread != null ? `${(market.spread * 100).toFixed(1)}¢` : '—'}</td>
        <td style={td}>
          {hasArb ? (
            <span style={{ background: GREEN, color: BG, padding: '2px 8px', borderRadius: 3, fontFamily: MONO, fontSize: 12, fontWeight: 700 }}>
              ARB {arbPct}%
            </span>
          ) : <span style={{ color: MUTED }}>—</span>}
        </td>
        <td style={{ ...td, fontFamily: MONO, fontSize: 11, color: MUTED }}>
          {formatVol(pm?.volume, km?.volume)}
        </td>
      </tr>
      {expanded && (
        <tr><td colSpan={8} style={{ padding: '12px 20px', background: SURF, borderBottom: `1px solid ${BORD}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ color: BLUE, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>POLYMARKET</div>
              {pm ? (
                <div style={{ fontFamily: MONO, fontSize: 12, color: TEXT }}>
                  <div>{pm.question}</div>
                  <div>Yes: {price(pm.yesPrice)} | No: {price(pm.noPrice)}</div>
                  <div style={{ color: MUTED }}>Vol: ${(pm.volume || 0).toLocaleString()} | Liq: ${(pm.liquidity || 0).toLocaleString()}</div>
                </div>
              ) : <span style={{ color: MUTED }}>Not available</span>}
            </div>
            <div>
              <div style={{ color: BLUE, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>KALSHI</div>
              {km ? (
                <div style={{ fontFamily: MONO, fontSize: 12, color: TEXT }}>
                  <div>{km.title} ({km.ticker})</div>
                  <div>Yes: {price(km.yesBid)}-{price(km.yesAsk)} | No: {price(km.noBid)}-{price(km.noAsk)}</div>
                  <div style={{ color: MUTED }}>Vol: {(km.volume || 0).toLocaleString()} | OI: {(km.openInterest || 0).toLocaleString()}</div>
                </div>
              ) : <span style={{ color: MUTED }}>Not available</span>}
            </div>
          </div>
          {hasArb && (
            <div style={{ marginTop: 12, padding: 12, background: GREEN_BG2, borderRadius: 6, border: `1px solid ${GREEN}` }}>
              <div style={{ color: GREEN, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>⚡ ARBITRAGE OPPORTUNITY — {arbPct}%</div>
              <div style={{ fontFamily: MONO, fontSize: 12, color: TEXT }}>{market.arb.strategy}</div>
              <div style={{ fontFamily: MONO, fontSize: 12, color: MUTED, marginTop: 2 }}>{market.arb.profit}</div>
            </div>
          )}
        </td></tr>
      )}
    </>
  );
}

function formatVol(pmVol, kmVol) {
  const total = (pmVol || 0) + (kmVol || 0);
  if (total >= 1e6) return `$${(total / 1e6).toFixed(1)}M`;
  if (total >= 1e3) return `$${(total / 1e3).toFixed(0)}K`;
  if (total > 0) return `$${total}`;
  return '—';
}

const td = { padding: '8px 12px', borderBottom: `1px solid ${BORD}`, verticalAlign: 'middle', whiteSpace: 'nowrap' };
const th = { ...td, color: MUTED, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, fontFamily: MONO };

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sport, setSport] = useState('All');
  const [search, setSearch] = useState('');
  const [interval, setInterval_] = useState(1); // index into INTERVALS
  const [expanded, setExpanded] = useState(null);
  const timerRef = useRef(null);

  const fetchData = useCallback(async (refresh = false) => {
    try {
      const url = refresh ? '/api/refresh' : '/api/markets';
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const ms = INTERVALS[interval].ms;
    if (ms > 0) {
      timerRef.current = setInterval(() => fetchData(), ms);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [interval, fetchData]);

  const filtered = (data?.markets || []).filter(m => {
    if (sport !== 'All' && m.sport !== sport) return false;
    if (search && !(m.event || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const isLive = INTERVALS[interval].ms > 0;

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: SANS }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${BORD}`, background: SURF }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontFamily: MONO, fontWeight: 700, letterSpacing: 2 }}>⚡ CROSS SCANNER</h1>
          {isLive && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: GREEN, fontFamily: MONO }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, animation: 'pulse 2s infinite' }} />
              LIVE
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: MUTED, fontFamily: MONO }}>
            {data?.summary?.lastRefresh ? `Updated ${new Date(data.summary.lastRefresh).toLocaleTimeString()}` : ''}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {INTERVALS.map((iv, i) => (
              <button key={iv.label} onClick={() => setInterval_(i)}
                style={{ padding: '4px 10px', fontSize: 11, fontFamily: MONO, cursor: 'pointer', border: `1px solid ${BORD}`,
                  borderRadius: 4, background: i === interval ? BLUE : SURF, color: i === interval ? BG : TEXT }}>
                {iv.label}
              </button>
            ))}
          </div>
          <button onClick={() => { setLoading(true); fetchData(true); }}
            style={{ padding: '4px 12px', fontSize: 11, fontFamily: MONO, cursor: 'pointer', border: `1px solid ${BORD}`,
              borderRadius: 4, background: SURF, color: TEXT }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      <SummaryBar summary={data?.summary} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderBottom: `1px solid ${BORD}`, alignItems: 'center', flexWrap: 'wrap' }}>
        {SPORTS.map(s => (
          <button key={s} onClick={() => setSport(s)}
            style={{ padding: '4px 12px', fontSize: 12, fontFamily: SANS, cursor: 'pointer', border: `1px solid ${BORD}`,
              borderRadius: 16, background: s === sport ? BLUE : 'transparent', color: s === sport ? BG : MUTED }}>
            {s !== 'All' ? `${SPORT_EMOJI[s] || ''} ` : ''}{s}
          </button>
        ))}
        <input placeholder="Search markets..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: 12, fontFamily: MONO, background: SURF, border: `1px solid ${BORD}`,
            borderRadius: 4, color: TEXT, outline: 'none', width: 200 }} />
      </div>

      {/* Table */}
      {loading && !data ? (
        <div style={{ padding: 40, textAlign: 'center', color: MUTED, fontFamily: MONO }}>Loading markets...</div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: 'center', color: RED, fontFamily: MONO }}>Error: {error}</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: SURF }}>
                <th style={th}>Event</th>
                <th style={th}>Start</th>
                <th style={th}>Type</th>
                <th style={th}>Polymarket (Y/N)</th>
                <th style={th}>Kalshi (Bid-Ask)</th>
                <th style={th}>Spread</th>
                <th style={th}>Arb %</th>
                <th style={th}>Volume</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: MUTED, padding: 40 }}>No markets found</td></tr>
              ) : filtered.map((m, i) => (
                <MarketRow key={m.kalshi?.ticker || m.polymarket?.id || i} market={m}
                  expanded={expanded === i} onToggle={() => setExpanded(expanded === i ? null : i)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        tr:hover { background: rgba(255,255,255,0.02) !important; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: ${BG}; }
        ::-webkit-scrollbar-thumb { background: ${BORD}; border-radius: 4px; }
      `}</style>
    </div>
  );
}
