import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { buildLivingMap } from "../client-os/living-map.mjs";
import { apiClient, mockClient } from "../discover/discovery-client.mjs";
import { changeRows, claimRows, errorText, expiresText, flowRows, historyRows, partRows, seedToProjection, unknownRows, usageText } from "../discover/discovery-view.mjs";

const run = async (texts, opts) => {
  const c = mockClient(opts);
  const s = await c.start();
  let r = null;
  for (const t of texts) r = await c.turn(s, t);
  return { c, s, r };
};

test("the map and the Living Atlas stay in sync: the seed draft becomes the projection the existing renderer reads", async () => {
  const { c, s, r } = await run(["We sell tile in a showroom and online, and install it."]);
  const projection = seedToProjection(await c.seed(s), r.views);
  const living = buildLivingMap(projection); // the Atlas's own model code, unchanged
  assert.ok(living);
  assert.deepEqual(living.parts.map((p) => p.name).sort(), r.map.parts.map((p) => p.name).sort());
  assert.equal(living.flows.length, r.map.flows.length);
  assert.equal(living.views.length, 5);
  // How we know each part travels with it: the Atlas shows the description when a part is selected.
  assert.match(living.parts.find((p) => p.name === "Install quoting").description, /^Groundwork's guess\./);
  assert.match(living.parts.find((p) => p.name === "Showroom sales").description, /^You said this\./);
});

test("an owner's correction removes a part from the drawing but keeps it, labelled, in the panel and the history", async () => {
  const { c, s, r } = await run(["We sell tile.", "Installs start with a visit.", "We closed the online store last month."]);
  assert.equal(partRows(r.map).find((p) => p.key === "online-store").label, "Removed by you");
  const living = buildLivingMap(seedToProjection(await c.seed(s), r.views));
  assert.ok(!living.parts.some((p) => p.name === "Online store"));
  assert.deepEqual(changeRows(r.changes, r.map)[0], { op: "retract", label: "Removed", target: "Online store", detail: 'owner: "We closed the online store last month."', rejected: false });
  const got = await c.get(s);
  const history = historyRows(got.turns, got.map);
  assert.equal(history[0].changes[0].label, "Removed");
});

test("a direction correction puts the guessed handoff in doubt and adds the stated one", async () => {
  const { r } = await run(["We sell tile.", "Installs start with a visit.", "The crew sends us his invoice."]);
  const rows = flowRows(r.map);
  assert.equal(rows.find((f) => f.key === "flow-invoicing-crews").label, "In doubt");
  assert.ok(changeRows(r.changes, r.map).some((c) => c.target === "Install invoicing → Install crews: invoices" && /opposite direction/.test(c.detail)));
  assert.deepEqual(rows.find((f) => f.key === "flow-crews-invoicing"), { key: "flow-crews-invoicing", from: "Install crews", to: "Install invoicing", item: "invoices", knowledge: "stated", label: "You said this", hint: "From your own words; not verified against any system.", quote: "The crew sends us his invoice." });
});

test("a change the backend could not apply is shown as such, never hidden", async () => {
  const { r } = await run(["We sell tile.", "Installs start with a visit."]);
  const rejected = changeRows(r.changes).filter((c) => c.rejected);
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0].label, "Couldn't apply");
  const { r: r3 } = await run(["We sell tile.", "Installs start with a visit.", "The van stopped working."]);
  assert.equal(changeRows(r3.changes)[0].detail, "retraction names no part on the map");
});

test("figures are the owner's, not measurements; unknowns are questions with a reason", async () => {
  const { r } = await run(["We do about 60k a month."]);
  const [claim] = claimRows(r.map);
  assert.equal(claim.source, "Your figure, not verified");
  assert.equal(claim.confidence, "low");
  assert.match(claim.meaning, /not yet split/);
  for (const u of unknownRows(r.unknowns)) {
    assert.ok(u.question.endsWith("?"));
    assert.ok(u.why.length > 0);
  }
});

