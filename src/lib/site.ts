export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://zenith-studio.site").replace(/\/$/, "");
}
