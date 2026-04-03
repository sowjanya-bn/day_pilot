from __future__ import annotations

from abc import ABC, abstractmethod

from app.agents.schemas import DailyContext, PatternFinding


class PatternDetector(ABC):
    @abstractmethod
    def detect(self, context: DailyContext) -> list[PatternFinding]:
        raise NotImplementedError
