// Groundwork Discovery: pure helpers for the /discover/ page (no DOM). The backend owns every rule: what counts as
// stated, what a correction may change, what is rejected. This file only turns its answers into things to show.

export const list = (x) => (Array.isArray(x) ? x : []);
const str = (x) => (typeof x === "string" ? x : x === null || x === undefined ? "" : String(x));

/** How we know a part or flow. Never stronger than the backend's own label. */
export const KNOWLEDGE = {
  stated: { label: "You said this", hint: "From your own words; not verified against any system." },
  inferred: { label: "Groundwork's guess", hint: "Not something you said. Confirm or correct it." },
  contested: { label: "In doubt", hint: "Something you said conflicts with this." },
  retracted: { label: "Removed by you", hint: "You said this is wrong or no longer exists. Kept in the history." },
};
export const knowledgeOf = (k) => KNOWLEDGE[k] ?? { label: "Unknown", hint: "" };

/**
 * A `groundwork-workspace-seed/1` draft (GET …/seed) as the projection the Living Atlas reads (`views`, `entities`,
 * `relationships`, …). Ids are the seed keys. Retracted parts are not in the seed, so they are not drawn. How we know
 * each part goes in its description, which the Atlas shows when a part is selected.
 */
export function seedToProjection(seed, views) {
  if (!seed || seed.format !== "groundwork-workspace-seed/1") return null;
  const records = list(seed.anatomy).filter((r) => r && typeof r.key === "string");
  const keys = new Set(records.map((r) => r.key));
  const entities = records.map((r) => {
    const known = knowledgeOf(r.properties?.discovery?.knowledge);
    const description = [`${known.label}.`, str(r.properties?.description)].filter(Boolean).join(" ");
    return {
      id: r.key,
      entity_type: str(r.entity_type),
      name: str(r.name),
      properties: { description, atlas: { views: list(r.properties?.atlas?.views).filter((v) => typeof v === "string") } },
    };
  });
  const relationships = records.flatMap((r) =>
    list(r.relationships)
      .filter((x) => x && keys.has(x.from) && keys.has(x.to) && typeof x.key === "string")
      .map((x) => ({ id: x.key, from: x.from, to: x.to, view: x.view, type: str(x.type) || "transfers", item: str(x.item) })),
  );
  return {
    views: list(views).filter((v) => v && typeof v.key === "string"),
    entities,
    relationships,
    observations: [],
    observation_links: [],
    improvement_refs: [],
    observation_status: "not_enabled",
  };
}

/** Parts for the side panel, retracted ones included (they stay in the history). */
export function partRows(map) {
  return list(map?.parts).map((p) => ({
    key: str(p.key),
    name: str(p.name),
    kind: str(p.kind),
    knowledge: str(p.knowledge),
    ...knowledgeOf(p.knowledge),
    quote: p.quote ? str(p.quote) : null,
    owner: p.owner_role ? str(p.owner_role) : null,
    description: str(p.description),
  }));
}

export function flowRows(map) {
  const names = new Map(list(map?.parts).map((p) => [p.key, str(p.name)]));
  return list(map?.flows).map((f) => ({
    key: str(f.key),
    from: names.get(f.from) ?? str(f.from),
    to: names.get(f.to) ?? str(f.to),
    item: str(f.item),
    knowledge: str(f.knowledge),
    ...knowledgeOf(f.knowledge),
    quote: f.quote ? str(f.quote) : null,
  }));
}

const MONEY = {
  reported_revenue_unspecified: "money you reported (not yet split into sales, payments or receipts)",
  payment_volume: "payments through one processor",
  net_receipts: "money received",
  invoiced: "invoiced",
  recognized_revenue: "recognized revenue",
};
/** Figures and facts. An owner's figure is shown as theirs, never as a measurement. */
export function claimRows(map) {
  return list(map?.claims).map((c) => {
    const owner = c.provenance?.source_kind === "owner_statement";
    const value = c.value === null || c.value === undefined ? "unknown" : typeof c.value === "number" ? c.value.toLocaleString("en-US") : str(c.value);
    return {
      id: str(c.id),
      about: str(c.subject) === "business" ? "The business" : str(c.subject),
      field: str(c.field),
      value: [value, str(c.unit), c.period ? `per ${str(c.period)}` : ""].filter(Boolean).join(" "),
      meaning: MONEY[c.concept] ?? "",
      source: owner ? "Your figure, not verified" : c.provenance?.source_kind === "inference" ? "Groundwork's guess" : "From a connected source",
      confidence: str(c.confidence) || "unknown",
      revised: !!c.supersedes,
    };
  });
}

/** Questions the map's structure suggests. They are suggestions, not findings. */
export const unknownRows = (unknowns) => list(unknowns).map((u) => ({ key: str(u.key), question: str(u.question), why: str(u.why) }));

const OPS = { add: "Added", revise: "Revised", retract: "Removed", reject: "Couldn't apply" };
/** Names instead of keys where the map knows them: a part by its name, a handoff as "from → to: item". */
function namer(map) {
  const parts = new Map(list(map?.parts).map((p) => [p.key, str(p.name)]));
  const flows = new Map(list(map?.flows).map((f) => [f.key, `${parts.get(f.from) ?? f.from} → ${parts.get(f.to) ?? f.to}: ${str(f.item)}`]));
  return (t) => parts.get(t) ?? flows.get(t) ?? (t.startsWith("goal:") ? "a goal" : t);
}

/** One line per change; a rejected change is always shown, with why. */
export function changeRows(changes, map) {
  const name = namer(map);
  return list(changes).map((c) => ({ op: str(c.op), label: OPS[c.op] ?? str(c.op), target: name(str(c.target)), detail: str(c.detail), rejected: c.op === "reject" }));
}

/** The history from GET …/sessions/:id: the changes each Groundwork turn made, newest first. */
export function historyRows(turns, map) {
  return list(turns)
    .filter((t) => t.role === "groundwork" && list(t.changes).length)
    .map((t) => ({ revision: Number(t.map_revision) || 0, changes: changeRows(t.changes, map) }))
    .reverse();
}

export function usageText(usage) {
  if (!usage) return "";
  const left = Number(usage.turns_left);
  const share = Number(usage.budget_left_share);
  const parts = [Number.isFinite(left) ? `${left} message${left === 1 ? "" : "s"} left in this free conversation` : ""];
  if (Number.isFinite(share)) parts.push(`${Math.max(0, Math.round(share * 100))}% of its AI budget left`);
  return parts.filter(Boolean).join(" · ");
}

/** Honest text for every failure the backend can return. */
export function errorText(status, body) {
  if (status === 429 && body?.message) return str(body.message);
  if (status === 409) return "Still writing the last reply. Wait a moment, then send again.";
  if (status === 404) return "This conversation is no longer available. It may have expired or been deleted. Start a new one.";
  if (status === 503) return "Free discovery isn't open yet. You can try the preview with scripted replies.";
  if (status === 400) return str(body?.message) || "That message couldn't be sent.";
  if (status === 0) return "Couldn't reach Groundwork. Check your connection and try again.";
  return "Something went wrong on our side. Your map is unchanged.";
}

export function expiresText(iso, now = new Date()) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const days = Math.ceil((t - now.getTime()) / 86_400_000);
  if (days <= 0) return "This conversation has expired.";
  return `Kept for ${days} more day${days === 1 ? "" : "s"}, then deleted.`;
}
