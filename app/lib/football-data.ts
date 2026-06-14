const BASE_URL = "https://api.football-data.org/v4";
const COMPETITION = "WC";
const CACHE_TTL_MS = 60_000;

export interface GroupStanding {
  group: string;
  position: number;
  team: { id: number; name: string };
  points: number;
  goalDifference: number;
  goalsFor: number;
  playedGames: number;
}

export interface Match {
  id: number;
  status: string;
  group: string | null;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT";
    fullTime: { home: number | null; away: number | null };
    penalties?: { home: number | null; away: number | null };
  };
}

async function fetchFromApi<T>(path: string): Promise<T> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    throw new Error("FOOTBALL_DATA_API_KEY is not set");
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-Auth-Token": apiKey },
  });

  if (!res.ok) {
    throw new Error(
      `football-data.org request failed: ${res.status} ${res.statusText}`
    );
  }

  return res.json() as Promise<T>;
}

function withCache<T>(fn: () => Promise<T>, ttlMs = CACHE_TTL_MS) {
  let cached: { value: T; expiresAt: number } | null = null;

  return async (): Promise<T> => {
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }
    const value = await fn();
    cached = { value, expiresAt: Date.now() + ttlMs };
    return value;
  };
}

export const getGroupStandings = withCache(async (): Promise<
  GroupStanding[]
> => {
  const data = await fetchFromApi<{
    standings: {
      type: string;
      group: string;
      table: GroupStanding[];
    }[];
  }>(`/competitions/${COMPETITION}/standings`);

  return data.standings
    .filter((s) => s.type === "TOTAL" && s.group)
    .flatMap((s) =>
      s.table.map((entry) => ({ ...entry, group: s.group }))
    );
});

export const getGroupMatches = withCache(async (): Promise<Match[]> => {
  const data = await fetchFromApi<{ matches: Match[] }>(
    `/competitions/${COMPETITION}/matches?stage=GROUP_STAGE`
  );

  return data.matches.filter((m) => m.status === "FINISHED");
});

const LIVE_CACHE_TTL_MS = 15_000;

export const getLiveMatches = withCache(async (): Promise<Match[]> => {
  const data = await fetchFromApi<{ matches: Match[] }>(
    `/competitions/${COMPETITION}/matches?stage=GROUP_STAGE`
  );

  return data.matches.filter(
    (m) => m.status === "IN_PLAY" || m.status === "PAUSED"
  );
}, LIVE_CACHE_TTL_MS);
