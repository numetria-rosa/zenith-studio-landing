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

    Email follow-up pass, 2026-09-11 (two rounds): the Ohio Supreme Court's
    attorney registry search (supremecourt.ohio.gov) was unreachable from
    this environment both times, so instead every firm's own site was
    checked directly for a real `mailto:` link or plain-text address -
    first the homepage/privacy-policy/firm-overview pages, then a second,
    deeper pass specifically on each named attorney's own bio page.
    Deliberately did NOT use third-party lead-scraping tools (RocketReach,
    ZoomInfo, LeadIQ) that surfaced in search results along the way, since
    those guess emails from patterns rather than confirm a real published
    one, and an unconfirmed guess would undermine the same public-email bar
    this file already holds every other row to.

    Found 3 of 7, all confirmed by an actual `mailto:` link or plain text on
    the firm's or attorney's own domain: Erney Law
    (leadcounsel@ohioinjurylaw.com, their privacy policy page - a firm
    inbox, no personal address found on Robert Erney's own bio page),
    Gervelis Law Firm (msg@gervelislaw.com, his own initials, a mailto: link
    directly on Mark Gervelis's own bio page - personally his), and Oliver
    Law Office (joliver@oliverattorneys.com, a mailto: link directly on Jami
    Oliver's own bio page - personally hers, upgraded from the firm's
    general info@ address the first pass had found).

    Third pass, 2026-09-12: widened the search to professional/peer-award
    directories the attorney's own bio doesn't control but that carry a
    real mailto: link for them specifically (National Association of
    Distinguished Counsel member pages worked twice here), not just the
    firm's own site. Found Soroka & Associates (roger@sorokalegal.com, on
    his own distinguishedcounsel.org member page - nothing on
    sorokalegal.com itself). Also surfaced a real correction while
    checking Freking Myers & Reul: Randolph Freking, the firm's namesake
    and the only name this file had for that row, retired at the end of
    2020 - emailing him would reach the wrong person even if an address
    existed. No email found for Freking Myers & Reul under any current
    partner either (checked Kelly Mulloy Myers's bio PDF and the firm
    overview page).

    The remaining 3 (O'Connor Acciani & Levy, The Moore Law Firm, Freking
    Myers & Reul) stay genuinely contact-form-only after three separate
    passes: firm homepage, privacy-policy page, named attorney's own bio
    page, a linked PDF bio, and now peer/professional directories
    (National Trial Lawyers, Cornell LII, distinguishedcounsel.org) with no
    email found anywhere for any of them. Still RESEARCHED but
    outreach-blocked (`runHardFilters` requires `isPublicEmail`), the same
    honest state several Dallas dental rows above are already in.

    Expansion pass, 2026-09-12 (user asked to grow the combined OH+TX
    sendable list to 20 while holding the same target profile): 7 more
    Columbus/Cincinnati PI firms researched, 6 outreach-eligible (Brian G.
    Miller, The Donahey Law Firm, Malek & Malek, Mark L. Newman, Somos Law
    Firm, Crandall & Pera Law), 1 blocked (Larry H. Creach). See the
    per-row comments below for exactly where each email was found and
    whether it reaches the named attorney personally or a firm/staff
    inbox. This batch brings Ohio to 14 firms researched, 10
    outreach-eligible.

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
    email: "roger@sorokalegal.com", // his own mailto: link on his National Association of Distinguished Counsel member page, 2026-09-12 - Roger Soroka personally; nothing found on his own firm site directly
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
    email: "msg@gervelislaw.com", // his own initials, a mailto: link on his own attorney bio page (gervelislaw.com/our-attorneys/mark-s-gervelis-esq/), 2026-09-11 - Mark Gervelis personally
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
    email: "joliver@oliverattorneys.com", // her own mailto: link on her own attorney bio page (jamioliver.com/jami-s-oliver/), 2026-09-11 - Jami Oliver personally, upgraded from the firm's general info@ inbox
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
  // Second Columbus/Cincinnati expansion pass, 2026-09-12 (user asked to grow the
  // combined OH+TX sendable list to 20 while holding the same target profile: PI-focused,
  // roughly 3-15 attorneys, no visible chat widget, decision-maker directly reachable).
  // Same research method throughout: real site visit, mailto: scan via script, chat-widget
  // screen, then a professional-directory check (americastop100attorneys.com,
  // distinguishedcounsel.org) when the firm's own site had nothing. Skipped several
  // otherwise-plausible candidates for failing the profile: Jeckering & Associates and the
  // Law Office of David A. Chicarelli (general practice, PI is one of several areas, not the
  // firm's focus), Schiff & Associates (self-described "large legal team," high-volume
  // marketing language, reads as an injury mill rather than a boutique), Moxie Law Group
  // (Podium chat widget).
  personalInjury({
    businessName: "Brian G. Miller Co., LLC",
    website: "https://www.bgmillerlaw.com/",
    city: "Columbus",
    area: "Worthington / Columbus",
    email: "slh@bgmillerlaw.com", // found on his own National Association of Distinguished Counsel member page, 2026-09-12 - initials suggest a staff/paralegal inbox, not Brian Miller personally
    phone: "614-221-4035",
    contactName: "Brian G. Miller",
    prospectScore: 82,
    tier: "HOT",
    recommendedServiceId: LAW,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "founder recognized in Best Lawyers in America every year since 2013, 2019 \"Lawyer of the Year\" in Columbus for personal injury litigation",
    buyingSignal: "award-recognized boutique with a real trial record, no visible chat widget",
    opportunity: "High-profile solo/small practice; recognition-driven intake volume likely outpaces after-hours capacity.",
    signals: ["Best Lawyers in America every year since 2013", "2019 \"Lawyer of the Year,\" Columbus personal injury", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "The Donahey Law Firm, LLC",
    website: "https://www.donaheylaw.com/",
    city: "Columbus",
    area: "Downtown Columbus",
    email: "help@donaheylaw.com", // mailto: link on their own homepage, 2026-09-12 - a firm inbox, not the named attorney personally
    phone: "614-224-8166",
    contactName: "Richard S. Donahey",
    prospectScore: 79,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "founded 1968, 4 attorneys with 140+ years combined trial and settlement experience, three former defense attorneys on staff",
    buyingSignal: "long-tenured boutique built on insider defense-side knowledge, no visible chat widget",
    opportunity: "Referral-driven boutique that takes the toughest catastrophic cases from other Ohio attorneys; a missed after-hours call costs referral trust as much as the case.",
    signals: ["founded 1968", "4 attorneys, 140+ years combined experience", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Malek & Malek Law Firm",
    website: "https://www.maleklawfirm.com/",
    city: "Columbus",
    area: "South Columbus",
    email: "jim@maleklawfirm.com", // his own mailto: link on his own attorney bio page (maleklawfirm.com/attorneys/james-malek/), 2026-09-12 - James Malek personally; nothing on the homepage itself
    phone: "(614) 444-7440",
    contactName: "James Malek",
    prospectScore: 80,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a father-and-three-sons practice since 1972, five attorneys with 60+ years of combined experience",
    buyingSignal: "multi-generation family boutique, no visible chat widget",
    opportunity: "Family-run practice built on personal relationships; an after-hours miss breaks exactly the kind of personal continuity the firm sells itself on.",
    signals: ["five attorneys, family-run since 1972", "60+ years combined experience", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Mark L. Newman, Attorney at Law",
    website: "https://marklnewman.com/",
    city: "Cincinnati",
    area: "Cincinnati",
    email: "mln@bpbslaw.com", // his own initials, a mailto: link directly on his own about page, 2026-09-12 - Mark Newman personally
    phone: "513-533-2009",
    contactName: "Mark L. Newman",
    prospectScore: 74,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a solo Cincinnati practice handling serious accident cases",
    buyingSignal: "solo practitioner, no visible chat widget",
    opportunity: "Solo practice with no admin layer; the attorney is the intake line, and a missed call has nowhere else to land.",
    signals: ["solo practitioner", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Law Office of Larry H. Creach, Esq. LLC",
    website: "https://www.creachlaw.com/",
    city: "Cincinnati",
    area: "Cincinnati",
    email: NA,
    phone: "513-401-7932",
    contactName: "Larry H. Creach",
    prospectScore: 73,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "26 years in practice, a former insurance-company attorney now representing the injured",
    buyingSignal: "solo practitioner, insurance-side background, no visible chat widget",
    opportunity: "Solo practice with no admin layer; a missed call has nowhere else to land.",
    signals: ["26 years in practice", "former insurance company attorney", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Somos Law Firm",
    website: "https://lawyersprotectingyou.com/",
    city: "Columbus",
    area: "North Columbus",
    email: "info@lawyersprotectingyou.com", // mailto: link on their own homepage, 2026-09-12 - a firm inbox, not Tom Somos personally. Site loads Microsoft Clarity analytics, confirmed NOT a chat widget (no visible chat UI, no "chat with us" text anywhere on the page)
    phone: "(614) 488-2770",
    contactName: "Tom Somos",
    prospectScore: 75,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a small, founder-led Columbus personal injury practice",
    buyingSignal: "small boutique, no visible chat widget",
    opportunity: "Small practice with no admin layer; a missed call has nowhere else to land.",
    signals: ["small founder-led practice", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Crandall & Pera Law, LLC",
    website: "https://www.injuryverdicts.com/",
    city: "Columbus",
    area: "Downtown Columbus, also Cleveland/Cincinnati/Kentucky offices",
    email: "steve@injuryverdicts.com", // found on his own America's Top 100 Attorneys listing page, 2026-09-12 - Steve Crandall personally; nothing on their own site
    phone: "(614) 702-2623",
    contactName: "Steve Crandall",
    prospectScore: 81,
    tier: "HOT",
    recommendedServiceId: LAW,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "a multi-office medical malpractice/personal injury firm staffed partly by registered nurses, named to Best Lawyers in America for 2027",
    buyingSignal: "multi-office boutique with clinical staff on the team, no visible chat widget",
    opportunity: "Multi-office coordination for complex malpractice cases is exactly where a missed after-hours call slips through.",
    signals: ["staffed partly by registered nurses", "named to Best Lawyers in America, 2027", "no visible chat widget"],
  }),
];

/** Fort Worth, TX personal injury firm research from the 2026-09-12
    prospecting pass (see meta-ai-advance-summary.md action item 7,
    "next city" follow-up). City chosen over the other original alternates
    (Jacksonville/Tampa FL) after real research, not a coin flip: Florida's
    2023 tort reform (HB 837) cut the PI statute of limitations from 4
    years to 2 and tightened the comparative-negligence bar, a real,
    documented shrink to that state's case pipeline that Texas has not had
    (a 2025 push for further restrictions, SB 30/HB 4806, did not pass).
    Also checked for the same city-level agency saturation signal that
    ruled out LA/NYC/Miami originally: a competitor ("Ansa") runs templated
    AI-receptionist landing pages for San Antonio, Jacksonville, AND Tampa
    specifically, found via search - Fort Worth has no equivalent page
    found, so it's the one candidate that still fits "no major agency
    saturation."

    Every row below was individually checked the same way as the Ohio
    batch: real site visited via browser, screened for a live chat widget
    (Stephens Law Firm was found and DROPPED here for exactly that reason,
    an "Intaker" chat script loaded on their site - same rule that caught
    Young Reverman & Bolotin and Rittgers Rittgers & Nakajima in Ohio),
    attorney headcount sourced from the firm's own site or a real search
    result citing it. Email search used the same method that worked for
    Ohio (mailto: links on the firm's own homepage/contact/privacy/attorney
    bio pages, verified live via a script, never a third-party
    lead-scraping guess) and found 4 of 7 right away, a better hit rate
    than Ohio's initial pass.

    Follow-up pass, 2026-09-12: widened the search to peer/professional
    directories carrying a real mailto: link for the attorney specifically
    (National Association of Distinguished Counsel worked here too),
    found Parker Law Firm (brad@parkerlawfirm.com, on his own
    distinguishedcounsel.org member page - nothing on parkerlawfirm.com
    itself, checked twice including the privacy policy page). Also checked
    Wade Barrow and Brett Cain against Texas Bar's directory, Super
    Lawyers, LawLink, about.me, and Keenan Trial Institute's faculty page -
    genuinely no email found for either after that additional pass. Texas
    Bar's own "Find a Lawyer" tool doesn't publish a real address either,
    only an internal "Email Now" contact-relay link, so it doesn't count
    against the isPublicEmail bar. Barrow Law and The Cain Firm remain
    RESEARCHED but outreach-blocked.

    Expansion pass, 2026-09-12 (same "grow to 20 total, same profile"
    request as the Ohio expansion above): 7 more Fort Worth-area PI firms
    researched, 5 outreach-eligible (James M. Stanley, Eric Reyes, Robert
    C. Slim, Robert L. Ward, J. Alexander Law Firm), 2 blocked (Queenan
    Law, J. Kent McAfee). J. Alexander Law Firm's only confirmed address is
    a marketing inbox (marketing@jalexlawfirm.com), not a named attorney -
    address outreach to the firm generally, not a person, same as Freking
    Myers & Reul's contactName: NA pattern. This batch brings Fort Worth
    to 14 firms researched, 10 outreach-eligible - combined with Ohio's 10,
    that's exactly the 20 sendable leads requested, all still fitting the
    original profile (PI-focused, roughly 3-15 attorneys, no chat widget,
    decision-maker reachable). */
export const FORT_WORTH_PI_PROSPECTS: SeedProspect[] = [
  personalInjury({
    businessName: "Patterson Law Group",
    website: "https://pattersonpersonalinjury.com/",
    city: "Fort Worth",
    area: "Fort Worth, also Arlington and San Antonio offices",
    email: "info@pattersonpersonalinjury.com", // mailto: link on their own homepage, 2026-09-12
    phone: "(817) 904-8460",
    contactName: "W. Travis Patterson",
    prospectScore: 89,
    tier: "HOT",
    recommendedServiceId: LAW,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "9 attorneys, $100M+ recovered, 496+ Google reviews, highest reported wrongful death settlement in Texas for 2024",
    buyingSignal: "9-attorney multi-office firm at real scale, no visible chat widget",
    opportunity: "High enough call volume that an intake gap is a real, recurring cost, not a one-off.",
    signals: ["9 attorneys across 3 offices", "496+ Google reviews", "highest reported wrongful death settlement in Texas, 2024", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Noteboom - The Law Firm",
    website: "https://noteboom.com/",
    city: "Fort Worth",
    area: "Hurst / Fort Worth metro",
    email: "lawyers@noteboom.com", // mailto: link on their own contact page, 2026-09-12
    phone: "(817) 282-9700",
    contactName: "Chuck Noteboom",
    prospectScore: 85,
    tier: "HOT",
    recommendedServiceId: LAW,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "2 attorneys board-certified in personal injury law by the Texas Board of Legal Specialization, plus in-house investigators",
    buyingSignal: "board-certified boutique with its own investigator staff, no visible chat widget",
    opportunity: "A firm this specialized fields serious cases directly; a missed after-hours call is a lost case, not just a lost lead.",
    signals: ["2 board-certified PI attorneys", "in-house investigator + assistant investigator", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Law Offices of Barry Martines",
    website: "https://barrymartines.com/",
    city: "Fort Worth",
    area: "Fort Worth",
    email: "info@barrymartines.com", // mailto: link on their own homepage, 2026-09-12
    phone: "817-838-9900",
    contactName: "Barry Martines",
    prospectScore: 77,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "24+ years focused solely on bodily injury claims",
    buyingSignal: "solo practitioner, single-focus practice, no visible chat widget",
    opportunity: "Solo practice with no admin layer; the attorney is the intake line, and a missed call has nowhere else to land.",
    signals: ["24+ years, bodily injury claims only", "solo practitioner", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Walters Law Office, PLLC",
    website: "https://walterslawofficepllc.com/",
    city: "Fort Worth",
    area: "Fort Worth",
    email: "jack@walterslawofficepllc.com", // his own mailto: link on the firm's homepage, 2026-09-12 - Jonathan Walters personally
    phone: "682-747-6800",
    contactName: "Jack Walters", // greeting-safe form; his own site/bios use "Jonathan \"Jack\" Walters," fine in prose but not as a raw salutation name
    prospectScore: 75,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "founded 2021, a Top 40 Under 40 trial lawyer who personally guarantees a response to every consultation",
    buyingSignal: "young solo boutique built on personal responsiveness, no visible chat widget",
    opportunity: "The founder's own pitch is personally answering every inquiry; an after-hours miss directly contradicts that promise.",
    signals: ["founded 2021", "Top 40 Under 40 trial lawyer", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "The Cain Firm",
    website: "https://cainfirm.com/",
    city: "Fort Worth",
    area: "Fort Worth, also Granbury and Dallas-by-appointment offices",
    email: NA,
    phone: "(817) 918-8638",
    contactName: "Brett Cain",
    prospectScore: 76,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "founded by a former prosecutor, now handling injury cases across 3 small Texas offices",
    buyingSignal: "solo-founder boutique spread across multiple small offices, no visible chat widget",
    opportunity: "Coverage across three offices from one founder means an after-hours call has no consistent backstop.",
    signals: ["founded by a former prosecutor", "3-office footprint (Fort Worth, Granbury, Dallas by appointment)", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Parker Law Firm Injury Lawyers",
    website: "https://parkerlawfirm.com/",
    city: "Fort Worth",
    area: "Bedford / Fort Worth",
    email: "brad@parkerlawfirm.com", // his own mailto: link on his National Association of Distinguished Counsel member page, 2026-09-12 - Brad Parker personally; nothing found on his own firm site directly
    phone: "(817) 503-9200",
    contactName: "W. Bradley Parker",
    prospectScore: 78,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "board-certified in personal injury trial law with 37+ years of practice",
    buyingSignal: "board-certified boutique, no visible chat widget",
    opportunity: "Long-tenured boutique built on the lead attorney's own reputation; an after-hours miss costs referral trust as much as the case itself.",
    signals: ["board-certified in personal injury trial law", "37+ years practicing", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Barrow Law PLLC",
    website: "https://www.barrow-law.com/",
    city: "Fort Worth",
    area: "Fort Worth",
    email: NA,
    phone: "817-962-2535",
    contactName: "Wade Barrow",
    prospectScore: 72,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a solo practice built on personally getting to know each client before crafting a strategy",
    buyingSignal: "solo boutique, personal-attention pitch, no visible chat widget",
    opportunity: "The firm's own pitch is personal attention to every client; a missed call is the opposite of that promise.",
    signals: ["solo practitioner", "personal-attention client strategy pitch", "no visible chat widget"],
  }),
  // Second Fort Worth expansion pass, 2026-09-12, same reason and method as the Ohio
  // expansion above. Dropped several otherwise-plausible candidates for failing the profile:
  // Meza Law Firm, Brian Hargrove Law, and Mullen & Mullen all load a live chat widget
  // (Clarity Livechat / ApexChat); Fulgham Hampton loads the same "Intaker" widget that
  // dropped Stephens Law Firm; Anderson Injury Lawyers lists 16 attorneys, one over this
  // profile's ceiling; Dunham & Jones has 123 lawyers across 14 Texas cities and is
  // primarily criminal defense; Allen & Weaver and the Law Office of Sandra Sprott are
  // general/family-law practices where PI is one of several areas, not the focus; Moxie Law
  // Group loads a Podium chat widget.
  personalInjury({
    businessName: "Law Office of James M. Stanley",
    website: "https://www.law-jms.com/",
    city: "Fort Worth",
    area: "Fort Worth",
    email: "jstanley@law-jms.com", // his own address, found on his America's Top 100 Attorneys listing page, 2026-09-12; nothing on his own site
    phone: "(817) 591-4222",
    contactName: "James M. Stanley",
    prospectScore: 79,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "representing injured Texans since 1976",
    buyingSignal: "long-tenured boutique, no visible chat widget",
    opportunity: "Decades-old boutique built on reputation; an after-hours miss costs referral trust as much as the case.",
    signals: ["representing clients since 1976", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "The Eric Reyes Law Firm, P.C.",
    website: "https://www.ericreyeslaw.com/",
    city: "Fort Worth",
    area: "Fort Worth, also Arlington office",
    email: "reyes@ericreyeslaw.com", // his own mailto: link on his own attorney bio page, 2026-09-12 - Eric Reyes personally
    phone: "(817) 332-1522",
    contactName: "Eric Reyes",
    prospectScore: 80,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "double board certified in Personal Injury Trial Law and Civil Trial Law, a distinction held by about 3% of Texas lawyers, practicing 27 years",
    buyingSignal: "double board-certified boutique, no visible chat widget",
    opportunity: "Credentialed boutique that draws cases on reputation alone; a missed after-hours call has no admin layer to catch it.",
    signals: ["double board certified (Personal Injury + Civil Trial Law)", "27 years in practice", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Robert C. Slim Law Firm, PLLC",
    website: "https://www.rcslawfirm.com/",
    city: "Fort Worth",
    area: "Hurst-Euless-Bedford, also a Dallas office",
    email: "robertcslim@rcslawfirm.com", // his own mailto: link on the firm's Hurst-Euless-Bedford page, 2026-09-12 - Robert Slim personally
    phone: "(214) 321-8225",
    contactName: "Robert C. Slim",
    prospectScore: 76,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a practice built on speaking directly with the principal lawyer, not a paralegal or staff investigator",
    buyingSignal: "solo/small boutique, direct-access pitch, no visible chat widget",
    opportunity: "The firm's own pitch is direct access to the attorney; an after-hours miss is the opposite of that promise.",
    signals: ["direct-access-to-attorney pitch", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Law Office of Robert L. Ward",
    website: "https://www.robwardlaw.com/",
    city: "Fort Worth",
    area: "Cleburne",
    email: "rob@robwardlaw.com", // his own mailto: link on the firm's personal injury page, 2026-09-12 - Robert Ward personally
    phone: "(817) 558-8788",
    contactName: "Robert L. Ward",
    prospectScore: 77,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a former Johnson County prosecutor with 23+ years of trial experience who personally handles every case",
    buyingSignal: "solo practitioner, former prosecutor, no visible chat widget",
    opportunity: "The firm's own pitch is that the attorney handles every case directly, never handed to a paralegal; a missed call breaks that promise.",
    signals: ["former Johnson County prosecutor", "23+ years trial experience", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Queenan Law (Law Offices of Kevin Queenan)",
    website: "https://www.queenanlaw.com/",
    city: "Fort Worth",
    area: "Arlington, also Weatherford and other Texas offices",
    email: NA,
    phone: "(817) 476-1797",
    contactName: "M. Kevin Queenan",
    prospectScore: 73,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a multi-city Texas personal injury practice built around one named founding attorney",
    buyingSignal: "founder-led multi-office boutique, no visible chat widget",
    opportunity: "Multi-office coordination under one founder is exactly where an after-hours call slips through.",
    signals: ["founder-led, multi-city Texas practice", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Law Offices of J. Kent McAfee, P.C.",
    website: "https://www.onelegalplace.com/",
    city: "Fort Worth",
    area: "Fort Worth",
    email: NA,
    phone: "817-332-7676",
    contactName: "J. Kent McAfee",
    prospectScore: 78,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "representing DFW accident victims since 1984, named a Top Attorney by Fort Worth Magazine for 17 consecutive years (2001-2017)",
    buyingSignal: "long-tenured boutique, no visible chat widget",
    opportunity: "Decades of peer recognition drives referral volume a small practice can't staff around the clock for.",
    signals: ["practicing since 1984", "Top Attorney, Fort Worth Magazine, 2001-2017", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "J. Alexander Law Firm, P.C.",
    website: "https://severeinjurylawyers.com/",
    city: "Fort Worth",
    area: "Fort Worth, headquartered in Dallas with several Texas offices",
    email: "marketing@jalexlawfirm.com", // found on his own America's Top 100 Bet-the-Company Litigators listing page, 2026-09-12 - a marketing inbox, not Josh Alexander or any attorney personally; address the firm generally, not him by name
    phone: "(214) 206-3264",
    contactName: NA,
    prospectScore: 74,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "founded by a Marine Corps veteran, about 6 attorneys with 75+ years combined personal injury litigation experience",
    buyingSignal: "veteran-founded boutique, no visible chat widget",
    opportunity: "Multi-office coordination for a founder-led boutique is exactly where an after-hours call slips through.",
    signals: ["founded by a Marine Corps veteran", "6 attorneys, 75+ years combined experience", "no visible chat widget"],
  }),
];
