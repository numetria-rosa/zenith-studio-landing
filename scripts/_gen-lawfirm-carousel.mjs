// Generates insta/lawfirm-carousel/slide-*.html — an 8-slide IG carousel
// selling the Law Firm AI Team service (src/lib/services.ts id "law-firms").
// Jet-black + amber-300 (#fcd34d) palette matching src/app/demo/law-firm-ai-team,
// glassmorphism cards, and small inline-SVG agent-flow diagrams per role.
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(scriptDir, "..", "insta", "lawfirm-carousel");
fs.mkdirSync(outDir, { recursive: true });

const TOTAL = 8;

const HEAD = `<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,600;1,9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#000000;
    --card:rgba(255,255,255,.05); --card-bd:rgba(255,255,255,.1); --card-hi:rgba(255,255,255,.09);
    --ink:#fdfaf3; --mut:rgba(253,250,243,.62); --mut2:rgba(253,250,243,.4);
    --yellow:#fcd34d; --yellow2:#fde68a; --yellowSoft:rgba(252,211,77,.14); --yellowBd:rgba(252,211,77,.35);
  }
  html,body{width:1080px;height:1350px;overflow:hidden}
  body{ background:var(--bg); color:var(--ink); font-family:'IBM Plex Sans',sans-serif; }
  .canvas{ position:relative; width:100%; height:100%; overflow:hidden; background:var(--bg); }
  .canvas::before{
    content:""; position:absolute; inset:0; z-index:0; pointer-events:none;
    background:
      radial-gradient(ellipse 60% 30% at 105% -8%, rgba(252,211,77,.18), transparent 55%),
      radial-gradient(ellipse 50% 26% at -10% 108%, rgba(252,211,77,.08), transparent 60%);
  }
  .frame{ position:relative; z-index:1; padding:60px 66px; height:100%; display:flex; flex-direction:column; }

  .glass{ background:var(--card); backdrop-filter:blur(22px) saturate(140%); -webkit-backdrop-filter:blur(22px) saturate(140%); border:1px solid var(--card-bd); box-shadow:0 24px 60px -24px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.06); }

  .topbar{ display:flex; align-items:center; justify-content:space-between; }
  .topbar-left{ display:flex; align-items:center; gap:14px; }
  .logo{ display:flex; align-items:center; gap:9px; background:var(--card); border:1px solid var(--card-bd); padding:11px 17px; border-radius:15px; }
  .logo .lw{ font-family:'Fraunces'; font-weight:700; font-size:22px; color:var(--ink); letter-spacing:-.01em; line-height:1; }
  .logo .lai{ display:flex; align-items:center; background:var(--yellow); color:#000; font-family:'Fraunces'; font-weight:700; font-size:14px; line-height:1; padding:6px 9px 5px; border-radius:8px; }
  .handle{ font-family:'IBM Plex Mono'; font-weight:600; font-size:22px; color:var(--mut); letter-spacing:.01em; }
  .counter{ font-family:'IBM Plex Mono'; font-weight:600; font-size:20px; color:var(--yellow2); background:var(--card); border:1px solid var(--card-bd); padding:9px 15px; border-radius:11px; letter-spacing:.02em; }

  .progress{ margin-top:24px; display:flex; gap:7px; }
  .progress .seg{ flex:1; height:5px; border-radius:4px; background:var(--card-bd); }
  .progress .seg.on{ background:var(--yellow); }

  .content{ flex:1; display:flex; flex-direction:column; justify-content:center; }

  .eyebrow{ font-family:'IBM Plex Mono'; font-size:23px; font-weight:600; letter-spacing:.13em; text-transform:uppercase; color:var(--yellow); }
  h1{ font-family:'Fraunces'; font-weight:700; font-size:70px; line-height:1.15; letter-spacing:-.01em; margin-top:18px; color:var(--ink); max-width:920px; }
  h1 i{ font-style:italic; color:var(--yellow); font-weight:600; }

  .sub{ margin-top:22px; font-family:'IBM Plex Sans'; font-weight:400; font-size:32px; line-height:1.5; color:var(--mut); max-width:880px; }

  .diagram{ margin-top:38px; border-radius:26px; padding:38px; }
  .diagram svg{ display:block; width:100%; height:auto; }

  .how{ margin-top:30px; display:flex; align-items:flex-start; gap:16px; border-radius:22px; padding:26px 30px; max-width:940px; }
  .how .tag{ flex-shrink:0; font-family:'IBM Plex Mono'; font-weight:700; font-size:17px; letter-spacing:.1em; color:#000; background:var(--yellow); padding:8px 13px; border-radius:9px; margin-top:2px; }
  .how p{ font-family:'IBM Plex Sans'; font-weight:500; font-size:27px; line-height:1.45; color:var(--yellow2); }

  .footer{ margin-top:28px; padding-top:24px; border-top:1px solid var(--card-bd); display:flex; align-items:center; justify-content:space-between; }
  .dots{ display:flex; gap:8px; }
  .dot{ width:8px; height:8px; border-radius:50%; background:var(--card-bd); }
  .dot.on{ background:var(--yellow); width:20px; border-radius:5px; }
  .swipe{ display:flex; align-items:center; gap:12px; }
  .swipe span{ font-family:'IBM Plex Mono'; font-weight:700; font-size:20px; letter-spacing:.1em; text-transform:uppercase; color:var(--ink); }
  .swipe .btn{ width:46px; height:46px; border-radius:50%; background:var(--yellow); display:flex; align-items:center; justify-content:center; }
  .swipe .btn svg{ width:20px; height:20px; }
  .site{ font-family:'IBM Plex Mono'; font-weight:700; font-size:20px; color:var(--mut); letter-spacing:.04em; }

  /* Cover */
  .cover h1{ font-size:84px; max-width:970px; }

  /* Team overview */
  .teamgrid{ margin-top:36px; display:flex; flex-direction:column; gap:16px; max-width:920px; }
  .teamrow{ display:flex; align-items:center; gap:22px; border-radius:20px; padding:24px 28px; }
  .teamrow .icon{ width:60px; height:60px; border-radius:14px; background:var(--yellowSoft); border:1px solid var(--yellowBd); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .teamrow .icon svg{ width:28px; height:28px; }
  .teamrow .tx b{ display:block; font-family:'IBM Plex Sans'; font-weight:700; font-size:28px; color:var(--ink); }
  .teamrow .tx span{ font-family:'IBM Plex Sans'; font-weight:400; font-size:22px; color:var(--mut); }

  /* Compare slide */
  .panels{ margin-top:36px; display:flex; flex-direction:column; gap:20px; }
  .panel{ border-radius:22px; padding:28px 32px; }
  .panel.on{ border-color:var(--yellowBd); }
  .prow{ display:flex; align-items:center; justify-content:space-between; }
  .ptitle{ font-family:'IBM Plex Sans'; font-size:27px; font-weight:700; color:var(--ink); }
  .ptitle span{ color:var(--mut); font-weight:500; }
  .panel.on .ptitle span{ color:var(--yellow); }
  .plabel{ margin-top:14px; font-family:'IBM Plex Sans'; font-size:22px; color:var(--mut); line-height:1.4; }
  .panel.on .plabel{ color:var(--yellow2); }

  /* CTA */
  .cta h1{ font-size:72px; }
  .cta .trialtag{ margin-top:30px; display:inline-flex; align-items:center; font-family:'IBM Plex Mono'; font-weight:700; font-size:18px; letter-spacing:.08em; text-transform:uppercase; color:var(--yellow); background:var(--yellowSoft); border:1px solid var(--yellowBd); padding:10px 18px; border-radius:12px; }
  .cta .price{ margin-top:18px; display:flex; align-items:baseline; gap:12px; }
  .cta .price b{ font-family:'Fraunces'; font-weight:700; font-size:52px; color:var(--yellow); }
  .cta .price span{ font-family:'IBM Plex Sans'; font-size:24px; color:var(--mut); }
  .pill{ margin-top:34px; display:inline-flex; align-items:center; gap:14px; background:var(--yellow); padding:26px 42px; border-radius:22px; box-shadow:0 20px 44px -16px rgba(252,211,77,.4); }
  .pill span{ font-family:'IBM Plex Sans'; font-weight:700; font-size:36px; color:#000; }
  .pill b{ font-family:'IBM Plex Mono'; font-weight:700; font-size:38px; color:#000; }
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
  for (let i = 1; i <= 6; i++) out += `<div class="seg${i <= current ? " on" : ""}"></div>`;
  out += `</div>\n`;
  return out;
}

function dots(activeIdx) {
  let out = `        <div class="dots">`;
  for (let i = 0; i < TOTAL; i++) out += `<div class="dot${i === activeIdx ? " on" : ""}"></div>`;
  out += `</div>\n`;
  return out;
}

const topbar = (counterLabel) => `      <div class="topbar">
        <div class="topbar-left">
          <div class="logo"><span class="lw">ZENITH</span><span class="lai">AI</span></div>
          <div class="handle">@_zenithstudio_</div>
        </div>
        <div class="counter">${counterLabel}</div>
      </div>
