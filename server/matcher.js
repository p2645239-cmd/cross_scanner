// Market matcher — pairs equivalent markets across Polymarket and Kalshi

// ─── Team Aliases ───────────────────────────────────────────────────────
const TEAM_ALIASES = {
  // NBA
  'oklahoma city thunder': ['okc', 'oklahoma city', 'thunder'],
  'golden state warriors': ['gsw', 'golden state', 'warriors'],
  'los angeles lakers': ['lal', 'la lakers', 'lakers'],
  'los angeles clippers': ['lac', 'la clippers', 'clippers'],
  'boston celtics': ['bos', 'boston', 'celtics'],
  'milwaukee bucks': ['mil', 'milwaukee', 'bucks'],
  'denver nuggets': ['den', 'denver', 'nuggets'],
  'phoenix suns': ['phx', 'phoenix', 'suns'],
  'philadelphia 76ers': ['phi', 'philadelphia', '76ers', 'sixers'],
  'new york knicks': ['nyk', 'new york', 'knicks', 'ny knicks'],
  'miami heat': ['mia', 'miami', 'heat'],
  'dallas mavericks': ['dal', 'dallas', 'mavericks', 'mavs'],
  'cleveland cavaliers': ['cle', 'cleveland', 'cavaliers', 'cavs'],
  'minnesota timberwolves': ['min', 'minnesota', 'timberwolves', 'wolves'],
  'sacramento kings': ['sac', 'sacramento', 'kings'],
  'indiana pacers': ['ind', 'indiana', 'pacers'],
  'new orleans pelicans': ['nop', 'new orleans', 'pelicans'],
  'chicago bulls': ['chi', 'chicago', 'bulls'],
  'atlanta hawks': ['atl', 'atlanta', 'hawks'],
  'toronto raptors': ['tor', 'toronto', 'raptors'],
  'brooklyn nets': ['bkn', 'brooklyn', 'nets'],
  'houston rockets': ['hou', 'houston', 'rockets'],
  'memphis grizzlies': ['mem', 'memphis', 'grizzlies'],
  'san antonio spurs': ['sas', 'san antonio', 'spurs'],
  'portland trail blazers': ['por', 'portland', 'blazers', 'trail blazers'],
  'utah jazz': ['uta', 'utah', 'jazz'],
  'orlando magic': ['orl', 'orlando', 'magic'],
  'charlotte hornets': ['cha', 'charlotte', 'hornets'],
  'detroit pistons': ['det', 'detroit', 'pistons'],
  'washington wizards': ['was', 'washington', 'wizards'],
  // NFL
  'kansas city chiefs': ['kc', 'kansas city', 'chiefs'],
  'san francisco 49ers': ['sf', 'san francisco', '49ers', 'niners'],
  'philadelphia eagles': ['phi', 'philadelphia', 'eagles'],
  'buffalo bills': ['buf', 'buffalo', 'bills'],
  'dallas cowboys': ['dal', 'dallas', 'cowboys'],
  'detroit lions': ['det', 'detroit', 'lions'],
  'baltimore ravens': ['bal', 'baltimore', 'ravens'],
  'miami dolphins': ['mia', 'miami', 'dolphins'],
  'green bay packers': ['gb', 'green bay', 'packers'],
  'pittsburgh steelers': ['pit', 'pittsburgh', 'steelers'],
  'new york giants': ['nyg', 'ny giants', 'giants'],
  'new york jets': ['nyj', 'ny jets', 'jets'],
  'los angeles rams': ['lar', 'la rams', 'rams'],
  'los angeles chargers': ['lac', 'la chargers', 'chargers'],
  // MLB
  'new york yankees': ['nyy', 'ny yankees', 'yankees'],
  'new york mets': ['nym', 'ny mets', 'mets'],
  'los angeles dodgers': ['lad', 'la dodgers', 'dodgers'],
  'boston red sox': ['bos', 'boston', 'red sox'],
  'chicago cubs': ['chc', 'chicago', 'cubs'],
  'chicago white sox': ['chw', 'chicago', 'white sox'],
  'houston astros': ['hou', 'houston', 'astros'],
  'atlanta braves': ['atl', 'atlanta', 'braves'],
  // NHL
  'toronto maple leafs': ['tor', 'toronto', 'maple leafs', 'leafs'],
  'montreal canadiens': ['mtl', 'montreal', 'canadiens', 'habs'],
  'boston bruins': ['bos', 'boston', 'bruins'],
  'new york rangers': ['nyr', 'ny rangers', 'rangers'],
  'new york islanders': ['nyi', 'ny islanders', 'islanders'],
  // Soccer
  'manchester united': ['man utd', 'man united', 'mufc', 'united'],
  'manchester city': ['man city', 'mcfc', 'city'],
  'liverpool': ['liverpool fc', 'lfc'],
  'arsenal': ['arsenal fc', 'afc'],
  'chelsea': ['chelsea fc', 'cfc'],
  'tottenham hotspur': ['tottenham', 'spurs', 'thfc'],
  'real madrid': ['real', 'rmcf'],
  'barcelona': ['barca', 'fcb', 'fc barcelona'],
  'bayern munich': ['bayern', 'fc bayern', 'bayern munchen'],
  'paris saint-germain': ['psg', 'paris sg'],
  'juventus': ['juve', 'juventus fc'],
  'inter milan': ['inter', 'internazionale'],
  'ac milan': ['milan', 'acm'],
};

