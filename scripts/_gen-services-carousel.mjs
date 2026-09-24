// Generates insta/services-carousel/slide-*.html — a 7-slide IG carousel in
// the "bobbybuildsai"-style educational format (progress bar, numbered
// counter, quote-bar insight, bold "How:" line, swipe + dot pagination) but
// built from Zenith's real service catalog (src/lib/services.ts) and in the
// house cream/dark/orange brand used by the recent reels, not a copy of the
// reference post's copy, colors, or layout details.
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(scriptDir, "..", "insta", "services-carousel");
fs.mkdirSync(outDir, { recursive: true });

const TOTAL = 7;

const HEAD = `<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,600;1,9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --cream:#f2e9d8; --cream2:#ece0ca;
    --dark:#18140f; --dark2:#221c14;
    --ink:#221c12; --mut:rgba(34,28,18,.62); --mut2:rgba(34,28,18,.42);
    --orange:#e2632c; --orange2:#f0895a;
  }
  html,body{width:1080px;height:1350px;overflow:hidden}
  body{ background:var(--cream); color:var(--ink); font-family:'IBM Plex Sans',sans-serif; }
  .canvas{ position:relative; width:100%; height:100%; overflow:hidden; background:var(--cream); }
  .canvas::before{
    content:""; position:absolute; inset:0; z-index:0; pointer-events:none;
    background-image:
      linear-gradient(rgba(34,28,18,.055) 1px, transparent 1px),
      linear-gradient(90deg, rgba(34,28,18,.055) 1px, transparent 1px);
    background-size:38px 38px;
  }
  .frame{ position:relative; z-index:1; padding:64px 68px; height:100%; display:flex; flex-direction:column; }

  .topbar{ display:flex; align-items:center; justify-content:space-between; }
  .topbar-left{ display:flex; align-items:center; gap:14px; }
  .logo{ display:flex; align-items:center; gap:9px; background:var(--dark2); padding:12px 18px; border-radius:15px; }
  .logo .lw{ font-family:'Fraunces'; font-weight:700; font-size:23px; color:#f2e9d8; letter-spacing:-.01em; line-height:1; }
  .logo .lai{ display:flex; align-items:center; background:var(--orange); color:#18140f; font-family:'Fraunces'; font-weight:700; font-size:15px; line-height:1; padding:6px 10px 5px; border-radius:8px; }
  .handle{ font-family:'IBM Plex Mono'; font-weight:600; font-size:19px; color:var(--mut); letter-spacing:.01em; }
  .counter{ font-family:'IBM Plex Mono'; font-weight:600; font-size:17px; color:var(--mut); background:var(--cream2); padding:9px 16px; border-radius:11px; letter-spacing:.02em; }

  .progress{ margin-top:26px; display:flex; gap:7px; }
  .progress .seg{ flex:1; height:6px; border-radius:4px; background:var(--cream2); }
  .progress .seg.on{ background:var(--orange); }

  .content{ flex:1; display:flex; flex-direction:column; justify-content:center; }

  .eyebrow{ font-family:'IBM Plex Mono'; font-size:21px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--mut2); margin-top:34px; }
  h1{ font-family:'Fraunces'; font-weight:700; font-size:72px; line-height:1.14; letter-spacing:-.01em; margin-top:16px; color:var(--ink); max-width:900px; }
  h1 .hl{ box-shadow:inset 0 -20px 0 rgba(226,99,44,.28); }
  h1 i{ font-style:italic; color:var(--orange); font-weight:600; }

  .quote{ margin-top:44px; border-left:5px solid var(--orange); padding:4px 0 4px 28px; font-family:'Fraunces'; font-style:italic; font-weight:600; font-size:38px; line-height:1.36; color:var(--ink); max-width:880px; }

  .body{ margin-top:30px; font-family:'IBM Plex Sans'; font-weight:400; font-size:32px; line-height:1.5; color:var(--mut); max-width:880px; }

  .how{ margin-top:48px; display:flex; align-items:flex-start; gap:18px; background:var(--dark2); border-radius:22px; padding:30px 34px; max-width:920px; }
  .how .tag{ flex-shrink:0; font-family:'IBM Plex Mono'; font-weight:700; font-size:17px; letter-spacing:.1em; color:var(--orange2); background:rgba(226,99,44,.16); border:1px solid rgba(226,99,44,.4); padding:8px 13px; border-radius:9px; margin-top:2px; }
  .how p{ font-family:'IBM Plex Sans'; font-weight:600; font-size:27px; line-height:1.4; color:#f2e9d8; }

  .footer{ margin-top:32px; padding-top:26px; border-top:1px solid rgba(34,28,18,.12); display:flex; align-items:center; justify-content:space-between; }
  .dots{ display:flex; gap:9px; }
  .dot{ width:9px; height:9px; border-radius:50%; background:var(--mut2); opacity:.5; }
  .dot.on{ background:var(--orange); opacity:1; width:22px; border-radius:5px; }
  .swipe{ display:flex; align-items:center; gap:12px; }
  .swipe span{ font-family:'IBM Plex Mono'; font-weight:700; font-size:19px; letter-spacing:.1em; text-transform:uppercase; color:var(--ink); }
  .swipe .btn{ width:46px; height:46px; border-radius:50%; background:var(--orange); display:flex; align-items:center; justify-content:center; }
  .swipe .btn svg{ width:20px; height:20px; }

  /* Cover-specific */
  .cover .eyebrow{ margin-top:0; }
  .cover h1{ font-size:92px; margin-top:24px; max-width:960px; }
  .cover .sub{ margin-top:28px; font-family:'IBM Plex Sans'; font-weight:500; font-size:35px; line-height:1.4; color:var(--mut); max-width:800px; }
  .cover .stack{ margin-top:58px; display:flex; flex-direction:column; gap:19px; max-width:680px; }
  .cover .stack .item{ display:flex; align-items:center; gap:18px; font-family:'IBM Plex Sans'; font-weight:600; font-size:29px; color:var(--ink); }
  .cover .stack .item .n{ width:42px; height:42px; border-radius:11px; background:var(--dark2); color:var(--orange2); font-family:'IBM Plex Mono'; font-weight:700; font-size:20px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

  /* CTA-specific */
  .cta h1{ font-size:78px; }
  .cta .body{ font-size:33px; }
  .cta .pill{ margin-top:40px; display:inline-flex; align-items:center; gap:16px; background:var(--orange); padding:26px 44px; border-radius:22px; box-shadow:0 20px 44px -16px rgba(226,99,44,.5); }
  .cta .pill span{ font-family:'IBM Plex Sans'; font-weight:700; font-size:36px; color:var(--dark); }
  .cta .pill b{ font-family:'IBM Plex Mono'; font-weight:700; font-size:38px; color:var(--dark); }
</style>`;

