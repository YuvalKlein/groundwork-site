import "/client-os/living-atlas.js";
import { apiClient, mockClient } from "./discovery-client.mjs";
import { KNOWLEDGE, changeRows, claimRows, errorText, expiresText, flowRows, historyRows, list, partRows, seedToProjection, unknownRows, usageText } from "./discovery-view.mjs";

/* Groundwork Discovery page. Every rule lives in the backend; this page shows its answers. All text from the owner or
 * the model is set with textContent, never parsed as HTML. */
const $ = (id) => document.getElementById(id);
const h = (tag, props = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) if (k === "class") el.className = v; else if (k === "text") el.textContent = v; else if (k.startsWith("on")) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v);
  for (const kid of kids) if (kid !== null && kid !== undefined && kid !== false) el.append(kid);
  return el;
};

const params = new URLSearchParams(location.search);
const apiBase = window.GROUNDWORK_CONFIG?.apiBase || "";
const preview = params.has("preview") || !apiBase;
const client = preview ? mockClient({ fail: params.get("fail") }) : apiClient(apiBase);
const STORE = "groundwork.discover.session";
const store = {
  get() { if (preview) return null; try { return JSON.parse(sessionStorage.getItem(STORE)); } catch { return null; } },
  set(v) { if (preview) return; try { sessionStorage.setItem(STORE, JSON.stringify(v)); } catch {} },
  clear() { try { sessionStorage.removeItem(STORE); } catch {} },
};
const OPENING = "Tell me about your business in your own words: what you do, for whom, and how a piece of work gets done from start to finish.";

let session = store.get();
let busy = false;
let exhausted = false;
const atlas = document.querySelector("groundwork-living-atlas");

$("mode").textContent = preview ? "Preview · scripted replies, no AI, nothing saved" : "Free discovery";
$("mode").classList.toggle("preview", preview);
$("limits").textContent = preview
  ? "This preview uses scripted replies so you can see how the map behaves. Nothing you type leaves your browser."
  : "Free conversations are short and capped. Your words are kept for a limited time and you can delete them at any time.";
$("legend").replaceChildren(...Object.entries(KNOWLEDGE).map(([k, v]) => h("span", {}, h("span", { class: `k ${k}`, text: v.label }))));

function message(role, text, extra = "") {
  const li = h("li", { class: `${role} ${extra}`.trim(), text });
  $("messages").append(li);
  li.scrollIntoView?.({ block: "nearest" });
  return li;
}
function setError(status, body) {
  const el = $("error");
  el.textContent = status === null ? "" : errorText(status, body);
  if (status === 503 && !preview) el.append(" ", h("a", { href: "?preview", text: "Open the preview" }));
}
function setBusy(b) { busy = b; $("send").disabled = b || exhausted; $("text").disabled = b || exhausted; }

function correct(prefix) {
  const t = $("text");
  t.value = prefix;
  t.focus();
  t.setSelectionRange?.(t.value.length, t.value.length);
}
const badge = (r) => h("span", { class: `k ${r.knowledge}`, text: r.label, title: r.hint });
const quote = (q) => (q ? h("span", { class: "quote", text: `“${q}”` }) : null);

function renderMap(map, unknowns) {
  const parts = partRows(map);
  $("parts").replaceChildren(...(parts.length ? parts.map((p) => h("li", {}, badge(p), h("strong", { text: p.name }), h("span", { class: "muted", text: ` · ${p.kind}${p.owner ? ` · ${p.owner}` : ""}` }), quote(p.quote),
    p.knowledge !== "retracted" ? h("div", { class: "row" }, h("button", { type: "button", onclick: () => correct(`About "${p.name}": `), text: p.knowledge === "inferred" ? "Confirm or correct" : "Correct" })) : null))
    : [h("li", { class: "muted", text: "Nothing yet." })]));
  const flows = flowRows(map);
  $("flows").replaceChildren(...(flows.length ? flows.map((f) => h("li", {}, badge(f), h("span", { text: `${f.from} → ${f.to}: ${f.item}` }), quote(f.quote),
    f.knowledge !== "retracted" ? h("div", { class: "row" }, h("button", { type: "button", onclick: () => correct(`About the handoff "${f.item}" from ${f.from} to ${f.to}: `), text: "Correct, or say it goes the other way" })) : null))
    : [h("li", { class: "muted", text: "No handoffs yet." })]));
  const claims = claimRows(map);
  $("claims").replaceChildren(...(claims.length ? claims.map((c) => h("li", {}, h("strong", { text: `${c.about}: ${c.value}` }), h("span", { class: "quote", text: [c.meaning, c.source, `confidence ${c.confidence}`, c.revised ? "revised" : ""].filter(Boolean).join(" · ") })))
    : [h("li", { class: "muted", text: "No figures yet. Unknown is not zero." })]));
  const goals = [...list(map?.goals).map((g) => `Goal: ${g.text}`), ...list(map?.work_items).map((w) => `${w.kind}: ${w.text}`)];
  $("goals").replaceChildren(...(goals.length ? goals.map((g) => h("li", { text: g })) : [h("li", { class: "muted", text: "None yet. Goals and projects are kept apart from the parts of the business." })]));
  const open = unknownRows(unknowns);
  $("unknowns").replaceChildren(...(open.length ? open.map((u) => h("li", {}, h("span", { text: u.question }), h("span", { class: "quote", text: u.why }))) : [h("li", { class: "muted", text: "None right now." })]));
}