test("limits and every backend failure have honest text", async () => {
  assert.equal(usageText({ turns_left: 1, budget_left_share: 0.42 }), "1 message left in this free conversation · 42% of its AI budget left");
  assert.match(errorText(503, {}), /isn't open yet/);
  assert.match(errorText(404, {}), /expired or been deleted/);
  assert.match(errorText(409, {}), /Still writing/);
  assert.equal(errorText(429, { message: "This free conversation has reached its length limit." }), "This free conversation has reached its length limit.");
  assert.match(errorText(0, null), /Couldn't reach/);
  assert.match(errorText(500, null), /map is unchanged/);
  assert.equal(expiresText("2026-10-01T00:00:00Z", new Date("2026-10-24T00:00:00Z")), "This conversation has expired.");
  assert.equal(expiresText("2026-10-26T00:00:00Z", new Date("2026-10-24T00:00:00Z")), "Kept for 2 more days, then deleted.");
  for (const [fail, status] of [["503", 503], ["404", 404], ["409", 409], ["429", 429], ["network", 0]]) {
    const c = mockClient({ fail });
    const s = fail === "503" ? null : await c.start();
    await assert.rejects(() => (s ? c.turn(s, "hello") : c.start()), (e) => e.status === status);
  }
});

test("the preview stops at its turn limit, and another conversation's token reads nothing", async () => {
  const c = mockClient();
  const s = await c.start();
  for (let i = 0; i < 6; i++) await c.turn(s, "more");
  await assert.rejects(() => c.turn(s, "one more"), (e) => e.status === 429 && e.body.reason === "turn_limit" && !/AI key/.test(e.body.message));
  await assert.rejects(() => c.get({ id: s.id, token: "someone-else" }), (e) => e.status === 404);
});

test("the live client sends the token only as a header, no cookies, and maps failures to a status", async () => {
  const calls = [];
  const ok = (body) => ({ ok: true, status: 200, json: async () => body });
  const c = apiClient("https://api.example/api/v1/", async (url, init) => { calls.push({ url, init }); return ok({ reply: "hi" }); });
  await c.turn({ id: "a/b", token: "t0k" }, "We sell tile");
  assert.equal(calls[0].url, "https://api.example/api/v1/groundwork/discovery/sessions/a%2Fb/turns");
  assert.equal(calls[0].init.headers["x-discovery-token"], "t0k");
  assert.equal(calls[0].init.credentials, "omit");
  assert.ok(!calls[0].url.includes("t0k"));
  assert.deepEqual(JSON.parse(calls[0].init.body), { text: "We sell tile" });
  const down = apiClient("https://api.example/api/v1", async () => { throw new TypeError("offline"); });
  await assert.rejects(() => down.start(), (e) => e.status === 0);
  const refused = apiClient("https://api.example/api/v1", async () => ({ ok: false, status: 429, json: async () => ({ reason: "daily_budget", message: "Free discovery has reached today's limit." }) }));
  await assert.rejects(() => refused.start(), (e) => e.status === 429 && e.body.reason === "daily_budget");
});

test("untrusted text is never parsed as HTML: the page builds DOM with textContent only", () => {
  const app = readFileSync(new URL("../discover/app.js", import.meta.url), "utf8");
  assert.doesNotMatch(app, /innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function/);
  assert.match(app, /const \$ = \(id\) => document\.getElementById\(id\);/);
  // Hostile names pass through the projection as plain strings; the Atlas renderer escapes them itself.
  const projection = seedToProjection({ format: "groundwork-workspace-seed/1", anatomy: [{ key: "x", entity_type: "Process", name: '<img src=x onerror="alert(1)">', properties: { atlas: { views: ["value_flow"] }, discovery: { knowledge: "stated" } }, relationships: [] }] }, [{ key: "value_flow", name: "Customer flow" }]);
  assert.equal(projection.entities[0].name, '<img src=x onerror="alert(1)">');
  assert.match(readFileSync(new URL("../client-os/living-atlas.js", import.meta.url), "utf8"), /const safe = /);
});

test("a malformed or foreign seed draws nothing instead of a wrong map", () => {
  assert.equal(seedToProjection(null, []), null);
  assert.equal(seedToProjection({ format: "something-else/1", anatomy: [] }, []), null);
  const p = seedToProjection({ format: "groundwork-workspace-seed/1", anatomy: [{ key: "a", name: "A", properties: { atlas: { views: ["value_flow"] } }, relationships: [{ key: "f", from: "a", to: "missing", view: "value_flow" }] }] }, [{ key: "value_flow", name: "Customer flow" }]);
  assert.equal(p.relationships.length, 0);
});

test("every element the page script looks up exists in the page", () => {
  const app = readFileSync(new URL("../discover/app.js", import.meta.url), "utf8");
  const html = readFileSync(new URL("../discover/index.html", import.meta.url), "utf8");
  const ids = [...app.matchAll(/\$\("([^"]+)"\)/g)].map((m) => m[1]);
  assert.ok(ids.length > 10);
  for (const id of new Set(ids)) assert.match(html, new RegExp(`id="${id}"`), `missing #${id}`);
  assert.match(html, /<groundwork-living-atlas hidden><\/groundwork-living-atlas>/);
});

test("every discover script parses", () => {
  for (const f of readdirSync(new URL("../discover/", import.meta.url)).filter((n) => /\.m?js$/.test(n)))
    execFileSync(process.execPath, ["--input-type=module", "--check"], { input: readFileSync(new URL(`../discover/${f}`, import.meta.url)), stdio: ["pipe", "pipe", "pipe"] });
});