function shell(bodyHtml, extraClass = "") {
  return `<!doctype html>
<html>
<head>${HEAD}</head>
<body>
  <div class="canvas ${extraClass}">
    <div class="frame">
${bodyHtml}
    </div>
  </div>
</body>
</html>
`;
}

function progressBar(current) {
  let out = `      <div class="progress">`;
  for (let i = 1; i <= 5; i++) out += `<div class="seg${i <= current ? " on" : ""}"></div>`;
  out += `</div>\n`;
  return out;
}

function dots(activeIdx) {
  let out = `        <div class="dots">`;
  for (let i = 0; i < TOTAL; i++) out += `<div class="dot${i === activeIdx ? " on" : ""}"></div>`;
  out += `</div>\n`;
  return out;
}

const ARROW_SVG = `<svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#18140f" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// ---- Slide 1: cover ----
const cover = shell(`
      <div class="topbar">
        <div class="topbar-left">
          <div class="logo"><span class="lw">ZENITH</span><span class="lai">AI</span></div>
          <div class="handle">@_zenithstudio_</div>
        </div>
        <div class="counter">01 / 07</div>
      </div>
      <div class="content">
      <div class="eyebrow">Systems, not tools</div>
      <h1>5 things AI should already be running <i>in your business.</i></h1>
      <div class="sub">If you're still doing any of these by hand, you're the bottleneck, not your team.</div>
      <div class="stack">
        <div class="item"><div class="n">1</div>Lead capture &amp; follow-up</div>
        <div class="item"><div class="n">2</div>Answering &amp; booking calls</div>
        <div class="item"><div class="n">3</div>Inbox triage</div>
        <div class="item"><div class="n">4</div>Missed-call text-back</div>
        <div class="item"><div class="n">5</div>Billable time capture</div>
      </div>
      </div>
      <div class="footer">
${dots(0)}
        <div class="swipe"><span>Swipe</span><div class="btn">${ARROW_SVG}</div></div>
      </div>
