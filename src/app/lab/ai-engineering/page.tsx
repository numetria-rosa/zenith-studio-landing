import type { Metadata } from "next";
import { getCourse, getCheckoutUrl } from "@/lib/courses";
import { Hero } from "@/components/course-details/Hero";
import { Curriculum } from "@/components/course-details/Curriculum";
import { FinalModule } from "@/components/course-details/FinalModule";
import { Inside } from "@/components/course-details/Inside";
import { Outcomes } from "@/components/course-details/Outcomes";
import { courseContent } from "@/components/course-details/data";
import type { Price } from "@/components/course-details/PriceLockup";
import { courses } from "../courses-data";

const SITE_URL = "https://zenith-studio.site";
const COURSE_ID = "ai-engineering";

export const metadata: Metadata = {
  title: "AI Engineering | Course Details | Zenith Lab",
  description: courseContent.tagline,
  alternates: { canonical: `${SITE_URL}/lab/${COURSE_ID}` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/lab/${COURSE_ID}`,
    title: "AI Engineering | Zenith Lab",
    description: courseContent.tagline,
  },
};

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];

// A specific segment, so it wins over the dynamic /lab/[courseId] page for this id.
export default async function AIEngineeringDetailsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const card = courses.find((c) => c.id === COURSE_ID);
  const catalogCourse = getCourse(COURSE_ID);
  const { url, isRealCheckout } = catalogCourse
    ? getCheckoutUrl(catalogCourse)
    : { url: "/lab", isRealCheckout: false };

  // Forward UTMs through /api/go so the tracked checkout redirect keeps attribution.
  const sp = await searchParams;
  const utm = new URLSearchParams();
  for (const key of UTM_KEYS) {
    const value = sp[key];
    if (typeof value === "string") utm.set(key, value);
  }
  const qs = utm.toString() ? `?${utm.toString()}` : "";
  const checkoutHref = isRealCheckout ? `/api/go/${COURSE_ID}${qs}` : url;

  const price: Price | null =
    card?.price && card.originalPrice && card.discountPercent
      ? { now: card.price, was: card.originalPrice, percent: card.discountPercent }
      : null;

  return (
    <main className="min-h-screen bg-void font-sans text-frost antialiased [line-height:normal]">
      <Hero checkoutHref={checkoutHref} price={price} />
      <Curriculum />
      <FinalModule />
      <Inside />
      <Outcomes checkoutHref={checkoutHref} price={price} />
    </main>
  );
}
