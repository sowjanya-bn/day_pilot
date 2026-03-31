import re
from datetime import date

from app.models.voice import VoiceCheckinDraftRequest, VoiceCheckinDraftResponse


COMPLETED_PATTERNS = [
    r"(?:i finished|i completed|i did|i got done|i wrapped up)\s+(.+?)(?:[.!?]|$)",
]

INCOMPLETE_PATTERNS = [
    r"(?:i didn't finish|i did not finish|i still haven't|i havent|i have not)\s+(.+?)(?:[.!?]|$)",
    r"(?:i still need to|i need to|i didn't do)\s+(.+?)(?:[.!?]|$)",
]

BLOCKER_KEYWORDS = [
    "tired",
    "low energy",
    "overwhelmed",
    "distracted",
    "poor focus",
    "busy",
    "stuck",
    "anxious",
    "stress",
    "stressed",
]

LOW_MOOD_KEYWORDS = [
    "tired",
    "overwhelmed",
    "drained",
    "anxious",
    "stressed",
    "exhausted",
    "low",
]

GOOD_MOOD_KEYWORDS = [
    "good",
    "happy",
    "productive",
    "steady",
    "calm",
    "pleased",
]


def _extract_matches(text: str, patterns: list[str]) -> list[str]:
    results: list[str] = []
    for pattern in patterns:
        matches = re.findall(pattern, text, flags=re.IGNORECASE)
        for match in matches:
            cleaned = match.strip(" .,;:-")
            if cleaned:
                results.append(cleaned[:120])
    return list(dict.fromkeys(results))


def _infer_blockers(text: str) -> list[str]:
    lowered = text.lower()
    found = [kw for kw in BLOCKER_KEYWORDS if kw in lowered]
    return list(dict.fromkeys(found))


def _infer_mood(text: str) -> str:
    lowered = text.lower()

    if any(word in lowered for word in LOW_MOOD_KEYWORDS):
        return "low"

    if any(word in lowered for word in GOOD_MOOD_KEYWORDS):
        return "good"

    return "steady"


def _extract_learned(text: str) -> str | None:
    patterns = [
        r"(?:i learned|i realised|i realized|i understood)\s+(.+?)(?:[.!?]|$)",
    ]
    matches = _extract_matches(text, patterns)
    return matches[0] if matches else None


def _extract_small_win(text: str) -> str | None:
    patterns = [
        r"(?:small win was|small win is|i'm glad i|i am glad i|at least i)\s+(.+?)(?:[.!?]|$)",
    ]
    matches = _extract_matches(text, patterns)
    return matches[0] if matches else None


def build_voice_checkin_draft(
    payload: VoiceCheckinDraftRequest,
) -> VoiceCheckinDraftResponse:
    transcript = payload.transcript.strip()

    completed = _extract_matches(transcript, COMPLETED_PATTERNS)
    incomplete = _extract_matches(transcript, INCOMPLETE_PATTERNS)
    blockers = _infer_blockers(transcript)
    learned = _extract_learned(transcript)
    small_win = _extract_small_win(transcript)
    mood = _infer_mood(transcript)

    notes = transcript if transcript else None

    return VoiceCheckinDraftResponse(
        date=payload.date,
        completed=completed,
        incomplete=incomplete,
        blockers=blockers,
        carry_forward=incomplete,
        learned=learned,
        small_win=small_win,
        mood=mood,
        notes=notes,
        transcript=transcript,
    )