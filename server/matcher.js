// Market matcher — pairs equivalent fixtures across Polymarket and Kalshi
// Strategy: extract both teams + date, require exact date + both teams match

// ─── Comprehensive Team Name Map ─────────────────────────────────────
// Maps all known variations to a single canonical key
const TEAM_MAP = {};

function addTeam(canonical, ...aliases) {
  const key = canonical.toLowerCase();
  TEAM_MAP[key] = key;
  for (const alias of aliases) {
    TEAM_MAP[alias.toLowerCase()] = key;
  }
}

// NBA — city names, nicknames, abbreviations
addTeam('oklahoma city thunder', 'okc', 'oklahoma city', 'thunder');
addTeam('golden state warriors', 'gsw', 'golden state', 'warriors');
addTeam('los angeles lakers', 'lal', 'la lakers', 'lakers', 'los angeles l');
addTeam('los angeles clippers', 'lac', 'la clippers', 'clippers', 'los angeles c');
addTeam('boston celtics', 'bos', 'boston', 'celtics');
addTeam('milwaukee bucks', 'mil', 'milwaukee', 'bucks');
addTeam('denver nuggets', 'den', 'denver', 'nuggets');
addTeam('phoenix suns', 'phx', 'phoenix', 'suns');
addTeam('philadelphia 76ers', 'phi', 'philadelphia', '76ers', 'sixers');
addTeam('new york knicks', 'nyk', 'new york', 'knicks', 'ny knicks');
addTeam('miami heat', 'mia', 'miami', 'heat');
addTeam('dallas mavericks', 'dal', 'dallas', 'mavericks', 'mavs');
addTeam('cleveland cavaliers', 'cle', 'cleveland', 'cavaliers', 'cavs');
addTeam('minnesota timberwolves', 'min', 'minnesota', 'timberwolves', 'wolves');
addTeam('sacramento kings', 'sac', 'sacramento', 'kings');
addTeam('indiana pacers', 'ind', 'indiana', 'pacers');
addTeam('new orleans pelicans', 'nop', 'new orleans', 'pelicans');
addTeam('chicago bulls', 'chi', 'chicago bulls', 'bulls');
addTeam('atlanta hawks', 'atl', 'atlanta hawks', 'hawks');
addTeam('toronto raptors', 'tor', 'toronto raptors', 'raptors');
addTeam('brooklyn nets', 'bkn', 'brooklyn', 'nets');
addTeam('houston rockets', 'hou', 'houston rockets', 'rockets');
addTeam('memphis grizzlies', 'mem', 'memphis', 'grizzlies');
addTeam('san antonio spurs', 'sas', 'san antonio', 'spurs');
addTeam('portland trail blazers', 'por', 'portland', 'blazers', 'trail blazers');
addTeam('utah jazz', 'uta', 'utah', 'jazz');
addTeam('orlando magic', 'orl', 'orlando', 'magic');
addTeam('charlotte hornets', 'cha', 'charlotte', 'hornets');
addTeam('detroit pistons', 'det', 'detroit pistons', 'pistons');
addTeam('washington wizards', 'was', 'washington wizards', 'wizards');

// NFL
addTeam('kansas city chiefs', 'kc', 'kansas city', 'chiefs');
addTeam('san francisco 49ers', 'sf', 'san francisco', '49ers', 'niners');
addTeam('philadelphia eagles', 'philadelphia eagles', 'eagles');
addTeam('buffalo bills', 'buf', 'buffalo', 'bills');
addTeam('dallas cowboys', 'dallas cowboys', 'cowboys');
addTeam('detroit lions', 'detroit lions', 'lions');
addTeam('baltimore ravens', 'bal', 'baltimore', 'ravens');
addTeam('miami dolphins', 'miami dolphins', 'dolphins');
addTeam('green bay packers', 'gb', 'green bay', 'packers');
addTeam('pittsburgh steelers', 'pit', 'pittsburgh', 'steelers');
addTeam('new york giants', 'nyg', 'ny giants', 'giants');
addTeam('new york jets', 'nyj', 'ny jets', 'jets');
addTeam('los angeles rams', 'lar', 'la rams', 'rams');
addTeam('los angeles chargers', 'la chargers', 'chargers');
addTeam('new england patriots', 'ne', 'new england', 'patriots');
addTeam('seattle seahawks', 'sea', 'seattle', 'seahawks');
addTeam('tampa bay buccaneers', 'tb', 'tampa bay', 'buccaneers', 'bucs');
addTeam('cincinnati bengals', 'cin', 'cincinnati', 'bengals');
addTeam('arizona cardinals', 'ari', 'arizona cardinals', 'cardinals');
addTeam('denver broncos', 'denver broncos', 'broncos');
addTeam('las vegas raiders', 'lv', 'las vegas', 'raiders');
addTeam('minnesota vikings', 'minnesota vikings', 'vikings');
addTeam('chicago bears', 'chicago bears', 'bears');

