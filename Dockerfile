FROM oven/bun:1 AS dependencies-env
COPY package.json bun.lock /app/
WORKDIR /app
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS build-env
COPY . /app/
COPY --from=dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN bun run build

FROM oven/bun:1
COPY package.json bun.lock /app/
COPY --from=dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
COPY --from=build-env /app/drizzle /app/drizzle
COPY --from=build-env /app/drizzle.config.ts /app/drizzle.config.ts
COPY --from=build-env /app/app/db /app/app/db
WORKDIR /app

# DATABASE_URL must point at a Postgres instance, e.g.
# postgres://user:pass@host:5432/dbname
EXPOSE 3000
CMD ["sh", "-c", "bun run db:migrate && bun run start"]
