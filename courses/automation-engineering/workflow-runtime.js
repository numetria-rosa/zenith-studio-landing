/* In-browser workflow runtime for AI Automation labs.
   Students assemble a graph of typed nodes. The runtime executes it against
   a simulated event, including flaky APIs, duplicate deliveries, and a
   deliberately messy AI step. Graders inspect the trace, not the drawing. */
(function (global) {
  const TYPES = ["trigger", "map", "http", "filter", "ai", "approve", "notify"];

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function hasCycle(nodes, edges) {
    const ids = new Set(nodes.map((n) => n.id));
    const incoming = {};
    const outgoing = {};
    ids.forEach((id) => { incoming[id] = 0; outgoing[id] = []; });
    edges.forEach((e) => {
      if (!ids.has(e.from) || !ids.has(e.to)) return;
      incoming[e.to] += 1;
      outgoing[e.from].push(e.to);
    });
    const q = Object.keys(incoming).filter((id) => incoming[id] === 0);
    let seen = 0;
    while (q.length) {
      const id = q.shift();
      seen += 1;
      (outgoing[id] || []).forEach((nxt) => {
        incoming[nxt] -= 1;
        if (incoming[nxt] === 0) q.push(nxt);
      });
    }
    return seen !== ids.size;
  }

  function topo(nodes, edges) {
    const ids = nodes.map((n) => n.id);
    const incoming = {};
    const outgoing = {};
    ids.forEach((id) => { incoming[id] = 0; outgoing[id] = []; });
    edges.forEach((e) => {
      incoming[e.to] = (incoming[e.to] || 0) + 1;
      outgoing[e.from] = outgoing[e.from] || [];
      outgoing[e.from].push(e.to);
    });
    const q = ids.filter((id) => incoming[id] === 0);
    const order = [];
    while (q.length) {
      const id = q.shift();
      order.push(id);
      (outgoing[id] || []).forEach((nxt) => {
        incoming[nxt] -= 1;
        if (incoming[nxt] === 0) q.push(nxt);
      });
    }
    return order;
  }

  function get(obj, path) {
    if (!path) return undefined;
    return String(path).split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
  }

  function applyMap(node, payload) {
    const mapping = node.config && node.config.mapping ? node.config.mapping : {};
    const out = {};
    Object.keys(mapping).forEach((dest) => {
      out[dest] = get(payload, mapping[dest]);
    });
    return out;
  }

  function runHttp(node, ctx) {
    const cfg = node.config || {};
    const failTimes = Number(ctx.httpFailTimes || 0);
    const attempts = (ctx.attempts[node.id] || 0) + 1;
    ctx.attempts[node.id] = attempts;
    if (attempts <= failTimes) {
      return { ok: false, status: 503, error: "upstream_timeout", attempt: attempts };
    }
    const sideEffect = cfg.sideEffect || "http_ok";
    ctx.sideEffects.push({ node: node.id, effect: sideEffect, attempt: attempts, eventId: ctx.event.id });
    return { ok: true, status: 200, attempt: attempts, body: { id: "rec_" + ctx.event.id, ok: true } };
  }

  function runAi(node, ctx) {
    const cfg = node.config || {};
    const schema = cfg.schema || null;
    const raw = ctx.aiOutput !== undefined ? ctx.aiOutput : (cfg.simulatedOutput || "Sure! This looks like a billing question.");
    let parsed = raw;
    if (typeof raw === "string") {
      try { parsed = JSON.parse(raw); } catch (e) { parsed = raw; }
    }
    if (schema && (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))) {
      return { ok: false, error: "not_json", raw: raw };
    }
    if (schema) {
      const missing = schema.filter((k) => parsed[k] === undefined || parsed[k] === "");
      if (missing.length) return { ok: false, error: "schema_mismatch", missing: missing, raw: parsed };
    }
    if (cfg.tools && cfg.tools.indexOf("refund.execute") !== -1 && !ctx.approved) {
      ctx.sideEffects.push({ node: node.id, effect: "refund.execute", eventId: ctx.event.id });
      return { ok: true, unbounded: true, parsed: parsed };
    }
    return { ok: true, parsed: parsed };
  }

  function run(graph, event, options) {
    const nodes = (graph && graph.nodes) || [];
    const edges = (graph && graph.edges) || [];
    const opt = options || {};
    const logs = [];
    const ctx = {
      event: event || { id: "evt_1" },
      httpFailTimes: opt.httpFailTimes || 0,
      aiOutput: opt.aiOutput,
      approved: !!opt.approved,
      attempts: {},
      sideEffects: [],
    };

    if (!nodes.length) return { ok: false, error: "empty_graph", logs: logs, ctx: ctx };
    if (hasCycle(nodes, edges)) return { ok: false, error: "cycle", logs: logs, ctx: ctx };

    const byId = {};
    nodes.forEach((n) => { byId[n.id] = n; });
    const order = topo(nodes, edges);
    if (order.length !== nodes.length) return { ok: false, error: "unexecutable", logs: logs, ctx: ctx };

    const store = opt.idempotencyStore || {};
    const idemKey = opt.idempotencyKey;
    if (idemKey && store[idemKey] && (graph.nodes.some((n) => n.config && n.config.idempotent))) {
      logs.push({ level: "ok", text: "Replay: returned stored result for key " + idemKey });
      return { ok: true, replayed: true, result: store[idemKey], logs: logs, ctx: ctx };
    }

    let payload = clone(ctx.event);
    for (let i = 0; i < order.length; i++) {
      const node = byId[order[i]];
      const type = node.type;
      logs.push({ level: "info", text: "Run " + node.id + " (" + type + ")" });

      if (type === "trigger") {
        logs.push({ level: "ok", text: "Trigger accepted event " + ctx.event.id });
        continue;
      }
      if (type === "map") {
        payload = Object.assign({}, payload, applyMap(node, payload));
        const required = (node.config && node.config.require) || [];
        const missing = required.filter((k) => payload[k] == null || payload[k] === "");
        if (missing.length) {
          logs.push({ level: "err", text: "Map rejected: missing " + missing.join(", ") });
          return { ok: false, error: "missing_fields", missing: missing, logs: logs, ctx: ctx };
        }
        logs.push({ level: "ok", text: "Mapped fields: " + Object.keys(node.config.mapping || {}).join(", ") });
        continue;
      }
      if (type === "filter") {
        const field = node.config && node.config.field;
        const equals = node.config && node.config.equals;
        if (get(payload, field) !== equals) {
          logs.push({ level: "warn", text: "Filter dropped the event" });
          return { ok: true, dropped: true, logs: logs, ctx: ctx };
        }
        continue;
      }
      if (type === "http") {
        const maxRetries = Number((node.config && node.config.maxRetries) || 0);
        let last = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          last = runHttp(node, ctx);
          if (last.ok) break;
          logs.push({ level: "warn", text: "HTTP " + (last.status || "err") + " on attempt " + last.attempt });
        }
        if (!last.ok) {
          logs.push({ level: "err", text: "HTTP exhausted retries" });
          return { ok: false, error: "http_failed", logs: logs, ctx: ctx };
        }
        payload.http = last.body;
        logs.push({ level: "ok", text: "HTTP 200 after " + last.attempt + " attempt(s)" });
        continue;
      }
      if (type === "ai") {
        const ai = runAi(node, ctx);
        if (!ai.ok) {
          logs.push({ level: "err", text: "AI step rejected: " + ai.error });
          return { ok: false, error: ai.error, logs: logs, ctx: ctx };
        }
        if (ai.unbounded) {
          logs.push({ level: "err", text: "AI step executed refund.execute with no approval" });
          return { ok: false, error: "unbounded_tool", logs: logs, ctx: ctx, unbounded: true };
        }
        payload.ai = ai.parsed;
        logs.push({ level: "ok", text: "AI step accepted structured output" });
        continue;
      }
      if (type === "approve") {
        if (!ctx.approved) {
          logs.push({ level: "warn", text: "Waiting on human approval" });
          return { ok: true, pendingApproval: true, logs: logs, ctx: ctx };
        }
        logs.push({ level: "ok", text: "Human approved" });
        continue;
      }
      if (type === "notify") {
        ctx.sideEffects.push({ node: node.id, effect: "notify", eventId: ctx.event.id });
        logs.push({ level: "ok", text: "Notify sent" });
        continue;
      }
      logs.push({ level: "err", text: "Unknown node type " + type });
      return { ok: false, error: "unknown_type", logs: logs, ctx: ctx };
    }

    const result = { ok: true, payload: payload, logs: logs, ctx: ctx };
    if (idemKey && graph.nodes.some((n) => n.config && n.config.idempotent)) {
      store[idemKey] = { payload: payload };
      result.storedKey = idemKey;
    }
    return result;
  }

  function countEffect(ctx, effect) {
    return ((ctx && ctx.sideEffects) || []).filter((s) => s.effect === effect).length;
  }

  function nodeTypes(graph) {
    return ((graph && graph.nodes) || []).map((n) => n.type);
  }

  function startsWithTrigger(graph) {
    const nodes = (graph && graph.nodes) || [];
    const edges = (graph && graph.edges) || [];
    const incoming = {};
    nodes.forEach((n) => { incoming[n.id] = 0; });
    edges.forEach((e) => { incoming[e.to] = (incoming[e.to] || 0) + 1; });
    const roots = nodes.filter((n) => incoming[n.id] === 0);
    return roots.length === 1 && roots[0].type === "trigger";
  }

  function endsWithNotify(graph) {
    const nodes = (graph && graph.nodes) || [];
    const edges = (graph && graph.edges) || [];
    const outgoing = {};
    nodes.forEach((n) => { outgoing[n.id] = 0; });
    edges.forEach((e) => { outgoing[e.from] = (outgoing[e.from] || 0) + 1; });
    const leaves = nodes.filter((n) => outgoing[n.id] === 0);
    return leaves.some((n) => n.type === "notify");
  }

  global.WorkflowRuntime = {
    TYPES, clone, hasCycle, run, countEffect, nodeTypes, startsWithTrigger, endsWithNotify, get,
  };
})(window);
