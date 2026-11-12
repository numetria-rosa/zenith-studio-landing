/** Arabic-Indic (٠-٩) and Eastern Arabic-Indic / Urdu (۰-۹) digits to ASCII, and the Arabic thousands and decimal
    separators (٬ ٫) to "," and ".". Without this a reply or a customer message written in Arabic or Urdu digits
    slips past every number check, which only reads 0-9. */
export function toAsciiDigits(text: string): string {
  return text
    // French writes 3 950 (a space, no-break space or narrow no-break space) where the knowledge base has 3,950, and 3 950,50
    // with a decimal comma: bring both to the English form so the price checks read them. Only a group of exactly three digits is merged.
    .replace(/\b(\d{1,3})[ \u00a0\u202f](\d{3})\b(?![ \u00a0\u202f]?\d)/g, "$1,$2")
    .replace(/\b(\d{1,3},\d{3}),(\d{1,2})\b/g, "$1.$2")
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/٬/g, ",")
    .replace(/٫/g, ".");
}
