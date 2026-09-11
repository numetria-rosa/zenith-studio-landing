import type { ProspectResearch, RecommendedOffer } from "@/lib/outreach";

export type SeedProspect = {
  businessName: string;
  website: string | null;
  city: string;
  country: string;
  niche: string;
  area: string;
  email: string | null;
  phone: string | null;
  contactName?: string | null;
  prospectScore: number;
  tier: "HOT" | "GOOD" | "BACKUP";
  recommendedServiceId: string;
  recommendedOffer: RecommendedOffer;
  personalizationSignal: string;
  opportunity: string;
  buyingSignal: string;
  research: ProspectResearch;
};

const NA = null;
const LEAD = "ai-lead-capture";
const RECEP = "ai-receptionist";
const INBOX = "ai-inbox-manager";

function dental(
  partial: Omit<SeedProspect, "city" | "country" | "niche" | "research"> & { signals: string[] }
): SeedProspect {
  const { signals, ...rest } = partial;
  return {
    ...rest,
    city: "Dallas",
    country: "USA",
    niche: "Dental clinics",
    research: {
      verified: {
        name: rest.businessName,
        city: "Dallas",
        country: "USA",
        niche: "Dental clinics",
        area: rest.area,
        website: rest.website ?? undefined,
        phone: rest.phone ?? undefined,
        email: rest.email ?? undefined,
        observedSignals: signals,
      },
      inferences: [rest.opportunity],
    },
  };
}

/** Dallas dental research from the 2026-08-29 prospecting pass. Only rows
    with a public email are eligible to email; the rest exist so the CRM
    can show why they were skipped. */
