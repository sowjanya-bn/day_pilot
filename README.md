# Day Pilot

A starter project for a goal-oriented companion app that helps with:

- planning tomorrow's agenda
- end-of-day stand-up style check-ins
- learning goals and next steps
- helpful links and coursework prompts
- job search nudges
- gentle social goalxxxxxs
cc
This is an initial scaffold, not a finished product. It gives you a clean starting point with:

- `backend/` – FastAPI service with placeholder endpoints
- `mobile/` – Expo React Native app scaffold
- `docs/` – product and architecture notes

## Suggested MVP flow

1. Evening prompt asks: what needs to happen tomorrow?
2. User enters tasks, learning goals and optional social goal.
3. App stores a daily plan.
4. Next day, the app shows the plan and reminders.
5. Evening review asks what was done, blocked or deferred.
6. Future agent modules can suggest learning links and job postings.

## Tech choices

### Backend
- FastAPI
- SQLModel placeholder for future persistence
- SQLite for local development

### Mobile
- Expo + React Native
- Basic tab-like navigation using state for simplicity

## Quick start

### Backend
```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs on `http://127.0.0.1:8000`

### Mobile
```bash
cd mobile
npm install
npm start
```

Then open in Expo Go or an emulator.

## Next implementation steps

1. Add persistent storage for plans and check-ins.
2. Add local notifications on the phone.
3. Add auth if you want multi-device sync.
4. Add agent modules for learning recommendations and job search.
5. Add a scheduler or background worker for daily prompts.
6. Connect calendar, email or task sources later if needed.

## Naming

Project name: **DayPilot**

## Notes

This scaffold aims to be practical and commercial-friendly. It is intentionally simple so you can grow it into a production-shaped architecture without fighting the starter code.
