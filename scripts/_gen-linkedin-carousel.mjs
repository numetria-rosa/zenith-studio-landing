// LinkedIn document-post (carousel) generator. Deliberately a different
// visual system from Instagram: dark navy + the cyan/violet gradient from
// the actual Zenith Studio logo/banner, denser text (LinkedIn's algorithm
// rewards dwell time over the punchier ad-style IG slides), thin rules and
// monospace data labels instead of big color-block CTAs. Portrait 1080x1350,
// LinkedIn's recommended carousel ratio.
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const HEAD = `<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,600;1,9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#08080f; --bg2:#0d0e1c; --card:#12132420;
    --cyan:#5dd8ec; --violet:#9b6cff;
    --ink:#f3f4f8; --mut:rgba(243,244,248,.64); --mut2:rgba(243,244,248,.38);
    --rule:rgba(243,244,248,.14);
  }
  html,body{width:1080px;height:1350px;overflow:hidden}
  body{ background:var(--bg); color:var(--ink); font-family:'IBM Plex Sans',sans-serif; }
  .canvas{ position:relative; width:100%; height:100%; overflow:hidden;
    background:
      radial-gradient(520px 360px at 92% -4%, rgba(93,216,236,.14), transparent 60%),
      radial-gradient(480px 380px at 4% 108%, rgba(155,108,255,.16), transparent 60%),
      linear-gradient(160deg, var(--bg) 0%, var(--bg2) 100%);
  }
  .frame{ position:relative; z-index:1; padding:72px 72px; height:100%; display:flex; flex-direction:column; }

  .topbar{ display:flex; align-items:center; justify-content:space-between; }
  .brand{ display:flex; align-items:center; gap:12px; }
  .brand .markwrap{ width:44px; height:44px; border-radius:11px; background:rgba(243,244,248,.07); border:1px solid rgba(243,244,248,.16); display:flex; align-items:center; justify-content:center; box-shadow:0 0 22px -4px rgba(93,216,236,.35); }
  .brand .mark{ width:30px; height:30px; border-radius:6px; }
  .brand .name{ font-family:'IBM Plex Mono'; font-weight:600; font-size:19px; letter-spacing:.04em; color:var(--mut); }
  .counter{ font-family:'IBM Plex Mono'; font-weight:600; font-size:17px; color:var(--mut2); letter-spacing:.06em; }

  .rule{ margin-top:24px; height:1px; background:var(--rule); }

  .content{ flex:1; display:flex; flex-direction:column; justify-content:center; }

  .eyebrow{ font-family:'IBM Plex Mono'; font-size:21px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--cyan); }
  h1{ font-family:'Fraunces'; font-weight:700; font-size:72px; line-height:1.16; letter-spacing:-.01em; margin-top:22px; color:var(--ink); max-width:900px; }
  h1 i{ font-style:italic; font-weight:600; background:linear-gradient(90deg,var(--cyan),var(--violet)); -webkit-background-clip:text; background-clip:text; color:transparent; }

  .sub{ margin-top:26px; font-family:'IBM Plex Sans'; font-weight:400; font-size:32px; line-height:1.55; color:var(--mut); max-width:860px; }

  /* keyword chips: small icon + label pills visualizing what the post covers */
  .chips{ margin-top:40px; display:flex; flex-wrap:wrap; gap:16px; max-width:900px; }
  .chip{ display:flex; align-items:center; gap:12px; background:rgba(243,244,248,.05); border:1px solid var(--rule); padding:16px 22px; border-radius:14px; }
  .chip .icon{ width:26px; height:26px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
  .chip .icon svg{ width:100%; height:100%; stroke:var(--cyan); fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
  .chip span{ font-family:'IBM Plex Sans'; font-weight:600; font-size:23px; color:var(--ink); white-space:nowrap; }

  /* numbered stat/signal list, dense and document-like */
  .list{ margin-top:48px; display:flex; flex-direction:column; gap:0; max-width:900px; }
  .litem{ display:flex; gap:26px; padding:30px 0; border-top:1px solid var(--rule); }
  .litem:first-child{ border-top:1px solid var(--rule); }
  .lnum{ flex-shrink:0; font-family:'IBM Plex Mono'; font-weight:700; font-size:24px; color:var(--cyan); width:44px; }
  .ltext b{ display:block; font-family:'IBM Plex Sans'; font-weight:600; font-size:31px; color:var(--ink); line-height:1.3; }
  .ltext p{ margin-top:9px; font-family:'IBM Plex Sans'; font-weight:400; font-size:24px; color:var(--mut); line-height:1.5; }

  .quote{ margin-top:40px; padding:34px 38px; border-left:3px solid var(--cyan); background:rgba(93,216,236,.06); border-radius:0 16px 16px 0; font-family:'Fraunces'; font-style:italic; font-weight:600; font-size:38px; line-height:1.4; color:var(--ink); max-width:880px; }

  .stat{ margin-top:44px; display:flex; align-items:center; gap:24px; }
  .stat .num{ font-family:'Fraunces'; font-weight:700; font-size:120px; line-height:1; background:linear-gradient(90deg,var(--cyan),var(--violet)); -webkit-background-clip:text; background-clip:text; color:transparent; }
  .stat .label{ font-family:'IBM Plex Sans'; font-weight:500; font-size:26px; color:var(--mut); max-width:340px; line-height:1.4; }

  .footer{ margin-top:36px; padding-top:26px; border-top:1px solid var(--rule); display:flex; align-items:center; justify-content:space-between; }
  .dots{ display:flex; gap:8px; }
  .dot{ width:8px; height:8px; border-radius:50%; background:var(--mut2); opacity:.6; }
  .dot.on{ background:var(--cyan); opacity:1; width:20px; border-radius:5px; }
  .foottext{ font-family:'IBM Plex Mono'; font-weight:600; font-size:18px; letter-spacing:.04em; color:var(--mut2); }

  .cta-tag{ margin-top:40px; display:inline-flex; align-items:center; gap:16px; border:1px solid rgba(93,216,236,.4); background:rgba(93,216,236,.08); padding:24px 34px; border-radius:16px; width:fit-content; }
  .cta-tag .icon{ width:26px; height:26px; flex-shrink:0; }
  .cta-tag .icon svg{ width:100%; height:100%; stroke:var(--cyan); fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
  .cta-tag span{ font-family:'IBM Plex Sans'; font-weight:600; font-size:29px; color:var(--ink); }
  .cta-tag b{ font-family:'IBM Plex Mono'; font-weight:700; font-size:29px; background:linear-gradient(90deg,var(--cyan),var(--violet)); -webkit-background-clip:text; background-clip:text; color:transparent; }

  /* macOS-window workflow diagram, n8n-style connected nodes */
  .macwin{ margin-top:40px; border-radius:18px; overflow:hidden; border:1px solid var(--rule); background:#0a0b16; box-shadow:0 30px 70px -30px rgba(0,0,0,.65); }
  .macwin-bar{ display:flex; align-items:center; padding:16px 20px; background:rgba(255,255,255,.03); border-bottom:1px solid var(--rule); position:relative; }
  .macwin-dots{ display:flex; gap:8px; }
  .macwin-dot{ width:11px; height:11px; border-radius:50%; }
  .macwin-title{ position:absolute; left:0; right:0; text-align:center; font-family:'IBM Plex Mono'; font-size:15px; color:var(--mut2); letter-spacing:.03em; }
  .macwin-body{ position:relative; padding:56px 34px; background-image: radial-gradient(rgba(243,244,248,.07) 1.5px, transparent 1.5px); background-size:24px 24px; }
  .flow{ display:flex; align-items:stretch; }
  .fnode{ position:relative; flex:1; background:rgba(255,255,255,.045); border:1px solid var(--rule); border-radius:14px; padding:20px 16px; border-top:3px solid var(--nc,var(--cyan)); }
  .fnode .ficon{ width:36px; height:36px; border-radius:9px; background:rgba(255,255,255,.07); display:flex; align-items:center; justify-content:center; margin-bottom:16px; }
  .fnode .ficon svg{ width:19px; height:19px; stroke:var(--nc,var(--cyan)); fill:none; stroke-width:1.9; stroke-linecap:round; stroke-linejoin:round; }
  .fnode b{ display:block; font-family:'IBM Plex Sans'; font-weight:600; font-size:19px; color:var(--ink); line-height:1.28; }
  .fnode p{ margin-top:6px; font-family:'IBM Plex Mono'; font-weight:500; font-size:13px; color:var(--mut2); letter-spacing:.01em; }
  .fline{ flex:0 0 34px; align-self:center; height:2px; background:linear-gradient(90deg, var(--cyan), var(--violet)); position:relative; opacity:.7; }
  .fline::after{ content:""; position:absolute; right:-2px; top:50%; width:7px; height:7px; border-top:2px solid var(--violet); border-right:2px solid var(--violet); transform:translateY(-50%) rotate(45deg); }
  .cursor{ position:absolute; width:30px; z-index:5; filter:drop-shadow(0 6px 14px rgba(0,0,0,.55)); }
  .cursor .ring{ position:absolute; left:-14px; top:-10px; width:52px; height:52px; border-radius:50%; background:radial-gradient(rgba(93,216,236,.4), transparent 68%); }
</style>`;

