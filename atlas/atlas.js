import "../client-os/atlas-view.js";
import { readAtlas } from "../client-os/atlas-data.mjs";
const config = window.GROUNDWORK_CONFIG,
  session = sessionStorage.getItem("groundwork-session");
const status = document.querySelector("#summary"),
  workspaces = document.querySelector("#workspaces"),
  atlas = document.querySelector("groundwork-atlas");
let loadVersion = 0;
async function read(path) {
  const res = await fetch(config.apiBase.replace(/\/$/, "") + path, {
    headers: { Authorization: "Bearer " + session },
    cache: "no-store",
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  if (!res.ok) {
    const error = new Error(
      "API request failed (" +
        res.status +
        "). Sign in from the workspace board.",
    );
    error.status = res.status;
    throw error;
  }
  return res.json();
}
if (!session || !config?.apiBase) {
  status.textContent = "Sign in on the workspace board first.";
} else boot().catch((e) => (status.textContent = e.message));
async function boot() {
  const rows = await read("/projects/improvement/workspaces");
  workspaces.replaceChildren(...rows.map((w) => new Option(w.name, w.id)));
  if (!rows.length) {
    status.textContent = "No authorized workspaces.";
    return;
  }
  workspaces.onchange = load;
  document.querySelector("#refresh").onclick = load;
  await load();
}
async function load() {
  const version = ++loadVersion;
  atlas.projection = null;
  status.textContent = "Loading workspace…";
  try {
    const data = await readAtlas(read, workspaces.value);
    if (version !== loadVersion) return;
    atlas.projection = data;
    status.textContent =
      "Current authorized records loaded. Observation freshness is supplied only where recorded.";
  } catch (error) {
    if (version === loadVersion) status.textContent = error.message;
  }
}
