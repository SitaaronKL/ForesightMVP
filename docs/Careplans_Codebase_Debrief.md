# Careplans Codebase Debrief

Quick map of what's actually in `Foresight-Health/careplans` and a reality check on the "I should migrate this to Next.js" instinct.

---

## TL;DR

The codebase is **not archaic**. It's a polyglot AWS-native monorepo on current stacks (Next.js 16, React 19, .NET 9, Bun, Tailwind 4, EF Core 9, Postgres 16, Auth0 v4). The thing that bit you is **dev-environment setup friction**, not the underlying tech. That distinction matters because the prescription is different.

- Migrating a .NET 9 / Postgres / Flyway / Clean Architecture API to Next.js in your first weeks would be career suicide.
- Writing a `bin/setup` script that gets a new engineer from zero to "all five services running locally" in one command is a hero move.

Pick the second one.

---

## What's in the repo (real layout)

```
careplans/
├── api/           C# .NET 9 backend (the system of record)
├── web/           Next.js 16 frontend (clinician UI)
├── eligibility/   Bun + Fastify backend + Next.js 16 frontend + Python sandbox
├── ai/            Python FastAPI WebSocket agent (POC, not deployed)
├── utils/         Mixed Python tooling (legacy notebooks, consent middleware, ingestion portal)
├── docs/          Agent docs (issue triage, labels, domain)
├── SYSTEM_DESIGN.md   Solid 698-line system overview at the root
└── .github/       15 GitHub Actions workflows (CI + manual deploys to ECS)
```

The user-facing product is **FHAIP** (Foresight Health AI Platform): clinics manage CCM, PCM, and RPM programs through it.

### Per-subproject reality check

| Subproject | Stack | Verdict |
|---|---|---|
| `web/` | Next.js 16 (App Router), React 19, Tailwind 4.1, pnpm, Auth0 v4, LaunchDarkly | **Already exactly what you'd build.** Literally on Next.js 16 (released Nov 2025), React 19, Tailwind 4. There is nothing to "migrate." |
| `api/` | .NET 9 + ASP.NET Core + EF Core 9 + Postgres 16 + Flyway + Auth0 JWT + Clean Architecture (4 layers) + xUnit | Modern enterprise C#. Healthcare companies pick .NET on purpose: strict typing, mature ORM, audit story for HIPAA. 596 .cs files across 30 controllers. |
| `eligibility/` | Bun + Fastify 5 + Anthropic Claude SDK + Postgres + Python sandbox + Next.js 16 frontend + Tailwind 4 | Cutting edge. Bun is barely a year stable. The Python sandbox + Claude code-parser/code-verifier pattern is genuinely sophisticated. |
| `ai/` | Python 3.11 + FastAPI + uvicorn + Anthropic + Pydantic 2 | POC quality. Not wired into anything, not deployed by CI. |
| `utils/` | Python notebooks + FastAPI + a Next.js consent middleware | Mix of legacy (`utils/eligibility/` is the old Jupyter eligibility engine being replaced) and shipped infra (`utils/outreach/consent-middleware/` is in production). |

Nothing here is archaic. The product just has more moving pieces than your usual side-project monolith.

---

## Why your local setup was painful (this is real, and it's solvable)

Onboarding hurt because the repo demands fluency in **six** different ecosystems at once:

