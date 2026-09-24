function clamp01(x){ return Math.max(0, Math.min(1, x)); }
function progress(t, a, b){ return clamp01((t - a) / (b - a)); }
function easeOutCubic(x){ return 1 - Math.pow(1 - x, 3); }
function easeInOutCubic(x){ return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2, 3)/2; }
function easeOutBack(x){ var c1=1.70158, c3=c1+1; return 1 + c3*Math.pow(x-1,3) + c1*Math.pow(x-1,2); }

// ---------- Timeline: scene hold durations are the real measured length of
// each voiceover line (see scripts/_reel-brand-vo-lines.mjs) plus a short
// gap, same architecture as the niche reels. ----------
var GAP = 0.4;
var LEAD_IN = 0.3;
var SCENE_DEFS = [
  { id: 'sceneHero',         dur: 6.02,  line: "This is Zenith AI. One team that never stops working for your business." },
  { id: 'sceneTeamHub',      dur: 7.63,  line: "Meet your AI employees. Built to answer, follow up, and book, so nothing falls through the cracks." },
  { id: 'sceneHowItWorks',   dur: 8.95,  line: "Here's how it works. A message comes in, your AI agent reads it, decides what to do, and takes action automatically." },
  { id: 'sceneInbox',        dur: 7.25,  line: "The Inbox Manager sorts your email and drafts the replies, so your inbox is empty before you open it." },
  { id: 'sceneLead',         dur: 7.37,  line: "The Lead Capture Agent follows up by text and email until they book, because the fastest reply wins the job." },
  { id: 'sceneReceptionist', dur: 6.65,  line: "The Receptionist answers every call, books straight into your calendar, and never puts anyone on hold." },
  { id: 'sceneTeams',        dur: 6.55,  line: "For law firms and real estate brokerages, we bundle all three into one dedicated AI team." },
  { id: 'sceneIntegrations', dur: 10.01, line: "It all connects to what you already use. Gmail, Yahoo, Zoho, your calendar, your phone number. No new software to learn." },
  { id: 'sceneCta',          dur: 3.05,  line: "Your AI team is ready when you are." },
];

var cursor = LEAD_IN;
var SCENES = SCENE_DEFS.map(function(def){
  var start = cursor;
  var end = start + def.dur;
  cursor = end + GAP;
  return {
    id: def.id, line: def.line, start: start, end: end,
    el: document.getElementById(def.id),
    in: [start, start + 0.3],
    out: [end, end + 0.3],
  };
});
var TOTAL_DURATION = cursor + 0.8;

function byId(id){ return SCENES.filter(function(s){ return s.id === id; })[0]; }

// ---------- Three.js ----------
var canvas = document.getElementById('three-canvas');
var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(1080, 1920, false);
renderer.setPixelRatio(1);

var scene3 = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(42, 1080 / 1920, 0.05, 100);
camera.position.set(0, 0, 16);

scene3.add(new THREE.AmbientLight(0x3a3a4a, 0.6));
var keyLight = new THREE.PointLight(0xffffff, 1.4, 60, 2); keyLight.position.set(8, 8, 14); scene3.add(keyLight);
var violetLight = new THREE.PointLight(0x8b7cff, 1.1, 60, 2); violetLight.position.set(-10, 5, 10); scene3.add(violetLight);
var cyanLight = new THREE.PointLight(0x43e6ff, 1.1, 60, 2); cyanLight.position.set(8, -8, 10); scene3.add(cyanLight);

// ---------- Glass node factory: a premium rounded-rect UI block, not a
// plain box — extruded from a rounded-corner 2D shape, physical glass
// material (transmission + clearcoat), plus a bright thin edge outline. ----------
function roundedRectShape(w, h, r){
  var s = new THREE.Shape();
  var x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function createGlassNode(w, h, depth){
  var shape = roundedRectShape(w, h, Math.min(w, h) * 0.16);
  var geo = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3, curveSegments: 10 });
  geo.center();
  // Note: true MeshPhysicalMaterial "transmission" needs an environment/
  // background for the renderer to refract, which this scene doesn't have —
  // without it, transmission renders as a near-black opaque plate instead
  // of glass. A bright base + real transparency + clearcoat reads as honest
  // frosted glass without that dependency.
  var mat = new THREE.MeshPhysicalMaterial({
    color: 0xf4f6ff, metalness: 0.1, roughness: 0.3,
    transparent: true, opacity: 0.26,
    clearcoat: 0.9, clearcoatRoughness: 0.2,
    emissive: 0x2a2e44, emissiveIntensity: 0.35,
  });
  var mesh = new THREE.Mesh(geo, mat);
  var edgeGeo = new THREE.EdgesGeometry(geo, 30);
  var edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
  mesh.add(new THREE.LineSegments(edgeGeo, edgeMat));
  return mesh;
}

