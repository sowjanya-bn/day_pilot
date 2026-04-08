from fastapi import APIRouter

from app.models.analysis import DailyAnalysisRequest, DailyAnalysisResponse
from app.services.analysis_service import analyze_daily_context

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/daily", response_model=DailyAnalysisResponse)
def analyze_daily(payload: DailyAnalysisRequest) -> DailyAnalysisResponse:
    return analyze_daily_context(payload)
