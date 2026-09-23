/**
 * content-moderation.ts
 * A reusable content moderation service to detect profanity, abusive language,
 * and inappropriate content in user inputs before processing with AI models.
 */

// A configurable dictionary of common abusive/profane terms.
// This list can be expanded or fetched from a remote config in the future.
const BAD_WORDS = [
  "fuck",
  "fucking",
  "ass",
  "asshole",
  "motherfucker",
  "bitch",
  "shit",
  "bullshit",
  "damn",
  "cunt",
  "dick",
  "pussy",
  "whore",
  "slut",
  "faggot",
  "nigger",
  "nigga",
  "retard",
  "kill yourself",
  "rape",
];

// Map of common obfuscation characters to their normalized alphabetical equivalents.
const OBFUSCATION_MAP: Record<string, string> = {
  '@': 'a',
  '4': 'a',
  '8': 'b',
  '(': 'c',
  '[': 'c',
  '<': 'c',
  '3': 'e',
  '#': 'h',
  '1': 'i',
  '!': 'i',
  '|': 'i',
  '0': 'o',
  '$': 's',
  '5': 's',
  '7': 't',
  '+': 't',
  'v': 'u',
  '*': '',
  '-': '',
  '_': '',
  '.': '',
};

/**
 * Normalizes text by converting to lowercase and resolving common obfuscations
 * (e.g., f*ck -> fck, sh1t -> shit, a$$ -> ass).
 */
function normalizeText(text: string): string {
  let normalized = text.toLowerCase();
  for (const [char, replacement] of Object.entries(OBFUSCATION_MAP)) {
    // Replace all instances of the character with its replacement
    normalized = normalized.split(char).join(replacement);
  }
  return normalized;
}

export interface ModerationResult {
  isSafe: boolean;
  matchedTerms: string[];
  violationType?: string;
  severity?: "low" | "medium" | "high";
}

/**
 * Checks a given string against the moderation dictionary.
 * 
 * @param text The user input to moderate.
 * @returns ModerationResult indicating if the content is safe and any matched terms.
 */
export function moderateContent(text: string): ModerationResult {
  if (!text) return { isSafe: true, matchedTerms: [] };

  const normalizedText = normalizeText(text);
  
  // Create word boundaries for the raw text to prevent false positives like "bass" -> "ass", 
  // but for normalized text, we might just check inclusion for obfuscated terms.
  // We'll use a combination approach.
  
  const rawWords = text.toLowerCase().split(/[\s,.-]+/);
  const matchedTerms: Set<string> = new Set();

  for (const badWord of BAD_WORDS) {
    // 1. Exact match in raw words
    if (rawWords.includes(badWord)) {
      matchedTerms.add(badWord);
    }
    
    // 2. Substring match in normalized text for obfuscations
    // e.g. if badWord is "fuck", and normalized text is "fck"
    // Wait, normalizing removes "*", so "f*ck" becomes "fck".
    // We should normalize the badWord the same way to compare.
    const normalizedBadWord = normalizeText(badWord);
    if (normalizedText.includes(normalizedBadWord) && normalizedBadWord.length > 2) {
      // Basic safeguard: don't match very short normalized strings as substrings to avoid massive false positives.
      // E.g., "ass" is length 3, which is fine.
      
      // Let's ensure it's surrounded by boundaries or is the exact normalized word
      const regex = new RegExp(`\\b${normalizedBadWord}\\b`, 'i');
      if (regex.test(normalizedText) || rawWords.some(w => normalizeText(w).includes(normalizedBadWord))) {
         matchedTerms.add(badWord);
      }
    }
  }

  const isSafe = matchedTerms.size === 0;

  if (!isSafe) {
    // Basic severity logic: we'll default to 'medium' for profanity.
    // Extremely offensive slurs could be classified as 'high' in a more advanced implementation.
    let severity: "low" | "medium" | "high" = "medium";
    
    const highSeverityTerms = ["nigger", "nigga", "faggot", "kill yourself", "rape"];
    for (const term of matchedTerms) {
      if (highSeverityTerms.includes(term)) {
        severity = "high";
        break;
      }
    }

    return {
      isSafe,
      matchedTerms: Array.from(matchedTerms),
      violationType: severity === "high" ? "Hate Speech / Severe Abuse" : "Profanity",
      severity
    };
  }

  return { isSafe: true, matchedTerms: [] };
}
