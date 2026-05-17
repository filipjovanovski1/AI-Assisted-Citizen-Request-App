# AI-Assisted Citizen Request App

A full-stack platform for citizens to report and track city/town issues. Requests are automatically triaged by an AI model (GPT-4o-mini) and routed to the responsible municipal department.

## Architecture

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Backend | Spring Boot (Java 21) |
| Database | PostgreSQL + Flyway |
| Container | Docker + Docker Compose |

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose — for the Docker quick start
- [Node.js](https://nodejs.org/en/download) LTS + npm — for local frontend dev
- [Java 21](https://adoptium.net/) + Maven — for local backend dev

---

## Quick Start — Docker (recommended)

```bash
git clone <repo-url>
cd AI-Assisted-Citizen-Request-App

cp .env.example .env
# Edit .env and fill in AI_OPENAI_API_KEY at minimum

docker compose up --build -d
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080

To stop: `docker compose down`

---

## Quick Start — Local Development

```bash
git clone <repo-url>
cd AI-Assisted-Citizen-Request-App

cp .env.example .env
# Edit .env — set DB_USER, DB_PASSWORD, JWT_SECRET, AI_OPENAI_API_KEY

# Start PostgreSQL (must be running and match DB_* vars in .env)

# Install dependencies
npm run install:all

# Start backend + frontend
npm run start:all
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values before running.

| Variable | Description | Default |
|---|---|---|
| `DB_NAME` | PostgreSQL database name | `citizen_requests_db` |
| `DB_USER` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | — |
| `JWT_SECRET` | JWT signing secret (≥ 32 chars) | — |
| `JWT_EXPIRATION_MS` | Token lifetime in milliseconds | `86400000` (24 h) |
| `AI_OPENAI_API_KEY` | OpenAI API key | — |
| `AI_OPENAI_MODEL` | OpenAI model name | `gpt-4o-mini` |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `http://localhost:5173` |
| `VITE_API_URL` | Backend URL used by Vite proxy | `http://localhost:8080` |

---

## Database & Migrations

Flyway runs automatically on startup. Migration files live in `api/src/main/resources/db/migration/`:

| File | Description |
|---|---|
| `V1__init.sql` | Core schema (users, departments, requests, comments, votes, AI triage) |
| `V2__seed_departments_and_staff.sql` | Seed departments and staff accounts |
| `V3__add_created_at_to_service_request.sql` | Adds `created_at` column |

### Seed Data (V2)

The V2 migration creates default department accounts you can log in with immediately:

| Email | Password | Role | Department |
|---|---|---|---|
| `admin@city.com` | `admin123` | ADMIN | — |
| `roads@city.com` | `staff123` | STAFF | Roads & Infrastructure |
| `utilities@city.com` | `staff123` | STAFF | Utilities |
| `parks@city.com` | `staff123` | STAFF | Parks & Recreation |
| `waste@city.com` | `staff123` | STAFF | Waste Management |
| `safety@city.com` | `staff123` | STAFF | Public Safety |

---

## Script Reference

### Root scripts (`package.json`)

| Script | What it does |
|---|---|
| `npm run install:all` | Installs root, frontend, and backend dependencies |
| `npm run start:all` | Starts backend and frontend together |
| `npm run start:api` | Starts the Spring Boot backend only |
| `npm run start:web` | Starts the Vite frontend dev server only |
| `npm run lint` | Runs backend and frontend lint checks |
| `npm run lint:fix` | Runs backend and frontend auto-fixes |

### API scripts (`api/`)

| Command | What it does |
|---|---|
| `./mvnw spring-boot:run` | Starts the backend |
| `./mvnw test` | Runs backend tests |
| `./mvnw spotless:check` | Verifies Java formatting |
| `./mvnw spotless:apply` | Applies Java formatting fixes |

### Web scripts (`web/`)

| Command | What it does |
|---|---|
| `npm run dev` | Starts the Vite development server |
| `npm run build` | Builds the frontend for production |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Runs ESLint |
| `npm run lint:fix` | Runs ESLint with auto-fix |

---

## Linting & Git Hooks

Pre-commit checks run automatically via [Lefthook](https://github.com/evilmartians/lefthook) (`lefthook.yml`). To run manually:

```bash
npx lefthook run pre-commit
```

---

## Troubleshooting

### Port already in use

```bash
lsof -i :8080   # find what's using the port
lsof -i :5173
```

### Database connection refused

Ensure PostgreSQL is running and `DB_*` variables in `.env` match your local setup.

### Spotless / JDK incompatibility

If you see `NoSuchMethodError` from `google-java-format`, confirm Java 21 is active:

```bash
java -version
cd api && ./mvnw -version
cd api && ./mvnw spotless:check -e
```

### Docker: API fails to start

Check logs: `docker compose logs api`. Common causes: missing `AI_OPENAI_API_KEY` in `.env`, or database not yet ready (retry logic is built-in via Spring retry).

