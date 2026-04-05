export type GuidanceEnhancementInput = {
  findings: string[];
  insight?: string;
  guidance?: string;
};

export interface LLMEnhancer {
  enhanceGuidance(input: GuidanceEnhancementInput): Promise<string | null>;
}
