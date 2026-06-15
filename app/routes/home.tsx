import { useEffect } from "react";
import { useRevalidator } from "react-router";
import { db } from "../db";
import {
  getGroupMatches,
  getGroupStandings,
  getLiveMatches,
} from "../lib/football-data";
import { computeLeaderboard } from "../lib/scoring";
import type { Route } from "./+types/home";

const LIVE_POLL_MS = 20_000;

export function meta({}: Route.MetaArgs) {
  return [
    { title: "World Cup Fantasy" },
    { name: "description", content: "Friends' World Cup pick tracker" },
  ];
}

export async function loader() {
  const allFriends = await db.query.friends.findMany({
    with: { picks: true },
  });

  const [standings, matches, liveMatches] = await Promise.all([
    getGroupStandings(),
    getGroupMatches(),
    getLiveMatches(),
  ]);

  const leaderboard = computeLeaderboard(
    allFriends.map((f) => ({
      name: f.name,
      teams: f.picks.map((p) => p.teamName),
    })),
    standings,
    matches,
    liveMatches
  );

  return {
    leaderboard,
    liveMatches: liveMatches.map((m) => ({
      id: m.id,
      group: m.group,
      home: m.homeTeam.name,
      away: m.awayTeam.name,
      homeScore: m.score.fullTime.home,
      awayScore: m.score.fullTime.away,
      status: m.status,
    })),
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { leaderboard, liveMatches } = loaderData;
  const revalidator = useRevalidator();

  useEffect(() => {
    if (liveMatches.length === 0) return;

    const interval = setInterval(() => {
      if (revalidator.state === "idle") {
        revalidator.revalidate();
      }
    }, LIVE_POLL_MS);

    return () => clearInterval(interval);
  }, [liveMatches.length, revalidator]);

  return (
    <main className="scoreboard">
      <header className="scoreboard__header">
        <p className="scoreboard__kicker">FIFA World Cup 2026</p>
        <h1 className="scoreboard__title">
          Fantasy
          <br />
          <span>Scoreboard</span>
        </h1>
      </header>

      {liveMatches.length > 0 && (
        <section className="live-ticker">
          <p className="live-ticker__label">
            <span className="live-dot" /> Live now
          </p>
          <ul className="live-ticker__list">
            {liveMatches.map((m) => (
              <li key={m.id} className="live-match">
                <span className="live-match__team">{m.home}</span>
                <span className="live-match__score">
                  {m.homeScore ?? 0}&ndash;{m.awayScore ?? 0}
                </span>
                <span className="live-match__team">{m.away}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="ticket-list">
        {leaderboard.map((entry, i) => {
          const sortedPicks = [...entry.picks].sort(
            (a, b) => b.total - a.total
          );

          return (
            <article
              key={entry.friend}
              className={`ticket${i === 0 ? " ticket--leader" : ""}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="ticket__header">
                <span className="ticket__rank">#{i + 1}</span>
                <h2 className="ticket__name">{entry.friend}</h2>
                <span className="ticket__score">
                  {entry.total}
                  <span className="ticket__score-label">pts</span>
                </span>
              </div>
              <div className="ticket__divider" />
              <div className="team-list-header">
                <span />
                <span />
                <span title="Wins">W</span>
                <span title="Draws">D</span>
                <span title="Losses">L</span>
                <span title="Total points">Pts</span>
              </div>
              <ul className="team-list">
                {sortedPicks.map((p, idx) => {
                  const allResults = [...p.results, ...p.liveResults];
                  const wins = allResults.filter((r) => r === "win").length;
                  const draws = allResults.filter((r) => r === "draw").length;
                  const losses = allResults.filter(
                    (r) => r === "loss" || r === "shootoutLoss"
                  ).length;
                  return (
                    <li key={p.team} className="team-row">
                      <span className="team-row__rank">{idx + 1}</span>
                      <span className="team-row__name">{p.team}</span>
                      <span className="team-row__record" title="Wins">
                        {wins}
                      </span>
                      <span className="team-row__record" title="Draws">
                        {draws}
                      </span>
                      <span className="team-row__record" title="Losses">
                        {losses}
                      </span>
                      <span
                        className={`team-row__total${p.livePoints !== 0 ? " is-live" : ""}`}
                        title={
                          p.livePoints !== 0
                            ? "Total points (incl. live, provisional)"
                            : "Total points"
                        }
                      >
                        {p.total}
                        {p.livePoints !== 0 && (
                          <span className="live-dot live-dot--inline" />
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    </main>
  );
}
