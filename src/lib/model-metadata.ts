const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "the",
  "with",
  "from",
  "for",
  "to",
  "of",
  "in",
  "on",
]);

export function createModelTitle(
  prompt?: string | null,
  fallback = "3D model"
) {
  if (!prompt) return fallback;

  const words = prompt
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => !STOP_WORDS.has(word.toLowerCase()))
    .slice(0, 5);

  if (words.length === 0) return fallback;

  const title = words
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return title.length > 56 ? `${title.slice(0, 53)}...` : title;
}

export function getModelFileLabel(format?: string | null) {
  return (format || "model").toUpperCase();
}
