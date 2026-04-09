from fastapi import APIRouter, Query

from app.agents.analyzer import StatelessAnalyzer
from app.models.analysis import AnalysisRequest, AnalysisResponse

router = APIRouter(prefix="/analysis", tags=["analysis"])

_analyzer = StatelessAnalyzer()


@router.post("", response_model=AnalysisResponse)
def analyze(
    payload: AnalysisRequest,
    period: str = Query(default="weekly", pattern="^(weekly|fortnightly|monthly)$"),
) -> AnalysisResponse:
    return _analyzer.analyze(payload, period)
