from __future__ import annotations

from datetime import date

from sqlmodel import Session

from agents.collector import ContextCollector
from agents.detectors.backlog import BacklogDetector
from agents.detectors.carry_forward import CarryForwardDetector
from agents.detectors.imbalance import ImbalanceDetector
from agents.detectors.overcommitment import OvercommitmentDetector
from agents.guidance import GuidanceEngine
from agents.schemas import AgentReport
from agents.synthesizer import InsightSynthesizer


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