// Build reverse lookup: alias -> canonical name
const ALIAS_MAP = {};
for (const [canonical, aliases] of Object.entries(TEAM_ALIASES)) {
  ALIAS_MAP[canonical] = canonical;
  for (const alias of aliases) {
    ALIAS_MAP[alias.toLowerCase()] = canonical;
  }
}

function normalizeTeamName(name) {
  const lower = name.toLowerCase().trim();
  if (ALIAS_MAP[lower]) return ALIAS_MAP[lower];
  // Try partial match
  for (const [alias, canonical] of Object.entries(ALIAS_MAP)) {
    if (lower.includes(alias) || alias.includes(lower)) return canonical;
  }
  return lower;
}

// ─── Sport Detection ────────────────────────────────────────────────────
const SPORT_KEYWORDS = {
  'Basketball': ['nba', 'basketball', 'wnba', 'ncaa basketball', 'cbb'],
  'Football': ['nfl', 'football', 'super bowl', 'ncaa football'],
  'Soccer': ['soccer', 'football', 'premier league', 'epl', 'la liga', 'champions league', 'mls', 'serie a', 'bundesliga', 'ligue 1', 'copa', 'uefa'],
  'Baseball': ['mlb', 'baseball', 'world series'],
  'Hockey': ['nhl', 'hockey', 'stanley cup'],
  'Tennis': ['tennis', 'atp', 'wta', 'grand slam', 'wimbledon', 'us open tennis', 'french open', 'australian open'],
  'F1': ['formula 1', 'f1', 'grand prix'],
  'MMA': ['ufc', 'mma', 'bellator'],
  'Esports': ['esports', 'starcraft', 'league of legends', 'dota', 'csgo', 'cs2', 'valorant'],
  'Golf': ['golf', 'pga', 'masters', 'open championship'],
};

const SPORT_EMOJIS = {
  'Basketball': '🏀', 'Football': '🏈', 'Soccer': '⚽', 'Baseball': '⚾',
  'Hockey': '🏒', 'Tennis': '🎾', 'F1': '🏎️', 'MMA': '🥊',
  'Esports': '🎮', 'Golf': '⛳', 'Other': '🏅',
};

function detectSport(text, tags) {
  const combined = `${text} ${(tags || []).join(' ')}`.toLowerCase();
  for (const [sport, keywords] of Object.entries(SPORT_KEYWORDS)) {
    if (keywords.some(kw => combined.includes(kw))) return sport;
  }
  return 'Other';
}

function detectLeague(text, tags, sport) {
  const combined = `${text} ${(tags || []).join(' ')}`.toLowerCase();
  const leagues = {
    'NBA': ['nba', 'pro basketball'],
    'WNBA': ['wnba'],
    'NFL': ['nfl', 'pro football'],
    'MLB': ['mlb', 'pro baseball'],
    'NHL': ['nhl', 'pro hockey'],
    'EPL': ['premier league', 'epl'],
    'La Liga': ['la liga', 'laliga'],
    'Champions League': ['champions league', 'ucl'],
    'MLS': ['mls', 'major league soccer'],
    'Serie A': ['serie a'],
    'Bundesliga': ['bundesliga'],
    'Ligue 1': ['ligue 1'],
    'ATP': ['atp'],
    'WTA': ['wta'],
    'UFC': ['ufc'],
    'PGA': ['pga'],
    'F1': ['formula 1', 'f1'],
    'NCAA': ['ncaa', 'college', 'march madness'],
  };
  for (const [league, kws] of Object.entries(leagues)) {
    if (kws.some(kw => combined.includes(kw))) return league;
  }
  return sport || 'Other';
}

// ─── Market Type Detection ──────────────────────────────────────────────
function detectMarketType(text) {
  const lower = text.toLowerCase();
  if (lower.includes('spread')) return 'spread';
  if (lower.includes('total') || lower.includes('over') || lower.includes('under')) return 'total';
  if (lower.includes('btts') || lower.includes('both teams')) return 'btts';
  if (lower.includes('prop') || lower.includes('points') || lower.includes('rebounds') || lower.includes('assists')) return 'prop';
  return 'moneyline';
}

// ─── Extract Teams from Question ────────────────────────────────────────
function extractTeams(text) {
  const lower = text.toLowerCase();
  const teams = [];
  for (const [canonical, aliases] of Object.entries(TEAM_ALIASES)) {
    if (lower.includes(canonical) || aliases.some(a => lower.includes(a.toLowerCase()))) {
      teams.push(canonical);
    }
  }
  return [...new Set(teams)];
}