`;

const ARROW_SVG = `<svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#000" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// ---- Icons (stroke, yellow) ----
const ICONS = {
  phoneMissed: `<svg viewBox="0 0 24 24" fill="none"><path d="M16 8l4-4M20 8l-4-4" stroke="#fcd34d" stroke-width="1.8" stroke-linecap="round"/><path d="M4 5c0 8.3 6.7 15 15 15v-3.2c0-.5-.3-.9-.8-1l-3-.7c-.4-.1-.8 0-1.1.3l-1.2 1.2a12 12 0 0 1-5.5-5.5l1.2-1.2c.3-.3.4-.7.3-1.1l-.7-3c-.1-.5-.5-.8-1-.8H4Z" stroke="#fcd34d" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 5.5C4 4.7 4.7 4 5.5 4h13c.8 0 1.5.7 1.5 1.5v10c0 .8-.7 1.5-1.5 1.5H9l-4 3.5v-3.5H5.5A1.5 1.5 0 0 1 4 15.5v-10Z" stroke="#fcd34d" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#fcd34d" stroke-width="1.8"/><path d="M8 12.5l2.5 2.5L16 9.5" stroke="#fcd34d" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#fcd34d" stroke-width="1.8"/><path d="M12 7v5l3.5 2" stroke="#fcd34d" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  send: `<svg viewBox="0 0 24 24" fill="none"><path d="M21 3 3 10.5l7 2.5 2.5 7L21 3Z" stroke="#fcd34d" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  list: `<svg viewBox="0 0 24 24" fill="none"><path d="M8 6h12M8 12h12M8 18h12" stroke="#fcd34d" stroke-width="1.8" stroke-linecap="round"/><circle cx="4" cy="6" r="1.3" fill="#fcd34d"/><circle cx="4" cy="12" r="1.3" fill="#fcd34d"/><circle cx="4" cy="18" r="1.3" fill="#fcd34d"/></svg>`,
  mic: `<svg viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" stroke="#fcd34d" stroke-width="1.8"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="#fcd34d" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  doc: `<svg viewBox="0 0 24 24" fill="none"><path d="M6 3h9l5 5v13H6V3Z" stroke="#fcd34d" stroke-width="1.8" stroke-linejoin="round"/><path d="M15 3v5h5M9 13h6M9 17h6" stroke="#fcd34d" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  dollar: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#fcd34d" stroke-width="1.8"/><path d="M12 6.5v11M15 9.2c0-1.2-1.3-2.2-3-2.2s-3 .9-3 2.2c0 3 6 1.6 6 4.6 0 1.2-1.3 2.2-3 2.2s-3-1-3-2.2" stroke="#fcd34d" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.2" stroke="#fcd34d" stroke-width="1.8"/><path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" stroke="#fcd34d" stroke-width="1.8" stroke-linecap="round"/><circle cx="17" cy="9" r="2.6" stroke="#fcd34d" stroke-width="1.6" opacity=".7"/><path d="M15.8 14.2c2.4.3 4.2 2.2 4.2 5.3" stroke="#fcd34d" stroke-width="1.6" stroke-linecap="round" opacity=".7"/></svg>`,
};

