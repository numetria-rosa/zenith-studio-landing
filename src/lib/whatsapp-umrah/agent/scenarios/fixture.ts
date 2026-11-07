import { PACKAGE_FORM_DEFAULTS, faqToText, packageToText, type PackageFields } from "../../kb/structured";
import type { OccasionInput } from "../../occasions";

/* A made-up demo agency (the same four packages as the "Zenith Demo Travel" demo account) used by the scenario
   suite. It is a fixture, not real data: the scenarios below assume exactly these prices, dates and occasions. */

const pkg = (over: Partial<PackageFields>): PackageFields => ({ ...PACKAGE_FORM_DEFAULTS, ...over });

export const FIXTURE_PACKAGES: PackageFields[] = [
  pkg({
    name: "7 Night Economy Umrah", type: "Umrah", nightsMakkah: 4, nightsMadinah: 3,
    makkahHotel: { name: "Dar Al Safa Hotel", stars: 3, distanceMetres: 650 }, madinahHotel: { name: "Al Noor Residence", stars: 3, distanceMetres: 400 },
    pricePerPerson: 1295, priceBasis: "quad sharing", deposit: 200, travelDates: "Departures 4 Dec 2026, 15 Jan 2027, 12 Feb 2027", departureAirports: "London Heathrow, Manchester",
    included: ["Return flights", "Visa", "Transfers"],
  }),
  pkg({
    name: "10 Night Premium Umrah", type: "Umrah", nightsMakkah: 5, nightsMadinah: 5,
    makkahHotel: { name: "Al Marwa Grand Hotel", stars: 5, distanceMetres: 150 }, madinahHotel: { name: "Taiba Front Hotel", stars: 5, distanceMetres: 100 },
    pricePerPerson: 2450, priceBasis: "twin sharing", deposit: 400, travelDates: "Departures 18 Dec 2026, 19 Feb 2027", departureAirports: "London Heathrow, Birmingham",
    included: ["Return flights", "Visa", "Guided ziyarat"],
  }),
  pkg({
    name: "Ramadan Umrah 2027", type: "Ramadan Umrah", nightsMakkah: 10, nightsMadinah: 4,
    makkahHotel: { name: "Al Marwa Grand Hotel", stars: 5, distanceMetres: 150 }, madinahHotel: { name: "Taiba Front Hotel", stars: 5, distanceMetres: 100 },
    pricePerPerson: 3950, priceBasis: "twin sharing", deposit: 750, paymentTerms: "Balance due 60 days before departure.", travelDates: "Departs 27 Feb 2027, returns 13 Mar 2027", departureAirports: "London Heathrow, Manchester, Birmingham",
    included: ["Return flights", "Visa", "Suhoor and iftar", "Guided ziyarat"],
  }),
  pkg({
    name: "Family Group Umrah, Easter 2027", type: "Group package", nightsMakkah: 5, nightsMadinah: 4,
    makkahHotel: { name: "Dar Al Safa Hotel", stars: 3, distanceMetres: 650 }, madinahHotel: { name: "Al Noor Residence", stars: 3, distanceMetres: 400 },
    pricePerPerson: 1650, priceBasis: "per adult, triple sharing", deposit: 300, travelDates: "Departs 1 Apr 2027, returns 10 Apr 2027", departureAirports: "London Heathrow",
    childPrice: 1150, infantPrice: 350, childMaxAge: 11,
  }),
];

const day = (s: string) => new Date(`${s}T00:00:00Z`);
export const FIXTURE_OCCASIONS: OccasionInput[] = [
  { name: "Ramadan 2027", startDate: day("2027-02-08"), endDate: day("2027-03-09") },
  { name: "Eid al-Fitr 2027", startDate: day("2027-03-09"), endDate: day("2027-03-11") },
  { name: "Hajj 2027", startDate: day("2027-05-15"), endDate: day("2027-05-20") },
];

export const FIXTURE_FAQ = { question: "Is the Umrah visa included?", answer: "Yes, the Umrah visa is included in every package and our team applies for it for you." };

/** The chunks the knowledge base would hand the model: one per package (ids p1..p4) and the FAQ (f1). */
export const FIXTURE_CHUNKS = [
  ...FIXTURE_PACKAGES.map((p, i) => ({ id: `p${i + 1}`, documentId: `d${i + 1}`, content: packageToText(p), distance: 0 })),
  { id: "f1", documentId: "df1", content: faqToText(FIXTURE_FAQ), distance: 0.1 },
];
