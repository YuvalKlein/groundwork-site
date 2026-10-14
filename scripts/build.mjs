import {cpSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
const env = process.env.VERCEL_ENV;
// Public API origins, not secrets. GROUNDWORK_API_BASE still overrides; a local/static build stays unconfigured.
const DEFAULT_API = {preview: 'https://unitism-backend-dev.up.railway.app/api/v1', production: 'https://unitism-backend-production.up.railway.app/api/v1'};
const apiBase = process.env.GROUNDWORK_API_BASE || DEFAULT_API[env] || '';
if (apiBase) {
  const url = new URL(apiBase);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/api/v1') throw new Error('GROUNDWORK_API_BASE must be an HTTPS API origin ending in /api/v1');
  if (env === 'production' && url.hostname === 'unitism-backend-dev.up.railway.app') throw new Error('Production must not use the Dev backend');
}
rmSync('dist', {recursive: true, force: true});
mkdirSync('dist');
for (const path of ['index.html', 'og.png', 'robots.txt', 'sitemap.xml', 'client-os', 'auth', 'system']) cpSync(path, `dist/${path}`, {recursive: true});
writeFileSync('dist/client-os/config.js', `window.GROUNDWORK_CONFIG = ${JSON.stringify({apiBase, appSlug: 'groundwork'})};\n`);
