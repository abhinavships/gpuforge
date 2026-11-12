# GPUForge

**LeetCode for GPU programming.** A practice arena for CUDA, memory architecture, parallel algorithms and hardware fundamentals, with an in-browser editor, XP and a leaderboard.

![React](https://img.shields.io/badge/React-18-61DAFB) ![Express](https://img.shields.io/badge/Express-4-339933) ![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57) ![Status](https://img.shields.io/badge/judge-simulated-orange)

## What is in it

- **14 problems** across CUDA fundamentals, memory architecture, parallel algorithms, hardware architecture, advanced GPU, hardware fundamentals and Metal/Vulkan
- **Three tiers**: Novice, Warrior, Legend
- **Monaco editor** in the browser (the editor behind VS Code)
- **Progression**: XP, levels, achievements, titles, daily challenge with bonus XP
- **Leaderboard** and per-problem discussion threads
- **Accounts**: register, login, token sessions, rate-limited submissions
- **One process, one file database**: Express serves the API and the built frontend; data lives in SQLite

## Status

The product loop works end to end: browse, open a problem, write code, submit, earn XP, climb the board.

Submissions are **not executed yet**. `simulateTestExecution` in `backend/server.js` is a placeholder that checks the shape of the code. Real grading means wiring a sandboxed runner such as [Judge0 CE](https://github.com/judge0/judge0), which is the next milestone.

## Run locally

```bash
git clone https://github.com/abhinavships/gpuforge.git
cd gpuforge
npm install
```

```bash
cd backend && npm install && npm run dev
```

```bash
cd frontend && npm install && npm run dev
```

Open `http://localhost:5173`. The API runs on port 3001.

## Deploy

The repo ships a Render blueprint (`render.yaml`): one web service that builds the frontend, starts `backend/server.prod.js` and mounts a 1 GB disk for the SQLite file. A `backend/Dockerfile` and `backend/railway.toml` cover Railway or any container host.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3001` | API port |
| `NODE_ENV` | `development` | Environment |
| `FRONTEND_URL` | `*` | Allowed CORS origin; set this in production |
| `DB_PATH` | `backend/db/gpuforge.db` | SQLite file location |
| `VITE_API_URL` | `/api` | Frontend API base URL |

## Layout

```
backend/
  server.js          API: auth, problems, submissions, leaderboard, discussions
  server.prod.js     same API plus static frontend serving
  db/database.js     schema and queries
  problems/          problem definitions and test cases
frontend/
  src/pages/         Home, Problems, ProblemDetail, Leaderboard, Profile, Auth
  src/hooks/         useAPI, useAuth
render.yaml          one-click Render blueprint
```

## Roadmap

- Real code execution through a sandboxed judge
- Slow password hashing (scrypt or argon2) and persistent sessions
- More problems, plus Triton and SIMD tracks
