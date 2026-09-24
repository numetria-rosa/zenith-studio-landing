// Generates insta/leak-listicle/slide-*.html — 6-slide IG carousel.
// Numbered "your business = your leak" listicle format, the single
// strongest-performing pattern from a vidIQ outlier pull on our niche
// (@basharjkatou's "1 Business = 1 Automation... for law firms, sell them
// speed" carousel/reel, 2.2M followers, way above median). Cream/dark/
// orange house brand (same CSS system as insta/services-carousel).
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(scriptDir, "..", "insta", "leak-listicle");
fs.mkdirSync(outDir, { recursive: true });

const TOTAL = 6;

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

  .eyebrow{ font-family:'IBM Plex Mono'; font-size:22px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--orange); }
  h1{ font-family:'Fraunces'; font-weight:700; font-size:80px; line-height:1.13; letter-spacing:-.01em; margin-top:18px; color:var(--ink); max-width:920px; }
  h1 i{ font-style:italic; color:var(--orange); font-weight:600; }

  .body{ margin-top:32px; font-family:'IBM Plex Sans'; font-weight:400; font-size:33px; line-height:1.5; color:var(--mut); max-width:880px; }

  .how{ margin-top:44px; display:flex; align-items:flex-start; gap:18px; background:var(--dark2); border-radius:22px; padding:30px 34px; max-width:920px; }
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
  .site{ font-family:'IBM Plex Mono'; font-weight:700; font-size:19px; color:var(--mut); letter-spacing:.04em; }

  /* Cover */
  .cover h1{ font-size:86px; max-width:940px; }
  .cover .sub{ margin-top:30px; font-family:'IBM Plex Sans'; font-weight:500; font-size:34px; line-height:1.42; color:var(--mut); max-width:820px; }

  /* Numbered body slides */
  .num{ display:flex; align-items:center; justify-content:center; width:64px; height:64px; border-radius:16px; background:var(--dark2); color:var(--orange2); font-family:'IBM Plex Mono'; font-weight:700; font-size:26px; }
  .whoTag{ display:flex; align-items:center; gap:18px; }
  .whoTag .label{ font-family:'IBM Plex Mono'; font-weight:700; font-size:22px; letter-spacing:.1em; text-transform:uppercase; color:var(--mut); }

  /* CTA */
  .cta h1{ font-size:78px; }
  .cta .body{ font-size:33px; }
  .cta .pill{ margin-top:40px; display:inline-flex; align-items:center; gap:16px; background:var(--orange); padding:26px 44px; border-radius:22px; box-shadow:0 20px 44px -16px rgba(226,99,44,.5); }
  .cta .pill span{ font-family:'IBM Plex Sans'; font-weight:700; font-size:36px; color:var(--dark); }
  .cta .pill b{ font-family:'IBM Plex Mono'; font-weight:700; font-size:38px; color:var(--dark); }
</style>`;

const ARROW_SVG = `<svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#18140f" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

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
  for (let i = 1; i <= TOTAL - 1; i++) out += `<div class="seg${i <= current ? " on" : ""}"></div>`;
  out += `</div>\n`;
  return out;
}

function dots(activeIdx) {
  let out = `        <div class="dots">`;
  for (let i = 0; i < TOTAL; i++) out += `<div class="dot${i === activeIdx ? " on" : ""}"></div>`;
  out += `</div>\n`;
  return out;
}

const topbar = (idx) => `      <div class="topbar">
        <div class="topbar-left">
          <div class="logo"><span class="lw">ZENITH</span><span class="lai">AI</span></div>
          <div class="handle">@_zenithstudio_</div>
        </div>
        <div class="counter">0${idx} / 0${TOTAL}</div>
      </div>
`;

// ---- Slide 1: cover ----
const s1 = shell(`
${topbar(1)}
      <div class="content cover">
        <div class="eyebrow">Find your leak</div>
        <h1>Every business has <i>one AI-sized leak.</i></h1>
        <div class="sub">Find yours below, then fix it this week, not next quarter.</div>
      </div>
      <div class="footer">
${dots(0)}
        <div class="swipe"><span>Swipe</span><div class="btn">${ARROW_SVG}</div></div>
      </div>
`, "cover");

const LEAKS = [
  {
    who: "Law firms",
    headline: `You're leaking <i>billable hours.</i>`,
    body: "Every call, email, and meeting that doesn't turn into a logged, billed entry is work you already did and never got paid for.",
    howTag: "THE FIX",
    how: "Missed-call text-back, plus a billing clerk that drafts the entry for you to approve.",
  },
  {
    who: "Contractors & trades",
    headline: `You're leaking <i>missed calls.</i>`,
    body: "You're on a roof, under a sink, mid-job. The phone rings once, goes to voicemail, and that caller doesn't wait around.",
    howTag: "THE FIX",
    how: "A text-back agent that replies within seconds, from the number you already have.",
  },
  {
    who: "Salons & clinics",
    headline: `You're leaking <i>no-shows.</i>`,
    body: "A booking with no reminder is a coin flip. Multiply that across a full week and you're losing real chairs, real hours.",
    howTag: "THE FIX",
    how: "An AI receptionist that books the slot and sends the reminder automatically.",
  },
  {
    who: "Any service business",
    headline: `You're leaking <i>slow replies.</i>`,
    body: "The business that answers first wins the job. Most leads go cold within minutes of going quiet.",
    howTag: "THE FIX",
    how: "Lead capture and follow-up that never lets a lead just sit there.",
  },
];

const bodySlides = LEAKS.map((l, i) => shell(`
${topbar(i + 2)}
${progressBar(i + 1)}
      <div class="content">
        <div class="whoTag"><div class="num">${i + 1}</div><div class="label">${l.who}</div></div>
        <h1>${l.headline}</h1>
        <div class="body">${l.body}</div>
        <div class="how"><div class="tag">${l.howTag}</div><p>${l.how}</p></div>
      </div>
      <div class="footer">
${dots(i + 1)}
        <div class="swipe"><span>Swipe</span><div class="btn">${ARROW_SVG}</div></div>
      </div>
`));

// ---- Slide 6: CTA ----
const s6 = shell(`
${topbar(6)}
      <div class="content cta">
        <h1>Which leak is <i>yours?</i></h1>
        <div class="body">Comment or DM the word below and we'll tell you exactly what to fix first, no generic pitch.</div>
        <div class="pill"><span>Comment or DM</span> <b>"SYSTEMS"</b></div>
      </div>
      <div class="footer">
${dots(5)}
        <div class="swipe"><span>zenith-studio.site</span></div>
      </div>
`, "cta");

const files = [
  ["slide-01-cover.html", s1],
  ["slide-02-lawfirm.html", bodySlides[0]],
  ["slide-03-contractor.html", bodySlides[1]],
  ["slide-04-salon.html", bodySlides[2]],
  ["slide-05-anybiz.html", bodySlides[3]],
  ["slide-06-cta.html", s6],
];

for (const [name, html] of files) {
  fs.writeFileSync(path.join(outDir, name), html);
  console.log("wrote", name);
}
