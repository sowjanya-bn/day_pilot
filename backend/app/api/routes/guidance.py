from datetime import date

from fastapi import APIRouter

from app.models.guidance import CarryForwardResponse
from app.services.guidance_service import get_carry_forward
from app.services.store import store

router = APIRouter(tags=["guidance"])


@router.get("/carry-forward/{day}", response_model=CarryForwardResponse)
def carry_forward(day: date) -> dict:
    return get_carry_forward(day, store)