1. **.NET / dotnet** for `api/` (build, run, watch, format)
2. **Make** as the universal command runner (api/Makefile alone is 200+ lines)
3. **Docker compose** for two separate Postgres instances:
   - api/docker/docker-compose.yml: port 5432, user `postgres`, db `careplans_temp` (note: README says 5500 / user `careplans` — that's a real inconsistency)
   - eligibility/backend/docker-compose.yml: port 5450, user `eligibility`, db `eligibility`
4. **Flyway CLI** on top of dotnet for migrations (`brew install flyway`), with its own `flyway.toml` files and env-var-driven JDBC URLs
5. **pnpm** for `web/`, **Bun** for `eligibility/backend/`, **npm** for `eligibility/frontend/`, **pip + venv** for `utils/`, **Poetry** for `ai/`. Five different package managers.
6. **Seven separate `.env` files** to populate (api, web, eligibility/backend, eligibility/frontend, ai, utils, utils/ai_pre_call) — none of which are checked in, each has its own variable naming convention.

The api alone requires: dotnet SDK → Docker → `cp .env.example .env` → populate Auth0/AWS/LLM creds → `docker compose up -d db` → `brew install flyway` → `make flyway-migrate` → `make db-seed` → `make watch`. That's 8 steps before you see a hello-world, and any one of them can fail in interesting ways.

**This is normal for a mature B2B platform.** It's also the thing every engineer who joins complains about. Which is your opening.

---

## The "migrate to Next.js" instinct — let's reality-check it

You said: *"unironically I think for a very long time I kind of just might have to migrate the care plan stuff to Next.js, hosted on Next.js."*

Here's the honest read.

### What "migrate" would actually mean

You'd need to rewrite:

- **30 controllers** (Patients, CarePlans, TimeLogs, Billing, Claims, Tasks, Escalations, Webhooks, Users, Templates, Clinics, EhrSystems, ConsentAssignments, RedoxWebhook, PreCall, PostCall, etc.)
- **All domain entities** with strongly-typed IDs (PatientId, CarePlanId, etc.) as plain TS
- **EF Core repositories and query services** as Drizzle/Prisma/Kysely equivalents
- **AuthorizationContextMiddleware** (the bit that turns Auth0 `org_id` into a ClinicId and filters every query) — this is load-bearing for multi-tenancy
- **The CCM/PCM/RPM time-tracking and billing logic** that's literally what they get paid for
- **Care plan versioning** (immutable snapshots, current_care_plan_version_id pointing to latest)
- **The Redox integration service** (a whole second clean-arch service at `services/redox-integration/`)
- **All the SQL: 100+ Flyway migrations** plus the schema docs auto-generation pipeline
- **The audit log story** that's how HIPAA compliance gets defended

That's six to twelve months of work for one person, during which **zero new customer features ship**. And at the end of it, you have... the same product, on a stack the rest of the team doesn't know.

### Why .NET is there on purpose (steel-manning the choice)

- **Compliance audit story.** HIPAA + SOC2 auditors are used to seeing .NET on healthcare backends. The patterns (DI, attribute-based auth policies, structured logging) are well-trodden in the auditor's checklist.
- **Strong typing through the stack.** Domain → Application → Infrastructure → Api. The strongly-typed IDs (`ClinicId`, `PatientId`) prevent entire classes of bugs that bite TypeScript backends (passing a `userId` where a `patientId` was expected and the compiler shrugs).
- **EF Core 9 is mature.** Migrations, change tracking, query optimization, JSONB support — all production-grade. Prisma is still catching up on some of this.
- **Auth0 + JWT bearer middleware + policy-based authorization** is one config file in .NET. In Next.js you'd be hand-rolling middleware that does what `AuthorizationContextMiddleware.cs` already does.
- **Long-running connections, background jobs (FOR UPDATE SKIP LOCKED queues in Postgres), CloudTalk webhook handlers** — all of this maps cleanly to .NET. In Next.js you'd be reaching for separate workers because the serverless model fights you.

### When this argument actually flips

Migrating *would* make sense if:

- The whole team became TypeScript-native and .NET hiring became a bottleneck.
- A real performance / cost problem in production forced a rewrite.
- The .NET deployment story broke down (it hasn't — it ships to ECS via OIDC just like everything else).

None of those are true today. So the migration argument is "I'd be more comfortable in Next.js," which is honest, but not a business case.

### What you actually want to propose (instead)

The pain you felt is real, valuable signal. Convert it into something the team will love:

1. **`bin/setup` script at the repo root.** One command that:
   - Verifies prereqs (dotnet 9, node 22, bun, pnpm, docker, flyway, python 3.12, poetry)
   - Generates `.env` files from `.env.example` with sane defaults
   - Boots both Postgres containers
   - Runs migrations
   - Seeds dev data
   - Prints "now run `cd api && make watch` in one terminal and `cd web && pnpm dev` in another"

2. **Fix the docker-compose / README inconsistencies.** The api docker-compose says port 5432 / user `postgres` / db `careplans_temp` but README and Makefile assume `careplans` / `careplans_dev`. That's a real bug — any new engineer hits it.

3. **A single `docker-compose.yml` at the repo root** that brings up both Postgres instances on their respective ports, with a single shared volume strategy and consistent naming. Optional, but nice.

4. **Onboarding doc that's actually a script you can run.** Not "install these 8 tools, populate these 7 env files, run these 15 commands." A README that says "run `./bin/setup`, then `make dev-all`."

This is a week-1 to week-3 project. It ships fast, every engineer benefits, and the senior people on the team will note that the new guy *fixed onboarding instead of complaining about it*. That's the move.

---

## Where to land in week 1 (recommendation)

You said in the onboarding call you'd be on the **core EMI team and care EMI team**. Without seeing where they slot you specifically, the highest-leverage entry points are:

- **`api/` controllers and domain.** That's where the EMI work will land — care plans, care teams, tasks, escalations, billing flows. Read `api/CONTEXT.md` (the domain glossary), then `api/CLAUDE.md` (the conventions), then poke around `Controllers/CarePlansController.cs` and `Controllers/PatientsController.cs` for the request/response style.
- **`web/`** is where you'll be most productive most quickly because it's stacks you already know. Good for getting an early ship on the board.
- **`eligibility/`** is the iterating subproject — if there's room to contribute there, the architecture is fresh enough that ideas are still mutable. ADRs in `eligibility/docs/adr/` show how decisions get made on this team.

### Things to read before day one (in this order)

1. `careplans/SYSTEM_DESIGN.md` — the 698-line system overview. Reads in 30 min, gives you the whole picture.
2. `api/CONTEXT.md` + `api/CLAUDE.md` — domain language + conventions.
3. `web/CLAUDE.md` — frontend conventions.
4. `eligibility/CONTEXT.md` — only if you'll touch it.
5. `eligibility/docs/adr/` — ADR-0002 (sessions), ADR-0004 (identity matching), ADR-0007 (clinic bridge), ADR-0008 (FHAIP token forwarding). These are the load-bearing decisions; reading them tells you how the team thinks.

### Things to NOT do in week 1

- Propose any architectural migration.
- Use the word "archaic" out loud about anything that ships to prod.
- Send a PR that touches more than one subproject.
- Skip reading the existing CONTEXT.md / ADR docs before suggesting an alternative — most of your disagreements with the EMI design doc are probably answered in there.

---

## Strategic frame

Tienlan and the senior engineers chose .NET + Postgres + Flyway + Clean Architecture deliberately. They live with the dev-setup friction the same way you do. They have not migrated because the cost-benefit doesn't pencil out yet, not because they haven't thought of it.

Your job in the working trial is to **demonstrate that you can be productive in this stack within a few days, ship a small ticket cleanly, and earn enough credibility that your architectural opinions start to land later**. Not week 1. Maybe month 3.

The single best move you can make in your first month is the setup-script + README-overhaul project I described above. It is:

- High leverage (every future engineer benefits)
- Zero risk (you're not touching prod code)
- Visible (Tienlan, Ian, and whoever else sees the PR will notice)
- Honest (you actually struggled with it, so you're the right person to fix it)
- Sets you up perfectly to propose bigger things later: *"now that onboarding is fixed, the next thing I'd look at is X..."*

That's the move.
