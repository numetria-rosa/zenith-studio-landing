// Generates insta/lawfirm-post/slide-01.html — single-image IG post for the
// Law Firm AI Team service. Same type system as the services carousel, but
// on the site's actual law-firm palette (bg-black + amber-300 #fcd34d, see
// src/app/demo/law-firm-ai-team/page.tsx) instead of the cream/orange brand.
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(scriptDir, "..", "insta", "lawfirm-post");
fs.mkdirSync(outDir, { recursive: true });

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,600;1,9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#000000; --card:#0a1216; --card-bd:#1c3540;
    --ink:#fdfaf3; --mut:rgba(253,250,243,.62); --mut2:rgba(253,250,243,.4);
    --yellow:#fcd34d; --yellow2:#fde68a;
  }
  html,body{width:1080px;height:1350px;overflow:hidden}
  body{ background:var(--bg); color:var(--ink); font-family:'IBM Plex Sans',sans-serif; }
  .canvas{ position:relative; width:100%; height:100%; overflow:hidden; background:var(--bg); }
  .canvas::before{
    content:""; position:absolute; inset:0; z-index:0; pointer-events:none;
    background: radial-gradient(ellipse 62% 30% at 100% -6%, rgba(252,211,77,.16), transparent 55%);
  }
  .frame{ position:relative; z-index:1; padding:64px 68px; height:100%; display:flex; flex-direction:column; }

  .topbar{ display:flex; align-items:center; justify-content:space-between; }
  .topbar-left{ display:flex; align-items:center; gap:14px; }
  .logo{ display:flex; align-items:center; gap:9px; background:var(--card); border:1px solid var(--card-bd); padding:12px 18px; border-radius:15px; }
  .logo .lw{ font-family:'Fraunces'; font-weight:700; font-size:23px; color:var(--ink); letter-spacing:-.01em; line-height:1; }
  .logo .lai{ display:flex; align-items:center; background:var(--yellow); color:#000; font-family:'Fraunces'; font-weight:700; font-size:15px; line-height:1; padding:6px 10px 5px; border-radius:8px; }
  .handle{ font-family:'IBM Plex Mono'; font-weight:600; font-size:19px; color:var(--mut); letter-spacing:.01em; }
  .badge{ font-family:'IBM Plex Mono'; font-weight:600; font-size:16px; color:var(--yellow); background:rgba(252,211,77,.1); border:1px solid rgba(252,211,77,.35); padding:9px 16px; border-radius:11px; letter-spacing:.08em; text-transform:uppercase; }

  .content{ flex:1; display:flex; flex-direction:column; justify-content:center; }

  .eyebrow{ font-family:'IBM Plex Mono'; font-size:21px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--yellow); }
  h1{ font-family:'Fraunces'; font-weight:700; font-size:80px; line-height:1.12; letter-spacing:-.01em; margin-top:18px; color:var(--ink); max-width:940px; }
  h1 i{ font-style:italic; color:var(--yellow); font-weight:600; }

  .sub{ margin-top:26px; font-family:'IBM Plex Sans'; font-weight:500; font-size:34px; line-height:1.42; color:var(--mut); max-width:840px; }

  .stats{ margin-top:46px; display:flex; gap:16px; flex-wrap:wrap; }
  .stat{ flex:1; min-width:260px; background:var(--card); border:1px solid var(--card-bd); border-radius:20px; padding:26px 26px; }
  .stat .n{ font-family:'Fraunces'; font-weight:700; font-size:44px; color:var(--yellow); line-height:1; }
  .stat .l{ margin-top:10px; font-family:'IBM Plex Sans'; font-weight:500; font-size:19px; color:var(--mut); line-height:1.35; }

  .how{ margin-top:32px; display:flex; align-items:flex-start; gap:18px; background:var(--card); border:1px solid var(--card-bd); border-radius:22px; padding:28px 32px; max-width:940px; }
  .how .tag{ flex-shrink:0; font-family:'IBM Plex Mono'; font-weight:700; font-size:15px; letter-spacing:.1em; color:#000; background:var(--yellow); padding:8px 13px; border-radius:9px; margin-top:2px; }
  .how p{ font-family:'IBM Plex Sans'; font-weight:500; font-size:24px; line-height:1.48; color:var(--yellow2); }

  .footer{ margin-top:32px; padding-top:26px; border-top:1px solid var(--card-bd); display:flex; align-items:center; justify-content:space-between; }
  .pill{ display:inline-flex; align-items:center; gap:16px; background:var(--yellow); padding:26px 44px; border-radius:22px; box-shadow:0 20px 44px -16px rgba(252,211,77,.4); }
  .pill span{ font-family:'IBM Plex Sans'; font-weight:700; font-size:36px; color:#000; }
  .pill b{ font-family:'IBM Plex Mono'; font-weight:700; font-size:38px; color:#000; }
  .site{ font-family:'IBM Plex Mono'; font-weight:700; font-size:19px; color:var(--mut); letter-spacing:.04em; }
</style>
</head>
<body>
  <div class="canvas">
    <div class="frame">
      <div class="topbar">
        <div class="topbar-left">
          <div class="logo"><span class="lw">ZENITH</span><span class="lai">AI</span></div>
          <div class="handle">@_zenithstudio_</div>
        </div>
        <div class="badge">Law Firm AI Team</div>
      </div>

      <div class="content">
        <div class="eyebrow">Before 2027</div>
        <h1>Run your law firm <i>with an AI team.</i></h1>
        <div class="sub">Your firm works 49 hours a week and bills 37.</div>

        <div class="stats">
          <div class="stat"><div class="n">$230K</div><div class="l">lost per attorney, per year</div></div>
          <div class="stat"><div class="n">34%</div><div class="l">callers who never call back</div></div>
          <div class="stat"><div class="n">6% vs 18%</div><div class="l">write-downs at 14 vs 45 days</div></div>
        </div>

        <div class="how"><div class="tag">THE TEAM</div><p>A Missed Call Text-Back, a Follow-Up Clerk, and a Billing Clerk running as one team. Every unanswered call gets a text back in seconds, every quiet lead gets worked, and billable time gets reconstructed before the write-down window closes.</p></div>
      </div>

      <div class="footer">
        <div class="pill"><span>Comment or DM</span> <b>"FIRM"</b></div>
        <div class="site">zenith-studio.site</div>
      </div>
    </div>
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(outDir, "slide-01.html"), html);
console.log("wrote slide-01.html");