// MLB
addTeam('new york yankees', 'nyy', 'ny yankees', 'yankees');
addTeam('new york mets', 'nym', 'ny mets', 'mets');
addTeam('los angeles dodgers', 'lad', 'la dodgers', 'dodgers');
addTeam('boston red sox', 'boston red sox', 'red sox');
addTeam('houston astros', 'houston astros', 'astros');
addTeam('atlanta braves', 'atlanta braves', 'braves');
addTeam('chicago cubs', 'chicago cubs', 'cubs');
addTeam('chicago white sox', 'chicago white sox', 'white sox');
addTeam('san diego padres', 'san diego', 'padres');

// NHL
addTeam('toronto maple leafs', 'toronto maple leafs', 'maple leafs', 'leafs');
addTeam('montreal canadiens', 'mtl', 'montreal', 'canadiens', 'habs');
addTeam('boston bruins', 'boston bruins', 'bruins');
addTeam('new york rangers', 'nyr', 'ny rangers', 'rangers');
addTeam('new york islanders', 'nyi', 'ny islanders', 'islanders');
addTeam('edmonton oilers', 'edmonton', 'oilers');
addTeam('colorado avalanche', 'colorado', 'avalanche', 'avs');
addTeam('carolina hurricanes', 'carolina', 'hurricanes', 'canes');
addTeam('florida panthers', 'florida panthers', 'panthers');
addTeam('winnipeg jets', 'winnipeg', 'winnipeg jets');
addTeam('vancouver canucks', 'vancouver', 'canucks');
addTeam('dallas stars', 'dallas stars', 'stars');
addTeam('vegas golden knights', 'vegas', 'golden knights', 'vgk');

// Soccer — EPL
addTeam('arsenal', 'arsenal fc', 'afc');
addTeam('manchester city', 'man city', 'mcfc', 'city');
addTeam('manchester united', 'man utd', 'man united', 'mufc');
addTeam('liverpool', 'liverpool fc', 'lfc');
addTeam('chelsea', 'chelsea fc', 'cfc');
addTeam('tottenham hotspur', 'tottenham', 'thfc');
addTeam('newcastle united', 'newcastle', 'nufc');
addTeam('aston villa', 'villa');
addTeam('brighton & hove albion', 'brighton', 'brighton & hove albion fc');
addTeam('west ham united', 'west ham', 'west ham fc');
addTeam('crystal palace', 'palace');
addTeam('fulham', 'fulham fc');
addTeam('bournemouth', 'afc bournemouth');
addTeam('wolverhampton wanderers', 'wolves', 'wolverhampton');
addTeam('nottingham forest', 'nottm forest', 'forest');
addTeam('brentford', 'brentford fc');
addTeam('everton', 'everton fc');
addTeam('leicester city', 'leicester');
addTeam('ipswich town', 'ipswich');
addTeam('southampton', 'southampton fc');

// Soccer — La Liga
addTeam('real madrid', 'real madrid cf', 'rmcf');
addTeam('barcelona', 'fc barcelona', 'barca', 'fcb');
addTeam('atletico madrid', 'atletico', 'atletico de madrid');
addTeam('real sociedad', 'sociedad');
addTeam('athletic bilbao', 'athletic club', 'bilbao');
addTeam('real betis', 'betis');
addTeam('villarreal', 'villarreal cf');
addTeam('getafe', 'getafe cf');
addTeam('sevilla', 'sevilla fc');
addTeam('celta vigo', 'celta');
addTeam('rayo vallecano', 'rayo');
addTeam('osasuna', 'ca osasuna');
addTeam('mallorca', 'rcd mallorca');
addTeam('las palmas', 'ud las palmas');
addTeam('girona', 'girona fc');

// Soccer — Serie A
addTeam('inter milan', 'inter', 'internazionale', 'fc internazionale');
addTeam('ac milan', 'milan', 'acm');
addTeam('juventus', 'juve', 'juventus fc');
addTeam('napoli', 'ssc napoli');
addTeam('roma', 'as roma');
addTeam('lazio', 'ss lazio');
addTeam('atalanta', 'atalanta bc');
addTeam('fiorentina', 'acf fiorentina');
addTeam('bologna', 'bologna fc');
addTeam('torino', 'torino fc');
addTeam('genoa', 'genoa cfc');
addTeam('sassuolo', 'us sassuolo');
addTeam('hellas verona', 'verona');
addTeam('parma calcio', 'parma');
addTeam('lecce', 'us lecce');

