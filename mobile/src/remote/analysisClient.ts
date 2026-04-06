const ANALYSIS_API_URL = 'http://127.0.0.1:8000/api/analysis/activity';

export async function analyzeActivity(payload: unknown) {
  const response = await fetch(ANALYSIS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Analysis request failed: ${response.status}`);
  }

  return response.json();
}