function renderHistory(rows) {
  $("history").replaceChildren(...(rows.length ? rows.flatMap((r) => r.changes.map((c) => h("li", { class: c.rejected ? "reject" : "" }, h("strong", { text: c.label }), h("span", { text: ` ${c.target}` }), c.detail ? h("span", { class: "quote", text: c.detail }) : null)))
    : [h("li", { class: "muted", text: "No changes yet." })]));
}

async function drawAtlas(views) {
  try {
    const projection = seedToProjection(await client.seed(session), views);
    const drawn = !!projection && projection.entities.length > 0;
    atlas.projection = drawn ? projection : null;
    $("empty").hidden = drawn;
  } catch (e) {
    setError(e.status ?? 0, e.body);
  }
}

let history = [];
async function apply(r, views) {
  renderMap(r.map, r.unknowns);
  if (r.changes) history = [{ revision: r.map?.revision ?? 0, changes: changeRows(r.changes, r.map) }, ...history];
  renderHistory(history);
  $("usage").textContent = usageText(r.usage);
  exhausted = Number(r.usage?.turns_left) === 0;
  setBusy(busy);
  $("erase").hidden = !session;
  await drawAtlas(views);
}

async function resume() {
  try {
    const r = await client.get(session);
    $("messages").replaceChildren();
    for (const t of list(r.turns)) message(t.role === "owner" ? "owner" : "groundwork", t.text);
    history = historyRows(r.turns, r.map);
    $("expires").textContent = expiresText(r.expires_at);
    await apply({ ...r, changes: null }, r.views);
  } catch (e) {
    session = null;
    store.clear();
    $("messages").replaceChildren();
    message("groundwork", OPENING);
    setError(e.status ?? 0, e.body);
  }
}

$("say").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const text = $("text").value.trim();
  if (!text || busy) return;
  setError(null);
  setBusy(true);
  const mine = message("owner", text);
  const pending = message("groundwork", "Thinking about what you said…", "pending");
  try {
    if (!session) {
      const s = await client.start();
      session = { id: s.id, token: s.token };
      store.set(session);
    }
    const r = await client.turn(session, text);
    pending.remove();
    message("groundwork", r.reply);
    $("text").value = "";
    await apply(r, r.views);
  } catch (e) {
    // Not sent: take it back out of the conversation; the text stays in the box to send again.
    pending.remove();
    mine.remove();
    // A 404 before a conversation exists means the route isn't there (backend without discovery): "not open yet".
    setError(!session && e.status === 404 ? 503 : e.status ?? 0, e.body);
    if (e.status === 404) { session = null; store.clear(); }
  } finally {
    setBusy(false);
  }
});

$("erase").addEventListener("click", async () => {
  if (!session || !confirm("Delete this conversation and its map? This can't be undone.")) return;
  try { await client.erase(session); } catch (e) { if (e.status !== 404) { setError(e.status ?? 0, e.body); return; } }
  session = null;
  store.clear();
  history = [];
  $("messages").replaceChildren();
  message("groundwork", OPENING);
  renderMap(null, []);
  renderHistory([]);
  atlas.projection = null;
  $("empty").hidden = false;
  $("usage").textContent = $("expires").textContent = "";
  $("erase").hidden = true;
  exhausted = false;
  setBusy(false);
});

if (session) resume();
else {
  message("groundwork", OPENING);
  renderMap(null, []);
  renderHistory([]);
}
