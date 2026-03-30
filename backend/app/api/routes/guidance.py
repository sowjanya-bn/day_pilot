from datetime import date

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db import get_session
from app.models.guidance import CarryForwardResponse
from app.services.guidance_service import get_carry_forward

router = APIRouter(tags=["guidance"])


@router.get("/carry-forward/{day}", response_model=CarryForwardResponse)
def carry_forward(
    day: date,
    session: Session = Depends(get_session),
) -> CarryForwardResponse:
    return get_carry_forward(session, day)