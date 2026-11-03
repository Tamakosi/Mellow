/** Suffixes that are not a family name ("Robert Montgomery III" → "RM"). */
const SUFFIX = /^(jr|sr|ii|iii|iv|v|phd|md)\.?$/i;

const segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;

/** First whole character that is a letter, so emoji or a leading symbol never becomes half an initial. */
function firstLetter(word: string) {
  const characters = segmenter ? [...segmenter.segment(word)].map((s) => s.segment) : Array.from(word);
  return characters.find((c) => /\p{L}/u.test(c)) ?? "";
}

/**
 * Up to two initials from the first and last name. Placeholder brackets, emoji, numbers and suffixes are
 * skipped. Returns "" when nothing usable is left, so the caller can show an icon instead.
 */
export function initials(name: string) {
  const words = name
    .replace(/[[\]]/g, "")
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w) && !SUFFIX.test(w));
  const picks = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return picks.map(firstLetter).join("").toLocaleUpperCase();
}
