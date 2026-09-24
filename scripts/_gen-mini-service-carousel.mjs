// Generates short (5-slide) IG carousels for individual "mini" services, in
// the house cream/dark/orange brand (same as insta/services-carousel), with
// a vertical glowing-node timeline for the "how it works" slide - a fresher
// diagram style than the horizontal flow boxes used on the law firm
// carousel, inspired by a quick Pinterest pass on numbered vertical-timeline
// UI patterns (not copied - just the "glowing node + connecting line" idea).
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const TOTAL = 5;

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
  .handle{ font-family:'IBM Plex Mono'; font-weight:600; font-size:22px; color:var(--mut); letter-spacing:.01em; }
  .counter{ font-family:'IBM Plex Mono'; font-weight:600; font-size:19px; color:var(--mut); background:var(--cream2); padding:9px 16px; border-radius:11px; letter-spacing:.02em; }

  .progress{ margin-top:26px; display:flex; gap:7px; }
  .progress .seg{ flex:1; height:6px; border-radius:4px; background:var(--cream2); }
  .progress .seg.on{ background:var(--orange); }

  .content{ flex:1; display:flex; flex-direction:column; justify-content:center; }

  .eyebrow{ font-family:'IBM Plex Mono'; font-size:25px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--mut2); }
  h1{ font-family:'Fraunces'; font-weight:700; font-size:86px; line-height:1.13; letter-spacing:-.01em; margin-top:20px; color:var(--ink); max-width:940px; }
  h1 i{ font-style:italic; color:var(--orange); font-weight:600; }

  .sub{ margin-top:28px; font-family:'IBM Plex Sans'; font-weight:400; font-size:37px; line-height:1.48; color:var(--mut); max-width:880px; }

  .quote{ margin-top:44px; border-left:5px solid var(--orange); padding:4px 0 4px 28px; font-family:'Fraunces'; font-style:italic; font-weight:600; font-size:42px; line-height:1.34; color:var(--ink); max-width:880px; }

  /* Vertical glowing-node timeline */
  .vtimeline{ margin-top:52px; position:relative; padding-left:84px; max-width:900px; }
  .vtimeline::before{ content:""; position:absolute; left:29px; top:8px; bottom:8px; width:2px; background:linear-gradient(var(--orange), rgba(226,99,44,.15)); }
  .vstep{ position:relative; margin-bottom:48px; }
  .vstep:last-child{ margin-bottom:0; }
  .vnode{ position:absolute; left:-84px; top:-6px; width:60px; height:60px; border-radius:50%; background:var(--dark2); border:2px solid var(--orange); display:flex; align-items:center; justify-content:center; box-shadow:0 0 0 8px rgba(226,99,44,.12); }
  .vnode span{ font-family:'IBM Plex Mono'; font-weight:700; font-size:25px; color:var(--orange2); }
  .vtext b{ display:block; font-family:'IBM Plex Sans'; font-weight:700; font-size:33px; color:var(--ink); }
  .vtext p{ margin-top:7px; font-family:'IBM Plex Sans'; font-weight:400; font-size:26px; color:var(--mut); line-height:1.4; }

  .how{ margin-top:44px; display:flex; align-items:flex-start; gap:18px; background:var(--dark2); border-radius:22px; padding:32px 36px; max-width:940px; }
  .how .tag{ flex-shrink:0; font-family:'IBM Plex Mono'; font-weight:700; font-size:19px; letter-spacing:.1em; color:var(--orange2); background:rgba(226,99,44,.16); border:1px solid rgba(226,99,44,.4); padding:9px 14px; border-radius:9px; margin-top:2px; }
  .how p{ font-family:'IBM Plex Sans'; font-weight:500; font-size:31px; line-height:1.42; color:#f2e9d8; }

  .footer{ margin-top:32px; padding-top:26px; border-top:1px solid rgba(34,28,18,.12); display:flex; align-items:center; justify-content:space-between; }
  .dots{ display:flex; gap:9px; }
  .dot{ width:9px; height:9px; border-radius:50%; background:var(--mut2); opacity:.5; }
  .dot.on{ background:var(--orange); opacity:1; width:22px; border-radius:5px; }
  .swipe{ display:flex; align-items:center; gap:12px; }
  .swipe span{ font-family:'IBM Plex Mono'; font-weight:700; font-size:21px; letter-spacing:.1em; text-transform:uppercase; color:var(--ink); }
  .swipe .btn{ width:48px; height:48px; border-radius:50%; background:var(--orange); display:flex; align-items:center; justify-content:center; }
  .swipe .btn svg{ width:21px; height:21px; }
  .site{ font-family:'IBM Plex Mono'; font-weight:700; font-size:21px; color:var(--mut); letter-spacing:.04em; }

  /* CTA */
  .cta .pill{ margin-top:44px; display:inline-flex; align-items:center; gap:16px; background:var(--orange); padding:28px 46px; border-radius:22px; box-shadow:0 20px 44px -16px rgba(226,99,44,.5); }
  .cta .pill span{ font-family:'IBM Plex Sans'; font-weight:700; font-size:40px; color:var(--dark); }
  .cta .pill b{ font-family:'IBM Plex Mono'; font-weight:700; font-size:42px; color:var(--dark); }
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

function vtimeline(steps) {
  let out = `<div class="vtimeline">`;
  steps.forEach((s, i) => {
    out += `<div class="vstep"><div class="vnode"><span>${i + 1}</span></div><div class="vtext"><b>${s.title}</b><p>${s.body}</p></div></div>`;
  });
  out += `</div>`;
  return out;
}

/* cfg: { slug, eyebrow0, headline0, sub0, eyebrow1, headline1, quote1,
   eyebrow2, headline2, sub2, steps2, headline3, body3, howTag3,
   headline4, sub4, ctaWord } */
export function genMiniServiceCarousel(cfg) {
  const outDir = path.join(scriptDir, "..", "insta", cfg.slug);
  fs.mkdirSync(outDir, { recursive: true });

  const s1 = shell(`
${topbar(1)}
      <div class="content">
        <div class="eyebrow">${cfg.eyebrow0}</div>
        <h1>${cfg.headline0}</h1>
        <div class="sub">${cfg.sub0}</div>
      </div>
      <div class="footer">
${dots(0)}
        <div class="swipe"><span>Swipe</span><div class="btn">${ARROW_SVG}</div></div>
      </div>
`);

  const s2 = shell(`
${topbar(2)}
${progressBar(1)}
      <div class="content">
        <div class="eyebrow">${cfg.eyebrow1}</div>
        <h1>${cfg.headline1}</h1>
        <div class="quote">${cfg.quote1}</div>
      </div>
      <div class="footer">
${dots(1)}
        <div class="swipe"><span>Swipe</span><div class="btn">${ARROW_SVG}</div></div>
      </div>
`);

  const s3 = shell(`
${topbar(3)}
${progressBar(2)}
      <div class="content">
        <div class="eyebrow">${cfg.eyebrow2}</div>
        <h1>${cfg.headline2}</h1>
${vtimeline(cfg.steps2)}
      </div>
      <div class="footer">
${dots(2)}
        <div class="swipe"><span>Swipe</span><div class="btn">${ARROW_SVG}</div></div>
      </div>
`);

  const s4 = shell(`
${topbar(4)}
${progressBar(3)}
      <div class="content">
        <h1>${cfg.headline3}</h1>
        <div class="how"><div class="tag">${cfg.howTag3}</div><p>${cfg.body3}</p></div>
      </div>
      <div class="footer">
${dots(3)}
        <div class="swipe"><span>Swipe</span><div class="btn">${ARROW_SVG}</div></div>
      </div>
`);

  const s5 = shell(`
${topbar(5)}
      <div class="content cta">
        <h1>${cfg.headline4}</h1>
        <div class="sub">${cfg.sub4}</div>
        <div class="pill"><span>Comment or DM</span> <b>"${cfg.ctaWord}"</b></div>
      </div>
      <div class="footer">
${dots(4)}
        <div class="swipe"><span>zenith-studio.site</span></div>
      </div>
`, "cta");

  const files = [
    ["slide-01-hook.html", s1],
    ["slide-02-problem.html", s2],
    ["slide-03-how.html", s3],
    ["slide-04-benefit.html", s4],
    ["slide-05-cta.html", s5],
  ];
  for (const [name, html] of files) {
    fs.writeFileSync(path.join(outDir, name), html);
    console.log("wrote", cfg.slug, name);
  }
}
