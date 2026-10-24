import { buildLivingMap, valueOf, numberOf } from "./living-map.mjs";
/* Groundwork Living Atlas: a business's systems, parts and flows, laid out by how the parts connect.
 * The drawing is one layout of the map; no shape is fixed in code. Read-only; d3 is bundled at /client-os/vendor/d3.min.js.
 */
const safe = (x) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const COLORS = { value_flow: "#38d9b4", resources_finance: "#f0c252", information_measurement: "#6aa8ff", improvement_activity: "#b49cff", organization: "#ff9a7a" };
const STATUS = { Discovered: "#6f8aa3", Measuring: "#38d9b4", Impact: "#f0c252", "In Progress": "#ff9a6b", Proposed: "#9fb2ff" };
const colorOf = (view) => COLORS[view] ?? "#9fb2ff";
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const wrap = (text, max) => {
  const out = []; let cur = "";
  for (const w of String(text).split(" ")) { if ((cur + " " + w).trim().length > max && cur) { out.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }
  if (cur) out.push(cur);
  return out.length > 3 ? [...out.slice(0, 2), out.slice(2).join(" ").slice(0, max - 1) + "…"] : out;
};
const CSS = `
:host{display:block;color:#e4eef6;font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;margin:0 0 20px}
.wrap{display:grid;grid-template-columns:minmax(0,1fr) 340px;background:#07131f;border-radius:18px;overflow:hidden;min-height:640px}
.stage{position:relative;min-width:0;height:640px;touch-action:none}
svg{display:block;width:100%;height:100%;cursor:grab;user-select:none}
.tools{position:absolute;left:12px;top:12px;right:60px;display:flex;flex-wrap:wrap;gap:6px}
.sys{display:inline-flex;align-items:center;gap:7px;font:inherit;font-size:13px;padding:5px 11px;border-radius:999px;border:1px solid #2c5878;background:#0c1d2e;color:#e4eef6;cursor:pointer}
.sys i{width:10px;height:10px;border-radius:50%}
.sys[aria-pressed=false]{opacity:.45}.sys[aria-pressed=false] i{background:transparent!important;border:1.5px solid #8fa9bf}
.zoom{position:absolute;right:12px;bottom:12px;display:flex;flex-direction:column;gap:6px}
.zoom button{width:38px;height:38px;border-radius:10px;border:1px solid #2c5878;background:#0c1d2e;color:#e4eef6;font-size:19px;cursor:pointer}
.lod{position:absolute;left:12px;bottom:12px;font:11px ui-monospace,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;color:#8fa9bf;background:#07131fcc;padding:5px 9px;border-radius:7px}
.lod b{color:#38d9b4;font-weight:500}
button:focus-visible{outline:2px solid #7fb8ff;outline-offset:2px}
.rail{background:#0c1d2e;border-left:1px solid #2c5878;padding:18px 20px 24px;overflow:auto;max-height:640px;display:flex;flex-direction:column;gap:16px;min-width:0}
.eyebrow{font:11px ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:#8fa9bf}
h2{font-size:23px;line-height:1.2;margin:4px 0 0;text-wrap:balance}
h3{font-size:12px;font-weight:600;margin:0 0 7px;color:#8fa9bf;letter-spacing:.05em;text-transform:uppercase}
p{margin:0}.dim{color:#8fa9bf;font-size:13px}
ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px}
li button{all:unset;box-sizing:border-box;width:100%;cursor:pointer;display:grid;grid-template-columns:10px minmax(0,1fr) auto;gap:9px;align-items:center;padding:6px 8px;border-radius:7px}
li button:hover,li button:focus-visible{background:#12304a}
.dot{width:9px;height:9px;border-radius:50%}
.t{min-width:0;overflow-wrap:anywhere}.c{font:12px ui-monospace,Menlo,monospace;color:#8fa9bf;text-align:right}
.flow{font-size:14px}.flow .c{display:block;text-align:left}
.vital{border:1px solid #2c5878;border-radius:10px;padding:9px 11px}
.vital .n{font:22px ui-monospace,Menlo,monospace;color:#38d9b4}
.crumbs{display:flex;flex-wrap:wrap;gap:6px;font-size:13px}.crumbs button{all:unset;cursor:pointer;color:#7fb8ff}
.hull{fill-opacity:.09;stroke-width:2;stroke-opacity:.7;cursor:pointer}.hull:hover,.hull.sel{fill-opacity:.17}
.sysname{font-weight:700;text-anchor:middle;pointer-events:none;paint-order:stroke;stroke:#07131f;stroke-width:calc(5px / var(--k,1));font-size:calc(22px / var(--k,1))}
.link{fill:none;stroke-linecap:round}.link.unmeasured{stroke-dasharray:5 6}
.node circle.core{stroke:#07131f;stroke-width:2;cursor:pointer}.node.sel circle.core,.node:hover circle.core{stroke:#7fb8ff;stroke-width:3}
.node .ring{fill:none;stroke:#38d9b4;stroke-width:2;opacity:.7}
.node text{pointer-events:none;text-anchor:middle;paint-order:stroke;stroke:#07131f;stroke-width:calc(4px / var(--k,1))}
.node .name{font-weight:600;font-size:calc(12px / var(--k,1));fill:#e4eef6}.node .count{font-family:ui-monospace,Menlo,monospace;font-size:calc(12px / var(--k,1));fill:#38d9b4}
.sat circle{stroke:#07131f;stroke-width:.6;cursor:pointer}.sat text{font-size:3.4px;fill:#e4eef6;text-anchor:middle;pointer-events:none}
.flowlabel{font-size:calc(11px / var(--k,1));fill:#8fa9bf;text-anchor:middle;pointer-events:none;paint-order:stroke;stroke:#07131f;stroke-width:calc(3px / var(--k,1))}
svg.z1 :is(.lz2,.lz3):not(.lz1),svg.z2 :is(.lz1,.lz3):not(.lz2),svg.z3 :is(.lz1,.lz2):not(.lz3){display:none}
@media (max-width:820px){.wrap{grid-template-columns:minmax(0,1fr)}.stage{height:62vh}.rail{border-left:0;border-top:1px solid #2c5878;max-height:none}}
`;

class GroundworkLivingAtlas extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this.map = null; this.selected = null; }
  set projection(data) {
    this.stop();
    this.map = data ? buildLivingMap(data) : null;
    this.selected = null;
    this.hidden = !this.map;
    if (this.map) this.draw(); else this.shadowRoot.innerHTML = "";
  }
  disconnectedCallback() { this.stop(); }
  stop() { this.sim?.stop(); this.timer?.stop(); this.resize?.disconnect(); }

  draw() {
    const d3 = window.d3;
    if (!d3) { this.shadowRoot.innerHTML = `<style>${CSS}</style><p class="dim">The map library did not load. Reload the page.</p>`; return; }
    const m = this.map, root = this.shadowRoot;
    root.innerHTML = `<style>${CSS}</style><div class="wrap"><div class="stage"><svg role="img" aria-label="The business's systems, parts and the flows between them"></svg>
      <div class="tools"></div><div class="zoom"><button data-z="in" aria-label="Zoom in">+</button><button data-z="out" aria-label="Zoom out">−</button><button data-z="home" aria-label="Show everything">⌂</button></div>
      <div class="lod">Zoom <b>Systems</b></div></div><aside class="rail" aria-live="polite"></aside></div>`;
    const stage = root.querySelector(".stage"), svg = d3.select(root.querySelector("svg")), rail = root.querySelector(".rail");
    const viewKeys = m.views.map((v) => v.key), viewName = Object.fromEntries(m.views.map((v) => [v.key, v.name]));
    const present = viewKeys.filter((k) => m.parts.some((p) => p.home === k));
    const storeKey = "living-atlas." + (m.parts[0]?.id ?? "map");
    let active = new Set(store.get(storeKey + ".views", present).filter((k) => present.includes(k)));
    if (!active.size) active = new Set(present);
    const pins = store.get(storeKey + ".pins", {});
    const byId = new Map(m.parts.map((p) => [p.id, p]));
    // Line width and particle density compare like with like: each unit (rows, usd, calls…) has its own scale.
    const maxByUnit = {};
    for (const f of m.flows) { const n = numberOf(f.measured); if (n !== null) maxByUnit[f.measured.unit] = Math.max(maxByUnit[f.measured.unit] ?? 0, n); }
    const share = (f) => { const n = numberOf(f.measured); return n === null ? null : n / (maxByUnit[f.measured.unit] || 1); };
    const nodeR = (p) => { const n = numberOf(p.measured); return n === null ? 11 : 13 + 9 * Math.sqrt(n / Math.max(1, ...m.parts.map((x) => numberOf(x.measured) ?? 0))); };

    m.parts.forEach((p, i) => {
      const a = (viewKeys.indexOf(p.home) / viewKeys.length) * Math.PI * 2;
      p.x = pins[p.id]?.x ?? Math.cos(a) * 260 + (i % 4) * 14; p.y = pins[p.id]?.y ?? Math.sin(a) * 200 + (i % 3) * 14;
      p.fx = pins[p.id]?.x ?? null; p.fy = pins[p.id]?.y ?? null;
    });
    const world = svg.append("g");
    const gHull = world.append("g"), gLinks = world.append("g"), gLabels = world.append("g"), gPart = world.append("g"), gNodes = world.append("g"), gNames = world.append("g");
    const lineHull = d3.line().curve(d3.curveCatmullRomClosed.alpha(0.6));
    const sim = (this.sim = d3.forceSimulation()
      .force("link", d3.forceLink().id((d) => d.id).distance((l) => (l.source.home === l.target.home ? 80 : 150)).strength((l) => (l.source.home === l.target.home ? 0.6 : 0.12)))
      .force("charge", d3.forceManyBody().strength(-340))
      .force("collide", d3.forceCollide((d) => nodeR(d) + 22))
      .force("center", d3.forceCenter(0, 0).strength(0.04))
      .force("cluster", (alpha) => { // parts of one system pull together, so each system finds its own outline
        const c = {};
        for (const n of sim.nodes()) { (c[n.home] ||= { x: 0, y: 0, k: 0 }); c[n.home].x += n.x; c[n.home].y += n.y; c[n.home].k++; }
        for (const n of sim.nodes()) { const s = c[n.home]; n.vx += (s.x / s.k - n.x) * alpha * 0.12; n.vy += (s.y / s.k - n.y) * alpha * 0.12; }
      })
      .on("tick", () => tick()));
    // Parallel flows between the same two parts bend apart so each stays visible.
    const pairIndex = new Map();
    for (const f of m.flows) { const k = f.from + ">" + f.to; f.bend = pairIndex.get(k) ?? 0; pairIndex.set(k, f.bend + 1); }
    const ctrl = (l) => {
      const dx = l.target.x - l.source.x, dy = l.target.y - l.source.y, k = 0.15 + l.bend * 0.12;
      return { mx: (l.source.x + l.target.x) / 2 - dy * k, my: (l.source.y + l.target.y) / 2 + dx * k };
    };
    let nodes = [], links = [], particles = [];

    const build = () => {
      nodes = m.parts.filter((p) => active.has(p.home));
      const ids = new Set(nodes.map((n) => n.id));
      links = m.flows.filter((f) => ids.has(f.from) && ids.has(f.to)).map((f) => ({ ...f, source: f.from, target: f.to }));
      sim.nodes(nodes); sim.force("link").links(links);
      gLinks.selectAll("path").data(links, (d) => d.id).join("path")
        .attr("class", (d) => "link" + (share(d) === null ? " unmeasured" : ""))
        .attr("stroke", (d) => colorOf(d.view)).attr("stroke-opacity", (d) => (d.type === "transfers" ? 0.6 : 0.3))
        .attr("stroke-width", (d) => (share(d) === null ? 1.6 : 1.5 + 12 * share(d)));
      gLabels.selectAll("text").data(links, (d) => d.id).join("text").attr("class", "flowlabel lz2 lz3")
        .text((d) => (valueOf(d.measured) ? `${d.item} · ${valueOf(d.measured)}` : d.item));
      gNodes.selectAll("g.node").data(nodes, (d) => d.id).join((e) => {
        const g = e.append("g").attr("class", "node").attr("tabindex", 0).attr("role", "button").attr("aria-label", (d) => d.name);
        g.append("circle").attr("class", "ring").attr("r", (d) => nodeR(d) + 5).attr("display", (d) => (valueOf(d.measured) ? null : "none"));
        g.append("circle").attr("class", "core").attr("r", nodeR).attr("fill", (d) => colorOf(d.home)).attr("fill-opacity", (d) => (valueOf(d.measured) ? 0.95 : 0.55));
        g.append("text").attr("class", "name lz2 lz3").attr("dy", (d) => nodeR(d) + 14).text((d) => d.name);
        g.append("text").attr("class", "count lz2 lz3").attr("dy", (d) => nodeR(d) + 30).text((d) => valueOf(d.measured) ?? "");
        g.append("g").attr("class", "lz3").each(function (d) {
          const R = nodeR(d) + 34;
          d.cards.forEach((c, i) => {
            const a = Math.PI / 2 + (i - (d.cards.length - 1) / 2) * 0.62;
            const s = d3.select(this).append("g").attr("class", "sat").attr("data-card", i).attr("transform", `translate(${Math.cos(a) * R},${Math.sin(a) * R})`);
            s.append("circle").attr("r", 3.6).attr("fill", STATUS[c.status] ?? "#6f8aa3");
            wrap(c.title, 24).forEach((ln, j) => s.append("text").attr("y", 7 + j * 4).text(ln));
          });
        });
        g.on("click", (ev, d) => { ev.stopPropagation(); const s = ev.target.closest?.(".sat"); select({ type: "part", id: d.id, card: s ? +s.dataset.card : null }); })
          .on("keydown", (ev, d) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); select({ type: "part", id: d.id }); } })
          .call(d3.drag()
            .on("start", (ev, d) => { if (!ev.active) sim.alphaTarget(0.25).restart(); d.fx = d.x; d.fy = d.y; })
            .on("drag", (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
            .on("end", (ev, d) => { if (!ev.active) sim.alphaTarget(0); pins[d.id] = { x: d.fx, y: d.fy }; store.set(storeKey + ".pins", pins); render(); }));
        return g;
      });
      const on = present.filter((k) => active.has(k));
      gHull.selectAll("path").data(on, (k) => k).join("path").attr("class", "hull").attr("fill", colorOf).attr("stroke", colorOf)
        .on("click", (ev, k) => { ev.stopPropagation(); select({ type: "view", id: k }); });
      gNames.selectAll("text").data(on, (k) => k).join("text").attr("class", "sysname lz1 lz2").attr("fill", colorOf).text((k) => viewName[k]);
      particles = [];
      for (const l of links) if (l.type === "transfers") { const s = share(l), n = s === null ? 2 : Math.max(2, Math.round(2 + s * 10)); for (let i = 0; i < n; i++) particles.push({ l, t: i / n, measured: s !== null }); }
      gPart.selectAll("circle").data(particles).join("circle").attr("r", (d) => (d.measured ? 2.6 : 1.8)).attr("fill", (d) => colorOf(d.l.view)).attr("opacity", (d) => (d.measured ? 0.95 : 0.5)).attr("pointer-events", "none");
      sim.alpha(0.8).restart();
    };
    const tick = () => {
      gLinks.selectAll("path").attr("d", (d) => { const { mx, my } = ctrl(d); return `M${d.source.x},${d.source.y} Q${mx},${my} ${d.target.x},${d.target.y}`; });
      gLabels.selectAll("text").attr("x", (d) => (d.source.x + 2 * ctrl(d).mx + d.target.x) / 4).attr("y", (d) => (d.source.y + 2 * ctrl(d).my + d.target.y) / 4 - 4);
      gNodes.selectAll("g.node").attr("transform", (d) => `translate(${d.x},${d.y})`);
      const groups = d3.group(nodes, (n) => n.home);
      gHull.selectAll("path").attr("d", (k) => {
        const pts = [];
        for (const n of groups.get(k) ?? []) { const r = nodeR(n) + 34; for (let a = 0; a < 8; a++) pts.push([n.x + Math.cos((a / 8) * Math.PI * 2) * r, n.y + Math.sin((a / 8) * Math.PI * 2) * r]); }
        const h = d3.polygonHull(pts); return h ? lineHull(h) : null;
      });
      gNames.selectAll("text").each(function (k) {
        const ns = groups.get(k) ?? []; if (!ns.length) return;
        d3.select(this).attr("x", d3.mean(ns, (n) => n.x)).attr("y", d3.min(ns, (n) => n.y - nodeR(n)) - 44);
      });
    };
    if (!reduced()) this.timer = d3.timer(() => {
      gPart.selectAll("circle").each(function (d) {
        d.t = (d.t + 0.004) % 1; const l = d.l, { mx, my } = ctrl(l), t = d.t, u = 1 - t;
        this.setAttribute("cx", u * u * l.source.x + 2 * u * t * mx + t * t * l.target.x);
        this.setAttribute("cy", u * u * l.source.y + 2 * u * t * my + t * t * l.target.y);
      });
    });

    const lod = root.querySelector(".lod");
    const zoom = d3.zoom().scaleExtent([0.25, 9]).on("zoom", (ev) => {
      world.attr("transform", ev.transform);
      root.host.style.setProperty("--k", ev.transform.k);
      const z = ev.transform.k < 0.75 ? 1 : ev.transform.k < 2.2 ? 2 : 3;
      svg.attr("class", "z" + z);
      lod.innerHTML = "Zoom <b>" + ["Systems", "Parts and flows", "Improvement work"][z - 1] + "</b>";
    });
    svg.call(zoom).on("dblclick.zoom", null).on("click", () => select(null));
    const fit = (ns, pad = 80, ms = 700, maxK = 9) => {
      const r = stage.getBoundingClientRect(); if (!ns.length || !r.width) return;
      const [x0, x1] = d3.extent(ns, (n) => n.x), [y0, y1] = d3.extent(ns, (n) => n.y);
      const k = Math.min(maxK, r.width / (x1 - x0 + pad * 2), r.height / (y1 - y0 + pad * 2));
      svg.transition().duration(reduced() ? 0 : ms).call(zoom.transform, d3.zoomIdentity.translate(r.width / 2, r.height / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2));
    };
    root.querySelector(".zoom").onclick = (e) => {
      const z = e.target.closest("button")?.dataset.z;
      if (z === "in") svg.transition().duration(300).call(zoom.scaleBy, 1.6);
      if (z === "out") svg.transition().duration(300).call(zoom.scaleBy, 1 / 1.6);
      if (z === "home") select(null);
    };
    const tools = root.querySelector(".tools");
    const renderTools = () => {
      tools.innerHTML = present.map((k) => `<button class="sys" data-k="${safe(k)}" aria-pressed="${active.has(k)}"><i style="background:${colorOf(k)}"></i>${safe(viewName[k])}</button>`).join("");
      tools.querySelectorAll(".sys").forEach((b) => (b.onclick = () => {
        const k = b.dataset.k; if (active.has(k)) { if (active.size > 1) active.delete(k); } else active.add(k);
        store.set(storeKey + ".views", [...active]);
        if (this.selected && !active.has(this.selected.type === "view" ? this.selected.id : byId.get(this.selected.id)?.home)) this.selected = null;
        renderTools(); build(); render(); setTimeout(() => fit(nodes), 900);
      }));
    };
    const select = (sel) => {
      this.selected = sel;
      gNodes.selectAll("g.node").classed("sel", (d) => sel?.type === "part" && sel.id === d.id);
      gHull.selectAll("path").classed("sel", (k) => sel?.type === "view" && sel.id === k);
      if (!sel) fit(nodes); else if (sel.type === "view") fit(nodes.filter((n) => n.home === sel.id), 90); else fit([byId.get(sel.id)], 70, 700, 3.4);
      render();
    };
    const flowRow = (f) => `<li class="flow"><b>${safe(byId.get(f.from)?.name)}</b> → <b>${safe(byId.get(f.to)?.name)}</b><span class="c">${safe(f.item)}${valueOf(f.measured) ? " · " + valueOf(f.measured) : f.declared ? " · not measured" : ""}</span></li>`;
    const gapsOf = (o) => (o?.gaps?.length ? `<p class="dim">${o.gaps.map(safe).join(" ")}</p>` : "");
    const render = () => {
      const sel = this.selected;
      const crumbs = [`<button data-go="">${safe("Whole business")}</button>`];
      if (sel?.type === "view") crumbs.push(safe(viewName[sel.id]));
      if (sel?.type === "part") { const p = byId.get(sel.id); crumbs.push(`<button data-go="view:${safe(p.home)}">${safe(viewName[p.home])}</button>`, safe(p.name)); }
      const head = `<nav class="crumbs">${crumbs.join(" › ")}</nav>`;
      if (sel?.type === "part") {
        const p = byId.get(sel.id), ins = m.flows.filter((f) => f.to === p.id), outs = m.flows.filter((f) => f.from === p.id), card = sel.card != null ? p.cards[sel.card] : null;
        rail.innerHTML = `${head}<div><div class="eyebrow" style="color:${colorOf(p.home)}">${safe(p.views.map((v) => viewName[v]).join(" · "))}</div><h2>${safe(p.name)}</h2></div>
          ${p.description ? `<p>${safe(p.description)}</p>` : ""}
          ${valueOf(p.measured) ? `<div class="vital"><div class="n">${valueOf(p.measured)}</div><div class="dim">${safe(p.measured.name)} · ${safe(p.measured.window?.from)} to ${safe(p.measured.window?.to)}</div></div>${gapsOf(p.measured)}` : ""}
          ${card ? `<div><h3>Selected improvement</h3><p><b>${safe(card.title)}</b></p><p class="dim">${safe(card.status)}</p></div>` : ""}
          <div><h3>Flows in</h3><ul>${ins.map(flowRow).join("") || '<li class="dim">None recorded</li>'}</ul></div>
          <div><h3>Flows out</h3><ul>${outs.map(flowRow).join("") || '<li class="dim">None recorded</li>'}</ul></div>
          <div><h3>Improvement work here</h3><ul>${p.cards.map((c) => `<li><span class="t"><span class="dot" style="display:inline-block;background:${STATUS[c.status] ?? "#6f8aa3"}"></span> ${safe(c.title)}</span> <span class="c">${safe(c.status)}</span></li>`).join("") || '<li class="dim">None yet</li>'}</ul></div>
          ${pins[p.id] ? '<button class="sys" data-unpin="1">Let this part float again</button>' : ""}`;
      } else if (sel?.type === "view") {
        const ps = m.parts.filter((p) => p.home === sel.id), ids = new Set(ps.map((p) => p.id)), v = m.views.find((x) => x.key === sel.id);
        rail.innerHTML = `${head}<div><div class="eyebrow" style="color:${colorOf(sel.id)}">System</div><h2>${safe(v.name)}</h2></div><p class="dim">${safe(v.question)}</p>
          <div><h3>Flows inside</h3><ul>${m.flows.filter((f) => ids.has(f.from) && ids.has(f.to)).map(flowRow).join("") || '<li class="dim">None recorded</li>'}</ul></div>
          <div><h3>Connections to other systems</h3><ul>${m.flows.filter((f) => ids.has(f.from) !== ids.has(f.to)).map(flowRow).join("") || '<li class="dim">None recorded</li>'}</ul></div>
          <div><h3>Parts</h3><ul>${ps.map((p) => `<li><button data-part="${safe(p.id)}"><span class="dot" style="background:${colorOf(p.home)}"></span><span class="t">${safe(p.name)}</span><span class="c">${valueOf(p.measured) ?? ""}</span></button></li>`).join("")}</ul></div>`;
      } else {
        const measured = m.flows.filter((f) => valueOf(f.measured)).length, declared = m.flows.filter((f) => f.declared).length;
        rail.innerHTML = `${head}<div><div class="eyebrow">Living Atlas</div><h2>Systems, parts and flows</h2></div>
          <p>${m.parts.length} parts and ${m.flows.length} flows. Nothing here has a fixed shape: each part is pulled by the parts it exchanges with, and a system's outline is wherever its parts settle.</p>
          <p class="dim">Turn systems on and off above the map to watch the shape change. Drag a part to move it; it stays where you leave it on this device.</p>
          <p class="dim">${m.status === "available" ? `${measured} of ${declared} measurable flows have live numbers. Solid, thicker lines carry more; dashed lines are not measured.` : "Live numbers are not switched on for you in this workspace, so every flow is dashed."}</p>
          <div><h3>Systems</h3><ul>${present.map((k) => `<li><button data-view="${safe(k)}"><span class="dot" style="background:${colorOf(k)}"></span><span class="t">${safe(viewName[k])}</span><span class="c">${m.parts.filter((p) => p.home === k).length} parts</span></button></li>`).join("")}</ul></div>
          ${Object.keys(pins).length ? '<button class="sys" data-unpin="all">Let every part float again</button>' : ""}
          <p class="dim">A drawing is one layout of the map, not the business's shape; compare volumes and ratios, not positions.</p>`;
      }
      rail.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => { const g = b.dataset.go; select(g ? { type: "view", id: g.slice(5) } : null); }));
      rail.querySelectorAll("[data-view]").forEach((b) => (b.onclick = () => select({ type: "view", id: b.dataset.view })));
      rail.querySelectorAll("[data-part]").forEach((b) => (b.onclick = () => select({ type: "part", id: b.dataset.part })));
      rail.querySelectorAll("[data-unpin]").forEach((b) => (b.onclick = () => {
        const all = b.dataset.unpin === "all";
        for (const p of m.parts) if (all || p.id === sel?.id) { delete pins[p.id]; p.fx = p.fy = null; }
        store.set(storeKey + ".pins", pins); sim.alpha(0.6).restart(); render();
      }));
    };
    renderTools(); build();
    sim.stop(); for (let i = 0; i < 320; i++) sim.tick(); tick(); render();
    requestAnimationFrame(() => fit(nodes, 80, 0));
    sim.alpha(0.05).restart();
    this.resize = new ResizeObserver(() => { if (!this.selected) fit(nodes, 80, 0); });
    this.resize.observe(stage);
  }
}
customElements.define("groundwork-living-atlas", GroundworkLivingAtlas);
