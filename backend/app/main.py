from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import checkin, guidance, health, planner, brief
from app.core.config import settings
from app.db import create_db_and_tables


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
app.include_router(planner.router, prefix="/api")
app.include_router(checkin.router, prefix="/api")
app.include_router(guidance.router, prefix="/api")
app.include_router(brief.router, prefix="/api")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "DayPilot backend is running"}