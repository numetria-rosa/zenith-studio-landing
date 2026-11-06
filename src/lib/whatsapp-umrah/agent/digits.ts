/** Arabic-Indic (٠-٩) and Eastern Arabic-Indic / Urdu (۰-۹) digits to ASCII, and the Arabic thousands and decimal
    separators (٬ ٫) to "," and ".". Without this a reply or a customer message written in Arabic or Urdu digits
    slips past every number check, which only reads 0-9. */
export function toAsciiDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/٬/g, ",")
    .replace(/٫/g, ".");
}
