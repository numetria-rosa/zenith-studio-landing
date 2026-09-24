// Zenith AI - Lead Capture Agent reel. Pure CSS/DOM timeline driven by
// renderFrame(t); no WebGL needed for this cream/dark UI-mockup aesthetic.
var GAP = 0.4;
var LEAD_IN = 0.3;

var SCENE_DEFS = [
  { id: "sceneHook", dur: 6.24, line: "The smartest way to close a lead in 2027? Answer before they go cold." },
  { id: "sceneSkill", dur: 6.41, line: "This is the Lead Capture Agent. We built it, and we run it inside our own agency." },
  { id: "scenePhone", dur: 6.55, line: "The moment someone reaches out, it texts and emails them back, then keeps following up until they book a call." },
  { id: "sceneResult", dur: 5.02, line: "We haven't chased a lead by hand in months, and our calendar has never been fuller." },
  { id: "sceneConnect", dur: 6.79, line: "It connects straight to your phone number, your inbox, and your calendar. No new app to learn." },
  { id: "sceneCta", dur: 6.24, line: "Want this running for your business? Comment or DM LEADS and we'll set it up for you." },
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

var BG_MODE = { sceneHook: "cream", sceneSkill: "cream", scenePhone: "cream", sceneResult: "cream", sceneConnect: "cream", sceneCta: "cream" };

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function progress(t, start, end) { return clamp((t - start) / (end - start), 0, 1); }
function easeOut(x) { return 1 - Math.pow(1 - x, 3); }
function easeInOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

var els = {};
function $(id) { return els[id] || (els[id] = document.getElementById(id)); }

var TYPED_STRING = "text every lead before they go cold";
var PHONE_BUBBLES = ["b1", "b2", "b3", "b4"];
var CONNECT_ICONS = ["ci1", "ci2", "ci3"];

window.onFontsReady = function () {};

// Subtitle crossfade uses its own (slightly wider) fade windows than the
// scene visuals, so the caption dissolves out/in smoothly across the GAP
// between scenes instead of hard-cutting the instant the next scene wins.
var SUB_FADE = 0.28;

window.renderFrame = function (t) {
  var subtitleText = "";
  var bestVis = -1;
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
    if (vis > bestVis) { bestVis = vis; }

    if (!active) return;
    var lt = t - s.start; // local time within scene

    if (s.id === "sceneHook") renderHook(el, lt, s.dur);
    else if (s.id === "sceneSkill") renderSkill(el, lt, s.dur);
    else if (s.id === "scenePhone") renderPhone(el, lt, s.dur);
    else if (s.id === "sceneResult") renderResult(el, lt, s.dur);
    else if (s.id === "sceneConnect") renderConnect(el, lt, s.dur);
    else if (s.id === "sceneCta") renderCta(el, lt, s.dur);
  });

  $("subtitleText").textContent = subtitleText;
  var subBox = $("subtitleBox");
  var eased = easeInOut(subVis);
  subBox.style.opacity = eased;
  subBox.style.transform = "translateY(" + (1 - eased) * 16 + "px)";
};

function renderHook(el, lt) {
  var wrap = el.querySelector(".headline-wrap");
  var p = easeOut(progress(lt, 0, 0.7));
  wrap.style.transform = "translateY(" + (1 - p) * 22 + "px)";
  wrap.style.opacity = p;
}

function renderSkill(el, lt) {
  var card = $("skillCard");
  var headline = el.querySelector(".headline");
  var hp = easeOut(progress(lt, 0, 0.5));
  headline.style.opacity = hp;
  headline.style.transform = "translateY(" + (1 - hp) * 18 + "px)";

  var cp = easeOut(progress(lt, 0.35, 0.85));
  card.style.opacity = cp;
  card.style.transform = "translateY(" + (1 - cp) * 30 + "px) scale(" + (0.96 + cp * 0.04) + ")";

  // Typewriter effect from t=1.1s to t=3.4s
  var typeStart = 1.1, typeEnd = 3.4;
  var tp = progress(lt, typeStart, typeEnd);
  var chars = Math.round(tp * TYPED_STRING.length);
  $("typedText").textContent = TYPED_STRING.slice(0, chars);

  var cursorEl = $("cursor");
  cursorEl.style.opacity = (Math.floor(lt * 2.5) % 2 === 0) ? 1 : 0.15;

  // "added" pill fades in once typing completes
  var addedP = easeOut(progress(lt, typeEnd + 0.15, typeEnd + 0.55));
  $("addedPill").style.opacity = addedP;

  // send button pulse after typing completes
  var sendBtn = $("sendBtn");
  var pulseT = progress(lt, typeEnd + 0.5, typeEnd + 1.1);
  if (pulseT > 0 && pulseT < 1) {
    var pulse = Math.sin(pulseT * Math.PI);
    sendBtn.style.boxShadow = "0 0 0 " + (pulse * 14) + "px rgba(226,99,44," + (pulse * 0.28) + ")";
  } else {
    sendBtn.style.boxShadow = "0 0 0 0 rgba(226,99,44,0)";
  }
}

function renderPhone(el, lt) {
  var headline = el.querySelector(".headline");
  var hp = easeOut(progress(lt, 0, 0.5));
  headline.style.opacity = hp;
  headline.style.transform = "translateY(" + (1 - hp) * 18 + "px)";

  var phone = el.querySelector(".phoneframe");
  var pp = easeOut(progress(lt, 0.3, 0.8));
  phone.style.opacity = pp;
  phone.style.transform = "translateY(" + (1 - pp) * 34 + "px)";

  var starts = [1.1, 2.2, 3.3, 4.4];
  PHONE_BUBBLES.forEach(function (id, i) {
    var bp = easeOut(progress(lt, starts[i], starts[i] + 0.45));
    var bEl = $(id);
    bEl.style.opacity = bp;
    bEl.style.transform = "translateY(" + (1 - bp) * 14 + "px)";
  });
}

function renderResult(el, lt) {
  var wrap = el.querySelector(".headline-wrap");
  var eyebrow = el.querySelector(".eyebrow");
  var headline = el.querySelector(".headline");
  var sub = el.querySelector(".sub");

  var ep = easeOut(progress(lt, 0, 0.35));
  eyebrow.style.opacity = ep;

  var hp = easeOut(progress(lt, 0.15, 0.65));
  headline.style.opacity = hp;
  headline.style.transform = "translateY(" + (1 - hp) * 20 + "px)";

  var sp = easeOut(progress(lt, 0.9, 1.4));
  sub.style.opacity = sp;
  sub.style.transform = "translateY(" + (1 - sp) * 14 + "px)";

  wrap.style.opacity = 1;
}

function renderConnect(el, lt) {
  var headline = el.querySelector(".headline");
  var hp = easeOut(progress(lt, 0, 0.5));
  headline.style.opacity = hp;
  headline.style.transform = "translateY(" + (1 - hp) * 18 + "px)";

  var starts = [0.6, 0.85, 1.1];
  CONNECT_ICONS.forEach(function (id, i) {
    var ip = easeOut(progress(lt, starts[i], starts[i] + 0.5));
    var iEl = $(id);
    iEl.style.opacity = ip;
    iEl.style.transform = "translateY(" + (1 - ip) * 24 + "px) scale(" + (0.85 + ip * 0.15) + ")";
  });
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