// Soccer — Bundesliga
addTeam('bayern munich', 'bayern', 'fc bayern', 'bayern munchen', 'bayern münchen');
addTeam('borussia dortmund', 'dortmund', 'bvb');
addTeam('bayer leverkusen', 'leverkusen');
addTeam('rb leipzig', 'leipzig');
addTeam('eintracht frankfurt', 'frankfurt');
addTeam('vfb stuttgart', 'stuttgart');
addTeam('borussia monchengladbach', 'monchengladbach', 'gladbach', 'mönchengladbach');
addTeam('vfl wolfsburg', 'wolfsburg');

// Soccer — Ligue 1
addTeam('paris saint-germain', 'psg', 'paris sg');
addTeam('olympique marseille', 'marseille', 'om');
addTeam('olympique lyonnais', 'lyon', 'ol');
addTeam('as monaco', 'monaco');
addTeam('lille', 'losc lille', 'losc');

// MMA/UFC - typically matched by fighter names, not team names
// We'll handle these via the text extraction

// ─── Sport Detection ────────────────────────────────────────────────────
const SPORT_KEYWORDS = {
  'Basketball': ['nba', 'basketball', 'wnba', 'ncaa basketball', 'cbb', 'ncaambgame', 'nbaml', 'nbatotal'],
  'Football': ['nfl', 'football', 'super bowl', 'ncaa football', 'nflml', 'nflgame'],
  'Soccer': ['soccer', 'premier league', 'epl', 'la liga', 'champions league', 'mls', 'serie a', 'bundesliga', 'ligue 1', 'copa', 'uefa', 'btts', 'brasileir'],
  'Baseball': ['mlb', 'baseball', 'world series'],
  'Hockey': ['nhl', 'hockey', 'stanley cup', 'nhltotal', 'nhlgame'],
  'Tennis': ['tennis', 'atp', 'wta', 'wimbledon'],
  'F1': ['formula 1', 'f1', 'grand prix'],
  'MMA': ['ufc', 'mma', 'bellator'],
  'Esports': ['esports', 'starcraft', 'league of legends', 'dota', 'valorant', 'csgo'],
  'Golf': ['golf', 'pga', 'masters'],
  'Rugby': ['rugby', 'six nations', 'super rugby'],
};

const SPORT_EMOJIS = {
  'Basketball':'🏀', 'Football':'🏈', 'Soccer':'⚽', 'Baseball':'⚾',
  'Hockey':'🏒', 'Tennis':'🎾', 'F1':'🏎️', 'MMA':'🥊',
  'Esports':'🎮', 'Golf':'⛳', 'Rugby':'🏉', 'Other':'🏅',
};

function detectSport(text, tags) {
  const combined = `${text} ${(tags || []).join(' ')}`.toLowerCase();
  for (const [sport, keywords] of Object.entries(SPORT_KEYWORDS)) {
    if (keywords.some(kw => combined.includes(kw))) return sport;
  }
  return 'Other';
}

function detectLeague(text, tags) {
  const combined = `${text} ${(tags || []).join(' ')}`.toLowerCase();
  const leagues = {
    'NBA': ['nba', 'pro basketball'], 'WNBA': ['wnba'], 'NFL': ['nfl', 'pro football'],
    'MLB': ['mlb'], 'NHL': ['nhl'], 'EPL': ['premier league', 'epl'],
    'La Liga': ['la liga', 'laliga'], 'Champions League': ['champions league', 'ucl'],
    'MLS': ['mls'], 'Serie A': ['serie a'], 'Bundesliga': ['bundesliga'],
    'Ligue 1': ['ligue 1'], 'NCAA': ['ncaa', 'college'], 'UFC': ['ufc'],
    'Six Nations': ['six nations'], 'Super Rugby': ['super rugby'],
  };
  for (const [league, kws] of Object.entries(leagues)) {
    if (kws.some(kw => combined.includes(kw))) return league;
  }
  return '';
}

function detectMarketType(text) {
  const lower = text.toLowerCase();
  if (lower.includes('spread') || lower.includes('handicap')) return 'spread';
  if (lower.includes('total') || lower.includes('o/u') || lower.includes('over') || lower.includes('under')) return 'total';
  if (lower.includes('btts') || lower.includes('both teams to score')) return 'btts';
  if (lower.includes('1h ') || lower.includes('first half') || lower.includes('1st half')) return 'first_half';
  if (lower.includes('draw')) return 'draw';
  return 'moneyline';
}

