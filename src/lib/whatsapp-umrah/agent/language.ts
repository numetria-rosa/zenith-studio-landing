import type { Language } from "./types";

// Letters that exist in Urdu's script but not in Arabic's.
const URDU_ONLY = /[ٹڈڑںےھگچپژہۓ]/;
const ARABIC_SCRIPT = /[؀-ۿ]/;
// Letters that are Turkish and not English (ö, ü and ç are too widely shared to count).
const TURKISH_ONLY = /[ğĞşŞıİ]/;

/** Which of our four languages a short message is written in, from its script alone. This is for the fixed
    replies that go out before (or without) the model, where the draft step's own language detection isn't
    available. Anything it can't tell apart is English. */
export function guessLanguage(text: string): Language {
  if (URDU_ONLY.test(text)) return "ur";
  if (ARABIC_SCRIPT.test(text)) return "ar";
  if (TURKISH_ONLY.test(text)) return "tr";
  return "en";
}
