# DayPilot Agent Layer Scaffold

This scaffold adds a lightweight reflective agent layer on top of a FastAPI + SQLModel task backend.

The goal is not to introduce an LLM into the core loop yet. The agent layer is a deterministic reasoning pipeline that:

- collects recent task state
- detects patterns such as carry-forward, backlog, imbalance and overcommitment
- synthesizes those patterns into higher-level insights
- returns concrete guidance that can be shown in a daily brief or after check-in

## Architecture

DayPilot already has an operational loop:

`plan -> tasks -> check-in -> daily brief`

The agent layer adds a reflective loop:

`observe -> detect -> interpret -> guide`

In code, that becomes:

`tasks -> context collector -> detectors -> insights -> guidance -> agent report`

### Why this is useful

This is more than a raw data pipeline because the system moves from facts to meaning to action:

- fact: 4 tasks have remained open for 5+ days
- interpretation: backlog is accumulating
- guidance: reduce tomorrow's plan and close one stale task first

That makes the system a feedback loop over behaviour, not just an analytics endpoint.

## Design principles

### 1. Keep persistence small
Persist raw operational truth only.

Recommended core table:

- `Task`

Optional but useful:

- `TaskEvent`

Avoid storing derived agent fields such as `backlog_score` or `carry_forward_count` on the task table. Those should be computed.

### 2. Keep the agent layer computed
The following are non-persistent models by default:

- `DailyContext`
- `PatternFinding`
- `Insight`
- `GuidanceItem`
- `AgentReport`

### 3. Use rules for detection
Use plain Python for:

- counts
- rolling ratios
- thresholds
- pattern scoring
- prioritisation

### 4. Add LLMs later only where they help
Good future use cases for an LLM:

- phrasing insights more naturally
- compressing multiple findings into a short reflection
- handling free-text user check-ins

Do not use an LLM as the primary detector at this stage.

## Package layout

```text
app/
  agents/
    collector.py
    guidance.py
    schemas.py
    service.py
    synthesizer.py
    detectors/
      base.py
      backlog.py
      carry_forward.py
      imbalance.py
      overcommitment.py
  api/
    agent.py
  models/
    task.py
```

## Core flow

1. `ContextCollector` reads tasks from the last 7 days and current open tasks.
2. Each detector emits structured `PatternFinding` objects.
3. `InsightSynthesizer` turns overlapping findings into a smaller set of user-facing insights.
4. `GuidanceEngine` maps the current state and insights into actionable next steps.
5. `AgentService` returns an `AgentReport`.

## Current scaffolded detectors

- `CarryForwardDetector`
- `BacklogDetector`
- `ImbalanceDetector`
- `OvercommitmentDetector`

## Example API

`GET /agent/daily-insights?target_date=2026-04-02`

Example response shape:

```json
{
  "date": "2026-04-02",
  "findings": [
    {
      "type": "carry_forward",
      "severity": "medium",
      "confidence": 0.8,
      "summary": "3 tasks have remained open for at least 3 days"
    }
  ],
  "insights": [
    {
      "type": "planning_load",
      "message": "A few tasks are repeatedly carrying forward, which suggests friction or overplanning."
    }
  ],
  "guidance": [
    {
      "type": "planning_adjustment",
      "title": "Reduce tomorrow's load",
      "message": "Cap tomorrow's plan at 3 tasks and finish one older task before adding more work."
    }
  ]
}
```

## Suggested integration points

### Daily brief
Generate the full `AgentReport` and attach it to the brief.

### Check-in
Run the agent after task updates to provide a short reflection.

### Plan generation
Eventually let the guidance influence how many new tasks should be planned.

## What to wire into your real app

This scaffold assumes you already have a task table and a SQLModel session dependency.

You will need to:

- replace the example `Task` model import with your actual one
- plug `get_session()` into your existing dependency setup
- decide whether category and priority already exist in your schema
- tune thresholds to match your product behaviour

## Next recommended steps

1. Drop these files into a feature branch.
2. Point the collector at your actual task model.
3. Adjust task statuses if your enum differs.
4. Add one integration test using real seeded task data.
5. Expose the report in your daily brief response.

## Future upgrades

- add `TaskEvent` for richer temporal history
- learn user-specific planning capacity
- persist `AgentReport` snapshots if you want trend history
- add an optional LLM narrator on top of the structured report
