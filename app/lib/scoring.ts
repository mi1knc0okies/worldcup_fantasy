import type { GroupStanding, Match } from "./football-data";

export type MatchResult = "win" | "draw" | "shootoutLoss" | "loss";

export const MATCH_POINTS: Record<MatchResult, number> = {
  win: 3,
  draw: 1,
  shootoutLoss: 1,
  loss: 0,
};

const NUM_ADVANCING_THIRD_PLACE = 8;
const GROUP_STAGE_MATCHES_PER_TEAM = 3;

/** A group's standings are final once every team has played all 3 group matches. */
function isGroupComplete(standings: GroupStanding[], group: string): boolean {
  return standings
    .filter((s) => s.group === group)
    .every((s) => s.playedGames >= GROUP_STAGE_MATCHES_PER_TEAM);
}

/**
 * Classify a finished group-stage match from the perspective of `teamName`.
 *
 * `match.score` shape from football-data.org:
 *   winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW"
 *   fullTime: { home, away }       <- 90 min score
 *   penalties: { home, away }      <- only set if the match went to a shootout
 *
 * TODO(you): implement this. Cases to handle:
 *   - team won in normal time -> "win"
 *   - match was a draw (winner === "DRAW", no penalties) -> "draw"
 *   - team lost in normal time, no penalties -> "loss"
 *   - penalties were taken: the team on the winning side of `penalties` -> "win",
 *     the team on the losing side -> "shootoutLoss"
 */
export function classifyMatchResult(
  match: Match,
  teamName: string
): MatchResult {
  const isHome = match.homeTeam.name === teamName;
  const { winner, penalties } = match.score;

  if (penalties && penalties.home !== null && penalties.away !== null) {
    const wonShootout = isHome
      ? penalties.home > penalties.away
      : penalties.away > penalties.home;
    return wonShootout ? "win" : "shootoutLoss";
  }

  if (winner === "DRAW") return "draw";

  const won = (winner === "HOME_TEAM" && isHome) || (winner === "AWAY_TEAM" && !isHome);
  return won ? "win" : "loss";
}

/**
 * Determine which 3rd-place teams advance to the knockout rounds, using FIFA's
 * tie-break order: points, then goal difference, then goals scored.
 */
export function getAdvancingThirdPlaceTeams(
  standings: GroupStanding[]
): Set<string> {
  const thirdPlace = standings.filter(
    (s) => s.position === 3 && isGroupComplete(standings, s.group)
  );

  const sorted = [...thirdPlace].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDifference !== b.goalDifference)
      return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return new Set(
    sorted.slice(0, NUM_ADVANCING_THIRD_PLACE).map((s) => s.team.name)
  );
}

function placementBonus(
  standing: GroupStanding | undefined,
  standings: GroupStanding[],
  advancingThirdPlace: Set<string>
): number {
  if (!standing) return 0;
  if (!isGroupComplete(standings, standing.group)) return 0;
  if (standing.position === 1) return 3;
  if (standing.position === 2) return 2;
  if (standing.position === 3 && advancingThirdPlace.has(standing.team.name))
    return 1;
  return 0;
}

export interface TeamScore {
  team: string;
  matchPoints: number;
  livePoints: number;
  placementBonus: number;
  total: number;
  results: MatchResult[];
  liveResults: MatchResult[];
}

function getTeamMatchResults(matches: Match[], teamName: string): MatchResult[] {
  return matches
    .filter((m) => m.homeTeam.name === teamName || m.awayTeam.name === teamName)
    .map((m) => classifyMatchResult(m, teamName));
}

function sumPoints(results: MatchResult[]): number {
  return results.reduce((sum, r) => sum + MATCH_POINTS[r], 0);
}

export function computeTeamScore(
  teamName: string,
  standings: GroupStanding[],
  matches: Match[],
  liveMatches: Match[],
  advancingThirdPlace: Set<string>
): TeamScore {
  const results = getTeamMatchResults(matches, teamName);
  const liveResults = getTeamMatchResults(liveMatches, teamName);
  const matchPoints = sumPoints(results);
  const livePoints = sumPoints(liveResults);

  const standing = standings.find((s) => s.team.name === teamName);
  const bonus = placementBonus(standing, standings, advancingThirdPlace);

  return {
    team: teamName,
    matchPoints,
    livePoints,
    placementBonus: bonus,
    total: matchPoints + livePoints + bonus,
    results,
    liveResults,
  };
}

export interface FriendScore {
  friend: string;
  total: number;
  picks: TeamScore[];
}

export function computeLeaderboard(
  friendsWithPicks: { name: string; teams: string[] }[],
  standings: GroupStanding[],
  matches: Match[],
  liveMatches: Match[]
): FriendScore[] {
  const advancingThirdPlace = getAdvancingThirdPlaceTeams(standings);

  return friendsWithPicks
    .map((friend) => {
      const picks = friend.teams.map((team) =>
        computeTeamScore(
          team,
          standings,
          matches,
          liveMatches,
          advancingThirdPlace
        )
      );
      return {
        friend: friend.name,
        total: picks.reduce((sum, p) => sum + p.total, 0),
        picks,
      };
    })
    .sort((a, b) => b.total - a.total);
}
