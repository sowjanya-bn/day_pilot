import type { GuidanceEnhancementInput, LLMEnhancer } from './enhancer.ts';

const OLLAMA_URL = 'http://localhost:11434/api/generate';

function buildPrompt(input: GuidanceEnhancementInput): string {
  return `
You are a calm, thoughtful productivity assistant.

Given:

Findings:
${input.findings.map((f) => `- ${f}`).join('\n')}

Insight:
${input.insight ?? 'None'}

Guidance:
${input.guidance ?? 'None'}

Rewrite the guidance as ONE short natural sentence.

Rules:
- Under 25 words
- Gentle and non-judgmental
- Do NOT invent new facts
- Do NOT add extra advice
- Return ONLY the sentence
`;
}

export const ollamaEnhancer: LLMEnhancer = {
  async enhanceGuidance(input) {
    try {
      const prompt = buildPrompt(input);

      //       console.log('Sending prompt to Ollama:', prompt);

      const res = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'phi3:mini',
          prompt,
          stream: false,
        }),
      });

      if (!res.ok) {
        throw new Error(`Ollama error: ${res.status}`);
      }

      const data = await res.json();
      const text = data?.response?.trim?.();

      //       console.log('Received response from Ollama:', text);

      return text || null;
    } catch (err) {
      console.log('LLM enhancer failed', err);
      return null;
    }
  },
};
