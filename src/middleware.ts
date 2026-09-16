import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Only the public marketing pages get locale routing. Admin, api, lab,
  // demo, proposals, courses, sign-in, profile, unsubscribe, and preview
  // stay English-only and untouched by this middleware.
  matcher: [
    "/",
    "/(es|fr|sv)",
    "/(es|fr|sv)/services/:path*",
    "/services/:path*",
    "/(es|fr|sv)/audit",
    "/audit",
    "/(es|fr|sv)/privacy",
    "/privacy",
    "/(es|fr|sv)/welcome",
    "/welcome",
  ],
};
