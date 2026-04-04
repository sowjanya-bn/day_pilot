import type {
  AgentReport,
  DailyContext,
  PatternFinding,
} from "../domain/types.ts";
import { detectOvercommitment } from "./detectors/detectOvercommitment.ts";
import { detectCarryForward } from "./detectors/detectCarryForward.ts";
import { processFindings } from "./processFindings.ts";
import { generateGuidance } from "./guidance.ts";
import { synthesizeInsights } from "./synthesizer.ts";

const detectors = [
  detectOvercommitment,
  detectCarryForward,
];

export function generateAgentReport(context: DailyContext): AgentReport {
  const rawFindings: PatternFinding[] = detectors.flatMap((detector) =>
    detector(context)
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