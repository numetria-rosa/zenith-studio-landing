import type { Language } from "./types";

// Letters that exist in Urdu's script but not in Arabic's.
const URDU_ONLY = /[ٹڈڑںےھگچپژہۓ]/;
const ARABIC_SCRIPT = /[؀-ۿ]/;
// Letters that are Turkish and not English (ö, ü and ç are too widely shared to count).
const TURKISH_ONLY = /[ğĞşŞıİ]/;

// French: letters English doesn't use (é è ê à â î ô û ù œ ë), or common French words. One strong word is enough,
// two weak ones are needed ("est", "pour", "les" also turn up inside other text).
const FRENCH_LETTERS = /[éèêàâîôûùœë]/i;
const FRENCH_STRONG = /\b(?:bonjour|bonsoir|salut|merci|combien|svp|salam alaykoum|s'il vous pla[iî]t|je voudrais|j'aimerais)\b/i;
const FRENCH_WEAK = /\b(?:je|vous|nous|est|les|des|une|pour|pas|avec|prix|voyage|quel|quelle|quand)\b/gi;

/** Which of our five languages a short message is written in, from its script and a few telltale words. This is for the fixed
    replies that go out before (or without) the model, where the draft step's own language detection isn't
    available. Anything it can't tell apart is English. */
export function guessLanguage(text: string): Language {
  if (URDU_ONLY.test(text)) return "ur";
  if (ARABIC_SCRIPT.test(text)) return "ar";
  if (TURKISH_ONLY.test(text)) return "tr";
  if (FRENCH_STRONG.test(text) || FRENCH_LETTERS.test(text) || (text.match(FRENCH_WEAK) ?? []).length >= 2) return "fr";
  return "en";
}
