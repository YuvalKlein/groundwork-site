import './improvement-view.js';
const config=window.GROUNDWORK_CONFIG,el=document.querySelector('groundwork-improvement'),err=document.querySelector('#error');
let token=sessionStorage.getItem('groundwork-session')||'',workspace='';
const report=e=>{err.textContent=e.message||String(e);};
async function api(path,options={}){
 if(!config?.apiBase)throw new Error('The shared backend connection has not been configured.');
 const r=await fetch(config.apiBase.replace(/\/$/,'')+path,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...options.headers},cache:'no-store'});
 const body=await r.json().catch(()=>({message:'Backend unavailable'}));if(!r.ok)throw new Error(Array.isArray(body.message)?body.message.join('\n'):body.message||'Request failed');return body;
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
el.addEventListener('settings',async({detail:d})=>{try{await api('/projects/improvement/workspaces/'+workspace+'/settings',{method:'PATCH',body:JSON.stringify(d.body)});d.done();await load();}catch(e){d.done(e.message);}});
el.addEventListener('history',async({detail:d})=>{try{const rows=await api('/projects/improvement/workspaces/'+workspace+'/nodes/'+d.id+'/events');d.target.textContent=rows.map(r=>r.created_at+' · '+r.event_type+' · '+(r.metadata.actor||'Historical backfill')+'\n'+JSON.stringify(r.metadata.after?.cycle||{})).join('\n\n');d.target.className='pre';}catch(e){report(e);}});
(async()=>{try{const url=new URL(location.href),magic=url.searchParams.get('token');if(magic){history.replaceState(null,'',location.pathname);const result=await api('/platform/auth/magic-link/verify',{method:'POST',body:JSON.stringify({token:magic,app_slug:config.appSlug})});token=result.access_token||result.data?.access_token;if(!token)throw new Error('Sign-in did not return an access token');sessionStorage.setItem('groundwork-session',token);}if(token)await start();}catch(e){report(e);}})();
