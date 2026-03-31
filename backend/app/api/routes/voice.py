from fastapi import APIRouter

from app.models.voice import VoiceCheckinDraftRequest, VoiceCheckinDraftResponse
from app.services.voice_checkin_service import build_voice_checkin_draft

router = APIRouter(tags=["voice"])


@router.post("/checkin/voice-draft", response_model=VoiceCheckinDraftResponse)
def create_voice_checkin_draft(
    payload: VoiceCheckinDraftRequest,
) -> VoiceCheckinDraftResponse:
    return build_voice_checkin_draft(payload)