`, "cover");

// ---- Slides 2-6: services ----
const services = [
  {
    eyebrow: "01 · Lead capture & follow-up",
    headline: `Never lose a lead to a <i>slow reply.</i>`,
    quote: "If a lead doesn't hear back in five minutes, they're already calling the next name on the list.",
    body: "It replies by text and email the moment someone reaches out, qualifies them, and keeps following up until they book.",
    howTag: "HOW",
    how: "SMS + email agent, wired straight into your calendar.",
  },
  {
    eyebrow: "02 · AI Receptionist & Booking",
    headline: `Answers and books <i>while you're on the job.</i>`,
    quote: "Every call that goes unanswered is a job that just got booked somewhere else.",
    body: "Handles enquiries around the clock, books straight into your calendar, and sends the reminders that cut no-shows.",
    howTag: "HOW",
    how: "Voice agent live 24/7, synced to your real calendar.",
  },
  {
    eyebrow: "03 · AI Inbox Manager",
    headline: `Wake up to an inbox that's <i>already handled.</i>`,
    quote: "Your inbox isn't a to-do list, but it's been running your morning like one.",
    body: "Sorts and prioritizes every email, then drafts replies to the routine ones so your day starts with decisions, not admin.",
    howTag: "HOW",
    how: "Trained on your inbox, drafts overnight for your review.",
  },
  {
    eyebrow: "04 · Missed-Call Text-Back",
    headline: `A missed call doesn't have to be a <i>lost client.</i>`,
    quote: "A call that goes to voicemail is a lead that's already gone cold.",
    body: "The second a call goes unanswered, it texts back automatically and keeps the conversation going until they're booked in.",
    howTag: "HOW",
    how: "Fires within seconds of a missed call, every time.",
  },
  {
    eyebrow: "05 · Billing Clerk",
    headline: `Billable hours don't <i>write themselves down.</i>`,
    quote: "Every untracked call and email is time you did the work for and never billed.",
    body: "Reconstructs billable time from your calls, emails, and notes, then drafts it for approval before the write-down window closes.",
    howTag: "HOW",
    how: "Drafts only. Nothing goes out until you approve it.",
  },
];

const serviceSlides = services.map((s, i) => {
  const idx = i + 2; // slide index for filename (2..6)
  const slideNumInSet = i + 1; // 1..5 for counter/progress
  return shell(`
      <div class="topbar">
        <div class="topbar-left">
          <div class="logo"><span class="lw">ZENITH</span><span class="lai">AI</span></div>
          <div class="handle">@_zenithstudio_</div>
        </div>
        <div class="counter">0${idx} / 07</div>
      </div>
${progressBar(slideNumInSet)}
      <div class="content">
      <div class="eyebrow">${s.eyebrow}</div>
      <h1>${s.headline}</h1>
      <div class="quote">${s.quote}</div>
      <div class="body">${s.body}</div>
      <div class="how"><div class="tag">${s.howTag}</div><p>${s.how}</p></div>
      </div>
      <div class="footer">
${dots(i + 1)}
        <div class="swipe"><span>Swipe</span><div class="btn">${ARROW_SVG}</div></div>
      </div>
`);
});

// ---- Slide 7: CTA ----
const cta = shell(`
      <div class="topbar">
        <div class="topbar-left">
          <div class="logo"><span class="lw">ZENITH</span><span class="lai">AI</span></div>
          <div class="handle">@_zenithstudio_</div>
        </div>
        <div class="counter">07 / 07</div>
      </div>
      <div class="content">
      <div class="eyebrow">Pick one</div>
      <h1>We'll have it running <i>in your business this week.</i></h1>
      <div class="body">Every system in this carousel is live in a real client's business today, not a demo, not a prototype.</div>
      <div class="pill"><span>Comment or DM</span> <b>"SYSTEMS"</b></div>
      </div>
      <div class="footer">
${dots(6)}
        <div class="swipe"><span>zenith-studio.site</span></div>
      </div>
`, "cta");

const files = [
  ["slide-01-cover.html", cover],
  ["slide-02-leads.html", serviceSlides[0]],
  ["slide-03-receptionist.html", serviceSlides[1]],
  ["slide-04-inbox.html", serviceSlides[2]],
  ["slide-05-missed-call.html", serviceSlides[3]],
  ["slide-06-billing.html", serviceSlides[4]],
  ["slide-07-cta.html", cta],
];

for (const [name, html] of files) {
  fs.writeFileSync(path.join(outDir, name), html);
  console.log("wrote", name);
}
