import { genLinkedInCarousel } from "./_gen-linkedin-carousel.mjs";

genLinkedInCarousel({
  slug: "carousel-billable-leaks",
  total: 6,
  cover: {
    eyebrow: "For Law Firms",
    headline: "3 signals your firm is <i>leaking billable hours</i>",
    sub: "None of these show up on a P&L until the quarter is already over. Here is what to check this week.",
    chips: [
      { icon: "phone", label: "Missed Calls" },
      { icon: "clock", label: "After-Hours Intake" },
      { icon: "invoice", label: "Billing Accuracy" },
    ],
  },
  listSlide: {
    eyebrow: "The Signals",
    headline: "Where the hours actually go",
    items: [
      { title: "Calls that never get logged", body: "A partner takes a call from the car, handles it, and never enters it. Multiply that by every fee earner, every week." },
      { title: "Intake that stalls after hours", body: "A prospective client calls at 7 PM, gets voicemail, and calls the next firm on the list instead." },
      { title: "Billing that gets reconstructed from memory", body: "Time entries written up two weeks later are shorter, vaguer, and lower than the work actually justified." },
    ],
  },
  workflowSlide: {
    eyebrow: "How Zenith Fixes It",
    headline: "One system, running quietly in the background",
    diagram: {
      title: "zenith-ai · workflow",
      cursorOn: 1,
      nodes: [
        { icon: "phone", label: "Call Missed", sub: "TRIGGER", accent: "#5dd8ec" },
        { icon: "agent", label: "Zenith AI Agent", sub: "PROCESSING", accent: "#9b6cff" },
        { icon: "chat", label: "Text-Back Sent", sub: "ACTION", accent: "#9b6cff" },
        { icon: "calendar", label: "Logged & Booked", sub: "RESULT", accent: "#5dd8ec" },
      ],
    },
  },
  quoteSlide: {
    eyebrow: "The Pattern",
    headline: "It is never one big leak",
    quote: "It is a dozen small ones, each easy to justify on its own, that add up to a full day of billable time a month per fee earner.",
  },
  statSlide: {
    eyebrow: "What We Found",
    headline: "Reconstructed billing loses detail, and detail is what survives an audit",
    num: "18%",
    label: "average time-entry shrinkage when logged more than 48 hours after the work",
    sub: "That gap compounds. A firm billing 2,000 hours a month at $350/hr is leaving real revenue on the table before a single new client walks in.",
  },
  closeSlide: {
    headline: "We build the AI team that closes these three leaks",
    sub: "Missed-call text-back, after-hours intake, and billing reconstruction, running as one system inside your firm.",
    ctaText: "Send us a message, or visit zenith-studio.site",
  },
});
