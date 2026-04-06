# DayPilot

DayPilot is a local-first, agent-assisted planning system that helps manage daily work with lightweight guidance and real-time feedback.

It is designed to feel simple, fast and supportive rather than overwhelming.

---

## Core capabilities

- Plan daily tasks, learning goals and job actions
- Track completion and carry-forward tasks
- Defer tasks to reduce daily load without losing them
- Receive real-time nudges while planning
- Generate structured daily insights and guidance
- Optionally enhance guidance using a local LLM

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
- SQLite (via Expo SQLite)
- Tasks, plans and check-ins stored locally

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

## UX behavior

- Tasks update instantly (optimistic UI)
- Interventions update immediately when tasks change
- Defer moves tasks to the next day
- System never blocks user actions

---

## Project structure

mobile/
  src/
    local/
      agent/
      storage/
      llm/
      utils/

---

## Tech stack

### Mobile
- React Native (Expo)
- Local state + SQLite

### Agent
- TypeScript-based rule system
- No external dependency

### LLM (optional)
- Ollama (local)
- Phi-3 Mini (recommended)

---

## Development setup

### Mobile

cd mobile
npm install
npm start

---

### Optional LLM

brew install ollama
ollama pull phi3:mini
ollama serve

---

## Current status

Phase 1 complete:

- Local-first data model
- Agent pipeline (findings → insights → guidance)
- Real-time planning interventions
- Optimistic task updates (done, defer)
- Optional LLM enhancement layer

---

## Next steps

- Improve intervention intelligence (pattern awareness)
- Add stuck-task detection
- Add weekly summaries
- Explore on-device LLM integration

---

## Notes

DayPilot is intentionally minimal.
The goal is to build a system that supports decisions without adding complexity.
