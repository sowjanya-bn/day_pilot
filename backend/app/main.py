from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import analysis, health, stats, tasks
from app.core.config import settings
from app.db import create_db_and_tables
from app.api.routes.context import router as context_router
from app.api.routes.briefing import router as briefing_router


app = FastAPI(title=settings.app_name, version="0.1.0")


@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")
app.include_router(context_router, prefix="/api")
app.include_router(briefing_router, prefix="/api")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "DayPilot backend is running"}
