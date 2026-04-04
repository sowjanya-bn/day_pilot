import type { AgentReport, DailyContext, PatternFinding } from "../../domain/types.ts";
import { detectOvercommitment } from "./detectors/detectOvercommitment.ts";
import { detectCarryForward } from "./detectors/detectCarryForward.ts";
import { generateGuidance } from "./guidance.ts";
import { synthesizeInsights } from "./synthesizer.ts";


export function generateAgentReport(context: DailyContext): AgentReport {
  const findings: PatternFinding[] = [
    ...detectOvercommitment(context),
    // later:
    ...detectCarryForward(context),
    // ...detectBacklog(context),
    // ...detectImbalance(context),
  ];

  const insights = synthesizeInsights(context, findings);
  const guidance = generateGuidance(context, findings, insights);

  return {
    date: context.date,
    findings,
    insights,
    guidance,
  };
}