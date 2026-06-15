# World Cup Fantasy Scoreboard

Track a group of friends' picks (5 teams each) through the FIFA World Cup group stage.

**Scoring**

- Win = 3 pts, draw or shootout loss = 1 pt, regular loss = 0 pts (group-stage matches only)
- Group placement bonus once a group finishes: 1st = 3 pts, 2nd = 2 pts, 3rd place that advances (one of the 8 best 3rd-place teams) = 1 pt
- A "live now" ticker shows in-play matches and provisionally reflects their points until the match is `FINISHED`

## Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Copy `.env.example` to `.env`, set `FOOTBALL_DATA_API_KEY` (free key at [football-data.org](https://www.football-data.org/client/register)) and `DATABASE_URL` to a Postgres connection string. For local development, `docker compose up db -d` starts a local Postgres matching the `docker-compose.yml` defaults (`postgres://postgres:postgres@localhost:5432/worldcup_fantasy`).

3. Edit `app/db/seed.ts` with your group's friends and their 5 team picks. Team names must match football-data.org's names (e.g. "South Korea" not "Korea Republic", "United States" not "USA").

4. Create the database tables and seed them:

   ```bash
   bun run db:migrate
   bun run db:seed
   ```

   Run `bun run db:studio` for a GUI to inspect/edit picks instead.

5. Start the dev server:

   ```bash
   bun run dev
   ```

   Visit `http://localhost:5173`.

## Database

Uses Postgres via Drizzle (`drizzle-orm/node-postgres`). `DATABASE_URL` works with any Postgres provider — Railway, Neon, Supabase, a self-hosted container, etc.

## Deployment

### Docker Compose (self-hosting with a bundled Postgres)

```bash
docker compose up
```

This starts the app and a Postgres database together. On first run, apply migrations and seed:

```bash
docker compose exec app bun run db:migrate
docker compose exec app bun run db:seed
```

### Docker (bring your own Postgres)

```bash
docker build -t worldcup-fantasy .
docker run -p 3000:3000 \
  -e FOOTBALL_DATA_API_KEY=your_key \
  -e DATABASE_URL=postgres://user:pass@host:5432/dbname \
  worldcup-fantasy
```

Works on any host that can reach your Postgres instance: Railway, Fly.io, Render, Vercel, a VPS, etc. Run `bun run db:migrate` and `bun run db:seed` against the same `DATABASE_URL` before first use.
