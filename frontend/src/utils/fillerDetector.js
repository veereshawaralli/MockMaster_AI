const FILLERS = [
  "um", "uh", "like", "basically", "you know",
  "actually", "literally", "kind of", "sort of",
  "right", "so", "well", "i mean", "honestly",
  "obviously", "essentially", "just"
];

/**
 * Detect filler words in a transcript.
 * Returns an object with per-filler counts and total count.
 */
export function detectFillers(transcript) {
  if (!transcript) return { fillers: {}, total: 0 };

  const lower = transcript.toLowerCase();
  const found = {};
  let total = 0;

  for (const filler of FILLERS) {
    // Use word boundary regex for accurate counting
    const regex = new RegExp(`\\b${filler.replace(/ /g, "\\s+")}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      found[filler] = matches.length;
      total += matches.length;
    }
  }

  return { fillers: found, total };
}