function shell(bodyHtml) {
  return `<!doctype html>
<html>
<head>${HEAD}</head>
<body>
  <div class="canvas">
    <div class="frame">
${bodyHtml}
    </div>
  </div>
</body>
</html>
`;
}

const LOGO_PATH = path.join(scriptDir, "..", "linkedin", "assets", "logo-mark.png");

const brand = () => `      <div class="topbar">
        <div class="brand"><div class="markwrap"><img class="mark" src="file://${LOGO_PATH.replace(/\\/g, "/")}"></div><div class="name">ZENITH STUDIO</div></div>
        <div class="counter">SLOT</div>
      </div>
      <div class="rule"></div>
`;

function dots(total, activeIdx) {
  let out = `        <div class="dots">`;
  for (let i = 0; i < total; i++) out += `<div class="dot${i === activeIdx ? " on" : ""}"></div>`;
  out += `</div>\n`;
  return out;
}

function counter(idx, total) {
  return `0${idx} / 0${total}`;
}

const ICONS = {
  phone: `<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  clock: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,
  invoice: `<svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M9 13h6M9 17h6M9 9h2"/></svg>`,
  chat: `<svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
  agent: `<svg viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="12" rx="3"/><path d="M9 3v4M15 3v4M9 13h.01M15 13h.01"/></svg>`,
};

const CURSOR_SVG = `<svg viewBox="0 0 24 26" fill="#f3f4f8" stroke="#08080f" stroke-width="1.1" stroke-linejoin="round"><path d="M2 1.5 21 12.5 12.7 14.3 15.8 21.5 12 23.2 9 16 3.6 20.5 2 1.5Z"/></svg>`;

/* nodes: [{icon,label,sub,accent}], cursorOn: node index to place the cursor over */
function workflowDiagram({ title, nodes, cursorOn }) {
  let flow = `<div class="flow">`;
  nodes.forEach((n, i) => {
    flow += `<div class="fnode" style="--nc:${n.accent}"><div class="ficon">${ICONS[n.icon] || ICONS.bolt}</div><b>${n.label}</b><p>${n.sub}</p>${i === cursorOn ? `<div class="cursor" style="right:14px; bottom:14px;"><div class="ring"></div>${CURSOR_SVG}</div>` : ""}</div>`;
    if (i < nodes.length - 1) flow += `<div class="fline"></div>`;
  });
  flow += `</div>`;

  return `<div class="macwin">
    <div class="macwin-bar">
      <div class="macwin-dots"><div class="macwin-dot" style="background:#ff5f57"></div><div class="macwin-dot" style="background:#febc2e"></div><div class="macwin-dot" style="background:#28c840"></div></div>
      <div class="macwin-title">${title}</div>
    </div>
    <div class="macwin-body">${flow}</div>
  </div>`;
}

function chips(items) {
  let out = `<div class="chips">`;
  items.forEach((c) => {
    out += `<div class="chip"><div class="icon">${ICONS[c.icon] || ICONS.bolt}</div><span>${c.label}</span></div>`;
  });
  out += `</div>`;
  return out;
}

/* cfg: { slug, total, cover:{eyebrow,headline,sub}, listSlide:{eyebrow,headline,items:[{title,body}]},
   quoteSlide:{eyebrow,headline,quote}, statSlide:{eyebrow,headline,num,label,sub},
   closeSlide:{headline,sub,ctaWord} } */
export function genLinkedInCarousel(cfg) {
  const outDir = path.join(scriptDir, "..", "linkedin", cfg.slug);
  fs.mkdirSync(outDir, { recursive: true });
  const total = cfg.total;

  const slides = [];

  // Slide 1: cover
  slides.push(shell(`
${brand().replace("SLOT", counter(1, total))}
      <div class="content">
        <div class="eyebrow">${cfg.cover.eyebrow}</div>
        <h1>${cfg.cover.headline}</h1>
        <div class="sub">${cfg.cover.sub}</div>
${cfg.cover.chips ? chips(cfg.cover.chips) : ""}
      </div>
      <div class="footer">
${dots(total, 0)}
        <div class="foottext">SWIPE</div>
      </div>
`));

  // Slide 2: numbered list (signals/leaks)
  let listItems = "";
  cfg.listSlide.items.forEach((it, i) => {
    listItems += `<div class="litem"><div class="lnum">0${i + 1}</div><div class="ltext"><b>${it.title}</b><p>${it.body}</p></div></div>`;
  });
  slides.push(shell(`
${brand().replace("SLOT", counter(2, total))}
      <div class="content">
        <div class="eyebrow">${cfg.listSlide.eyebrow}</div>
        <h1>${cfg.listSlide.headline}</h1>
        <div class="list">${listItems}</div>
      </div>
      <div class="footer">
${dots(total, 1)}
        <div class="foottext">SWIPE</div>
      </div>
`));

  // Slide 3: workflow diagram (macOS window + n8n-style connected nodes)
  slides.push(shell(`
${brand().replace("SLOT", counter(3, total))}
      <div class="content">
        <div class="eyebrow">${cfg.workflowSlide.eyebrow}</div>
        <h1>${cfg.workflowSlide.headline}</h1>
${workflowDiagram(cfg.workflowSlide.diagram)}
      </div>
      <div class="footer">
${dots(total, 2)}
        <div class="foottext">SWIPE</div>
      </div>
`));

  // Slide 4: quote / framework
  slides.push(shell(`
${brand().replace("SLOT", counter(4, total))}
      <div class="content">
        <div class="eyebrow">${cfg.quoteSlide.eyebrow}</div>
        <h1>${cfg.quoteSlide.headline}</h1>
        <div class="quote">${cfg.quoteSlide.quote}</div>
      </div>
      <div class="footer">
${dots(total, 3)}
        <div class="foottext">SWIPE</div>
      </div>
`));

  // Slide 5: stat
  slides.push(shell(`
${brand().replace("SLOT", counter(5, total))}
      <div class="content">
        <div class="eyebrow">${cfg.statSlide.eyebrow}</div>
        <h1>${cfg.statSlide.headline}</h1>
        <div class="stat"><div class="num">${cfg.statSlide.num}</div><div class="label">${cfg.statSlide.label}</div></div>
        <div class="sub">${cfg.statSlide.sub}</div>
      </div>
      <div class="footer">
${dots(total, 4)}
        <div class="foottext">SWIPE</div>
      </div>
`));

  // Slide 6: close / CTA
  slides.push(shell(`
${brand().replace("SLOT", counter(6, total))}
      <div class="content">
        <h1>${cfg.closeSlide.headline}</h1>
        <div class="sub">${cfg.closeSlide.sub}</div>
        <div class="cta-tag"><div class="icon">${ICONS.chat}</div><span>${cfg.closeSlide.ctaText}</span></div>
      </div>
      <div class="footer">
${dots(total, 5)}
        <div class="foottext">ZENITH-STUDIO.SITE</div>
      </div>
`));

  slides.forEach((html, i) => {
    const name = `slide-0${i + 1}.html`;
    fs.writeFileSync(path.join(outDir, name), html);
    console.log("wrote", cfg.slug, name);
  });
}