// Root node ("Zenith AI") — the hub every pipe originates from, shared by
// the hero scene (macro-to-wide reveal) and the integrations scene.
var rootNode = createGlassNode(2.6, 1.5, 0.5);
rootNode.position.set(0, 0, 0);
scene3.add(rootNode);

// 5 integration nodes arranged in a wide arc around the root.
var NODE_IDS = ['node-gmail', 'node-yahoo', 'node-zoho', 'node-cal', 'node-phone'];
var INT_SLOTS = [
  [-2.15, 2.0, -1.5],
  [-1.25, -2.5, -2.4],
  [0.0, 2.9, -2.8],
  [1.25, -2.5, -2.4],
  [2.15, 2.0, -1.5],
];
var integrationNodes = INT_SLOTS.map(function(slot){
  var n = createGlassNode(1.5, 1.5, 0.35);
  n.position.set(slot[0], slot[1], slot[2]);
  n.visible = false;
  n.scale.setScalar(0.001);
  scene3.add(n);
  return n;
});

// ---------- Bezier pulse pipes: data flowing from the root to each
// integration node, a soft glow sprite riding a small emissive sphere. ----------
function makeGlowTexture(){
  var size = 128, c = document.createElement('canvas'); c.width = c.height = size;
  var ctx = c.getContext('2d');
  var g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(160,210,255,0.65)');
  g.addColorStop(1, 'rgba(160,210,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
var glowTex = makeGlowTexture();

var pipes = integrationNodes.map(function(node, i){
  var from = rootNode.position;
  var to = node.position;
  var mid1 = from.clone().lerp(to, 0.35).add(new THREE.Vector3(0, 0.9, 0.6));
  var mid2 = from.clone().lerp(to, 0.7).add(new THREE.Vector3(0, -0.6, 0.6));
  var curve = new THREE.CubicBezierCurve3(from.clone(), mid1, mid2, to.clone());
  var tubeGeo = new THREE.TubeGeometry(curve, 48, 0.022, 8, false);
  var tubeMat = new THREE.MeshBasicMaterial({ color: 0x9fd6ff, transparent: true, opacity: 0.3 });
  var tube = new THREE.Mesh(tubeGeo, tubeMat);
  tube.visible = false;
  scene3.add(tube);

  var pulseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  var pulse = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), pulseMat);
  var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x9fd6ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.set(0.55, 0.55, 0.55);
  pulse.add(halo);
  pulse.visible = false;
  scene3.add(pulse);

  return { curve: curve, tube: tube, pulse: pulse, phase: i * 0.35 };
});

function projectToScreen(vec3){
  var p = vec3.clone().project(camera);
  return { x: (p.x * 0.5 + 0.5) * 1080, y: (1 - (p.y * 0.5 + 0.5)) * 1920 };
}

// ---------- "How it works" pipeline diagram: connector lines computed from
// real element rects (not guessed coordinates), same technique proven in
// the niche reels — this is what actually shows the AI agent's mechanism. ----------
function rectMid(el){ var r = el.getBoundingClientRect(); return { x: (r.left + r.right) / 2, top: r.top, bottom: r.bottom }; }
function smoothPath(x1, y1, x2, y2){ var ymid = (y1 + y2) / 2; return 'M' + x1 + ',' + y1 + ' C' + x1 + ',' + ymid + ' ' + x2 + ',' + ymid + ' ' + x2 + ',' + y2; }
var hwPaths = {}, hwDots = {}, hwLens = {};
window.onFontsReady = function(){
  var steps = ['hw-step1', 'hw-step2', 'hw-step3', 'hw-step4'].map(function(id){ return rectMid(document.getElementById(id)); });
  for (var i = 0; i < 3; i++) {
    var lineId = 'hw-line' + (i + 1);
    var p = document.getElementById(lineId);
    p.setAttribute('d', smoothPath(steps[i].x, steps[i].bottom, steps[i + 1].x, steps[i + 1].top));
    hwPaths[lineId] = p;
    hwLens[lineId] = p.getTotalLength();
    hwDots[lineId] = document.getElementById('hw-dot' + (i + 1));
  }
  renderFrame(0);
};

