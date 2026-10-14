// Language of the page around the board (sign-in, picker, messages). The board itself follows its workspace's locale.
// Order: ?lang=he|en on the link (remembered on this device), else the browser language. Once signed in, the
// workspace's language wins. Elements carry data-i18n with their English text; nothing else on the page is touched.
(function(){
  const HE={
    'GROUNDWORK / Client OS':'GROUNDWORK / מערכת הלקוח','Sign out':'יציאה','Turn improvement into a practice.':'הופכים שיפור להרגל.',
    'Sign in to the workspaces you have been granted.':'היכנסו לסביבות העבודה שקיבלתם אליהן גישה.','Email':'אימייל','Send sign-in link':'שליחת קישור כניסה',
    'Workspace':'סביבת עבודה','Check your email for your sign-in link.':'בדקו את תיבת המייל: שלחנו לכם קישור כניסה.',
    'No workspace has been granted to this account yet.':'לחשבון הזה עדיין לא ניתנה גישה לסביבת עבודה.',
    'Signing in to Groundwork':'נכנסים ל־Groundwork','Opening your workspace…':'פותחים את סביבת העבודה…','Request a new sign-in link':'בקשת קישור כניסה חדש',
    'Invalid sign-in link. Request a new Groundwork link.':'קישור הכניסה אינו תקין. בקשו קישור חדש.',
    'This sign-in link is invalid or expired. Request a new link.':'קישור הכניסה אינו תקין או שפג תוקפו. בקשו קישור חדש.',
    'Sign-in did not return an access token.':'הכניסה לא הושלמה. בקשו קישור חדש.','Sign-in failed. Request a new link.':'הכניסה נכשלה. בקשו קישור חדש.',
  };
  const KEY='groundwork-lang',ok=l=>l==='he'||l==='en';
  const read=k=>{try{return localStorage.getItem(k);}catch{return null;}},write=(k,v)=>{try{localStorage.setItem(k,v);}catch{}};
  const cb=window.groundworkCallback,param=(typeof cb==='string'?new URLSearchParams(cb):cb instanceof URLSearchParams?cb:new URLSearchParams()).get('lang');
  if(ok(param))write(KEY,param);
  let lang=ok(param)?param:ok(read(KEY))?read(KEY):(navigator.language||'').toLowerCase().startsWith('he')?'he':'en';
  const t=s=>lang==='he'&&HE[s]?HE[s]:s;
  function apply(next){
    if(ok(next))lang=next;
    document.documentElement.lang=lang;document.documentElement.dir=lang==='he'?'rtl':'ltr';
    document.querySelectorAll('[data-i18n]').forEach(e=>{e.dataset.en??=e.textContent;e.textContent=t(e.dataset.en);});
  }
  window.groundworkShell={t,apply,get lang(){return lang;}};
  apply();
})();
