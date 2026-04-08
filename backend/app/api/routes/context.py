from fastapi import APIRouter
from app.flows.context_flow import run_context_flow
from app.models.context import ContextTodayRequest, ContextTodayResponse

router = APIRouter(prefix="/context", tags=["context"])

@router.post("/today", response_model=ContextTodayResponse)
async def get_today_context(payload: ContextTodayRequest) -> ContextTodayResponse:
    return await run_context_flow(payload)
