import type { AgentBriefReflection, AgentReport } from "../../domain/types.ts";

export function mapAgentToBrief(agentReport: AgentReport | null): AgentBriefReflection | null {
  if (!agentReport) return null;

  const patterns = agentReport.findings.slice(0, 2).map((finding) => finding.summary);
  const insight = agentReport.insights.length ? agentReport.insights[0].message : null;
  const nextSteps = agentReport.guidance
    .filter((item) => item.type !== "maintain_momentum")
    .slice(0, 2)
    .map((item) => item.message);

  if (!patterns.length && !insight && !nextSteps.length) {
    return null;
  }

  return {
    patterns,
    insight,
    nextSteps,
  };
}