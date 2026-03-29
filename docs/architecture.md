# Architecture Notes

## Current shape

Mobile App -> FastAPI Backend -> SQLite

## Future modules

- Planner Service
- Check-in Service
- Recommendation Service
- Job Search Adapter
- Notification Scheduler
- Agent Orchestrator

## Possible future agent flow

1. Planner agent reads today's state
2. Reflection agent evaluates completion and blockers
3. Recommendation agent proposes next learning steps
4. Job agent fetches recent roles by saved keywords
5. Social agent proposes one lightweight connection goal

## Deployment options later

- Backend on Railway, Render or Fly.io
- Postgres instead of SQLite
- Expo EAS or React Native production build
- Background jobs via Celery, APScheduler or cloud scheduler
