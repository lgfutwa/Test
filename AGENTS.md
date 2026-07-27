# AGENTS.md

## Cursor Cloud specific instructions

This is the **Sim** monorepo (`simstudio`): a Bun + Turborepo + Next.js app for building AI agent workflows. The primary product lives in `apps/sim` (Next.js web app on port `3000` + a realtime Socket.IO server on port `3002`). Standard commands live in the root/app `package.json` and `README.md` (see "Self-hosted: Manual Setup"); this section only records the non-obvious bits for running in the cloud VM.

### Runtime / package manager
- Use `bun` (pinned to `bun@1.3.3`), not `npm`/`npx`. Bun is installed to `~/.bun/bin`. If it is not on `PATH` in a non-interactive shell, call it as `~/.bun/bin/bun` or run `export PATH="$HOME/.bun/bin:$PATH"` first.
- The update script runs `bun install` for you on startup, so dependencies are already installed.

### PostgreSQL + pgvector (required service, must be started manually)
The app requires PostgreSQL **with the `pgvector` extension**. It is installed via apt (`postgresql-16` + `postgresql-16-pgvector`) but is **not** auto-started on VM boot. Start it and ensure the `simstudio` DB + `vector` extension exist:

```bash
sudo pg_ctlcluster 16 main start
# First time only (idempotent-ish): create db + extension
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE simstudio;" 2>/dev/null || true
sudo -u postgres psql -d simstudio -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

Connection string used everywhere: `postgresql://postgres:postgres@localhost:5432/simstudio`.

### Environment files (gitignored — recreate if missing)
Both `apps/sim/.env` and `packages/db/.env` are required and gitignored. If they are missing, create them. Minimum working set (generate secrets with `openssl rand -hex 32`):

```bash
# apps/sim/.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/simstudio"
BETTER_AUTH_SECRET=<hex32>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENCRYPTION_KEY=<hex32>
INTERNAL_API_SECRET=<hex32>
API_ENCRYPTION_KEY=<hex32>

# packages/db/.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/simstudio"
```

- Email verification is **off** by default (no `EMAIL_VERIFICATION_ENABLED`), so email/password signup works without an email provider — signup lands directly in the workspace. Set `DISABLE_AUTH=true` only if you want to bypass auth entirely.
- Optional integrations (Redis, Trigger.dev, Ollama/vLLM, Copilot `COPILOT_API_KEY`, Resend, S3/Azure) degrade gracefully and are not needed to run/test the core app.

### Database migrations
Run from `apps/sim` so drizzle picks the correct `.env` (this is required — do not run from repo root):

```bash
cd apps/sim && ~/.bun/bin/bunx drizzle-kit migrate --config=./drizzle.config.ts
```

Migrations emit `NOTICE ... identifier will be truncated` messages — these are harmless Postgres notices, not errors.

### Run the app (dev)
From the repo root, run both the web app and the realtime socket server together:

```bash
bun run dev:full   # App on :3000, Realtime Socket.IO on :3002
```

Socket server health check: `curl http://localhost:3002/health`. The Next.js dev server uses Turbopack; hot reload works, but new dependencies require restarting `dev:full`.

### Lint / test
- Lint (Biome): `bun run lint:check` (or `bun run lint` to autofix). Pre-commit runs `bunx lint-staged` (Biome on staged files).
- Tests (Vitest, per-workspace via Turbo): `bun run test`, or scope to the app with `cd apps/sim && bunx vitest run <path>`. Tests are unit-style and do not require the DB/services to be running.
