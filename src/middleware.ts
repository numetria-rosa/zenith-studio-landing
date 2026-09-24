import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Only the public marketing pages get locale routing. Admin, api, lab,
  // demo, proposals, courses, sign-in, profile, unsubscribe, and preview
  // stay English-only and untouched by this middleware.
  //
  // /services/:slug (single segment) is the [locale]/services/[slug]
  // marketing details pages - intentionally NOT /services/:path* anymore.
  // /services/dashboard/[clientId] (added 2026-09-24) is two segments deep
  // and lives outside the [locale] route group; the wildcard version used
  // to catch it too, silently 404ing any real client whose browser/cookie
  // preferred a non-English locale (as-needed prefixing means only
  // non-English gets redirected, so this bug is invisible to an
  // English-browser tester) - found while testing self-serve activation.
  matcher: [
    "/",
    "/(es|fr|sv)",
    "/(es|fr|sv)/services/:slug",
    "/services/:slug",
    "/(es|fr|sv)/audit",
    "/audit",
    "/(es|fr|sv)/privacy",
    "/privacy",
    "/(es|fr|sv)/welcome",
    "/welcome",
  ],
};
