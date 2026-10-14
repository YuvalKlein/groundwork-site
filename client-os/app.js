import './improvement-view.js';
import {captureMagicLink, verifyMagicLink, SESSION_KEY} from './auth.js';
const config=window.GROUNDWORK_CONFIG,el=document.querySelector('groundwork-improvement'),err=document.querySelector('#error');
let token='',workspace='';
const report=e=>{err.textContent=e.message||String(e);};
async function api(path,options={}){
 if(!config?.apiBase)throw new Error('The shared backend connection has not been configured.');
 const r=await fetch(config.apiBase.replace(/\/$/,'')+path,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...options.headers},cache:'no-store'});
 const body=await r.json().catch(()=>({message:'Backend unavailable'}));if(r.status===401){token='';sessionStorage.removeItem(SESSION_KEY);document.querySelector('#login').hidden=false;document.querySelector('#logout').hidden=true;document.querySelector('#picker').hidden=true;el.board=null;}if(!r.ok)throw new Error(Array.isArray(body.message)?body.message.join('\n'):body.message||'Request failed');return body;
}
async function load(){el.board=await api('/projects/improvement/workspaces/'+workspace);}
async function start(){
 const workspaces=await api('/projects/improvement/workspaces');
 document.querySelector('#login').hidden=true;document.querySelector('#logout').hidden=false;document.querySelector('#picker').hidden=false;
 const select=document.querySelector('#workspaces');select.replaceChildren(...workspaces.map(w=>new Option(w.name,w.id)));
 if(!workspaces.length){err.textContent='No workspace has been granted to this account yet.';return;}
 workspace=workspaces[0].id;select.onchange=()=>{workspace=select.value;load().catch(report);};await load();
}
document.querySelector('#login').onsubmit=async e=>{e.preventDefault();try{await api('/platform/auth/magic-link',{method:'POST',body:JSON.stringify({email:new FormData(e.target).get('email'),app_slug:config.appSlug})});err.textContent='Check your email for your sign-in link.';}catch(e){report(e);}};
document.querySelector('#logout').onclick=()=>{sessionStorage.removeItem('groundwork-session');location.reload();};
el.addEventListener('refresh',()=>load().catch(report));
el.addEventListener('save',async({detail:d})=>{try{await api('/projects/improvement/workspaces/'+workspace+'/nodes'+(d.id?'/'+d.id:''),{method:d.id?'PUT':'POST',body:JSON.stringify(d.body)});d.done();await load();}catch(e){d.done(e.message);}});
// Proposals, approval, comments, archive: the bundle names a path under the workspace; the backend enforces who may do what.
el.addEventListener('request',async({detail:d})=>{try{d.done(null,await api('/projects/improvement/workspaces/'+workspace+d.path,{method:d.method,...(d.body!==undefined?{body:JSON.stringify(d.body)}:{})}));}catch(e){d.done(e.message);}});
el.addEventListener('settings',async({detail:d})=>{try{await api('/projects/improvement/workspaces/'+workspace+'/settings',{method:'PATCH',body:JSON.stringify(d.body)});d.done();await load();}catch(e){d.done(e.message);}});
el.addEventListener('history',async({detail:d})=>{try{const rows=await api('/projects/improvement/workspaces/'+workspace+'/nodes/'+d.id+'/events');d.target.textContent=rows.map(r=>r.created_at+' · '+r.event_type+' · '+(r.metadata.actor||'Historical backfill')+'\n'+JSON.stringify(r.metadata.after?.cycle||{})).join('\n\n');d.target.className='pre';}catch(e){report(e);}});
(async()=>{try{
 const search=window.groundworkCallback;delete window.groundworkCallback;
 const magic=captureMagicLink({search,pathname:location.pathname},history);
 if(magic){
  sessionStorage.removeItem(SESSION_KEY);
  token=await verifyMagicLink(magic,config);
  sessionStorage.setItem(SESSION_KEY,token);
 }else token=sessionStorage.getItem(SESSION_KEY)||'';
 if(token)await start();
}catch(e){report(e);}})();
