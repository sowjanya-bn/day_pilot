import type { DailyContext, Insight, PatternFinding } from '../domain/types.ts';
import { detectOvercommitment } from './detectors/detectOvercommitment.ts';
import { detectCarryForward } from './detectors/detectCarryForward.ts';
import { detectBacklogPressure } from './detectors/detectBacklogPressure.ts';
import { processFindings } from './processFindings.ts';
import { generateGuidance } from './guidance.ts';
import { synthesizeInsights } from './synthesizeInsights.ts';

const detectors = [
  detectOvercommitment,
  detectCarryForward,
  detectBacklogPressure,
];

export function generateAgentReport(context: DailyContext): AgentReport {
  const rawFindings: PatternFinding[] = detectors.flatMap((detector) =>
    detector(context),
  );

  const findings = processFindings(rawFindings);
  const insights = synthesizeInsights(context, findings);
  const guidance = generateGuidance(context, findings, insights);

  return {
    date: context.analysisDate,
    findings,
    insights,
    guidance,
  };
}
