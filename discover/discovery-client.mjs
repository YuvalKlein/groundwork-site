// Groundwork Discovery clients. `apiClient` talks to unitism-backend (/api/v1/groundwork/discovery: signed-in,
// allowlisted testers only; off unless GROUNDWORK_DISCOVERY_ENABLED=true). `mockClient` is a scripted preview with the same interface: no AI, no
// network, nothing saved. Both resolve to the backend's response shapes and reject with {status, body}.

export class DiscoveryError extends Error {
  constructor(status, body) {
    super(`discovery ${status}`);
    this.status = status;
    this.body = body;
  }
}

/** `signIn()` returns the platform access token (the Groundwork magic-link session), or "" when signed out. */
export function apiClient(apiBase, fetchImpl = (...a) => fetch(...a), signIn = () => "") {
  const base = String(apiBase || "").replace(/\/+$/, "") + "/groundwork/discovery/sessions";
  const call = async (path, { method = "GET", token, body } = {}) => {
    const bearer = signIn();
    if (!bearer) throw new DiscoveryError(401, null);
    let res;
    try {
      res = await fetchImpl(base + path, {
        method,
        headers: { authorization: `Bearer ${bearer}`, ...(token ? { "x-discovery-token": token } : {}), ...(body ? { "content-type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
    } catch {
      throw new DiscoveryError(0, null);
    }
    let data = null;
    try { data = await res.json(); } catch {}
    if (!res.ok) throw new DiscoveryError(res.status, data);
    return data;
  };
  const id = (x) => encodeURIComponent(String(x));
  return {
    mode: "live",
    start: () => call("", { method: "POST" }),
    turn: (s, text) => call(`/${id(s.id)}/turns`, { method: "POST", token: s.token, body: { text } }),
    get: (s) => call(`/${id(s.id)}`, { token: s.token }),
    seed: (s) => call(`/${id(s.id)}/seed`, { token: s.token }),
    erase: (s) => call(`/${id(s.id)}`, { method: "DELETE", token: s.token }),
  };
}

// ---- Scripted preview (fictional tile shop; mirrors the response shapes from PR #1286) ----

const VIEWS = [
  { key: "value_flow", name: "Customer flow", question: "How does a customer move from first contact to a finished job?" },
  { key: "resources_finance", name: "Money flow", question: "Where does money go out, and where does it come back?" },
  { key: "information_measurement", name: "Information flow", question: "How does what happens get recorded and seen?" },
  { key: "improvement_activity", name: "Decisions and improvement", question: "How do numbers turn into decisions and changes?" },
  { key: "organization", name: "People and responsibility", question: "Who does the work, and who decides?" },
];
const OPENING = "Tell me about your business in your own words: what you do, for whom, and how a piece of work gets done from start to finish.";
const MAX_TURNS = 6;

const part = (key, name, kind, views, knowledge, quote = null, owner_role = null, description = "") =>
  ({ key, name, kind, description, views, owner_role, knowledge, quote, first_revision: 1, health: "unknown" });
const flow = (key, from, to, item, view, knowledge, quote = null) => ({ key, from, to, item, view, knowledge, quote });

/** Mirrors the backend's unknowns: from the map's own structure, ranked by a plain heuristic. */
function mockUnknowns(map) {
  const live = map.parts.filter((p) => p.knowledge !== "retracted");
  if (!live.length) return [{ key: "start", about: "business", question: OPENING, why: "Nothing is on the map yet.", rank: 0, source: "structure" }];
  const model = (map.gaps ?? []).map((g) => ({ ...g, rank: 0.5, source: "model" }));
  const out = [];
  for (const v of VIEWS) if (!live.some((p) => p.views.includes(v.key))) out.push({ key: `view:${v.key}`, about: v.key, question: v.question, why: `Nothing on the map covers ${v.name.toLowerCase()} yet.`, rank: 1, source: "structure" });
  for (const p of live) {
    if (!p.owner_role) out.push({ key: `owner:${p.key}`, about: p.key, question: `Who is responsible for ${p.name}?`, why: `${p.name} has no known owner.`, rank: 3, source: "structure" });
    if (p.knowledge === "inferred") out.push({ key: `confirm:${p.key}`, about: p.key, question: `I assumed there is "${p.name}". Is that right, and what do you call it?`, why: "Inferred, not stated by you.", rank: 4, source: "structure" });
  }
  return [...model, ...out.sort((a, b) => a.rank - b.rank)];
}

/** Mirrors the backend seed export (retracted parts and their flows left out). */
function mockSeed(map, id) {
  const live = map.parts.filter((p) => p.knowledge !== "retracted");
  const ok = new Set(live.map((p) => p.key));
  const label = (k) => (k === "stated" ? "source paraphrase" : "hypothesis");
  return {
    format: "groundwork-workspace-seed/1",
    workspace_slug: null,
    source_notice: "Scripted preview; not a real conversation.",
    anatomy: live.map((p) => ({
      key: `discovery-${p.key}`,
      entity_type: p.kind,
      name: p.name,
      properties: { description: p.description, atlas: { views: p.views }, discovery: { knowledge: p.knowledge, health: "unknown", quote: p.quote } },
      relationships: map.flows
        .filter((f) => f.from === p.key && f.knowledge !== "retracted" && ok.has(f.to))
        .map((f) => ({ key: `discovery-${f.key}`, type: "transfers", from: `discovery-${f.from}`, to: `discovery-${f.to}`, view: f.view, item: f.item, epistemic_label: label(f.knowledge), review_state: "pending" })),
      provenance: { source_id: `groundwork-discovery:${id}`, epistemic_label: label(p.knowledge) },
    })),
    research_findings: [],
    nodes: [],
    discovery: { goals: map.goals, work_items: map.work_items, claims: map.claims, unknowns: mockUnknowns(map) },
  };
}

const firstSentence = (text, re) => {
  const s = String(text).split(/(?<=[.!?])\s+/).find((x) => re.test(x));
  return s ? s.trim().slice(0, 120) : null;
};

/**
 * Scripted preview. Turn 1 and 2 draw a fixed fictional map; later turns react to two kinds of correction so every
 * state can be seen: something "closed / no longer" (a part is removed, in the owner's words) and a handoff "the other
 * way" (the guessed direction is put in doubt). `fail` simulates a backend answer: 503, 404, 409, 429 or "network".
 */
export function mockClient({ fail = null, now = () => new Date() } = {}) {
  const id = "00000000-0000-4000-8000-000000d15c0e";
  const token = "preview";
  let map = { format: "groundwork-discovery-map/1", revision: 0, parts: [], flows: [], goals: [], work_items: [], claims: [], gaps: [], history: [] };
  const turns = [{ seq: 1, role: "groundwork", text: OPENING, map_revision: 0, changes: [] }];
  let used = 0;
  const expires = new Date(now().getTime() + 7 * 86_400_000).toISOString();
  const usage = () => ({ turns_used: used, turns_left: Math.max(0, MAX_TURNS - used), budget_left_share: Math.max(0, 1 - used * 0.045) });
  const check = (s, op) => {
    if (fail === "network" && op !== "start") throw new DiscoveryError(0, null);
    if (fail === "503") throw new DiscoveryError(503, { statusCode: 503, message: "Discovery is not available" });
    if (s && (s.id !== id || s.token !== token)) throw new DiscoveryError(404, { message: "Conversation not found" });
    if (fail === "404" && op !== "start") throw new DiscoveryError(404, { message: "Conversation not found" });
  };
  const commit = (changes) => {
    map = { ...map, revision: map.revision + 1, history: [...map.history, { revision: map.revision + 1, turn: turns.length, changes }] };
    return changes;
  };
  const step = (text) => {
    const owner = String(text);
    if (used === 1) {
      map.parts = [
        part("showroom-sales", "Showroom sales", "Process", ["value_flow", "resources_finance"], "stated", "sell tile from our showroom", "co-owner"),
        part("online-store", "Online store", "Process", ["value_flow"], "stated", "a small online store", "co-owner"),
        part("install-crews", "Install crews", "Function", ["value_flow", "organization"], "stated", "two install crews", "owner"),
        part("install-quoting", "Install quoting", "Process", ["value_flow"], "inferred"),
        part("invoicing", "Install invoicing", "Process", ["resources_finance"], "inferred"),
      ];
      map.flows = [
        flow("flow-quoting-crews", "install-quoting", "install-crews", "accepted jobs", "value_flow", "inferred"),
        flow("flow-invoicing-crews", "invoicing", "install-crews", "invoices", "resources_finance", "inferred"),
      ];
      map.goals = [{ key: "predictable-installs", kind: "Objective", text: "More predictable install bookings", knowledge: "inferred", quote: null }];
      map.work_items = [{ key: "tablet-quoting", kind: "Project", text: "Tablet quoting app", quote: null }];
      map.gaps = [
        { key: "gap:capacity", area: "capacity", about: "install-crews", question: "How many installs can each crew finish in a typical week?", why: "Sets how much install work the business can take on." },
        { key: "gap:revenue", area: "revenue_mix", about: "business", question: "Roughly what share of the money comes from counter sales versus installs?", why: "Shows which part of the map carries the money." },
        { key: "gap:lead", area: "lead_times", about: "business", question: "How long do tile orders take to arrive?", why: "Supply waits can hold up installs." },
      ];
      map.claims = [{ id: "business:money:monthly:r1:0", subject: "business", field: "money:monthly", concept: "reported_revenue_unspecified", value: 60000, unit: "USD", period: "month", scope: "business", confidence: "low", provenance: { source_kind: "owner_statement" }, supersedes: null }];
      return {
        reply: "So you sell tile from a showroom and online, and also install it with your own crews. Could you walk me through what happens from the moment a homeowner asks for an install to the day it's paid?",
        changes: commit([
          ...map.parts.map((p) => ({ op: "add", target: p.key, detail: `${p.kind} (${p.knowledge})` })),
          ...map.flows.map((f) => ({ op: "add", target: f.key, detail: `${f.item} (${f.knowledge})` })),
          { op: "add", target: "goal:predictable-installs", detail: "Objective kept as a goal, not a unit" },
        ]),
      };
    }
    if (used === 2) {
      map.parts.push(part("tile-ordering", "Tile ordering", "Process", ["value_flow", "resources_finance"], "stated", "we order any tile we don't have"));
      map.flows.push(flow("flow-ordering-crews", "tile-ordering", "install-crews", "tile for the job", "value_flow", "inferred"));
      return {
        reply: "Tile arrival seems to be where jobs slip. Which causes more delay: waiting on tile, or finding a free crew once the tile is in?",
        changes: commit([
          { op: "add", target: "tile-ordering", detail: "Process (stated)" },
          { op: "add", target: "flow-ordering-crews", detail: "tile for the job (inferred)" },
          { op: "reject", target: "Deposits", detail: "claim deposit:percent is about no known part" },
        ]),
      };
    }
    const changes = [];
    const closed = firstSentence(owner, /\b(closed|no longer|shut|stopped)\b/i);
    if (closed && /online/i.test(closed)) {
      const p = map.parts.find((x) => x.key === "online-store");
      if (p && p.knowledge !== "retracted") {
        p.knowledge = "retracted";
        changes.push({ op: "retract", target: p.key, detail: `owner: "${closed}"` });
      }
    } else if (closed) {
      changes.push({ op: "reject", target: closed.slice(0, 60), detail: "retraction names no part on the map" });
    }
    const reverse = firstSentence(owner, /\b(other way|opposite|sends? (us|me)|invoices? us)\b/i);
    if (reverse) {
      const f = map.flows.find((x) => x.key === "flow-invoicing-crews");
      if (f && f.knowledge === "inferred") {
        map.flows.push(flow("flow-crews-invoicing", "install-crews", "invoicing", "invoices", "resources_finance", "stated", reverse));
        f.knowledge = "contested";
        changes.push({ op: "add", target: "flow-crews-invoicing", detail: "invoices (stated)" }, { op: "revise", target: f.key, detail: "contested: the owner described the opposite direction" });
      }
    }
    if (!changes.length) {
      return { reply: `This preview only has scripted replies, so I can't take in "${owner.slice(0, 80)}". Try telling me something that closed, or a handoff that goes the other way.`, changes: commit([]) };
    }
    return { reply: "Thanks, I've updated the map from what you said. What else on it looks wrong?", changes: commit(changes) };
  };
  return {
    mode: "preview",
    async start() {
      check(null, "start");
      return { id, token, reply: OPENING, map, views: VIEWS, unknowns: mockUnknowns(map), usage: usage() };
    },
    async turn(s, text) {
      check(s, "turn");
      if (fail === "409") throw new DiscoveryError(409, { message: "A reply is still being written" });
      if (used >= MAX_TURNS || fail === "429") throw new DiscoveryError(429, { reason: "turn_limit", message: "This free conversation has reached its length limit. Your map is saved; talk to us to continue." });
      if (!String(text).trim()) throw new DiscoveryError(400, { message: "Say something about your business" });
      used++;
      turns.push({ seq: turns.length + 1, role: "owner", text: String(text), map_revision: map.revision, changes: [] });
      const r = step(text);
      turns.push({ seq: turns.length + 1, role: "groundwork", text: r.reply, map_revision: map.revision, changes: r.changes });
      return { reply: r.reply, map, views: VIEWS, changes: r.changes, unknowns: mockUnknowns(map), usage: usage() };
    },
    async get(s) {
      check(s, "get");
      return { id, map, views: VIEWS, unknowns: mockUnknowns(map), turns, usage: usage(), expires_at: expires };
    },
    async seed(s) {
      check(s, "seed");
      return mockSeed(map, id);
    },
    async erase(s) {
      check(s, "erase");
      return { deleted: true };
    },
  };
}
