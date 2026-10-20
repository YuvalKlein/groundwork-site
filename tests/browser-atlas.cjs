const { chromium } = require("playwright");
const http = require("http"),
  fs = require("fs"),
  path = require("path"),
  assert = require("assert/strict");
const root = path.resolve(__dirname, "..");
const server = http.createServer((req, res) => {
  const file = path.join(
    root,
    req.url.split("?")[0],
    req.url.endsWith("/") ? "index.html" : "",
  );
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  try {
    res.setHeader(
      "Content-Type",
      file.endsWith(".html")
        ? "text/html"
        : file.endsWith(".js") || file.endsWith(".mjs")
          ? "text/javascript"
          : "text/plain",
    );
    res.end(fs.readFileSync(file));
  } catch {
    res.writeHead(404).end();
  }
});
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({
    ...(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {}),
    headless: true,
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const entities = Array.from({ length: 24 }, (_, i) => ({
      id: "e" + i,
      name: i === 0 ? "Intake <script>unsafe</script>" : "Process " + i,
      entity_type: i % 2 ? "Resource" : "Process",
      model_revision: "v0.1.1",
      schema_version: "0.1",
      record_version: 2,
      properties: { description: "Synthetic only" },
      provenance: { source: "fixture", status: "DOCUMENTED" },
      gaps: ["No observed metric"],
    }));
    const plate = {
      workspace: { id: "a", name: "Synthetic workspace" },
      entities,
      relationships: [
        {
          origin_entity_id: "e0",
          target_entity_id: "e1",
          type: "depends_on",
          provenance: { source: "fixture" },
        },
        { origin_entity_id: "e0", target_id: "missing", type: "produces" },
      ],
      unknowns: [{ question: "Synthetic research gap" }],
      sources: [],
    };
    let mode = "ok",
      calls = [];
    await page.route("**/client-os/config.js", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `window.GROUNDWORK_CONFIG={apiBase:'${origin}/api/v1',appSlug:'groundwork'}`,
      }),
    );
    await page.route("**/api/v1/**", async (r) => {
      const url = r.request().url();
      calls.push(url);
      if (url.endsWith("/workspaces"))
        return r.fulfill({
          json: [
            { id: "a", name: "A" },
            { id: "b", name: "B" },
          ],
        });
      if (url.endsWith("/agreements")) return r.fulfill({ json: [] });
      if (url.endsWith("/overview"))
        return r.fulfill({ status: 403, json: { message: "not admin" } });
      if (url.endsWith("/atlas"))
        return mode === "ok"
          ? r.fulfill({ json: plate })
          : r.fulfill({
              status: mode === "fallback" ? 404 : 403,
              json: { message: "denied" },
            });
      return r.fulfill({
        json: {
          workspace: { id: "a", name: "A" },
          role: "reader",
          anatomy: entities.map((e, i) => ({
            ...e,
            relationships: i === 0 ? plate.relationships : [],
          })),
          nodes: [],
          pipeline: [],
          templates: [],
          research_findings: [],
        },
      });
    });
    await page.goto(origin + "/atlas/");
    assert.equal(calls.length, 0);
    await page.evaluate(() =>
      sessionStorage.setItem("groundwork-session", "synthetic"),
    );
    await page.reload();
    await page.locator("groundwork-atlas svg g").first().waitFor();
    assert.equal(await page.locator("groundwork-atlas svg g").count(), 24);
    assert.equal(await page.locator("groundwork-atlas svg line").count(), 1);
    await page.locator("groundwork-atlas svg g").first().focus();
    await page.keyboard.press("Enter");
    assert.match(
      await page.locator("groundwork-atlas .detail").innerText(),
      /Intake <script>unsafe<\/script>/,
    );
    await page.locator("groundwork-atlas summary").click();
    assert.match(
      await page.locator("groundwork-atlas pre").innerText(),
      /DOCUMENTED/,
    );
    assert.equal(await page.locator("groundwork-atlas script").count(), 0);
    await page
      .locator("groundwork-atlas li")
      .filter({ hasText: "Synthetic research gap" })
      .waitFor();
    await page.locator('groundwork-atlas [data-mode="cards"]').click();
    assert.equal(
      await page.locator("groundwork-atlas .grid:visible button").count(),
      24,
    );
    await page.locator('groundwork-atlas [data-layer="Resource"]').uncheck();
    assert.equal(
      await page.locator("groundwork-atlas .grid:visible button").count(),
      12,
    );
    mode = "fallback";
    await page.locator("#refresh").click();
    await page.getByText(/Compatibility view/).waitFor();
    mode = "denied";
    await page.locator("#refresh").click();
    await page.locator("#summary").filter({ hasText: "403" }).waitFor();
    assert.equal(await page.locator("groundwork-atlas [data-id]").count(), 0);
    mode = "ok";
    await page.goto(origin + "/client-os/");
    await page.locator("#show-atlas").waitFor();
    await page.locator("#show-atlas").click();
    await page.locator("groundwork-atlas svg g").first().waitFor();
    assert.equal(
      await page.locator("groundwork-improvement").isVisible(),
      false,
    );
    await page.locator("#show-board").click();
    assert.equal(
      await page.locator("groundwork-improvement").isVisible(),
      true,
    );
    await page.locator("#show-atlas").click();
    mode = "denied";
    await page.locator("#workspaces").selectOption("b");
    await page.waitForFunction(
      () => document.querySelector("#error").textContent.length > 0,
    );
    assert.equal(await page.locator("#error").textContent(), "denied");
    assert.equal(await page.locator("groundwork-atlas [data-id]").count(), 0);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: browser anonymous access, map/cards, 24-node height, keyboard selection, escaped text, object provenance, research gaps, filters, 404 fallback, 403 clearing, embedded board switching. Synthetic fixture only.",
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  server.close();
  process.exitCode = 1;
});