// ─── Normalize Polymarket Market ────────────────────────────────────────
function normalizePolymarket(m) {
  const yesPrice = m.outcomes?.[0]?.price ?? null;
  const noPrice = m.outcomes?.[1]?.price ?? null;
  const sport = detectSport(m.question + ' ' + (m.description || ''), m.tags);
  const league = detectLeague(m.question + ' ' + (m.description || ''), m.tags, sport);
  const teams = extractTeams(m.question + ' ' + (m.description || ''));
  return {
    platform: 'polymarket',
    id: m.id,
    question: m.question,
    description: m.description,
    slug: m.slug,
    yesPrice,
    noPrice,
    volume: m.volume || 0,
    volume24h: m.volume_24h || 0,
    liquidity: m.liquidity || 0,
    startDate: m.start_date,
    endDate: m.end_date,
    sport, league, teams,
    marketType: detectMarketType(m.question),
    tokenIds: m.clob_token_ids || [],
    yesTokenId: m.outcomes?.[0]?.clob_token_id,
    noTokenId: m.outcomes?.[1]?.clob_token_id,
  };
}

// ─── Normalize Kalshi Market ────────────────────────────────────────────
function normalizeKalshi(m) {
  const yesBid = m.yes_bid_dollars ? parseFloat(m.yes_bid_dollars) : (m.yes_bid || 0) / 100;
  const yesAsk = m.yes_ask_dollars ? parseFloat(m.yes_ask_dollars) : (m.yes_ask || 0) / 100;
  const noBid = m.no_bid_dollars ? parseFloat(m.no_bid_dollars) : (m.no_bid || 0) / 100;
  const noAsk = m.no_ask_dollars ? parseFloat(m.no_ask_dollars) : (m.no_ask || 0) / 100;
  const tags = m._series?.tags || [];
  const text = `${m.title} ${m.subtitle || ''} ${m._series?.title || ''}`;
  const sport = detectSport(text, tags);
  const league = detectLeague(text, tags, sport);
  const teams = extractTeams(text);
  return {
    platform: 'kalshi',
    ticker: m.ticker,
    title: m.title,
    subtitle: m.subtitle,
    yesBid, yesAsk, noBid, noAsk,
    lastPrice: m.last_price_dollars ? parseFloat(m.last_price_dollars) : (m.last_price || 0) / 100,
    volume: m.volume || 0,
    volume24h: m.volume_24h || 0,
    openInterest: m.open_interest || 0,
    closeTime: m.close_time,
    expectedExpiration: m.expected_expiration_time,
    sport, league, teams,
    marketType: detectMarketType(m.title),
    seriesTicker: m._series?.ticker,
    seriesTitle: m._series?.title,
    tags,
  };
}

// ─── Match Markets ──────────────────────────────────────────────────────
function matchMarkets(polymarkets, kalshiMarkets) {
  const normPoly = polymarkets.map(normalizePolymarket);
  const normKalshi = kalshiMarkets.map(normalizeKalshi);
  const matched = [];
  const unmatchedPoly = [];
  const usedKalshi = new Set();

  for (const pm of normPoly) {
    let bestMatch = null;
    let bestScore = 0;

    for (let i = 0; i < normKalshi.length; i++) {
      if (usedKalshi.has(i)) continue;
      const km = normKalshi[i];

      // Must be same sport
      if (pm.sport !== km.sport && pm.sport !== 'Other' && km.sport !== 'Other') continue;
      // Must be same market type
      if (pm.marketType !== km.marketType) continue;

      // Team overlap
      const pmTeams = pm.teams.map(normalizeTeamName);
      const kmTeams = km.teams.map(normalizeTeamName);
      const overlap = pmTeams.filter(t => kmTeams.includes(t)).length;
      // Require at least 1 team match, prefer 2 for strong match
      if (overlap < 1) continue;

      // Date proximity check — fixtures should be within 3 days of each other
      const pmEnd = new Date(pm.endDate || '2099');
      const kmEnd = new Date(km.closeTime || km.expectedExpiration || '2099');
      const daysDiff = Math.abs(pmEnd - kmEnd) / 86400000;
      if (daysDiff > 3) continue;

      const score = overlap * 10 + (pm.league === km.league ? 5 : 0) + (daysDiff < 1 ? 3 : 0);
      if (score > bestScore && score >= 10) {
        bestScore = score;
        bestMatch = { index: i, market: km };
      }
    }

    if (bestMatch) {
      usedKalshi.add(bestMatch.index);
      matched.push({ polymarket: pm, kalshi: bestMatch.market });
    } else {
      unmatchedPoly.push(pm);
    }
  }

  const unmatchedKalshi = normKalshi.filter((_, i) => !usedKalshi.has(i));
  return { matched, unmatchedPoly, unmatchedKalshi };
}

module.exports = { matchMarkets, normalizePolymarket, normalizeKalshi, SPORT_EMOJIS, detectSport, detectLeague };