function flowDiagram(steps) {
  // steps: [{icon, label}] rendered as 3 glass nodes connected by arrows
  const nodeW = 280, nodeH = 168, gap = 46, svgW = nodeW * 3 + gap * 2, svgH = nodeH + 20;
  let svg = `<svg viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">`;
  steps.forEach((s, i) => {
    const x = i * (nodeW + gap);
    svg += `<rect x="${x}" y="10" width="${nodeW}" height="${nodeH}" rx="22" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>`;
    svg += `<circle cx="${x + nodeW / 2}" cy="66" r="30" fill="rgba(252,211,77,0.12)" stroke="rgba(252,211,77,0.4)" stroke-width="1.5"/>`;
    const sizedIcon = s.icon.replace("<svg ", '<svg width="26" height="26" ');
    svg += `<g transform="translate(${x + nodeW / 2 - 13}, 53)">${sizedIcon}</g>`;
    const lines = s.label.split("\n");
    lines.forEach((line, li) => {
      svg += `<text x="${x + nodeW / 2}" y="${124 + li * 25}" text-anchor="middle" font-family="IBM Plex Sans" font-weight="600" font-size="20" fill="#fdfaf3">${line}</text>`;
    });
    if (i < steps.length - 1) {
      const ax = x + nodeW + 6;
      svg += `<path d="M${ax} ${10 + nodeH / 2} L${ax + gap - 12} ${10 + nodeH / 2}" stroke="#fcd34d" stroke-width="2.5" stroke-linecap="round"/>`;
      svg += `<path d="M${ax + gap - 20} ${10 + nodeH / 2 - 7} L${ax + gap - 12} ${10 + nodeH / 2} L${ax + gap - 20} ${10 + nodeH / 2 + 7}" fill="none" stroke="#fcd34d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
  });
  svg += `</svg>`;
  return svg;
}

function teamDiagram() {
  // "Your Firm" center node with 3 spokes to each agent
  const w = 900, h = 300;
  const center = { x: w / 2, y: 60 };
  const agents = [
    { x: 110, y: 240, label: "Text-Back" },
    { x: 450, y: 240, label: "Follow-Up" },
    { x: 790, y: 240, label: "Billing" },
  ];
  let svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
  agents.forEach((a) => {
    svg += `<path d="M${center.x} ${center.y + 30} L${a.x} ${a.y - 40}" stroke="rgba(252,211,77,0.35)" stroke-width="1.5" stroke-dasharray="4 5"/>`;
  });
  svg += `<rect x="${center.x - 110}" y="${center.y - 32}" width="220" height="64" rx="18" fill="rgba(252,211,77,0.12)" stroke="rgba(252,211,77,0.5)" stroke-width="1.5"/>`;
  svg += `<text x="${center.x}" y="${center.y + 8}" text-anchor="middle" font-family="Fraunces" font-weight="700" font-style="italic" font-size="28" fill="#fcd34d">Your Firm</text>`;
  agents.forEach((a) => {
    svg += `<rect x="${a.x - 110}" y="${a.y - 40}" width="220" height="88" rx="20" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>`;
    svg += `<text x="${a.x}" y="${a.y - 2}" text-anchor="middle" font-family="IBM Plex Sans" font-weight="700" font-size="23" fill="#fdfaf3">${a.label}</text>`;
    svg += `<text x="${a.x}" y="${a.y + 25}" text-anchor="middle" font-family="IBM Plex Mono" font-size="16" fill="rgba(253,250,243,0.5)">AI agent</text>`;
  });
  svg += `</svg>`;
  return svg;
}

// ================= Slides =================

const s1_cover = shell(`
${topbar("01 / 08")}
      <div class="content cover">
        <div class="eyebrow">Law Firm AI Team</div>
        <h1>Run your firm <i>with an AI team,</i> before 2027.</h1>
        <div class="sub">It answers, follows up, and bills the hours you're already owed, while you sleep. Less manual work for everyone at the firm.</div>
        <div class="teamgrid">
          <div class="teamrow glass"><div class="icon">${ICONS.clock}</div><div class="tx"><b>Works 24/7</b><span>Nights, weekends, trial days, all covered.</span></div></div>
          <div class="teamrow glass"><div class="icon">${ICONS.users}</div><div class="tx"><b>Less manual work</b><span>No new hires, no training, no turnover.</span></div></div>
          <div class="teamrow glass"><div class="icon">${ICONS.check}</div><div class="tx"><b>Nothing falls through</b><span>Every call, lead, and billable hour handled.</span></div></div>
        </div>
      </div>
      <div class="footer">
${dots(0)}
        <div class="swipe"><span>Swipe</span><div class="btn">${ARROW_SVG}</div></div>
      </div>
`, "cover");

const s2_team = shell(`
${topbar("02 / 08")}
${progressBar(1)}
      <div class="content">
        <div class="eyebrow">Meet the team</div>
        <h1>Three AI agents. <i>One firm.</i></h1>
        <div class="sub">Each one owns a leak your firm already has. Together, they close all three.</div>
        <div class="diagram glass">${teamDiagram()}</div>
      </div>
      <div class="footer">
${dots(1)}
        <div class="swipe"><span>Swipe</span><div class="btn">${ARROW_SVG}</div></div>
      </div>
`);

const s3_textback = shell(`
${topbar("03 / 08")}
${progressBar(2)}
      <div class="content">
        <div class="eyebrow">Agent 01 &middot; Missed Call Text-Back</div>
        <h1>No call goes <i>unanswered.</i></h1>
        <div class="sub">34% of callers who hit voicemail never call back. This agent makes sure they never have to.</div>
        <div class="diagram glass">${flowDiagram([
          { icon: ICONS.phoneMissed, label: "Call goes\nunanswered" },
          { icon: ICONS.chat, label: "AI texts back\nin seconds" },
          { icon: ICONS.check, label: "Lead stays\nengaged" },
        ])}</div>
        <div class="how glass"><div class="tag">RESULT</div><p>Every missed call gets a reply before the caller has hung up on the idea of your firm.</p></div>
      </div>
      <div class="footer">
${dots(2)}
        <div class="swipe"><span>Swipe</span><div class="btn">${ARROW_SVG}</div></div>
      </div>
`);

const s4_followup = shell(`
${topbar("04 / 08")}
${progressBar(3)}
      <div class="content">
        <div class="eyebrow">Agent 02 &middot; Follow-Up Clerk</div>
        <h1>Works the leads <i>that went quiet.</i></h1>
        <div class="sub">A consult that didn't retain isn't dead, it's just unattended. This agent keeps working it.</div>
        <div class="diagram glass">${flowDiagram([
          { icon: ICONS.clock, label: "Lead goes\nquiet" },
          { icon: ICONS.send, label: "AI follows up\nby text and email" },
          { icon: ICONS.list, label: "Retained, or\nlogged and closed" },
        ])}</div>
        <div class="how glass"><div class="tag">RESULT</div><p>No lead sits in a forgotten inbox. Every one gets worked until it converts or closes.</p></div>
      </div>
      <div class="footer">
${dots(3)}
        <div class="swipe"><span>Swipe</span><div class="btn">${ARROW_SVG}</div></div>
      </div>
`);

const s5_billing = shell(`
${topbar("05 / 08")}
${progressBar(4)}
      <div class="content">
        <div class="eyebrow">Agent 03 &middot; Billing Clerk</div>
        <h1>Billable time, <i>reconstructed.</i></h1>
        <div class="sub">Write-downs jump from 6% to 18% once time is more than 14 days old. This agent gets it drafted before that window closes.</div>
        <div class="diagram glass">${flowDiagram([
          { icon: ICONS.mic, label: "Calls and emails\nhappen" },
          { icon: ICONS.doc, label: "AI drafts\nthe time entry" },
          { icon: ICONS.dollar, label: "You approve,\nit gets billed" },
        ])}</div>
        <div class="how glass"><div class="tag">RESULT</div><p>Nothing goes out until you approve it. It just makes sure there's something to approve.</p></div>
      </div>
      <div class="footer">
${dots(4)}
        <div class="swipe"><span>Swipe</span><div class="btn">${ARROW_SVG}</div></div>
      </div>
`);

const s6_compare = shell(`
${topbar("06 / 08")}
${progressBar(5)}
      <div class="content">
        <div class="eyebrow">The math</div>
        <h1>One front desk takes <i>one call.</i> One AI team takes <i>all of them.</i></h1>
        <div class="panels">
          <div class="panel glass">
            <div class="prow"><div class="ptitle">Human front desk <span>&middot; office hours only</span></div></div>
            <div class="plabel">Calls after 6pm, over lunch, or during a trial go to voicemail. Most never call back.</div>
          </div>
          <div class="panel glass on">
            <div class="prow"><div class="ptitle">AI team <span>&middot; 24/7, every line</span></div></div>
            <div class="plabel">Every missed call, quiet lead, and billable hour gets handled the same day it happens.</div>
          </div>
        </div>
      </div>
      <div class="footer">
${dots(5)}
        <div class="swipe"><span>Swipe</span><div class="btn">${ARROW_SVG}</div></div>
      </div>
`);

const s7_team2 = shell(`
${topbar("07 / 08")}
${progressBar(6)}
      <div class="content">
        <div class="eyebrow">What you get</div>
        <h1>One team, <i>three roles covered.</i></h1>
        <div class="teamgrid">
          <div class="teamrow glass"><div class="icon">${ICONS.phoneMissed}</div><div class="tx"><b>Missed Call Text-Back</b><span>Texts back every unanswered call in seconds.</span></div></div>
          <div class="teamrow glass"><div class="icon">${ICONS.send}</div><div class="tx"><b>Follow-Up Clerk</b><span>Works the leads that didn't retain until they do.</span></div></div>
          <div class="teamrow glass"><div class="icon">${ICONS.doc}</div><div class="tx"><b>Billing Clerk</b><span>Reconstructs billable time before write-downs hit.</span></div></div>
        </div>
      </div>
      <div class="footer">
${dots(6)}
        <div class="swipe"><span>Swipe</span><div class="btn">${ARROW_SVG}</div></div>
      </div>
`);

const s8_cta = shell(`
${topbar("08 / 08")}
      <div class="content cta">
        <div class="eyebrow">Run it this week</div>
        <h1>Your firm's AI team, <i>live before 2027.</i></h1>
        <div class="sub">Try your AI team free for 3 days, no cost, no commitment. See it answer, follow up, and bill before you pay a cent.</div>
        <div class="trialtag">3-day free trial</div>
        <div class="price"><b>$1,200</b><span>/ month after your trial</span></div>
        <div class="pill"><span>Comment or DM</span> <b>"FIRM"</b></div>
      </div>
      <div class="footer">
${dots(7)}
        <div class="swipe"><span>zenith-studio.site</span></div>
      </div>
`, "cta");

const files = [
  ["slide-01-cover.html", s1_cover],
  ["slide-02-team.html", s2_team],
  ["slide-03-textback.html", s3_textback],
  ["slide-04-followup.html", s4_followup],
  ["slide-05-billing.html", s5_billing],
  ["slide-06-compare.html", s6_compare],
  ["slide-07-recap.html", s7_team2],
  ["slide-08-cta.html", s8_cta],
];

for (const [name, html] of files) {
  fs.writeFileSync(path.join(outDir, name), html);
  console.log("wrote", name);
}