// ─── Team Extraction ────────────────────────────────────────────────────
// This is the critical function — extract exactly which two teams are playing

function resolveTeam(name) {
  const lower = name.toLowerCase()
    .replace(/\bfc\b/g, '').replace(/\bcf\b/g, '').replace(/\bsc\b/g, '')
    .replace(/[.()]/g, '').replace(/\s+/g, ' ').trim();
  
  // Direct lookup
  if (TEAM_MAP[lower]) return TEAM_MAP[lower];
  
  // Try progressively shorter prefixes (for "Los Angeles C" matching "Los Angeles Clippers")
  const words = lower.split(' ');
  for (let len = words.length; len >= 1; len--) {
    const prefix = words.slice(0, len).join(' ');
    if (TEAM_MAP[prefix]) return TEAM_MAP[prefix];
  }
  
  // Try each word as a standalone (for nicknames like "Nuggets", "Arsenal")
  for (const word of words) {
    if (word.length >= 4 && TEAM_MAP[word]) return TEAM_MAP[word];
  }
  
  return lower; // Return cleaned name as-is for unknown teams
}

function extractFixtureTeams(text) {
  // Common separators: "vs.", "vs", "at", "v"
  // Patterns: "Team A vs. Team B", "Team A at Team B", "Team A v Team B"
  // Also: "Will Team A win on DATE?" (single team)
  // Also: "Team A vs. Team B: O/U 225.5" (with suffix)
  
  const cleaned = text
    .replace(/:\s*(O\/U|Over|Under|Total|Spread|Both Teams|1H|First Half|Moneyline).*$/i, '') // Remove market type suffix
    .replace(/\(\w+\)/g, '') // Remove (W), (M) etc
    .replace(/\s*[-–]\s*Map \d.*$/i, '') // Remove esports map info
    .replace(/\s*\(BO\d\).*$/i, '') // Remove best-of info
    .trim();
  
  // Try "X vs. Y" or "X vs Y" or "X v Y"
  let match = cleaned.match(/^(.+?)\s+vs?\.?\s+(.+?)$/i);
  if (match) {
    return [resolveTeam(match[1]), resolveTeam(match[2])];
  }
  
  // Try "X at Y"
  match = cleaned.match(/^(.+?)\s+at\s+(.+?)$/i);
  if (match) {
    return [resolveTeam(match[1]), resolveTeam(match[2])];
  }
  
  // Kalshi format: "Denver at Los Angeles C: Total Points"
  match = cleaned.match(/^(.+?)\s+at\s+(.+?):/i);
  if (match) {
    return [resolveTeam(match[1]), resolveTeam(match[2])];
  }
  
  // "Will X win on DATE?" or "Will X vs. Y end in a draw?"
  match = cleaned.match(/^Will\s+(.+?)\s+(?:win|lose)\s+on\s+/i);
  if (match) {
    return [resolveTeam(match[1])];
  }
  
  match = cleaned.match(/^Will\s+(.+?)\s+vs\.\s+(.+?)\s+end\s+in/i);
  if (match) {
    return [resolveTeam(match[1]), resolveTeam(match[2])];
  }
  
  // Polymarket: "Brighton & Hove Albion FC vs. Arsenal FC: Both Teams to Score"
  match = text.match(/^(.+?)\s+vs\.?\s+(.+?):/i);
  if (match) {
    return [resolveTeam(match[1]), resolveTeam(match[2])];
  }
  
  return [];
}

function getFixtureDate(market) {
  // Get the date portion (YYYY-MM-DD) of when the fixture occurs
  const dateStr = market.end_date || market.endDate || market.expected_expiration_time || market.close_time || '';
  return dateStr.slice(0, 10); // YYYY-MM-DD
}

// ─── Normalize Markets ──────────────────────────────────────────────────
function normalizePolymarket(m) {
  const yesPrice = m.outcomes?.[0]?.price ?? null;
  const noPrice = m.outcomes?.[1]?.price ?? null;
  const text = m.question || '';
  const teams = extractFixtureTeams(text);
  const date = getFixtureDate(m);
  const sport = detectSport(text + ' ' + (m.description || ''), m.tags);
  const league = detectLeague(text + ' ' + (m.description || ''), m.tags);
  
  return {
    platform: 'polymarket',
    id: m.id,
    question: m.question,
    slug: m.slug,
    yesPrice, noPrice,
    volume: m.volume || 0,
    volume24h: m.volume_24h || 0,
    liquidity: m.liquidity || 0,
    endDate: m.end_date,
    sport, league, teams, date,
    marketType: detectMarketType(text),
    yesTokenId: m.outcomes?.[0]?.clob_token_id || m.clob_token_ids?.[0],
    noTokenId: m.outcomes?.[1]?.clob_token_id || m.clob_token_ids?.[1],
  };
}