export const DALLAS_DENTAL_PROSPECTS: SeedProspect[] = [
  dental({
    businessName: "Contemporary Dentistry Dallas",
    website: "https://cddallas.com/",
    area: "Northwest Hwy / 75220",
    email: "info@cddallas.com",
    phone: "(214) 366-4646",
    prospectScore: 91,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "online booking and same-day emergency visits",
    buyingSignal: "online booking",
    opportunity: "Potential follow-up opportunity because the site advertises online booking and same-day emergency care.",
    signals: ["online booking", "same-day emergency visits", "cosmetic and implant services"],
  }),
  dental({
    businessName: "Dizon Dental Aesthetics",
    website: "https://www.dizondental.com/",
    area: "North Central / 75206",
    email: "info@dizondental.com",
    phone: "(214) 646-6202",
    prospectScore: 89,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a request-an-appointment page plus Invisalign, veneers, and implants",
    buyingSignal: "request an appointment",
    opportunity: "Potential lead-follow-up opportunity because visitors are asked to request appointments for high-value treatments.",
    signals: ["request an appointment", "Invisalign", "veneers", "implants"],
  }),
  dental({
    businessName: "Dallas Dental Arts",
    website: "https://www.dallasdentalspa.com/",
    area: "Downtown / 75201",
    email: "info@dallasdentalarts.com",
    phone: "(214) 999-0110",
    prospectScore: 88,
    tier: "HOT",
    recommendedServiceId: RECEP,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "a multi-specialty concierge practice (prosthodontics, endodontics, periodontics)",
    buyingSignal: "multi-specialty concierge listing",
    opportunity: "Potential receptionist opportunity because the public site presents three specialties and a concierge intake path that is not fully visible online.",
    signals: ["multi-specialty concierge practice", "prosthodontics", "endodontics", "periodontics"],
  }),
  dental({
    businessName: "Bleu Dentistry",
    website: "https://bleudentist.com/",
    area: "Oak Lawn / 75219",
    email: "info@bleudentist.com",
    phone: "(214) 699-4976",
    prospectScore: 86,
    tier: "HOT",
    recommendedServiceId: RECEP,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a Book Appointment call-to-action plus Invisalign, implants, and emergency visits",
    buyingSignal: "book appointment",
    opportunity: "Potential receptionist opportunity because the site is appointment-driven and advertises emergency visits.",
    signals: ["book appointment", "Invisalign", "implants", "emergency visits"],
  }),
  dental({
    businessName: "Preston Sherry Dental Associates",
    website: "https://prestonsherrydental.com/",
    area: "Park Cities / 75225",
    email: "info@prestonsherrydental.com",
    phone: "(214) 691-7371",
    prospectScore: 83,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a Request Appointment page plus emergency dentistry and Invisalign/implants",
    buyingSignal: "request appointment",
    opportunity: "Potential follow-up opportunity because new-patient and emergency requests are invited online.",
    signals: ["request appointment", "emergency dentistry", "Invisalign", "implants"],
  }),
  dental({
    businessName: "ARCHPOINT Implant Dentistry Dallas",
    website: "https://www.archpointid.com/office/dallas/",
    area: "Park Lane / 75231",
    email: "info@archpointid.com",
    phone: "(844) 281-6446",
    prospectScore: 83,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "a free consultation call-to-action on the Dallas implant-center page",
    buyingSignal: "schedule a free consultation",
    opportunity: "Potential lead-follow-up opportunity because the Dallas page invites free implant consultations across multiple DFW offices.",
    signals: ["schedule a free consultation", "dental implants", "Dallas office at Park Lane"],
  }),
  dental({
    businessName: "Ambriz Center for Reconstructive and Cosmetic Dentistry",
    website: "https://www.ambrizdallas.com/",
    area: "N Central / 75231",
    email: "smile@ambrizdallas.com",
    phone: "(214) 368-0514",
    prospectScore: 82,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a call-or-text line plus cosmetic, implant, and Invisalign services",
    buyingSignal: "call or text",
    opportunity: "Potential follow-up opportunity because cosmetic consults are invited by call or text.",
    signals: ["call or text", "cosmetic dentistry", "implant dentistry", "Invisalign"],
  }),
  dental({
    businessName: "Park Cities Family Dentistry",
    website: "https://www.cosmeticdentistindallas.com/",
    area: "Knox-Henderson / 75204",
    email: NA,
    phone: "(214) 528-3770",
    prospectScore: 86,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "complimentary consultations advertised for Highland Park / Uptown / Lakewood",
    buyingSignal: "complimentary consultation",
    opportunity: "Potential consult follow-up, but no public email was found so outreach is blocked.",
    signals: ["complimentary consultations"],
  }),
  dental({
    businessName: "Moseley Dental Group",
    website: "https://www.moseleydentalgroup.com/",
    area: "Preston Center + Hillcrest",
    email: NA,
    phone: NA,
    prospectScore: 85,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "two Dallas locations advertising Invisalign",
    buyingSignal: "two locations",
    opportunity: "Multi-location enquiry routing, but no public email was found.",
    signals: ["two Dallas locations", "Invisalign"],
  }),
  dental({
    businessName: "Katy Trail Dental",
    website: "https://www.katytrail.dental/",
    area: "Knox / 75205",
    email: NA,
    phone: "(214) 380-9071",
    prospectScore: 84,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "an Invisalign consultation call-to-action",
    buyingSignal: "Invisalign consultation",
    opportunity: "Aligner consult follow-up; no public email found.",
    signals: ["Invisalign consultation"],
  }),
  dental({
    businessName: "Arts Family Dentistry",
    website: "https://www.artsfamilydentistry.com/",
    area: "Kessler / Oak Cliff / 75208",
    email: NA,
    phone: "(214) 203-1145",
    prospectScore: 84,
    tier: "HOT",
    recommendedServiceId: RECEP,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "Saturday hours plus implants and Invisalign",
    buyingSignal: "Saturday hours",
    opportunity: "Appointment-driven neighborhood practice; no public email found.",
    signals: ["Saturday hours", "implants", "Invisalign"],
  }),
  dental({
    businessName: "Turtle Creek Dental Associates",
    website: "https://www.turtlecreekdental.com/",
    area: "Uptown / 75219",
    email: NA,
    phone: "(214) 953-0906",
    prospectScore: 82,
    tier: "HOT",
    recommendedServiceId: INBOX,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a four-doctor Uptown practice with a prominent phone number",
    buyingSignal: "prominent phone number",
    opportunity: "Multi-doctor admin load is an inference; no public email found.",
    signals: ["four doctors", "prominent phone number"],
  }),
  dental({
    businessName: "East Quarter Dental",
    website: "https://www.eastquarterdental.com/",
    area: "Downtown / 75201",
    email: NA,
    phone: "(469) 943-1400",
    prospectScore: 81,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "Schedule plus Request a Callback for downtown Invisalign patients",
    buyingSignal: "request a callback",
    opportunity: "Callback requests can go stale; no public email found.",
    signals: ["request a callback", "Invisalign"],
  }),
  dental({
    businessName: "Dallas Designer Smiles",
    website: "https://www.dallasdesignersmiles.com/",
    area: "Park Cities / 75225",
    email: NA,
    phone: NA,
    prospectScore: 80,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a new-patient appointment request form",
    buyingSignal: "new-patient request form",
    opportunity: "Structured lead capture; no public email found.",
    signals: ["new-patient appointment request form"],
  }),
  dental({
    businessName: "Inwood Village Dental",
    website: "https://inwoodvillagedental.com/",
    area: "Lovers Lane / 75209",
    email: NA,
    phone: "(214) 252-2777",
    prospectScore: 80,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a free Invisalign consultation offer",
    buyingSignal: "free Invisalign consultation",
    opportunity: "High-intent consult leads; no public email found.",
    signals: ["free Invisalign consultation"],
  }),
  dental({
    businessName: "Trinity Dental Loft",
    website: "https://trinitydentalloft.com/",
    area: "Trinity Groves / 75208",
    email: NA,
    phone: "(214) 415-2125",
    prospectScore: 78,
    tier: "GOOD",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "Book Now plus emergency and cosmetic dentistry",
    buyingSignal: "book now",
    opportunity: "Boutique West Dallas booking path; no public email found.",
    signals: ["book now", "emergency dentistry", "cosmetic dentistry"],
  }),
  dental({
    businessName: "Lakewood Dental Studio",
    website: "https://www.lakewooddentalstudio.com/",
    area: "Gaston / 75214",
    email: NA,
    phone: "(214) 446-5084",
    prospectScore: 76,
    tier: "GOOD",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a Book An Appointment call-to-action",
    buyingSignal: "book an appointment",
    opportunity: "Public booking CTA; contact-page placeholder emails were ignored.",
    signals: ["book an appointment"],
  }),
  dental({
    businessName: "Dallas Dental Group",
    website: "https://www.dallasdental.com/",
    area: "Prestonwood / 75248",
    email: NA,
    phone: "(972) 644-1998",
    prospectScore: 74,
    tier: "GOOD",
    recommendedServiceId: INBOX,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "Book Online on dallasdental.com",
    buyingSignal: "book online",
    opportunity: "Family practice with online scheduling; no public email found.",
    signals: ["book online"],
  }),
];

