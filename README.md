# AI-Assisted Citizen Request App

This project is a web platform for reporting and tracking city/town issues. It uses a Spring Boot API for backend services and a React + TypeScript frontend for the user interface.

The repository is organized as a monorepo with two main applications: `api` (backend) and `web` (frontend). The root `package.json` provides unified scripts so you can install, run, and lint both applications from one place.

## Quick start

### 1) Requirements

Install [Node.js](https://nodejs.org/en/download) (LTS), npm (comes with Node.js), [Java](https://www.java.com/en/download/) 21, and [Maven](https://maven.apache.org/install.html).

### 2) Install dependencies

Run the following from the project root:

```bash
npm run install:all
```

### 3) Start the app in development mode

```bash
npm run start:all
```

By default, the frontend runs on `http://localhost:5173` and the backend runs on `http://localhost:8080`.

### 4) Run quality checks

```bash
npm run lint
```

### 5) Apply automatic fixes

```bash
npm run lint:fix
```

## Script reference

### Root scripts (`package.json`)

| Script | What it does |
| --- | --- |
| `npm run install:api` | Fetches backend dependencies via Maven in `api/`. |
| `npm run install:web` | Installs frontend dependencies in `web/`. |
| `npm run install:all` | Installs root, frontend, and backend dependencies. |
| `npm run start:api` | Starts the Spring Boot backend. |
| `npm run start:web` | Starts the Vite frontend dev server. |
| `npm run start:all` | Starts backend and frontend together. |
| `npm run lint:api` | Runs Spotless check for backend Java code. |
| `npm run lint:api:fix` | Applies Spotless formatting to backend Java code. |
| `npm run lint:web` | Runs ESLint for frontend code. |
| `npm run lint:web:fix` | Runs ESLint with auto-fix. |
| `npm run lint` | Runs backend and frontend lint checks. |
| `npm run lint:fix` | Runs backend and frontend auto-fixes. |

### API scripts (`api/`)

| Command | What it does |
| --- | --- |
| `mvn spring-boot:run` | Starts the backend service. |
| `mvn test` | Runs backend tests. |
| `mvn spotless:check` | Verifies formatting rules for Java files. |
| `mvn spotless:apply` | Applies formatting fixes for Java files. |

### Web scripts (`web/`)

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Builds the frontend for production. |
| `npm run preview` | Serves the production build locally. |
| `npm run lint` | Runs frontend lint checks. |
| `npm run lint:fix` | Applies frontend lint auto-fixes. |

## Git hooks

Pre-commit checks are configured through `lefthook.yml` and can be run manually with:

```bash
npx lefthook run pre-commit
```

If no relevant staged files are detected, Lefthook may show tasks as skipped.

## Troubleshooting

### Spotless/JDK incompatibility error

If you see errors similar to `NoSuchMethodError` from `google-java-format`, ensure:

1. Java 21 is active in your shell
2. Spotless plugin version in `api/pom.xml` is up to date
3. local Maven cache is refreshed if needed

Helpful commands:

```bash
java -version
cd api && mvn -version
cd api && mvn spotless:check -e
```
