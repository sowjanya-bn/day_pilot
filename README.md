# DayPilot

DayPilot is a local-first, agent-assisted planning system that helps manage daily work with lightweight guidance, real-time feedback, and a personalised content briefing.

It is designed to feel simple, fast and supportive rather than overwhelming.

---

## Core capabilities

- Plan daily tasks, learning goals and job actions
- Track completion and carry-forward tasks
- Defer tasks to reduce daily load without losing them
- Receive real-time nudges while planning
- Generate structured daily insights and guidance
- Pull a personalised daily briefing — articles, tools and news matched to today's tasks
- Browse plans and tasks across all days

---

## System design

DayPilot is built around a simple loop:

Tasks → Context → Agent → Guidance → UI → Tasks

### Key principles

- Local-first (no backend required for core functionality)
- Deterministic logic (agent produces consistent outputs)
- Optional AI layer (LLM enhances wording, not logic)
- Immediate UI feedback (optimistic updates)

---

## Architecture overview

### Storage
- SQLite (via Expo SQLite) on mobile
- SQLite on backend (via SQLModel)
- Tasks, plans and check-ins stored locally on device

### Agent pipeline
- Builds a `DailyContext` from recent tasks
- Runs detectors to identify patterns:
  - overcommitment
  - carry-forward
  - backlog pressure
  - imbalance
- Produces:
  - findings
  - insights
  - guidance

### Daily briefing (enrichment agent)
- Triggered on demand from the Today screen
- Posts today's tasks to the backend
- Backend extracts topics from task titles and categories (compound-term aware: "react native", "machine learning" etc.)
- Fans out in parallel to three content sources:
  - Hacker News (Algolia search API)
  - GitHub (repository search by topic)
  - Dev.to (articles by tag)
- Ranks and splits content into three buckets:
  - **Learn** — tutorials, guides, how-tos matched to learning goals
  - **Pulse** — news and discussion in your space
  - **Tools** — relevant repos and libraries
- Returns a `DailySnippet` displayed as a card with tappable links

### Interventions (real-time)
- Evaluates current task list during planning
- Generates lightweight nudges such as:
  - plan too full
  - tasks being carried forward
  - imbalance across categories

### LLM (optional)
- Local model (e.g. Phi-3 via Ollama)
- Used only to improve tone of guidance
- Never affects logic or decisions

---

## UX behaviour

- Opens to today's date automatically
- Tasks update instantly (optimistic UI)
- Interventions update immediately when tasks change
- Defer moves tasks to the next day
- Header date arrows (‹ ›) navigate across any day — Tasks tab updates to show that day
- Plan tab shows all persisted plans (newest first, expandable) plus a form for the selected date
- System never blocks user actions

---

## Project structure

```
day_pilot/
├── backend/
│   └── app/
│       ├── api/routes/          # REST endpoints
│       ├── flows/               # Orchestration (context, enrichment)
│       ├── services/            # Business logic
│       ├── integrations/        # HN, GitHub, Dev.to
│       └── models/              # Pydantic models
│
└── mobile/
    └── src/
        ├── api/                 # Backend REST clients
        ├── features/briefing/   # UI cards (briefing, snippet)
        ├── local/
        │   ├── agent/           # Local agent pipeline
        │   ├── storage/         # SQLite abstraction
        │   ├── llm/             # Ollama integration
        │   └── brief/           # Daily brief pipeline
        └── domain/              # TypeScript types
```

---

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health check |
| POST | `/api/context/today` | Build daily context (focus, outstanding, news) |
| POST | `/api/briefing/daily` | Enrichment agent — returns Learn / Pulse / Tools snippet |
| POST | `/api/analysis/daily` | Analyse activity patterns |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/{day}` | List tasks for date |
| PUT | `/api/tasks/{task_id}/status` | Update task status |
| GET | `/api/stats/{day}` | Daily stats |

---

## Tech stack

### Mobile
- React Native (Expo)
- Local state + SQLite

### Backend
- Python / FastAPI
- SQLite via SQLModel
- httpx for async HTTP

### Agent
- TypeScript rule system (mobile, offline-first)
- Python service (backend, REST-accessible)

### Content sources
- Hacker News Algolia API (no key required)
- GitHub repository search API
- Dev.to articles API (no key required)

### LLM (optional)
- Ollama (local)
- Phi-3 Mini (recommended)

---

## Development setup

### Backend

```bash
cd backend
python3 -m venv .daypilot
source .daypilot/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Mobile

```bash
cd mobile
npm install
npm start
# Press i to open iOS simulator
```

### Optional LLM

```bash
brew install ollama
ollama pull phi3:mini
ollama serve
```

---

## Current status

Phase 2 complete:

- Local-first data model
- Agent pipeline (findings → insights → guidance)
- Real-time planning interventions
- Optimistic task updates (done, defer)
- Optional LLM enhancement layer
- Daily enrichment briefing (HN + GitHub + Dev.to, topic-aware)
- Clean bottom-tab navigation (Today / Tasks / Plan / Log)
- Plan history — all persisted plans browsable in the Plan tab
- Cross-day task browsing via header date navigation
- Auto-loads today's date on boot

---

## Next steps

- Cache daily snippet by date (avoid re-fetching on every tap)
- Trigger briefing automatically on boot
- Add more content sources (Reddit, RSS, YouTube)
- Improve intervention intelligence (pattern awareness)
- Add stuck-task detection
- Add weekly summaries
- Explore on-device LLM integration

---

## Notes

DayPilot is intentionally minimal.
The goal is to build a system that supports decisions without adding complexity.