function renderFrame(t){
  document.querySelector('.logo').style.opacity = easeOutCubic(progress(t, 0, 0.4));

  var subtitleVis = 0, subtitleLine = '';
  var heroVis = 0, hubVis = 0, intVis = 0;
  SCENES.forEach(function(s){
    var a = progress(t, s.in[0], s.in[1]);
    var b = 1 - progress(t, s.out[0], s.out[1]);
    var vis = Math.min(a, b);
    s.el.style.opacity = vis;
    s.el.style.transform = 'translateY(' + (1 - a) * 20 + 'px)';
    if (vis > subtitleVis) { subtitleVis = vis; subtitleLine = s.line; }
    if (s.id === 'sceneHero') heroVis = vis;
    if (s.id === 'sceneTeamHub') hubVis = vis;
    if (s.id === 'sceneIntegrations') intVis = vis;
  });
  document.getElementById('subtitleBox').style.opacity = subtitleVis;
  if (document.getElementById('subtitleText').textContent !== subtitleLine) {
    document.getElementById('subtitleText').textContent = subtitleLine;
  }

  // --- Camera: macro close-up on the root node's glass surface during the
  // hero scene, then a smooth cinematic pull-back that reveals the full
  // connected ecosystem once the integrations scene takes over. A slow
  // continuous drift keeps the frame alive the rest of the time. ---
  var hero = byId('sceneHero'), lthero = t - hero.start;
  var macroP = easeInOutCubic(progress(lthero, 0.2, hero.end - hero.start - 0.3));
  var heroZ = 2.4 + macroP * (12.5 - 2.4);
  var heroX = 0.6 * (1 - macroP);
  var restZ = 16, intZ = 15.2;
  var camZ = heroVis > 0.01 ? heroZ : (restZ + intVis * (intZ - restZ));
  camera.position.z = camZ + Math.sin(t * 0.1) * 0.3;
  camera.position.x = heroVis > 0.01 ? heroX : Math.sin(t * 0.12) * 0.7;
  camera.position.y = intVis * 0.6 + Math.sin(t * 0.09) * 0.3;
  camera.lookAt(0, intVis * 0.3, 0);

  // --- Root node: visible during hero + integrations, otherwise hidden. ---
  var rootVis = Math.max(heroVis, intVis);
  rootNode.visible = rootVis > 0.01;
  rootNode.material.opacity = 0.5 * rootVis + 0.02;
  rootNode.children[0].material.opacity = 0.55 * rootVis;
  rootNode.rotation.y = t * 0.12;
  var rootLabel = document.getElementById('node-root');
  var rootScreen = projectToScreen(rootNode.position);
  rootLabel.style.left = rootScreen.x + 'px';
  rootLabel.style.top = rootScreen.y + 'px';
  rootLabel.style.opacity = rootVis;

  // --- Integration nodes + bezier pulse pipes (integrations scene only) ---
  var ints = byId('sceneIntegrations'), ltint = t - ints.start;
  integrationNodes.forEach(function(node, i){
    var revealStart = 0.6 + i * 0.35;
    var revealP = easeOutBack(progress(ltint, revealStart, revealStart + 0.55));
    var scaleP = clamp01(progress(ltint, revealStart, revealStart + 0.55));
    var visible = intVis > 0.01 && ltint >= revealStart - 0.05;
    node.visible = visible;
    node.material.opacity = 0.5 * scaleP;
    node.children[0].material.opacity = 0.55 * scaleP;
    node.scale.setScalar(Math.max(0.001, scaleP * (0.9 + revealP * 0.1)));
    node.rotation.y = t * 0.15;

    var pipe = pipes[i];
    pipe.tube.visible = visible;
    pipe.tube.material.opacity = 0.28 * scaleP;
    pipe.pulse.visible = visible && ltint > revealStart + 0.3;
    if (pipe.pulse.visible) {
      var cycle = 1.6;
      var pt = ((ltint - revealStart - 0.3) / cycle + pipe.phase) % 1;
      var pos = pipe.curve.getPointAt(clamp01(pt));
      pipe.pulse.position.copy(pos);
    }

    var label = document.getElementById(NODE_IDS[i]);
    var screenPos = projectToScreen(node.position);
    label.style.left = screenPos.x + 'px';
    label.style.top = (screenPos.y - 62) + 'px';
    label.style.opacity = scaleP * intVis;
    label.style.transform = 'translate(-50%,-50%) translateY(' + (1 - scaleP) * 16 + 'px)';
  });

  renderer.render(scene3, camera);

  // --- Team hub: cascading fan of glass cards (pure CSS 3D), one card lit
  // neon green as the "active automation" card. ---
  var hub = byId('sceneTeamHub'), lthub = t - hub.start;
  var FAN_IDS = ['fan-inbox', 'fan-lead', 'fan-receptionist', 'fan-law', 'fan-brokerage'];
  var FAN_ANGLES = [-22, -11, 0, 11, 22];
  FAN_IDS.forEach(function(id, i){
    var el = document.getElementById(id);
    var revealStart = 0.4 + i * 0.28;
    var revealP = easeOutBack(progress(lthub, revealStart, revealStart + 0.6));
    var scaleP = clamp01(progress(lthub, revealStart, revealStart + 0.6));
    var angle = FAN_ANGLES[i] * revealP;
    var breathe = 1 + 0.01 * Math.sin(t * 1.3 + i);
    var liftY = -Math.abs(i - 2) * 26;
    el.style.opacity = scaleP;
    el.style.zIndex = String(10 - Math.abs(i - 2));
    el.style.transform =
      'translate(-50%,-50%) ' +
      'rotate(' + angle + 'deg) ' +
      'translateY(' + (liftY + (1 - scaleP) * 60) + 'px) ' +
      'scale(' + (scaleP * breathe) + ')';
  });

  // --- How it works: 4-step pipeline, staggered reveal + line draw-in + flowing dots ---
  var hiw = byId('sceneHowItWorks'), lthiw = t - hiw.start;
  var HW_STEP_REVEALS = [0.3, 1.0, 2.1, 3.2];
  ['hw-step1', 'hw-step2', 'hw-step3', 'hw-step4'].forEach(function(id, i){
    var el = document.getElementById(id);
    var p = easeOutCubic(progress(lthiw, HW_STEP_REVEALS[i], HW_STEP_REVEALS[i] + 0.4));
    var breathe = 1 + 0.012 * Math.sin(t * 1.4 + i * 1.1);
    el.style.opacity = p;
    el.style.transform = 'translate(-50%,-50%) translateY(' + (1 - p) * 24 + 'px) scale(' + breathe + ')';
  });
  var HW_LINE_WINDOWS = { 'hw-line1': [0.7, 1.1], 'hw-line2': [1.8, 2.2], 'hw-line3': [2.9, 3.3] };
  ['hw-line1', 'hw-line2', 'hw-line3'].forEach(function(id, i){
    var w = HW_LINE_WINDOWS[id];
    var len = hwLens[id];
    if (len == null) return; // not yet computed (before onFontsReady)
    var drawP = easeOutCubic(progress(lthiw, w[0], w[1]));
    hwPaths[id].style.strokeDasharray = len;
    hwPaths[id].style.strokeDashoffset = len * (1 - drawP);
    var loopStart = w[1] + 0.15;
    var dot = hwDots[id];
    if (lthiw < loopStart || t > hiw.end) { dot.style.opacity = 0; return; }
    var cycle = 1.3, stagger = i * 0.2;
    var localT = ((lthiw - loopStart + stagger) % cycle + cycle) % cycle / cycle;
    var pt = hwPaths[id].getPointAtLength(localT * len);
    dot.style.opacity = 0.95;
    dot.setAttribute('cx', pt.x);
    dot.setAttribute('cy', pt.y);
  });

  // --- Gentle breathing on the glass service cards, so they keep moving
  // instead of sitting frozen once they've entered. ---
  document.querySelectorAll('.gcard').forEach(function(el, i){
    var breathe = 1 + 0.012 * Math.sin(t * 1.4 + i * 1.1);
    el.style.transform = 'scale(' + breathe + ')';
  });

  // --- CTA (no pricing): wordmark, tagline, then link/site ---
  var s8 = byId('sceneCta'), lt8 = t - s8.start;
  var wordP = easeOutBack(progress(lt8, 0.15, 0.55));
  document.getElementById('ctaWord').style.transform = 'scale(' + (0.8 + wordP * 0.2) + ')';
  document.getElementById('ctaWord').style.opacity = clamp01(progress(lt8, 0.15, 0.55) * 1.3);
  var ctaP = easeOutCubic(progress(lt8, 1.1, 1.5));
  document.getElementById('ctaText').style.opacity = ctaP;
  document.getElementById('siteText').style.opacity = ctaP;
}

window.renderFrame = renderFrame;
window.TOTAL_DURATION = TOTAL_DURATION;
window.SCENES_DEBUG = SCENES;
renderFrame(0);
