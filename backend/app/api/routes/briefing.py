from fastapi import APIRouter

from app.models.briefing import BriefingRequest, DailySnippet
from app.flows.enrichment_flow import run_enrichment_flow

router = APIRouter()


@router.post("/briefing/daily", response_model=DailySnippet)
async def daily_briefing(payload: BriefingRequest) -> DailySnippet:
    return await run_enrichment_flow(payload)
