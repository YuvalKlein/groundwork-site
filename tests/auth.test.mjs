import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
const source = readFileSync('client-os/auth.js', 'utf8');
const {captureMagicLink, verifyMagicLink} = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const config = {apiBase: 'https://api.example.test/api/v1', appSlug: 'groundwork'};
test('scrub before rejecting malformed or cross-app input', () => {
  for (const search of ['?token=secret&app_slug=lobby','?token=secret','?token=a&token=b&app_slug=groundwork','?token=&app_slug=groundwork','?app_slug=groundwork']) {
    let clean = false;
    assert.throws(() => captureMagicLink({search, pathname:'/auth/verify/'}, {replaceState(a,b,path){assert.equal(path,'/auth/verify/');clean=true;}}));
    assert.equal(clean,true);
  }
});
test('valid callback consumes only the exact Groundwork credential', () => {
  assert.equal(captureMagicLink({search:'?token=secret&app_slug=groundwork',pathname:'/auth/verify'}, {replaceState(){}}), 'secret');
  assert.equal(captureMagicLink({search:''}, {}), null);
});
test('credential only in POST body without old session or redirects', async () => {
  const token = await verifyMagicLink('one-use',config,async (url,options) => {
    assert.equal(url,'https://api.example.test/api/v1/platform/auth/magic-link/verify');
    assert.equal(options.headers.Authorization,undefined);
    assert.deepEqual(JSON.parse(options.body),{token:'one-use',app_slug:'groundwork'});
    assert.equal(options.redirect,'error');assert.equal(options.referrerPolicy,'no-referrer');
    assert.equal(options.credentials,'omit');assert.equal(options.cache,'no-store');
    return {ok:true,json:async()=>({access_token:'session'})};
  });
  assert.equal(token,'session');
});
test('failed, expired, and malformed verification cannot create a session', async () => {
  for(const result of [{ok:false,json:async()=>({})},{ok:true,json:async()=>({})},{ok:true,json:async()=>({access_token:123})}]) await assert.rejects(verifyMagicLink('invalid',config,async()=>result));
  await assert.rejects(verifyMagicLink('secret',{apiBase:''},()=>assert.fail('must not fetch')));
});
test('callback verifies on clean URL, stores only session, redirects without credential', async () => {
  const html=readFileSync('auth/verify/index.html','utf8');
  const scripts=[...html.matchAll(/<script(?: type="module")?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  const values=new Map();let destination;
  const location={search:'?token=secret&app_slug=groundwork',pathname:'/auth/verify/',replace(url){destination=url;}};
  const context=vm.createContext({URLSearchParams,window:{GROUNDWORK_CONFIG:config},location,history:{replaceState(){location.search='';}},sessionStorage:{setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},document:{querySelector:()=>({})},captureMagicLink,SESSION_KEY:'groundwork-session',verifyMagicLink:async(t)=>{assert.equal(location.search,'');assert.equal(t,'secret');return 'jwt';}});
  vm.runInContext(scripts[0],context);
  await vm.runInContext('(async()=>{'+scripts[1].replace(/import .*?;\n/,'')+'})()',context);
  assert.equal(destination,'/client-os/');assert.deepEqual([...values],[['groundwork-session','jwt']]);
  assert.equal(context.window.groundworkCallback,undefined);
});
test('build isolates Preview and refuses Dev API in Production', () => {
  execFileSync(process.execPath,['scripts/build.mjs'],{env:{...process.env,VERCEL_ENV:'preview',GROUNDWORK_API_BASE:''}});
  assert.match(readFileSync('dist/client-os/config.js','utf8'),/unitism-backend-dev.up.railway.app\/api\/v1/);
  execFileSync(process.execPath,['scripts/build.mjs'],{env:{...process.env,VERCEL_ENV:'production',GROUNDWORK_API_BASE:''}});
  assert.match(readFileSync('dist/client-os/config.js','utf8'),/"apiBase":""/);
  assert.throws(()=>execFileSync(process.execPath,['scripts/build.mjs'],{env:{...process.env,VERCEL_ENV:'production',GROUNDWORK_API_BASE:'https://unitism-backend-dev.up.railway.app/api/v1'},stdio:'pipe'}));
});
