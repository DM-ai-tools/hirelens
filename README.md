# HireLens — AI Candidate Screening & Assessment Platform

Production-ready AI candidate screening platform by **DOTMappers IT Pvt Ltd**.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, TailwindCSS, shadcn/ui
- **Backend:** Next.js Route Handlers, Server Actions
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth v5 (Credentials + JWT)
- **AI:** Claude Sonnet (Anthropic SDK)
- **Queue:** BullMQ + Redis
- **Email:** Resend + React Email
- **Reports:** Puppeteer (PDF), ExcelJS (Excel)

## Quick Start

### 1. Start infrastructure

```bash
docker compose up -d postgres redis
```

### 2. Install & configure

```bash
cd hirelens
npm install
cp .env.example .env   # already created as .env
```

### 3. Database setup

```bash
npm run db:push
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dotmappers.in | admin123 |
| Recruiter | recruiter@dotmappers.in | recruiter123 |

## Application Flow

1. **Landing** (`/`) — HireLens branded screening form
2. **Login** (`/login`) — Role-based authentication
3. **Processing** (`/processing/[jobId]`) — Live pipeline with progress
4. **Report** (`/report/[jobId]`) — Ranked candidates, assessments, PDF/Excel export
5. **Recruiter Dashboard** (`/dashboard/*`)
6. **Admin Panel** (`/admin/*`)

## Environment Variables

See `.env.example` for all configuration options.

Set `ANTHROPIC_API_KEY` for real Claude evaluation, or keep `USE_MOCK_AI=true` for demo mode without API costs.

## Deployment (Railway)

1. Connect repository to Railway
2. Add PostgreSQL service and link `DATABASE_URL=${{Postgres.DATABASE_URL}}`
3. Set `NEXTAUTH_URL` and `AUTH_URL` to your Railway public URL
4. Deploy using included `Dockerfile` and `railway.json`
5. **Networking:** In the app service → Settings → Networking → Public domain → set **Target port** to Railway's `PORT` (usually **8080**). If you see "The train has not arrived at the station", regenerate the domain and confirm the target port matches deploy logs (`Starting server on 0.0.0.0:8080`).

```bash
docker compose up --build
```

## Project Structure

```
src/
  app/           # Pages & API routes
  actions/       # Server actions
  components/    # UI components
  emails/        # React Email templates
  hooks/         # Custom hooks
  lib/           # Auth, prisma, utils
  services/      # Business logic (AI, parsing, scoring, reports)
  types/         # TypeScript types
prisma/          # Schema, migrations, seed
```

## Scoring Rubric

| Factor | Weight |
|--------|--------|
| Must-have skills | 40% |
| Relevant experience | 25% |
| Nice-to-have skills | 15% |
| Domain match | 10% |
| Role/seniority match | 10% |

**Good to Call:** Score ≥ 70 AND all must-haves present