const LAW = "law-firms";

function personalInjury(
  partial: Omit<SeedProspect, "country" | "niche" | "research"> & { city: string; signals: string[] }
): SeedProspect {
  const { signals, ...rest } = partial;
  return {
    ...rest,
    country: "USA",
    niche: "Personal injury law",
    research: {
      verified: {
        name: rest.businessName,
        city: rest.city,
        country: "USA",
        niche: "Personal injury law",
        area: rest.area,
        website: rest.website ?? undefined,
        phone: rest.phone ?? undefined,
        email: rest.email ?? undefined,
        contactName: rest.contactName ?? undefined,
        observedSignals: signals,
      },
      inferences: [rest.opportunity],
    },
  };
}

/** Columbus/Cincinnati OH personal injury firm research from the 2026-09-11
    prospecting pass (see meta-ai-advance-summary.md action item 7). Every
    row below was individually checked, not templated: real site visited,
    screened out for a visible chat/live-chat widget (two strong candidates,
    Young Reverman & Bolotin and Rittgers Rittgers & Nakajima, were found
    and DROPPED for exactly this reason), attorney headcount read off the
    firm's own team page where published.

    Email follow-up pass, 2026-09-11: the Ohio Supreme Court's attorney
    registry search (supremecourt.ohio.gov) was unreachable from this
    environment, so instead every firm's own homepage, privacy policy page,
    and (for Freking Myers & Reul) firm-overview page was checked directly
    for a real `mailto:` link or plain-text address - deliberately NOT
    third-party lead-scraping tools (RocketReach, ZoomInfo, LeadIQ) that
    surfaced elsewhere in search results, since those guess emails from
    patterns rather than confirming a real published one, and using an
    unconfirmed guess would undermine the same public-email bar this file
    already holds every other row to. Found 2 of 7: Erney Law
    (leadcounsel@ohioinjurylaw.com, on their own privacy policy page) and
    Oliver Law Office (info@oliverattorneys.com, a mailto: link on their own
    site). Both are firm inboxes, not the named attorney's personal address.
    The other 5 (Soroka, Gervelis, O'Connor Acciani & Levy, Moore, Freking
    Myers & Reul) remain genuinely contact-form-only, no email found on
    their own site - still RESEARCHED but outreach-blocked
    (`runHardFilters` requires `isPublicEmail`), the same honest state
    several Dallas dental rows above are already in.

    Google Business Profile review counts (the 20-200 filter from the
    original blueprint) were NOT independently verified here, no Places API
    access in this pass, don't treat prospectScore below as including that
    signal. */