function normalizeKalshi(m) {
  const yesBid = m.yes_bid_dollars ? parseFloat(m.yes_bid_dollars) : (m.yes_bid || 0) / 100;
  const yesAsk = m.yes_ask_dollars ? parseFloat(m.yes_ask_dollars) : (m.yes_ask || 0) / 100;
  const noBid = m.no_bid_dollars ? parseFloat(m.no_bid_dollars) : (m.no_bid || 0) / 100;
  const noAsk = m.no_ask_dollars ? parseFloat(m.no_ask_dollars) : (m.no_ask || 0) / 100;
  const tags = m._series?.tags || [];
  const text = `${m.title || ''} ${m._series?.title || ''}`;
  const teams = extractFixtureTeams(m.title || '');
  const date = getFixtureDate({ expected_expiration_time: m.expected_expiration_time, close_time: m.close_time });
  const sport = detectSport(text, tags);
  const league = detectLeague(text, tags);
  
  return {
    platform: 'kalshi',
    ticker: m.ticker,
    title: m.title,
    yesBid, yesAsk, noBid, noAsk,
    lastPrice: m.last_price_dollars ? parseFloat(m.last_price_dollars) : (m.last_price || 0) / 100,
    volume: m.volume || 0,
    volume24h: m.volume_24h || 0,
    openInterest: m.open_interest || 0,
    closeTime: m.close_time,
    expectedExpiration: m.expected_expiration_time,
    sport, league, teams, date,
    marketType: detectMarketType(m.title || ''),
    tags,
  };
}

// ─── Match Markets ──────────────────────────────────────────────────────
function matchMarkets(polymarkets, kalshiMarkets) {
  const normPoly = polymarkets.map(normalizePolymarket);
  const normKalshi = kalshiMarkets.map(normalizeKalshi);
  const matched = [];
  const usedKalshi = new Set();

  for (const pm of normPoly) {
    if (pm.teams.length < 1) continue; // Can't match without teams
    
    let bestMatch = null;
    let bestScore = 0;

    for (let i = 0; i < normKalshi.length; i++) {
      if (usedKalshi.has(i)) continue;
      const km = normKalshi[i];
      if (km.teams.length < 1) continue;
      
      // RULE 1: Must be exact same date
      if (pm.date !== km.date) continue;
      
      // RULE 2: Must be same market type (moneyline vs moneyline, total vs total)
      if (pm.marketType !== km.marketType) continue;
      
      // RULE 3: Both teams must match
      const pmTeams = new Set(pm.teams);
      const kmTeams = new Set(km.teams);
      
      let teamOverlap = 0;
      for (const t of pmTeams) {
        if (kmTeams.has(t)) teamOverlap++;
      }
      
      // For 2-team fixtures, require both teams to match
      if (pm.teams.length >= 2 && km.teams.length >= 2) {
        if (teamOverlap < 2) continue;
      } else if (pm.teams.length === 1 || km.teams.length === 1) {
        // Single team markets (e.g., "Will X win?") — require the 1 team to match
        if (teamOverlap < 1) continue;
      }
      
      const score = teamOverlap * 10 + (pm.sport === km.sport ? 5 : 0);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { index: i, market: km };
      }
    }

    if (bestMatch) {
      usedKalshi.add(bestMatch.index);
      matched.push({ polymarket: pm, kalshi: bestMatch.market });
    }
  }

  // Unmatched
  const matchedPolyIds = new Set(matched.map(m => m.polymarket.id));
  const unmatchedPoly = normPoly.filter(m => !matchedPolyIds.has(m.id));
  const unmatchedKalshi = normKalshi.filter((_, i) => !usedKalshi.has(i));

  console.log(`[MATCH] ${matched.length} matched, ${unmatchedPoly.length} poly-only, ${unmatchedKalshi.length} kalshi-only`);
  
  // Log matched for debugging
  for (const m of matched.slice(0, 5)) {
    console.log(`[MATCH] ✓ "${m.polymarket.question?.slice(0,40)}" <=> "${m.kalshi.title?.slice(0,40)}" (${m.polymarket.date})`);
  }

  return { matched, unmatchedPoly, unmatchedKalshi };
}

module.exports = { matchMarkets, normalizePolymarket, normalizeKalshi, SPORT_EMOJIS, detectSport, detectLeague };
