from __future__ import annotations

from datetime import date

from sqlmodel import Session

from app.agents.collector import ContextCollector
from app.agents.detectors.backlog import BacklogDetector
from app.agents.detectors.carry_forward import CarryForwardDetector
from app.agents.detectors.imbalance import ImbalanceDetector
from app.agents.detectors.overcommitment import OvercommitmentDetector
from app.agents.guidance import GuidanceEngine
from app.agents.schemas import AgentReport
from app.agents.synthesizer import InsightSynthesizer


class AgentService:
    def __init__(self) -> None:
        self.collector = ContextCollector()
        self.detectors = [
            CarryForwardDetector(),
            BacklogDetector(),
            ImbalanceDetector(),
            OvercommitmentDetector(),
        ]
        self.synthesizer = InsightSynthesizer()
        self.guidance = GuidanceEngine()

    def generate_daily_report(self, session: Session, target_date: date) -> AgentReport:
        context = self.collector.collect(session, target_date)
        print("CONTEXT:", context.model_dump())
        context = self.collector.collect(session, target_date)

        findings = []
        for detector in self.detectors:
            findings.extend(detector.detect(context))

        insights = self.synthesizer.synthesize(context, findings)
        guidance = self.guidance.generate(context, findings, insights)

        return AgentReport(
            date=target_date,
            findings=findings,
            insights=insights,
            guidance=guidance,
        )