export const OHIO_PI_PROSPECTS: SeedProspect[] = [
  personalInjury({
    businessName: "Soroka & Associates, LLC",
    website: "https://www.sorokalegal.com/",
    city: "Columbus",
    area: "Central Ohio",
    email: NA,
    phone: "(614) 918-4078",
    contactName: "Roger R. Soroka",
    prospectScore: 88,
    tier: "HOT",
    recommendedServiceId: LAW,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "a 5-attorney trial team that takes catastrophic-injury and trucking cases to jury rather than settling fast",
    buyingSignal: "5-attorney boutique, no visible chat widget",
    opportunity: "A firm this size fields every call itself; a missed call after hours is a real cost with no admin layer to catch it.",
    signals: ["5 named attorneys", "handles complex trucking/catastrophic injury litigation", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Erney Law (Robert D. Erney & Associates)",
    website: "https://ohioinjurylaw.com/",
    city: "Columbus",
    area: "Downtown / 43203",
    email: "leadcounsel@ohioinjurylaw.com", // published in plain text on the firm's own privacy policy page, 2026-09-11 - a firm inbox, not Robert Erney personally
    phone: "(614) 258-6100",
    contactName: "Robert D. Erney",
    prospectScore: 84,
    tier: "HOT",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a father-daughter practice (Robert and Mary Erney) that personally handles every client relationship",
    buyingSignal: "small family practice, no visible chat widget",
    opportunity: "Two-attorney practice with no admin layer; the managing partner is reachable directly, and a missed call has nowhere else to land.",
    signals: ["father-daughter two-attorney practice", "reviews consistently name the attorneys personally", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Gervelis Law Firm",
    website: "https://gervelislaw.com/",
    city: "Columbus",
    area: "Dublin Rd / 43215",
    email: NA,
    phone: "866-965-8721",
    contactName: "Mark S. Gervelis",
    prospectScore: 80,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a board-certified trial lawyer's firm built on being personally reachable to clients",
    buyingSignal: "small boutique, no visible chat widget",
    opportunity: "Community-reputation-driven boutique; after-hours intake gaps cost referral trust, not just one lead.",
    signals: ["board-certified civil trial lawyer", "small named team", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Oliver Law Office",
    website: "https://jamioliver.com/",
    city: "Columbus",
    area: "Central Ohio",
    email: "info@oliverattorneys.com", // published as a mailto: link on the firm's own site, 2026-09-11 - a firm inbox, not Jami Oliver personally
    phone: "614.220.9100",
    contactName: "Jami S. Oliver",
    prospectScore: 76,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a woman-led boutique firm, 2024 \"Lawyer of the Year\" (Best Lawyers, Columbus)",
    buyingSignal: "award-recognized boutique, no visible chat widget",
    opportunity: "High-profile solo/boutique practice; intake volume from the recognition likely outpaces a small team's after-hours capacity.",
    signals: ["2024 Best Lawyers \"Lawyer of the Year\"", "woman-led boutique", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "O'Connor, Acciani & Levy",
    website: "https://www.oal-law.com/",
    city: "Cincinnati",
    area: "Also serves Columbus and Northern Kentucky",
    email: NA,
    phone: "(513) 548-3729",
    contactName: "Henry D. Acciani",
    prospectScore: 83,
    tier: "HOT",
    recommendedServiceId: LAW,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "13 attorneys across three offices (Cincinnati, Columbus, Northern Kentucky), free-unless-we-win intake",
    buyingSignal: "multi-office boutique at the top of the target size range, no visible chat widget",
    opportunity: "Three-office intake coordination is exactly the kind of thing a missed call slips through; largest firm in this batch, still under the 15-attorney ceiling.",
    signals: ["13 attorneys", "three-office footprint (OH + KY)", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "The Moore Law Firm",
    website: "https://www.moorelaw.com/",
    city: "Cincinnati",
    area: "1060 Nimitzview Dr, Cincinnati",
    email: NA,
    phone: "513-232-2000",
    contactName: "Daniel N. Moore",
    prospectScore: 87,
    tier: "HOT",
    recommendedServiceId: LAW,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "a 4-attorney firm built around \"a legacy of pursuing justice\"",
    buyingSignal: "4-attorney boutique, no visible chat widget",
    opportunity: "Tight, name-brand boutique; a missed after-hours call is a lost case, not just a lost lead.",
    signals: ["4 named attorneys", "single-office boutique", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Freking Myers & Reul LLC",
    website: "https://www.fmr.law/",
    city: "Cincinnati",
    area: "Central Cincinnati",
    email: NA,
    phone: "(513) 866-8816",
    contactName: NA,
    prospectScore: 74,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "\"Advocates for working people\" since 1990, 12 attorneys spanning employment and personal injury law",
    buyingSignal: "12-attorney boutique, no visible chat widget",
    opportunity: "Mixed employment/PI practice at the top of the size range; worth confirming PI is still a primary focus before outreach.",
    signals: ["12 attorneys", "employment + personal injury practice since 1990", "no visible chat widget"],
  }),
];
