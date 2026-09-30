/* dc-lite: tiny renderer for the reference .dc.html screens (sc-for, sc-if, {{holes}}, onClick).
   Only used by the reference previews in this folder. Not part of the app you build. */
(function () {
  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(p) { Object.assign(this.state, typeof p === 'function' ? p(this.state) : p); this.__render && this.__render(); }
    forceUpdate() { this.__render && this.__render(); }
  }
  function get(scope, path) {
    path = path.trim();
    if (path === 'true') return true; if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, scope);
  }
  var WHOLE = /^\s*\{\{([^}]+)\}\}\s*$/;
  function interp(str, scope) { return str.replace(/\{\{([^}]+)\}\}/g, function (_, p) { var v = get(scope, p); return v == null ? '' : v; }); }
  function build(node, scope, out) {
    if (node.nodeType === 3) { out.appendChild(document.createTextNode(interp(node.nodeValue, scope))); return; }
    if (node.nodeType !== 1) return;
    var tag = node.tagName.toLowerCase();
    if (tag === 'sc-for') {
      var list = get(scope, (node.getAttribute('list').match(WHOLE) || [])[1] || '') || [];
      var as = node.getAttribute('as') || 'item';
      list.forEach(function (it, i) { var s = Object.create(scope); s[as] = it; s.$index = i; node.childNodes.forEach(function (c) { build(c, s, out); }); });
      return;
    }
    if (tag === 'sc-if') {
      var v = get(scope, (node.getAttribute('value').match(WHOLE) || [])[1] || '');
      if (v) node.childNodes.forEach(function (c) { build(c, scope, out); });
      return;
    }
    var el = node.namespaceURI === 'http://www.w3.org/2000/svg' ? document.createElementNS(node.namespaceURI, node.tagName) : document.createElement(tag);
    Array.prototype.forEach.call(node.attributes, function (a) {
      var n = a.name, val = a.value;
      if (n.indexOf('hint-') === 0) return;
      if (/^on/i.test(n)) { var m = val.match(WHOLE); var fn = m && get(scope, m[1]); if (typeof fn === 'function') el.addEventListener(n.slice(2).toLowerCase(), fn); return; }
      el.setAttribute(n, interp(val, scope));
    });
    node.childNodes.forEach(function (c) { build(c, scope, el); });
    out.appendChild(el);
  }
  window.dcMount = function (tplId, scriptId, mountId) {
    var tpl = document.getElementById(tplId).content, sc = document.getElementById(scriptId);
    var props = {}; try { var dp = JSON.parse(sc.getAttribute('data-props') || '{}'); Object.keys(dp).forEach(function (k) { if (k[0] !== '$' && dp[k] && 'default' in dp[k]) props[k] = dp[k].default; }); } catch (e) {}
    var Comp = new Function('DCLogic', sc.textContent + '\n;return Component;')(DCLogic);
    var inst = new Comp(props); if (!inst.props) inst.props = props;
    var mount = document.getElementById(mountId);
    inst.__render = function () { var f = document.createDocumentFragment(); var vals = inst.renderVals ? inst.renderVals() : {}; tpl.childNodes.forEach(function (c) { build(c, vals, f); }); mount.replaceChildren(f); };
    inst.__render();
    if (inst.componentDidMount) inst.componentDidMount();
    window.__dc = inst;
  };
})();
