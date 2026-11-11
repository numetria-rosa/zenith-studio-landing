import { getCourse, getCheckoutUrl } from "@/lib/courses";
import { SiteNav } from "@/components/site/SiteNav";
import { courses } from "@/app/lab/courses-data";
import { auth } from "@/lib/auth";
import { hasCourseAccess } from "@/lib/entitlements";
import type { CourseDetails } from "./data";
import { Hero } from "./Hero";
import { Curriculum } from "./Curriculum";
import { FinalModule } from "./FinalModule";
import { Inside } from "./Inside";
import { Outcomes } from "./Outcomes";
import type { Price } from "./PriceLockup";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
const WAITLIST_LINK =
  "mailto:zenith.studio.s@outlook.com?subject=Zenith%20Lab%20Waitlist&body=Hi%20Zenith%20Studio%2C%0A%0AI'd%20like%20to%20join%20the%20waitlist%20for%3A%20%0A%0AWhat%20I%20want%20to%20be%20able%20to%20do%20after%20the%20course%3A%20%0A";

const isPast = (iso: string | undefined) => (iso ? Date.now() > new Date(iso).getTime() : false);

/** The course details page, the same design for every published course. */
export async function CourseDetailsPage({
  details,
  searchParams,
}: {
  details: CourseDetails;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const card = courses.find((c) => c.id === details.id);
  const catalogCourse = getCourse(details.id);
  const { url, isRealCheckout } = catalogCourse ? getCheckoutUrl(catalogCourse) : { url: WAITLIST_LINK, isRealCheckout: false };

  // Forward UTMs through /api/go so the tracked checkout redirect keeps attribution.
  const utm = new URLSearchParams();
  for (const key of UTM_KEYS) {
    const value = searchParams[key];
    if (typeof value === "string") utm.set(key, value);
  }
  const qs = utm.toString() ? `?${utm.toString()}` : "";
  // Someone who already owns the course goes straight into it instead of back to checkout.
  const session = await auth();
  const owns = session?.user?.id ? await hasCourseAccess(session.user.id, details.id) : false;
  const checkoutHref = owns && catalogCourse?.learnUrl ? catalogCourse.learnUrl : isRealCheckout ? `/api/go/${details.id}${qs}` : url;
  const ctaLabel = owns ? "Open the course" : isRealCheckout ? "Start the course" : "Join the waitlist";

  // An expired discount must not show: once its deadline passes the list price is the real one.
  const discountLive = Boolean(card?.discountPercent) && !isPast(card?.discountDeadline);
  const price: Price | null = !card?.price
    ? null
    : discountLive && card.originalPrice
      ? { now: card.price, was: card.originalPrice, percent: card.discountPercent }
      : { now: card.originalPrice ?? card.price };

  const links = [
    { href: "#overview", label: "Overview" },
    { href: "#curriculum", label: "Curriculum" },
    ...(details.finalModule ? [{ href: "#final-module", label: "Final module" }] : []),
    ...(details.appSections.length > 0 ? [{ href: "#inside", label: "Inside" }] : []),
    { href: "#outcomes", label: "Outcomes" },
    { href: "#career-path", label: "Career path" },
  ];

  return (
    <main className="min-h-screen bg-void font-sans text-frost antialiased [line-height:normal]">
      <SiteNav
        brand="lab"
        links={links}
        cta={{ href: checkoutHref, label: ctaLabel, plain: true }}
        signIn={{ href: "/sign-in", label: "Sign in" }}
      />
      <Hero details={details} checkoutHref={checkoutHref} ctaLabel={ctaLabel} price={price} />
      <Curriculum details={details} />
      {details.finalModule && <FinalModule />}
      {details.appSections.length > 0 && <Inside details={details} />}
      <Outcomes details={details} checkoutHref={checkoutHref} ctaLabel={ctaLabel} price={price} />
    </main>
  );
}
