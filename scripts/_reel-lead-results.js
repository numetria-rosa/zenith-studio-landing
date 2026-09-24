// Zenith AI - Lead Capture "results claim" reel. Shorter/punchier remix of
// _reel-lead.js: opens on a concrete outcome instead of a question (vidIQ
// outlier pattern: screen-record + result-claim hook beats feature tours),
// then the proof (the actual conversation), then CTA. Same phone-mockup
// component, same brand.
var GAP = 0.4;
var LEAD_IN = 0.3;

var SCENE_DEFS = [
  { id: "sceneHook", dur: 5.71, line: "It replied to a new lead in eight seconds, and had them booked before I even saw the notification." },
  { id: "scenePhone", dur: 7.34, line: "Here's the exact conversation. It replies, qualifies them, and books the call automatically." },
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

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function progress(t, start, end) { return clamp((t - start) / (end - start), 0, 1); }
function easeOut(x) { return 1 - Math.pow(1 - x, 3); }
function easeInOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

var els = {};
function $(id) { return els[id] || (els[id] = document.getElementById(id)); }

var PHONE_BUBBLES = ["b1", "b2", "b3", "b4"];

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

    if (s.id === "sceneHook") renderHook(el, lt);
    else if (s.id === "scenePhone") renderPhone(el, lt);
    else if (s.id === "sceneCta") renderCta(el, lt);
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

function renderPhone(el, lt) {
  var headline = el.querySelector(".headline");
  var hp = easeOut(progress(lt, 0, 0.5));
  headline.style.opacity = hp;
  headline.style.transform = "translateY(" + (1 - hp) * 18 + "px)";

  var phone = el.querySelector(".phoneframe");
  var pp = easeOut(progress(lt, 0.3, 0.8));
  phone.style.opacity = pp;
  phone.style.transform = "translateY(" + (1 - pp) * 34 + "px)";

  var starts = [1.0, 2.0, 3.0, 4.0];
  PHONE_BUBBLES.forEach(function (id, i) {
    var bp = easeOut(progress(lt, starts[i], starts[i] + 0.4));
    var bEl = $(id);
    bEl.style.opacity = bp;
    bEl.style.transform = "translateY(" + (1 - bp) * 14 + "px)";
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
