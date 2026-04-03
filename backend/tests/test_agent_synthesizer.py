from app.agents.schemas import DailyContext, PatternFinding
from app.agents.synthesizer import InsightSynthesizer


def test_synthesizer_combines_carry_forward_and_overcommitment() -> None:
    synthesizer = InsightSynthesizer()
    context = DailyContext(date="2026-04-02")
    findings = [
        PatternFinding(
            type="carry_forward",
            severity="medium",
            confidence=0.8,
            summary="carry-forward detected",
        ),
        PatternFinding(
            type="overcommitment",
            severity="high",
            confidence=0.9,
            summary="overcommitment detected",
        ),
    ]

    insights = synthesizer.synthesize(context, findings)

    assert len(insights) == 1
    assert insights[0].type == "planning_load"
