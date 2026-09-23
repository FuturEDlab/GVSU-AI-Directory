export interface SimplifiedTool {
  id: string;
  name: string;
  description: string;
  category: string;
  tags?: string;
}

export function normalizeTokens(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ') // remove punctuation
    .split(/\s+/)
    .filter(t => t.length > 2); // remove tiny stop words essentially
}

export function scoreTool(tool: SimplifiedTool, queryTokens: string[]): number {
  if (!queryTokens.length) return 0;
  
  const nameTokens = normalizeTokens(tool.name);
  const tagTokens = normalizeTokens(tool.tags || '');
  const catTokens = normalizeTokens(tool.category);
  const descTokens = normalizeTokens(tool.description);

  let score = 0;
  
  for (const qt of queryTokens) {
    // Weighted scoring
    if (nameTokens.some(nt => nt.includes(qt) || qt.includes(nt))) score += 10;
    if (tagTokens.some(tt => tt.includes(qt) || qt.includes(tt))) score += 6;
    if (catTokens.some(ct => ct.includes(qt) || qt.includes(ct))) score += 5;
    if (descTokens.some(dt => dt.includes(qt) || qt.includes(dt))) score += 2;
  }
  return score;
}

export function retrieveCandidates(tools: SimplifiedTool[], question: string): SimplifiedTool[] {
  const queryTokens = normalizeTokens(question);
  
  const scored = tools.map(t => ({ tool: t, score: scoreTool(t, queryTokens) }));
  
  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);
  
  // Get tools with at least some match
  const matched = scored.filter(s => s.score > 0).map(s => s.tool);
  
  // Fallback Strategy: If we have fewer than 8 candidates, pad it out with top overall category matches or broadly useful tools
  // Since we already sorted by score, we'll just take the absolute top scoring tools even if score is 0, 
  // ensuring we always pass a minimum bounded set of 8 (or total tools if less than 8) for Gemini to evaluate contextually
  let finalCandidates = matched;
  if (finalCandidates.length < 8) {
    finalCandidates = scored.slice(0, 8).map(s => s.tool);
  }
  
  // Maximum 20 candidates
  return finalCandidates.slice(0, 20);
}
