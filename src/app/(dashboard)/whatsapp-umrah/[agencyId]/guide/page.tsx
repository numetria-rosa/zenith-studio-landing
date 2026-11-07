import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedAgency } from "@/lib/whatsapp-umrah/dashboard-data";
import { AGENT_NAME } from "@/lib/whatsapp-umrah/agent-name";
import { Glass, PageHeader } from "@/components/wa/ui";

const CAN = [
  "Answer from your packages, FAQs and occasions: prices, dates, hotels, distances, what is included, deposits and payment terms.",
  "Work out totals, deposits and balances for a group, and for adults plus children when you have set child and infant prices.",
  "List every package that fits a vague question (a month, an occasion, a hotel, a budget).",
  "Remember what the customer already said in the chat and not ask it twice.",
  "Reply in English, Arabic, Turkish or Urdu, matching each message.",
  "Pass the chat to your team with a plain reason and a summary when someone is ready to book, complains, or asks for a person.",
  "Relay your ATOL number if you have put it in your knowledge base.",
];

const CANT = [
  "Make or confirm a booking. Your team does that; Zeen says the request is noted.",
  "Take passports, photos of documents or card details. It tells the customer your team will collect them securely and hands the chat over.",
  "Answer questions about Islamic rulings beyond what your own guide text says, or give visa, legal or immigration advice.",
  "Invent a price, date or availability. If it is not in your knowledge base it says it will check and hands over.",
  "Chat about anything unrelated to your business. Meta bans general-purpose AI chat on WhatsApp, so Zeen politely declines.",
  "Claim ATOL protection that is not written in your knowledge base.",
  "Pretend to be a person. If asked, it says it is your virtual assistant.",
  "Send voice notes or reply to them. Voice notes, photos and stickers go to your team.",
];

const TIPS: [string, string][] = [
  ["One package per real product", "Give each departure its own package, with its own price and dates. Do not combine two prices in one description."],
  ["Fill the price step completely", "Price per person, the basis (quad, triple, twin), the deposit, and child and infant prices if you offer them. Zeen only quotes what is written."],
  ["Write dates the way a customer would say them", "For example: Departs 27 Feb 2027, returns 13 Mar 2027. List every departure date for the package."],
  ["Say how far the hotels are", "Add the distance in metres to the Haram and the Prophet's Mosque. Customers ask for it constantly."],
  ["Mark what is and is not included", "Use the chips: flights, visa, transfers, meals, ziyarat. A clear 'not included' list prevents disputes."],
  ["Set availability honestly", "Use Seats available, Few seats left or Sold out, and update it. Zeen repeats what it finds."],
  ["Add the questions you answer every day as FAQs", "Visa, passports needed, cancellation, payment plan, ATOL number, who the guide is. Use your own words."],
  ["Fill in Occasions", "Add Ramadan, Eid, Hajj and school holidays with dates so Zeen can match a customer's time of year to your packages."],
  ["Test in the Simulator", "Ask the questions your customers ask. If an answer is wrong or missing, fix the package or add an FAQ, then ask again."],
  ["Keep the team email watched", "Every handover emails your team with the reason and a summary. Answer from your own WhatsApp app and Zeen steps aside."],
];

export default async function GuidePage({ params }: { params: Promise<{ agencyId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  if (!(await getOwnedAgency(agencyId, session.user.id))) notFound();

  const list = (items: string[]) => (
    <ul className="mt-3 space-y-2 text-[14px] leading-6 text-mist">
      {items.map((t) => <li key={t} className="list-disc ml-5">{t}</li>)}
    </ul>
  );

  return (
    <div>
      <PageHeader title="Guide" subtitle={`What ${AGENT_NAME} can and cannot do, and how to fill in your knowledge base so it answers well.`} />
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
        <Glass className="rounded-2xl p-6">
          <h2 className="text-[16px] font-semibold">{AGENT_NAME} can</h2>
          {list(CAN)}
        </Glass>
        <Glass className="rounded-2xl p-6">
          <h2 className="text-[16px] font-semibold">{AGENT_NAME} will not</h2>
          {list(CANT)}
        </Glass>
      </div>
      <Glass className="mt-5 rounded-2xl p-6">
        <h2 className="text-[16px] font-semibold">Filling in your knowledge base well</h2>
        <ol className="mt-3 space-y-4 text-[14px] leading-6">
          {TIPS.map(([title, body], i) => (
            <li key={title} className="flex gap-3">
              <span className="font-mono text-dim">{i + 1}</span>
              <span><strong>{title}.</strong> <span className="text-mist">{body}</span></span>
            </li>
          ))}
        </ol>
      </Glass>
    </div>
  );
}
