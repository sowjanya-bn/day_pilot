import type { PatternFinding } from '../../domain/types.ts';

function severityWeight(severity: PatternFinding['severity']): number {
  switch (severity) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
}

function clampConfidence(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function defaultDedupeKey(finding: PatternFinding): string {
  return finding.type;
}

function normalizeFindings(findings: PatternFinding[]): PatternFinding[] {
  return findings.map((finding) => {
    const confidence = clampConfidence(finding.confidence);
    const score = severityWeight(finding.severity) * 10 + confidence;

    return {
      ...finding,
      confidence,
      score,
      dedupeKey: finding.dedupeKey ?? defaultDedupeKey(finding),
    };
  });
}

function dedupeFindings(findings: PatternFinding[]): PatternFinding[] {
  const byKey = new Map<string, PatternFinding>();

  for (const finding of findings) {
    const key = finding.dedupeKey ?? finding.type;
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, finding);
      continue;
    }

    const existingScore = existing.score ?? 0;
    const currentScore = finding.score ?? 0;

    if (currentScore > existingScore) {
      byKey.set(key, finding);
    }
  }

  return Array.from(byKey.values());
}

function rankFindings(findings: PatternFinding[]): PatternFinding[] {
  return [...findings].sort((a, b) => {
    const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
    if (scoreDiff !== 0) return scoreDiff;

    const confidenceDiff = b.confidence - a.confidence;
    if (confidenceDiff !== 0) return confidenceDiff;

    return a.type.localeCompare(b.type);
  });
}

function limitFindings(
  findings: PatternFinding[],
  limit: number,
): PatternFinding[] {
  return findings.slice(0, limit);
}

export function processFindings(findings: PatternFinding[]): PatternFinding[] {
  const normalized = normalizeFindings(findings);
  const deduped = dedupeFindings(normalized);
  const ranked = rankFindings(deduped);
  return limitFindings(ranked, 5);
}
