// Shared client for the existing UNITISM authentication endpoints.
export const SESSION_KEY = 'groundwork-session';
export function captureMagicLink(location, history) {
  const query = new URLSearchParams(location.search);
  const present = query.has('token') || query.has('app_slug');
  if (!present) return null;
  // Scrub before validation, storage access, imports or network requests.
  history.replaceState(null, '', location.pathname);
  if (query.getAll('token').length !== 1 || !query.get('token') ||
      query.getAll('app_slug').length !== 1 || query.get('app_slug') !== 'groundwork') {
    throw new Error('Invalid sign-in link. Request a new Groundwork link.');
  }
  return query.get('token');
}
export async function verifyMagicLink(magic, config, fetcher = fetch) {
  if (!config?.apiBase || config.appSlug !== 'groundwork') {
    throw new Error('The shared backend connection has not been configured.');
  }
  const response = await fetcher(config.apiBase.replace(/\/$/, '') + '/platform/auth/magic-link/verify', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({token: magic, app_slug: 'groundwork'}),
    credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', redirect: 'error'
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('This sign-in link is invalid or expired. Request a new link.');
  const accessToken = result.access_token || result.data?.access_token;
  if (typeof accessToken !== 'string' || !accessToken.trim()) throw new Error('Sign-in did not return an access token.');
  return accessToken;
}
