// Zenith AI - POV phone-chaos reel. Reuses the ring-pulse + missed-call
// pillstack animation built for _reel-law-firm.html's scenePhone (same
// markup/timing), restyled onto the cream/orange LEADS brand instead of
// black/lime, framed as relatable POV comedy instead of law-firm stats
// (vidIQ outlier pattern: @bigwaveclean's "every business owner's phone"
// skit, 104x median).
var GAP = 0.4;
var LEAD_IN = 0.3;

var SCENE_DEFS = [
  { id: "scenePhone", dur: 5.18, line: "POV. You're mid job, and your phone will not stop." },
  { id: "sceneResolve", dur: 4.13, line: "While you worked, it already replied, and grabbed them a time." },
  { id: "sceneCta", dur: 4.01, line: "Comment or DM LEADS and we'll set this up for your business." },
];

(function () {
  var cursor = LEAD_IN;
  SCENE_DEFS.forEach(function (s) {
    s.start = cursor;
    s.end = s.start + s.dur;
    cursor = s.end + GAP;
  });
  window.TOTAL_DURATION = cursor + 0.8;
})();

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function progress(t, start, end) { return clamp((t - start) / (end - start), 0, 1); }
function easeOut(x) { return 1 - Math.pow(1 - x, 3); }
function easeInOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

var els = {};
function $(id) { return els[id] || (els[id] = document.getElementById(id)); }

window.onFontsReady = function () {};

var SUB_FADE = 0.28;

window.renderFrame = function (t) {
  var subtitleText = "";
  var subVis = 0;

  SCENE_DEFS.forEach(function (s) {
    var el = document.getElementById(s.id);
    var fadeIn = progress(t, s.start, s.start + 0.3);
    var fadeOut = 1 - progress(t, s.end - 0.3, s.end);
    var vis = clamp(Math.min(fadeIn, fadeOut), 0, 1);
    var active = t >= s.start - 0.05 && t <= s.end + 0.05;
    el.style.opacity = vis;
    el.style.display = active ? "flex" : "none";

    var subFadeIn = progress(t, s.start, s.start + SUB_FADE);
    var subFadeOut = 1 - progress(t, s.end - SUB_FADE, s.end);
    var sVis = clamp(Math.min(subFadeIn, subFadeOut), 0, 1);
    if (sVis > subVis) { subVis = sVis; subtitleText = s.line; }

    if (!active) return;
    var lt = t - s.start;

    if (s.id === "scenePhone") renderPhone(lt);
    else if (s.id === "sceneResolve") renderResolve(el, lt);
    else if (s.id === "sceneCta") renderCta(el, lt);
  });

  $("subtitleText").textContent = subtitleText;
  var subBox = $("subtitleBox");
  var eased = easeInOut(subVis);
  subBox.style.opacity = eased;
  subBox.style.transform = "translateY(" + (1 - eased) * 16 + "px)";
};

function renderPhone(lt0) {
  ["pulse1", "pulse2"].forEach(function (id, i) {
    if (lt0 < 0.2 || lt0 > 1.1) { $(id).style.opacity = 0; return; }
    var local = ((lt0 - 0.2 - i * 0.35) % 1.1 + 1.1) % 1.1 / 1.1;
    $(id).style.opacity = (1 - local) * 0.7;
    $(id).style.transform = "scale(" + (1 + local * 0.9) + ")";
  });
  var missedP = progress(lt0, 1.0, 1.25);
  $("missedBanner").style.opacity = missedP;
  $("callerSub").style.opacity = 1 - missedP;
  $("callerSub").textContent = missedP > 0.5 ? "" : "Incoming…";
  $("ringIcon").style.opacity = 1 - progress(lt0, 1.3, 1.7) * 0.4;
  var pillGroupP = progress(lt0, 1.4, 1.7);
  $("ringWrap").style.transform = "scale(" + (1 - pillGroupP * 0.22) + ") translateY(" + (-pillGroupP * 40) + "px)";
  [["pill1", 1.55], ["pill2", 1.85], ["pill3", 2.15]].forEach(function (pair) {
    var el = $(pair[0]);
    var p = easeOut(progress(lt0, pair[1], pair[1] + 0.3));
    el.style.opacity = p;
    el.style.transform = "translateY(" + (1 - p) * -16 + "px)";
  });
}

function renderResolve(el, lt) {
  var headline = el.querySelector(".headline");
  var hp = easeOut(progress(lt, 0, 0.5));
  headline.style.opacity = hp;
  headline.style.transform = "translateY(" + (1 - hp) * 18 + "px)";

  var card = $("resolveCard");
  var cp = easeOut(progress(lt, 0.5, 1.1));
  card.style.opacity = cp;
  card.style.transform = "translateY(" + (1 - cp) * 26 + "px) scale(" + (0.96 + cp * 0.04) + ")";
}

function renderCta(el, lt) {
  var wrap = el.querySelector(".headline-wrap");
  var headline = el.querySelector(".headline");
  var comment = el.querySelector(".comment");
  var pillsrow = el.querySelector(".pillsrow");

  var hp = easeOut(progress(lt, 0, 0.5));
  headline.style.opacity = hp;
  headline.style.transform = "translateY(" + (1 - hp) * 20 + "px)";

  var cp = progress(lt, 0.55, 0.95);
  var bounce = cp < 1 ? 1 + Math.sin(cp * Math.PI) * 0.06 * (1 - cp) : 1;
  comment.style.opacity = easeOut(cp);
  comment.style.transform = "scale(" + (cp > 0 ? bounce : 0.9) + ")";

  var pp = easeOut(progress(lt, 1.1, 1.6));
  pillsrow.style.opacity = pp;
  pillsrow.style.transform = "translateY(" + (1 - pp) * 14 + "px)";

  wrap.style.opacity = 1;
}
