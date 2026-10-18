/* Groundwork Client OS — shared presentation. Domain rules and calculations live in Unitism. */
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const impactText=i=>i.value===null?'Not quantified':/^[A-Z]{3}$/.test(i.unit||'')&&i.unit!=='USD'?currencyText(i.value,i.unit):i.unit==='fraction of spend'?(i.value*100).toFixed(1)+'% of spend':Number(i.value).toLocaleString(undefined,{maximumFractionDigits:2,minimumFractionDigits:i.unit.startsWith('USD')?2:0})+' '+i.unit;
// Money is in the business's currency (board.workspace.currency). USD keeps its old format exactly; others use Intl.
const currencyText=(n,c)=>{try{return Number(n).toLocaleString('en-US',{style:'currency',currency:c,maximumFractionDigits:Math.abs(n)<100?2:0,minimumFractionDigits:0});}catch{return Number(n).toLocaleString('en-US')+' '+c;}};
const money=(n,unit)=>n===null||n===undefined?'—':unit==='USD'?'$'+Number(n).toLocaleString('en-US',{maximumFractionDigits:Math.abs(n)<100?2:0}):/^[A-Z]{3}$/.test(unit||'')?currencyText(n,unit):unit==='hours'?Number(n).toLocaleString('en-US',{maximumFractionDigits:1})+' h':Number(n).toLocaleString('en-US',{maximumFractionDigits:2})+(unit?' '+unit:'');
const outcomes=['Revenue created','Cost reduced','Hours saved','Conversion','Decision speed','Founder dependency'];
const stages=['Discovered','Prioritized','In Progress','Measuring','Impact'];
const cycle=['Learning','Preparing & Assumptions','Doing','Tracking','Analyzing','Improving','Documenting'];
const kinds=['Opportunity','Task'];
const changes=['Repair','Optimize','Automate','Augment','Transform','Split/Merge','Retire'];
const evidence=['Measured','Estimated','Expected','Not measured / Baseline needed'];
const docKinds=[['plan','Plan'],['meeting','Meeting'],['log','Log'],['report','Report'],['reference','Reference'],['agreement','Agreement'],['other','Other']];
// Board language comes from the workspace (data): `workspace.locale` 'he' renders these labels in Hebrew, right-to-left.
// Templates stay in English; after each render the shadow tree's own labels are swapped by exact text or pattern.
// Anything not listed (people's own text, names, numbers) is left as written. English renders exactly as before.
const HE={
'Map it. Improve it. Measure it. Every cycle.':'ממפים. משפרים. מודדים. בכל מחזור.','Refresh':'רענון','Board language':'שפת הלוח','Close':'סגירה','Cancel':'ביטול','Save':'שמירה','Saved':'נשמר','Edit':'עריכה','Archive':'העברה לארכיון','Restore':'שחזור','Remove':'הסרה','Loading…':'טוען…','Not set':'לא הוגדר','not set':'לא הוגדר','Unknown':'לא ידוע','unknown':'לא ידוע','None':'ללא','None recorded':'לא נרשם',
'Value':'ערך','One-time value':'ערך חד־פעמי','once':'פעם אחת','Monthly recurring':'ערך חודשי חוזר','every month':'כל חודש','Annualized':'בחישוב שנתי','monthly × 12 · run-rate, not money received':'חודשי × 12 · קצב שנתי, לא כסף שהתקבל','Confirmed by the business':'אושר על ידי העסק','Not yet confirmed':'טרם אושר','Nothing quantified yet':'עדיין לא כומת דבר',
'By outcome':'לפי תוצאה','Impact dashboard':'לוח השפעה','Not measured yet':'טרם נמדד','one-time':'חד־פעמי','per month':'לחודש',
'Whose time · value of one hour each':'של מי הזמן · ערך שעה של כל אחד','Released hours are priced at the rate of the person whose time they free. No rate = shown in hours only.':'שעות שמתפנות מתומחרות לפי התעריף של האדם שזמנו מתפנה. בלי תעריף, מוצגות בשעות בלבד.','Nobody listed yet.':'עדיין לא נרשם אף אחד.','Add a person or role':'הוספת אדם או תפקיד','rate':'תעריף','/h':'/שעה',
'Meeting recordings':'הקלטות פגישות','Connect the note taker your business uses and choose which meetings Groundwork may read. Ideas from them go to review; nothing lands on the board by itself.':'חברו את כלי סיכום הפגישות שהעסק משתמש בו ובחרו אילו פגישות Groundwork רשאי לקרוא. רעיונות מהן עוברים לבדיקה; שום דבר לא עולה ללוח מעצמו.','No note taker connected yet.':'עדיין לא חובר כלי סיכום פגישות.','Connect a note taker':'חיבור כלי סיכום פגישות','Note taker':'כלי סיכום פגישות','API key':'מפתח API','New API key':'מפתח API חדש','Name (optional)':'שם (לא חובה)','e.g. Sales team account':'למשל: חשבון צוות המכירות','Which meetings to bring':'אילו פגישות להביא','Connect':'חיבור','Only the title and attendees are kept. Nothing is read until you send it.':'נשמרים רק הכותרת והמשתתפים. שום דבר לא נקרא עד שתשלחו.','Send to Groundwork':'שליחה ל־Groundwork','Keep private':'להשאיר פרטי','Untitled meeting':'פגישה ללא כותרת','Check now':'בדיקה עכשיו','Resume':'חידוש','Pause':'השהיה','Paused':'מושהה','not checked yet':'טרם נבדק','Replace the API key':'החלפת מפתח ה־API','Replace':'החלפה','Disconnect':'ניתוק','The key is deleted. Ideas already brought in stay on the board.':'המפתח נמחק. רעיונות שכבר הובאו נשארים בלוח.','Sent. Its ideas reach review in about a minute.':'נשלח. הרעיונות יגיעו לבדיקה בעוד כדקה.',
'Fathom: Settings → API Access. Fireflies: Settings → Developer settings. The key is checked, stored encrypted, and never shown again.':'Fathom: Settings ← API Access. Fireflies: Settings ← Developer settings. המפתח נבדק, נשמר מוצפן ולא יוצג שוב.',
'Every recorded meeting':'כל פגישה מוקלטת','Every meeting this account records is read automatically.':'כל פגישה שהחשבון הזה מקליט נקראת אוטומטית.','Meetings with the consultant':'פגישות עם היועץ','Only meetings the consultant attended. Your other meetings are never read.':'רק פגישות שהיועץ השתתף בהן. שאר הפגישות שלכם לא נקראות לעולם.','Meetings with only our people':'פגישות של אנשי העסק בלבד','Only meetings where everyone is from the business (the consultant may join). Uses the business email domains.':'רק פגישות שכל המשתתפים בהן מהעסק (היועץ יכול להצטרף). לפי דומיין המייל של העסק.','I choose each meeting':'אני בוחר/ת כל פגישה','Every meeting waits here with its title and attendees only. Nothing is read until you send it.':'כל פגישה ממתינה כאן עם הכותרת והמשתתפים בלבד. שום דבר לא נקרא עד שתשלחו.',
'Review queue':'תור לבדיקה','Nothing waiting for review.':'אין רעיונות שממתינים לבדיקה.','Accept as a new card':'אישור ככרטיס חדש','Attach to an existing card':'צירוף לכרטיס קיים','Card':'כרטיס','Attach as evidence':'צירוף כראיה','Reject':'דחייה','Edit before deciding':'עריכה לפני החלטה','What was said':'מה נאמר','Quotes stay as they were said.':'ציטוטים נשארים כפי שנאמרו.',
'Opportunity board':'לוח ההזדמנויות','Show all':'הצגת הכול','Discover opportunity':'הזדמנות חדשה','Propose an idea':'הצעת רעיון','All':'הכול','Opportunity':'הזדמנות','Task':'משימה','Effort':'מאמץ','Confidence':'ביטחון','Conf.':'ביטחון','Stage':'שלב','First':'ראשון','Nothing here yet.':'אין כאן עדיין כלום.','Most value for the effort goes first. Value, effort and confidence are coarse 1–3 judgments pending review, not a forecast.':'קודם מה שנותן הכי הרבה ערך ביחס למאמץ. ערך, מאמץ וביטחון הם הערכות גסות בסולם 1–3 שממתינות לבדיקה, לא תחזית.',
'Documents':'מסמכים','Add a link':'הוספת קישור','Added by the consultant':'נוסף על ידי היועץ','Added by the business owner':'נוסף על ידי בעלת העסק','For':'עבור','No documents yet.':'עדיין אין מסמכים.','Edit document':'עריכת מסמך','Title':'כותרת','Kind':'סוג','Link (https://…)':'קישור (‎https://…‎)','For opportunity (optional)':'עבור הזדמנות (לא חובה)','Share the document itself so the people in this workspace can open it. The link is saved, not the file.':'שתפו את המסמך עצמו כדי שהאנשים בסביבת העבודה יוכלו לפתוח אותו. נשמר הקישור, לא הקובץ.','Plan':'תוכנית','Agreement':'הסכם','Tick the consent box to sign':'סמנו את תיבת ההסכמה כדי לחתום','Type your full name to sign':'הקלידו שם מלא כדי לחתום','You have already signed this document':'כבר חתמת על המסמך הזה','Sign in with your own account to sign':'כדי לחתום צריך להיכנס עם החשבון שלך','Only a stored agreement file can be signed':'אפשר לחתום רק על קובץ הסכם שהועלה','File storage is not configured yet':'אחסון הקבצים עוד לא הוגדר','PDF, Word, Excel, PowerPoint, an image or plain text only':'רק PDF, ‏Word, ‏Excel, ‏PowerPoint, תמונה או טקסט','At most 20 MB':'עד 20MB','Attach a file':'צרפו קובץ','A title is required (at most 300 characters)':'צריך כותרת (עד 300 תווים)','Upload a file':'העלאת קובץ','Upload':'העלאה','File (PDF, Word, Excel, PowerPoint, image; up to 20 MB)':'קובץ (PDF, ‏Word, ‏Excel, ‏PowerPoint או תמונה; עד 20MB)','The file is kept privately and opens only for people in this workspace. An agreement can be signed once it is uploaded.':'הקובץ נשמר באופן פרטי ונפתח רק לאנשים בסביבת העבודה הזו. אחרי ההעלאה אפשר לחתום על הסכם.','Signed':'נחתם','Not signed yet.':'עדיין לא נחתם.','Sign':'חתימה','Open the document':'פתיחת המסמך','Full name':'שם מלא','Meeting':'פגישה','Log':'יומן','Report':'דוח','Reference':'חומר עזר','Other':'אחר',
"What we've shipped":'מה כבר יצא לדרך','Value counts as delivered only once the business has confirmed it.':'ערך נחשב כמסופק רק אחרי שהעסק אישר אותו.',
'Descriptive mappings are separate from interventions. Process scopes below are proposed; Business Unit boundaries need review.':'המיפוי התיאורי נפרד מההתערבויות. התהליכים שלהלן מוצעים; גבולות היחידות העסקיות טעונים בדיקה.','Process · proposed':'תהליך · מוצע','Mapped initiatives:':'יוזמות ממופות:','Known gaps:':'פערים ידועים:','No descriptive business model has been imported. Unknown is valid.':'לא יובא מודל עסקי תיאורי. "לא ידוע" זו תשובה לגיטימית.','Business Anatomy research findings':'ממצאי מחקר של Business Anatomy',
'Owner:':'אחראי:','Review date:':'תאריך סקירה:','Missing:':'חסר:','Value sign-off:':'אישור ערך:','The business has confirmed this value.':'העסק אישר את הערך הזה.','Value stays Expected or Estimated until the business confirms it.':'הערך נשאר צפוי או מוערך עד שהעסק מאשר אותו.','Note (needed to move back)':'הערה (נדרשת כדי לחזור אחורה)',
'Desired outcome':'התוצאה הרצויה','Hypothesis':'השערה','Not yet recorded':'טרם נרשם','Baseline → Target':'נקודת בסיס ← יעד','Baseline needed':'נדרשת נקודת בסיס','Target to agree':'יעד לסיכום','KPIs':'מדדים','Input → Output':'קלט ← פלט','Dependencies':'תלויות','Affected business anatomy':'חלקי העסק המושפעים','Objectives:':'יעדים:','Intervention type:':'סוג ההתערבות:','Delivery evidence:':'ראיית ביצוע:','Observation and diagnosis':'תצפית ואבחון','Diagnosis not recorded':'האבחון טרם נרשם','Measurement design':'תכנון המדידה','Baseline needed. Define metric version, population, comparison window, source, method and guardrails before execution.':'נדרשת נקודת בסיס. יש להגדיר גרסת מדד, אוכלוסייה, חלון השוואה, מקור, שיטה ומגבלות לפני הביצוע.','Not yet mapped':'טרם מופה','Unresolved reference':'הפניה לא מזוהה',
'Record the learning and evidence at this step.':'רשמו את הלמידה והראיות בשלב הזה.','Not yet made':'טרם התקבלה','Impact and evidence':'השפעה וראיות','Missing':'חסר','Not measured':'לא נמדד','Not agreed':'לא סוכם','Needed':'נדרש','No impact evidence recorded.':'לא נרשמו ראיות להשפעה.','Not quantified':'לא כומת',
'Learning and professional / company knowledge':'למידה וידע מקצועי / ארגוני','Learning to record':'למידה לתיעוד','Documentation / SOP updates':'תיעוד / עדכוני נהלים','Update needed':'נדרש עדכון','Evidence sources':'מקורות הראיות','Comments':'תגובות','Add a comment':'הוספת תגובה','Post':'פרסום','Not a reply':'לא כתגובה','Reply':'תגובה','No comments yet.':'עדיין אין תגובות.','Business owner':'בעלת העסק','Consultant':'היועץ','Change history':'היסטוריית שינויים','Edit / advance cycle':'עריכה / קידום המחזור','Archive this card':'העברת הכרטיס לארכיון','Why (optional)':'למה (לא חובה)',
'What should change?':'מה צריך להשתנות?','Why — what you see today':'למה — מה אתם רואים היום','It lands as Proposed. The consultant reviews it, fills in the details and decides what comes first.':'הרעיון נכנס כ"הוצע". היועץ בודק אותו, משלים את הפרטים ומחליט מה קודם.','Propose':'הצעה',
'Discovered':'זוהתה','Prioritized':'תועדפה','In Progress':'בביצוע','Measuring':'במדידה','Impact':'השפעה',
'Proposed':'הוצע','Consultant approved':'אושר על ידי היועץ','Business confirmed':'אושר על ידי העסק','Not on the track yet':'עדיין לא במסלול האישור','Not on the approval track yet':'עדיין לא במסלול האישור',
'Measured':'נמדד','Estimated':'מוערך','Expected':'צפוי','Not measured / Baseline needed':'לא נמדד / נדרשת נקודת בסיס',
'Linked goal':'יעד מקושר','Affected unit or handoff':'יחידה או מעבר מושפעים','Baseline':'נקודת בסיס','Expected impact with units':'השפעה צפויה עם יחידות','Urgency':'דחיפות','Owner':'אחראי','Review date':'תאריך סקירה',
'Revenue created':'הכנסה שנוצרה','Cost reduced':'עלות שנחסכה','Hours saved':'שעות שנחסכו','Conversion':'המרה','Decision speed':'מהירות החלטה','Founder dependency':'תלות במייסד',
'Learning':'למידה','Preparing & Assumptions':'הכנה והנחות','Doing':'ביצוע','Tracking':'מעקב','Analyzing':'ניתוח','Improving':'שיפור','Documenting':'תיעוד',
'proposed':'מוצע','code-present':'קוד קיים','source-reported':'מדווח במקור','To agree':'לסיכום','Not estimated yet':'טרם הוערך','n/a (risk)':'לא רלוונטי (סיכון)',
'Repair':'תיקון','Optimize':'ייעול','Automate':'אוטומציה','Augment':'חיזוק','Transform':'שינוי מהותי','Split/Merge':'פיצול/איחוד','Retire':'הוצאה משימוש',
'Evidence records are not added across metrics, units, time periods or initiatives. No aggregate revenue or savings claim is implied.':'רשומות ראיה אינן מסוכמות בין מדדים, יחידות, תקופות או יוזמות. אין כאן טענה מצטברת להכנסה או לחיסכון.',
"Three numbers, never added together. Each line is one evidence type, business-confirmed first. Annualized is the monthly run-rate x 12, not money received. Time value is released hours priced at that person's rate: a conversion, not cash.":'שלושה מספרים שלעולם לא מחוברים יחד. כל שורה היא סוג ראיה אחד, ומה שהעסק אישר מופיע ראשון. השנתי הוא הקצב החודשי × 12, לא כסף שהתקבל. ערך הזמן הוא שעות שמתפנות לפי תעריף האדם: המרה, לא מזומן.',
'Totals never mix evidence types, categories or one-time with monthly amounts. Expected is what we expect, not what happened. Hours are capacity released, not cash saved, unless cost is actually removed; they are priced only at the rate of the person whose time they release.':'הסיכומים לעולם לא מערבבים סוגי ראיה, קטגוריות או סכומים חד־פעמיים עם חודשיים. "צפוי" הוא מה שאנחנו מצפים לו, לא מה שקרה. שעות הן קיבולת שהתפנתה, לא כסף שנחסך, אלא אם העלות באמת ירדה; הן מתומחרות רק לפי תעריף האדם שזמנו מתפנה.',
'yuval':'היועץ','owner':'בעלת העסק','system':'המערכת','ai':'בינה מלאכותית',
};
const heWho=w=>HE[w]||w;
const HE_PATTERNS=[
 [/^(\d+) missing$/,(_,n)=>n==='1'?'שדה אחד חסר':`${n} שדות חסרים`],
 [/^Missing: (.+)$/s,(_,l)=>'חסר: '+l.split(', ').map(heText).join(', ')],
 [/^(\d+) cards? missing required fields$/,(_,n)=>`${n} כרטיסים שחסרים בהם שדות חובה`],
 [/^(\d+) items? still need a baseline or a number$/,(_,n)=>`${n} פריטים עדיין צריכים נקודת בסיס או מספר`],
 [/^(\d+) records? · see opportunities$/,(_,n)=>`${n} רשומות · ראו בהזדמנויות`],
 [/^Every number says how we know it\. (.+)$/s,(_,r)=>'כל מספר אומר איך אנחנו יודעים אותו. '+heText(r)],
 [/^\+ (.+) of time \(conversion\)$/,(_,v)=>`+ ${v} בזמן (המרה)`],
 [/^(.+) not priced$/,(_,v)=>`${v} לא מתומחר`],
 [/^Review cadence: (.+)$/,(_,c)=>'קצב סקירה: '+heText(c)],
 [/^Proposed by (.+) · entered by (.+)$/,(_,a,b)=>`הוצע על ידי ${heWho(a)} · הוזן על ידי ${heWho(b)}`],
 [/^Move to (.+)$/,(_,s)=>'קידום ל: '+heText(s)],
 [/^Back to (.+)$/,(_,s)=>'חזרה ל: '+heText(s)],
 [/^Impact (\S+) × confidence (\S+) × urgency (\S+) ÷ effort (\S+)\. Coarse 1–3 judgments, not an ROI forecast\.\s*(.*)$/s,(_,i,c,u,e,r)=>`השפעה ${i} × ביטחון ${c} × דחיפות ${u} ÷ מאמץ ${e}. הערכות גסות בסולם 1–3, לא תחזית תשואה.${r?' '+r:''}`],
 [/^One or more priority ratings are unknown\.\s*(.*)$/s,(_,r)=>`אחת או יותר מהערכות העדיפות לא ידועות.${r?' '+r:''}`],
 [/^Improvement cycle · Round (\d+)$/,(_,n)=>`מחזור שיפור · סבב ${n}`],
 [/^Decision: (.+)$/,(_,d)=>'החלטה: '+heText(d)],
 [/^Before: (.+) · After: (.+) · Target: (.+)$/,(_,b,a,t)=>`לפני: ${heText(b)} · אחרי: ${heText(a)} · יעד: ${heText(t)}`],
 [/^Evidence: (.+)$/s,(_,e)=>'ראיה: '+heText(e)],
 [/^Business view · Business Anatomy (.+)$/,(_,v)=>`תמונת העסק · Business Anatomy ${v}`],
 [/^Sign: (.+)$/s,(_,t)=>'חתימה: '+t],
 [/^Signing binds your name to this exact file \(fingerprint (.+)\)\. The date and time are recorded with it\.$/,(_,h)=>`החתימה קושרת את שמך לקובץ הזה בדיוק (טביעת אצבע ${h}). התאריך והשעה נשמרים איתה.`],
 [/^Archived documents · (\d+)$/,(_,n)=>`מסמכים בארכיון · ${n}`],
 [/^Meetings waiting for your choice · (\d+)$/,(_,n)=>`פגישות שממתינות לבחירתך · ${n}`],
 [/^Meeting recordings · (\d+) waiting for your choice$/,(_,n)=>`הקלטות פגישות · ${n} ממתינות לבחירתך`],
 [/^key …(\S*) · last checked (.+)$/,(_,k,d)=>`מפתח …${k} · נבדק לאחרונה ${d}`],
 [/^key …(\S*) · not checked yet$/,(_,k)=>`מפתח …${k} · טרם נבדק`],
 [/^Disconnect (.+)$/,(_,p)=>`ניתוק ${p}`],
 [/^(.+) · opportunities$/,(_,c)=>`${heText(c)} · הזדמנויות`],
];
function heText(s){
  const t=String(s).trim();if(!t)return s;
  let out=Object.prototype.hasOwnProperty.call(HE,t)?HE[t]:undefined;
  if(out===undefined)for(const [re,rep] of HE_PATTERNS){const m=t.match(re);if(m){out=rep(...m);break;}}
  // Composite labels ("Opportunity · Discovered", "Proposed 11 · Consultant approved"): translate the parts we know.
  if(out===undefined&&t.includes(' · ')){const parts=t.split(' · '),tr=parts.map(p=>{const x=p.trim();return x&&Object.prototype.hasOwnProperty.call(HE,x)?HE[x]:p;});if(tr.some((p,i)=>p!==parts[i]))out=tr.join(' · ');}
  if(out===undefined&&t.includes(' → ')){const parts=t.split(' → '),tr=parts.map(p=>heText(p));if(tr.some((p,i)=>p!==parts[i]))out=tr.join(' ← ');}
  if(out===undefined&&/^Value sign-off: /.test(t))out='אישור ערך: '+heText(t.slice(16));
  if(out===undefined)return s;
  const str=String(s);return str.match(/^\s*/)[0]+out+str.match(/\s*$/)[0];
}
class GroundworkImprovement extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});this.selected=null;this.filter='All';this.error='';this.busy=false;}
  set board(value){this.data=value;if(value?.role==='editor')this.loadCandidates();if(['owner','editor'].includes(value?.role))this.loadSources();this.render();}
  // The business's own note takers and the meetings waiting for its choice. Owner or editor; keys go in once and never come back.
  loadSources(){const seq=this.srcSeq=(this.srcSeq||0)+1;
    Promise.all([this.request('GET','/call-sources'),this.request('GET','/calls/awaiting')]).then(([sources,awaiting])=>{if(seq===this.srcSeq){this.sources=sources;this.awaiting=awaiting;this.srcError='';this.render();}},e=>{if(seq===this.srcSeq){this.srcError=e.message;this.render();}});}
  // The review queue: ideas from interviews and recorded calls wait here until the editor decides. Nothing is on the board before that.
  loadCandidates(){const seq=this.candSeq=(this.candSeq||0)+1;
    this.request('GET','/candidates').then(rows=>{if(seq===this.candSeq){this.candidates=rows;this.candError='';this.render();}},e=>{if(seq===this.candSeq){this.candError=e.message;this.render();}});}
  connectedCallback(){if(this.data)this.render();}
  emit(name,detail){this.dispatchEvent(new CustomEvent(name,{detail,bubbles:true,composed:true}));}
  // Any other backend call: path is relative to the workspace (e.g. /proposals, /nodes/ID/approval). The host maps and proxies it.
  request(method,path,body,as){return new Promise((resolve,reject)=>this.emit('request',{method,path,body,as,done:(err,result)=>err?reject(new Error(err)):resolve(result)}));}
  can(role){return this.data.role===role;}
  get he(){return this.data?.workspace?.locale==='he';}
  get cur(){return this.data?.impact_dashboard?.currency||this.data?.workspace?.currency||'USD';}
  get curSymbol(){return currencyText(0,this.cur).replace(/[\d.,\s]/g,'')||this.cur;}
  t(s){return this.he?heText(s):s;}
  // Hebrew: swap this tree's own labels in place (text, placeholder, title, aria-label). Option values never change.
  localize(root){if(!this.he)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
    for(let n=w.nextNode();n;n=w.nextNode()){if(n.nodeType===3){if(['STYLE','SCRIPT','TEXTAREA'].includes(n.parentNode?.nodeName))continue;const t=heText(n.nodeValue);if(t!==n.nodeValue)n.nodeValue=t;}
      else for(const a of ['placeholder','title','aria-label']){const v=n.getAttribute(a);if(v){const t=heText(v);if(t!==v)n.setAttribute(a,t);}}}}
  approvalTag(n){const a=n.value_approval;return a?`<span class="tag appr ${a.value_delivered?'ok':''}" title="Proposed by ${esc(a.proposed_by||'unknown')} · entered by ${esc(a.entered_by||'unknown')}">${esc(a.label||'Not on the approval track yet')}</span>`:'';}
  field(label,name,value,type='text'){return `<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(value)}" ${type==='number'?'step="any"':''}></label>`;}
  area(label,name,value){return `<label>${esc(label)}<textarea name="${name}" rows="3">${esc(value)}</textarea></label>`;}
  select(label,name,value,options){return `<label>${esc(label)}<select name="${name}">${options.map(o=>{const [v,t]=Array.isArray(o)?o:[o,o];return `<option value="${esc(v)}" ${v===value?'selected':''}>${esc(t)}</option>`}).join('')}</select></label>`;}
  render(){
    if(!this.data)return;
    if(this.he){this.setAttribute('dir','rtl');this.setAttribute('lang','he');}else if(this.getAttribute('lang')==='he'){this.removeAttribute('dir');this.removeAttribute('lang');}
    const {workspace,nodes,pipeline}=this.data,dash=this.data.impact_dashboard,people=workspace.people||[];
    const opportunities=nodes.filter(n=>n.improvement.kind==='Opportunity');
    const rank={'High':0,'Medium':1,'Validate first':2,'Low':3,'Not assessed':4};
    const focus=this.focus&&dash?dash.categories.find(c=>c.category===this.focus):null;
    // Open work first (in progress, then the backlog by priority), delivered work after it.
    const group={'In Progress':0,'Prioritized':1,'Discovered':1,'Measuring':2,'Impact':2};
    const ratio=n=>(n.improvement.impact||0)/(n.improvement.effort||3);
    const order=(a,b)=>(group[a.improvement.status]-group[b.improvement.status])||(rank[a.priority_assessment.band]-rank[b.priority_assessment.band])||(ratio(b)-ratio(a))||a.title.localeCompare(b.title);
    const rows=opportunities.filter(n=>(this.filter==='All'||n.improvement.status===this.filter)&&(!focus||focus.node_ids.includes(n.id))).sort(order);
    const firstId=opportunities.filter(n=>['Discovered','Prioritized'].includes(n.improvement.status)).sort(order)[0]?.id;
    const firstIx=rows.findIndex(n=>n.id===firstId);if(firstIx>0)rows.unshift(...rows.splice(firstIx,1));
    const delivered=opportunities.filter(n=>['Measuring','Impact','In Progress'].includes(n.improvement.status)).sort((a,b)=>stages.indexOf(b.improvement.status)-stages.indexOf(a.improvement.status)||a.title.localeCompare(b.title));
    const shown=this.shown||{Measured:true,Estimated:true,Expected:true};
    const bar=(n,cls)=>`<span class="bar ${cls}"><i style="width:${n===null?0:Math.round(n/3*100)}%"></i></span>`;
    const dots=n=>`<span class="dots" aria-label="${n===null?'Not assessed':n+' of 3'}">${[1,2,3].map(k=>`<i class="${n!==null&&k<=n?'on':''}"></i>`).join('')}</span>`;
    const card=c=>{
      const quantified=c.by_evidence.filter(e=>shown[e.type]&&(e.one_time!==null||e.per_month!==null));
      const max=Math.max(1,...quantified.flatMap(e=>[e.one_time||0,e.per_month||0]));
      const gaps=c.by_evidence.find(e=>e.type===evidence[3]).records+c.by_evidence.filter(e=>e.type!==evidence[3]).reduce((s,e)=>s+e.unquantified,0);
      const hoursConv=(type,k)=>{
        // Hours are priced only at the rate of the person whose time they release.
        const v=(dash.hours_value||[]).find(x=>x.type===type);if(!v)return '';
        const who=(dash.hours_by_person||[]).map(p=>({p,e:p.by_evidence.find(x=>x.type===type)})).filter(({p,e})=>e&&e[k+'_usd']!==null&&p.hourly_value_usd!==null);
        const usd=v[k+'_usd'],left=v['unpriced_'+k+'_hours'];
        return (usd!==null?`<small class="conv">≈ ${esc(money(usd,this.cur))} of time · ${who.map(({p,e})=>`${esc(p.name)} ${esc(money(e[k+'_hours'],'hours'))} × ${esc(money(p.hourly_value_usd,this.cur))}/h`).join(' + ')} · conversion, not cash</small>`:'')
          +(left!==null?`<small class="conv">${esc(money(left,'hours'))} not in dollars: no person or no rate</small>`:'');
      };
      const lines=quantified.map(e=>['per_month','one_time'].filter(k=>e[k]!==null).map(k=>`<div class="line"><span class="tag ${esc(e.type)}">${esc(e.type)}</span><b>${esc(money(e[k],c.unit))}</b><small>${k==='per_month'?'per month':'one-time'}</small><span class="bar ${esc(e.type)}"><i style="width:${Math.round(e[k]/max*100)}%"></i></span>${c.category==='Hours saved'?hoursConv(e.type,k):''}</div>`).join('')).join('');
      const other=c.by_evidence.filter(e=>e.type!==evidence[3]&&shown[e.type]&&e.records&&!c.summable).map(e=>`<div class="line"><span class="tag ${esc(e.type)}">${esc(e.type)}</span><small>${e.records} record${e.records>1?'s':''} · see opportunities</small></div>`).join('');
      return `<button class="impactcard ${this.focus===c.category?'focused':''}" data-focus="${esc(c.category)}"><h3>${esc(c.category)}</h3>${lines||other||`<div class="line"><span class="tag nm">Not measured yet</span></div>`}${gaps?`<small class="gap">${gaps} item${gaps>1?'s':''} still need a baseline or a number</small>`:''}</button>`;
    };
    this.shadowRoot.innerHTML=`<style>
      :host{display:block;--bg:#0b1a2b;--panel:#10243a;--panel2:#132b45;--line:#21405f;--text:#e7eff7;--muted:#8ea5ba;--teal:#2fd3b0;--amber:#f2c14e;--violet:#9fb2ff;--grey:#5d7389;color:var(--text);font:15px/1.5 system-ui,-apple-system,sans-serif;background:radial-gradient(1200px 600px at 20% -10%,#163152,transparent),var(--bg);border-radius:18px}
      *{box-sizing:border-box}button,input,select,textarea{font:inherit;color:inherit}button{cursor:pointer;border:1px solid var(--line);border-radius:10px;background:var(--panel);padding:8px 13px}button:hover{border-color:var(--teal)}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid var(--amber);outline-offset:2px}button:disabled{opacity:.5;cursor:wait}
      .wrap{max-width:1280px;margin:auto;padding:28px}.brand{display:flex;align-items:center;gap:10px;font-weight:700;letter-spacing:.02em}.logo{display:inline-grid;gap:3px}.logo i{display:block;height:5px;border-radius:3px;background:#3aa0ff}.logo i:first-child{width:16px;margin-inline-start:6px;background:var(--amber)}.logo i:nth-child(2){width:20px}.logo i:nth-child(3){width:16px;background:#2b7fd8}
      .eyebrow{letter-spacing:.16em;text-transform:uppercase;font-size:11px;font-weight:750;color:var(--teal)}h1{font:600 clamp(26px,4vw,40px)/1.15 system-ui,sans-serif;margin:8px 0 2px}h2{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--teal);margin:0 0 12px}h3{font-size:16px;margin:0 0 8px}p{margin:6px 0 14px}.muted,small{color:var(--muted)}
      header,.heading{display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap}.section{margin-top:30px}
      .chips{display:flex;gap:8px;flex-wrap:wrap}.chip{border-radius:20px;padding:5px 13px;font-size:13px;opacity:.55}.chip.on{opacity:1}.chip.Expected.on{background:#25305c;border-color:var(--violet)}.chip.Estimated.on{background:#4a3a14;border-color:var(--amber)}.chip.Measured.on{background:#0f4a40;border-color:var(--teal)}
      .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.impactcard{text-align:start;display:block;width:100%;padding:16px;border-radius:14px;background:linear-gradient(180deg,var(--panel2),var(--panel));min-height:150px}.impactcard.focused{border-color:var(--teal);box-shadow:0 0 0 1px var(--teal)}.line{display:grid;grid-template-columns:auto 1fr auto;align-items:baseline;gap:4px 10px;margin:9px 0}.line b{font-size:22px;font-weight:600}.line .bar{grid-column:1/-1}.conv,.gap{grid-column:1/-1;display:block}.gap{margin-top:8px}
      .tag{display:inline-block;border-radius:20px;padding:2px 9px;font-size:11px;font-weight:650;border:1px solid var(--line);white-space:nowrap}.tag.Measured{border-color:var(--teal);color:var(--teal)}.tag.Estimated{border-color:var(--amber);color:var(--amber)}.tag.Expected{border-color:var(--violet);color:var(--violet)}.tag.nm,.tag.Not{color:var(--muted)}
      .bar{display:block;height:7px;border-radius:5px;background:#1b3550;overflow:hidden;min-width:60px}.bar i{display:block;height:100%;border-radius:5px;background:var(--teal)}.bar.Estimated i,.bar.effort i{background:var(--amber)}.bar.Expected i{background:var(--violet)}
      .dots{display:inline-flex;gap:4px}.dots i{width:8px;height:8px;border-radius:50%;background:#28445f}.dots i.on{background:var(--violet)}
      .board{border:1px solid var(--line);border-radius:14px;background:var(--panel);overflow:hidden}.row{display:grid;grid-template-columns:minmax(0,2.6fr) 1fr 1fr 96px 110px;gap:14px;align-items:center;padding:12px 14px;border-top:1px solid var(--line)}.row.head{border-top:0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}.row.first{background:#0f3a3a}.row .t{display:flex;flex-wrap:wrap;gap:4px 9px;align-items:center;min-width:0}.row .t .link{flex:1 1 0;min-width:0}.short{display:none}.row .t .pip{width:9px;height:9px;border-radius:50%;flex:none;background:var(--amber)}.row .t .pip.shipped{background:var(--teal)}.first-badge{background:var(--teal);color:#05221d;border-radius:20px;padding:1px 9px;font-size:11px;font-weight:750;margin-inline-start:6px}
      .link{border:0;background:none;text-align:start;padding:0;font-weight:600;overflow-wrap:anywhere}.link:hover{color:var(--teal)}
      .pipeline{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}.pipeline button b{margin-inline-start:6px;color:var(--teal)}.selected,.primary{background:var(--teal)!important;color:#05221d!important;border-color:var(--teal)!important}.selected b{color:#05221d!important}
      .delivered{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.done{padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--panel)}.done p{margin:4px 0;font-size:14px;color:var(--muted)}.done .tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
      .people{margin-top:16px;padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--panel)}.people p{font-size:13px}.person{display:grid;grid-template-columns:minmax(0,1fr) auto 110px auto auto;gap:8px;align-items:center;margin:8px 0;font-size:14px}.person input{padding:7px;border:1px solid var(--line);border-radius:8px;background:var(--bg)}
      @media(max-width:620px){.person{grid-template-columns:minmax(0,1fr) auto 84px auto}.person button,.person>span:last-child:empty{grid-column:1/-1}}
      .note{color:var(--muted);font-size:13px;margin-top:10px}.approvals b{color:var(--text)}.tag.appr{color:var(--muted)}.tag.appr.ok{border-color:var(--teal);color:var(--teal)}.gaptext{color:var(--amber)}
      .headline{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.hlcol{padding:16px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(180deg,var(--panel2),var(--panel))}.hlgroup{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:12px 0 2px}.hl{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;margin:6px 0}.hl b{font-size:24px;font-weight:600}.hl small{flex-basis:100%}
      @media(max-width:860px){.headline{grid-template-columns:1fr}}
      .opt{display:flex;flex-direction:column;gap:2px;margin:8px 0;font-weight:400}.opt small{margin-inline-start:24px}.cand{padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--panel);margin:10px 0}.cand h3{margin:8px 0 4px}.cand details{padding:8px 0 0}.cand .actions{margin-top:8px;flex-wrap:wrap}blockquote{margin:6px 0;padding-inline-start:10px;border-inline-start:2px solid var(--violet);color:var(--muted);font-size:14px}a{color:var(--teal)}.call ul{margin:4px 0 8px;padding-inline-start:20px;font-size:14px}
      .signed{margin:6px 0}.tag.ok{border-color:var(--teal);color:var(--teal)}.sigs{margin:8px 0}
      .comment{border-inline-start:2px solid var(--line);padding:6px 10px;margin:8px 0}.comment .comment{margin-inline-start:14px}.comment small{display:block}.track{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
      .lang{flex-direction:row;align-items:center;margin:0}.lang select{width:auto}
      details{border-top:1px solid var(--line);padding:12px 0}summary{cursor:pointer;font-weight:650}.map{padding-block:5px;padding-inline:16px 0;border-inline-start:1px solid var(--line);margin-inline-start:6px}.map button{border:0;background:none;padding:5px;text-align:start}
      dialog{border:1px solid var(--line);border-radius:16px;max-width:980px;width:94vw;max-height:92vh;padding:0;color:var(--text);background:var(--panel)}dialog::backdrop{background:#020a14d0}dialog h1{font-size:26px}.detail{padding:26px}.cycle{display:flex;gap:6px;flex-wrap:wrap;margin:15px 0}.cycle span{font-size:12px;border:1px solid var(--line);padding:6px 9px;border-radius:6px}.notice{background:#0f2c44;border-inline-start:3px solid var(--teal);padding:12px;margin:14px 0}.error{background:#3a1a12;color:#ffb59a;padding:12px;white-space:pre-wrap}
      .formgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.two{display:grid;grid-template-columns:1fr 1fr;gap:18px}label{display:flex;flex-direction:column;font-size:12px;font-weight:650;gap:5px;margin:8px 0}input,select,textarea{width:100%;padding:9px;border:1px solid var(--line);border-radius:6px;background:var(--bg)}textarea{resize:vertical}.impact{padding:15px;border:1px solid var(--line);border-radius:8px;margin:12px 0}.actions{display:flex;gap:8px;margin-top:14px}.pre{white-space:pre-wrap;overflow-wrap:anywhere}footer{font-size:12px;margin-top:28px;color:var(--muted)}
      @media(max-width:860px){.grid{grid-template-columns:1fr 1fr}.delivered{grid-template-columns:1fr}}
      @media(max-width:620px){.wrap{padding:16px}.grid,.two,.formgrid{grid-template-columns:1fr}.row{grid-template-columns:minmax(0,1fr) 64px 64px 44px;gap:8px}.row .st{display:none}.row.head .st{display:none}.long{display:none}.short{display:inline}.impactcard{min-height:0}.row .t .pip{display:none}.row .t .link{flex-basis:100%}.first-badge{margin-inline-start:0;order:-1}.detail{padding:16px}.line b{font-size:20px}}
    </style><div class="wrap">
    <header><div><div class="brand"><span class="logo"><i></i><i></i><i></i></span>Groundwork</div><h1>${esc(workspace.name)}</h1><p class="muted">Map it. Improve it. Measure it. Every cycle.</p></div><div class="track">${this.can('editor')&&this.hasAttribute('locales')?`<label class="lang">Board language<select data-locale>${[['en','English'],['he','עברית']].map(([k,l])=>`<option value="${k}" ${(workspace.locale||'en')===k?'selected':''}>${l}</option>`).join('')}</select></label>`:''}<button data-action="refresh">Refresh</button></div></header>
    ${dash?.headline?this.headline(dash.headline):''}
    ${dash?`<section class="section"><div class="heading"><h2>${dash.headline?'By outcome':'Impact dashboard'}</h2><div class="chips">${['Expected','Estimated','Measured'].map(t=>`<button class="chip ${t} ${shown[t]?'on':''}" data-shown="${t}" aria-pressed="${!!shown[t]}">${t}</button>`).join('')}</div></div>
      <div class="grid">${dash.categories.map(card).join('')}</div>
      <p class="note">Every number says how we know it. ${esc(dash.note)}</p>
      <div class="people"><h3>Whose time · value of one hour each</h3><p class="muted">Released hours are priced at the rate of the person whose time they free. No rate = shown in hours only.</p>${this.data.role==='editor'?`<div data-people>${people.map((p,ix)=>`<div class="person" data-person="${esc(p.key)}"><span>${esc(p.name)}</span><span>${esc(this.curSymbol)}</span><input data-rate type="number" min="1" step="1" inputmode="decimal" value="${esc(p.hourly_value_usd??'')}" aria-label="${esc(this.cur)} per hour for ${esc(p.name)}" placeholder="not set"><small>/h</small><button data-remove="${ix}" aria-label="Remove ${esc(p.name)}">Remove</button></div>`).join('')}</div><div class="person"><input data-new-name placeholder="Add a person or role" aria-label="New person name"><span>${esc(this.curSymbol)}</span><input data-new-rate type="number" min="1" step="1" inputmode="decimal" placeholder="rate" aria-label="New person ${esc(this.cur)} per hour"><small>/h</small><span></span></div><div class="actions"><button class="primary" data-action="people">Save</button><small data-people-msg></small></div>`:people.map(p=>`<div class="person"><span>${esc(p.name)}</span><b>${p.hourly_value_usd===null?'not set':esc(money(p.hourly_value_usd,this.cur))+'/h'}</b></div>`).join('')||'<p class="muted">Nobody listed yet.</p>'}</div></section>`:''}
    ${this.recordings()}
    ${this.reviewQueue()}
    <section class="section"><div class="heading"><h2>${focus?esc(focus.category)+' · opportunities':'Opportunity board'}</h2>${focus?'<button data-focus="">Show all</button>':''}${this.data.role==='editor'?'<button class="primary" data-action="new">Discover opportunity</button>':''}${['owner','editor'].includes(this.data.role)?'<button data-action="propose">Propose an idea</button>':''}</div>
      <div class="pipeline"><button data-filter="All" class="${this.filter==='All'?'selected':''}">All<b>${opportunities.length}</b></button>${pipeline.map(p=>`<button data-filter="${p.status}" class="${this.filter===p.status?'selected':''}">${p.status}<b>${p.count}</b></button>`).join('')}</div>
      ${(this.data.approval_track||[]).some(a=>a.count)?`<p class="note approvals">Value sign-off: ${this.data.approval_track.filter(a=>a.count).map(a=>`${esc(a.label)} <b>${a.count}</b>`).join(' · ')}${this.data.cards_with_gaps?` · <span class="gaptext">${this.data.cards_with_gaps} card${this.data.cards_with_gaps>1?'s':''} missing required fields</span>`:''}</p>`:''}
      <div class="board"><div class="row head"><span>Opportunity</span><span>Value</span><span>Effort</span><span><span class="long">Confidence</span><span class="short">Conf.</span></span><span class="st">Stage</span></div>${rows.map(n=>`<div class="row ${n.id===firstId?'first':''}"><span class="t"><span class="pip ${['Measuring','Impact'].includes(n.improvement.status)?'shipped':''}"></span><button class="link" data-node="${n.id}" title="${esc(n.priority_assessment.explanation)}">${esc(n.title)}</button>${n.id===firstId?'<span class="first-badge">First</span>':''}${this.approvalTag(n)}${n.gaps?.length?`<small class="gaptext" title="Missing: ${esc(n.gaps.join(', '))}">${n.gaps.length} missing</small>`:''}</span>${bar(n.improvement.impact,'value')}${bar(n.improvement.effort,'effort')}${dots(n.improvement.confidence)}<span class="st"><span class="tag">${esc(n.improvement.status)}</span></span></div>`).join('')||'<div class="row"><span class="muted">Nothing here yet.</span></div>'}</div>
      <p class="note">Most value for the effort goes first. Value, effort and confidence are coarse 1–3 judgments pending review, not a forecast.</p></section>
    ${this.documents()}
    <section class="section"><h2>What we've shipped</h2><p class="note">Value counts as delivered only once the business has confirmed it.</p><div class="delivered">${delivered.map(n=>{const vals=n.impact_results.filter(i=>i.outcome);return `<div class="done"><button class="link" data-node="${n.id}">${esc(n.title)}</button><p>${esc(n.description)}</p><div class="tags"><span class="tag">${esc(n.improvement.status)}</span>${this.approvalTag(n)}${vals.map(i=>`<span class="tag ${esc(i.type.split(' ')[0])}">${esc(i.outcome.category)}: ${esc(i.type==='Expected'&&i.target!==null?money(i.target,i.unit)+' expected':i.value!==null?money(i.value,i.unit):i.type==='Expected'?'expected, not quantified':'not measured yet')}</span>`).join('')}</div></div>`;}).join('')}</div></section>
    <section class="section"><details><summary>Business view · Business Anatomy ${esc(this.data.anatomy_contract?.schema_version||'0.1')}</summary><p class="muted">Descriptive mappings are separate from interventions. Process scopes below are proposed; Business Unit boundaries need review.</p>${(this.data.anatomy||[]).filter(a=>a.entity_type==='Process').map(a=>`<details><summary>${esc(a.name)} <span class="tag">Process · proposed</span></summary><p>${esc(a.properties.description)}</p><p><b>Mapped initiatives:</b> ${nodes.filter(n=>n.improvement.groundwork?.affected_anatomy_ids.includes(a.id)).map(n=>`<button class="link" data-node="${n.id}">${esc(n.title)}</button>`).join(' · ')}</p><p><b>Known gaps:</b> ${esc(a.gaps.join('; '))}</p></details>`).join('')||'<p>No descriptive business model has been imported. Unknown is valid.</p>'}</details>
    <details><summary>Business Anatomy research findings</summary>${(this.data.research_findings||[]).map(r=>`<details><summary>${esc(r.id)} · ${esc(r.observed_case)}</summary><p>${esc(r.schema_gap)}</p><p>${esc(r.suggested_question)}</p></details>`).join('')}</details></section>
    ${this.callLog()}
    ${this.can('editor')&&(this.data.archived||[]).length?`<section class="section"><details><summary>Archived · ${this.data.archived.length}</summary>${this.data.archived.map(a=>`<div class="person"><span>${esc(a.title)}</span><small>${esc(a.archived_reason||'')}</small><span></span><button data-restore="${a.id}" data-rev="${a.revision}">Restore</button></div>`).join('')}</details></section>`:''}
    <footer>${esc(this.data.impact_note)}<br>Review cadence: ${esc(workspace.review_cadence)}</footer>
    ${this.error?`<p role="alert" class="error">${esc(this.error)}</p>`:''}</div><dialog aria-label="Opportunity detail"></dialog>`;
    const $$=s=>this.shadowRoot.querySelectorAll(s);
    $$('[data-filter]').forEach(b=>b.onclick=()=>{this.filter=b.dataset.filter;this.render();});
    $$('[data-focus]').forEach(b=>b.onclick=()=>{this.focus=b.dataset.focus===this.focus?'':b.dataset.focus;this.render();if(this.focus)this.shadowRoot.querySelector('.board')?.scrollIntoView({behavior:'smooth',block:'start'});});
    $$('[data-shown]').forEach(b=>b.onclick=()=>{this.shown={...shown,[b.dataset.shown]:!shown[b.dataset.shown]};this.render();});
    $$('[data-node]').forEach(b=>b.onclick=()=>this.detail(b.dataset.node));
    this.shadowRoot.querySelector('[data-action="refresh"]').onclick=()=>this.emit('refresh');
    // Editor only, and only where the host opts in (`locales`): the language is the workspace's, for every member.
    this.shadowRoot.querySelector('[data-locale]')?.addEventListener('change',e=>{e.target.disabled=true;this.emit('settings',{body:{locale:e.target.value},done:err=>{if(err){this.error=err;this.render();}}});});
    this.shadowRoot.querySelector('[data-action="new"]')?.addEventListener('click',()=>this.edit(null,'Opportunity'));
    this.shadowRoot.querySelector('[data-action="propose"]')?.addEventListener('click',()=>this.propose());
    $$('[data-restore]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await this.request('POST','/nodes/'+b.dataset.restore+'/restore',{revision:Number(b.dataset.rev)});this.emit('refresh');}catch(e){this.error=e.message;this.render();}});
    this.wireRecordings();
    this.wireDocuments();
    this.localize(this.shadowRoot);
    $$('[data-cand]').forEach(box=>{
      const id=box.dataset.cand,err=box.querySelector('[role="alert"]');
      // Accept and attach change the board, so the whole board reloads; a rejection only changes the queue.
      const act=async(b,path,body,board)=>{err.hidden=true;b.disabled=true;try{await this.request('POST','/candidates/'+id+path,body);board?this.emit('refresh'):this.loadCandidates();}catch(e){err.textContent=e.message;err.hidden=false;b.disabled=false;}};
      box.querySelector('[data-cand-accept]').onclick=e=>act(e.currentTarget,'/accept',{},true);
      box.querySelector('[data-cand-attach]')?.addEventListener('click',e=>act(e.currentTarget,'/attach',{project_id:box.querySelector('[data-attach-to]').value},true));
      box.querySelector('[data-cand-dismiss]').onclick=e=>act(e.currentTarget,'/dismiss',{reason:box.querySelector('[data-reject-reason]').value.trim()||undefined});
      box.querySelector('[data-cand-edit]').onclick=()=>this.editCandidate(this.candidates.find(c=>c.id===id));
    });
    const root=this.shadowRoot,save=root.querySelector('[data-action="people"]');
    root.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{b.closest('.person').hidden=true;b.closest('.person').dataset.removed='1';});
    if(save)save.onclick=()=>{const msg=root.querySelector('[data-people-msg]');
      const rate=raw=>raw.trim()===''?null:Number(raw);
      const next=[...root.querySelectorAll('[data-people] .person')].filter(r=>!r.dataset.removed).map(r=>{const p=people.find(x=>x.key===r.dataset.person);return {key:p.key,name:p.name,hourly_value_usd:rate(r.querySelector('[data-rate]').value)};});
      const name=root.querySelector('[data-new-name]').value.trim();
      // Evidence names a person by key. Re-adding someone removed in this save keeps their key, so their recorded hours
      // stay priced instead of moving to a fresh "-2" key; a different name never takes over a listed person's key.
      const same=p=>p.name.trim().toLowerCase()===name.toLowerCase();
      if(name&&next.some(same)){if(msg)msg.textContent=`${name} is already listed.`;return;}
      if(name){let key=people.find(p=>same(p)&&!next.some(x=>x.key===p.key))?.key;if(!key){key=name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'person';const base=key;let k=2;while(next.some(p=>p.key===key)||people.some(p=>p.key===key))key=(base.slice(0,36)+'-'+k++);}next.push({key,name,hourly_value_usd:rate(root.querySelector('[data-new-rate]').value)});}
      // Evidence still pointing at someone no longer listed is shown in hours only: say so instead of letting it go quiet.
      const orphans=new Map();for(const n of nodes)for(const i of n.improvement.impacts||[]){const k=i.outcome?.person;if(k&&!next.some(p=>p.key===k))orphans.set(k,(orphans.get(k)||0)+1);}
      const orphanNote=orphans.size?` · ${[...orphans].map(([k,c])=>`${people.find(p=>p.key===k)?.name||k}: ${c} evidence item${c>1?'s':''}`).join(', ')} now unpriced (hours only) until they are added back.`:'';
      save.disabled=true;
      this.emit('settings',{body:{people:next},done:err=>{save.disabled=false;if(msg)msg.textContent=err||this.t('Saved')+orphanNote;}});};
  }
  recordings(){
    if(!['owner','editor'].includes(this.data.role))return '';
    const s=this.sources,scopes=s?.scopes||[],name={fathom:'Fathom',fireflies:'Fireflies'},waiting=this.awaiting||[];
    const scopeLabel=k=>scopes.find(x=>x.key===k)?.label||k;
    const radios=(group,current)=>scopes.map(o=>`<label class="opt"><span><input type="radio" name="${group}" value="${esc(o.key)}" ${o.key===current?'checked':''} style="width:auto"> <b>${esc(o.label)}</b></span><small>${esc(o.description)}</small></label>`).join('');
    const conn=c=>`<div class="cand" data-source="${esc(c.id)}"><div class="track"><b>${esc(name[c.provider]||c.provider)}${c.label?' · '+esc(c.label):''}</b><span class="tag">${esc(scopeLabel(c.scope))}</span>${c.paused?'<span class="tag">Paused</span>':''}<small>key …${esc(c.credential_hint)} · ${c.last_synced_at?'last checked '+esc(new Date(c.last_synced_at).toLocaleString()):'not checked yet'}</small></div>
      ${c.last_error?`<p class="error">${esc(c.last_error)}</p>`:''}
      <div class="actions"><button data-src-sync>Check now</button><button data-src-pause="${c.paused?'':'1'}">${c.paused?'Resume':'Pause'}</button></div>
      <details><summary>Which meetings to bring</summary>${radios('scope-'+c.id,c.scope)}<button data-src-scope>Save</button></details>
      <details><summary>Replace the API key</summary><label>New API key<input type="password" autocomplete="off" data-src-key></label><button data-src-rekey>Replace</button></details>
      <details><summary>Disconnect</summary><p class="note">The key is deleted. Ideas already brought in stay on the board.</p><button data-src-remove>Disconnect ${esc(name[c.provider]||c.provider)}</button></details>
      <p role="alert" class="error" hidden></p></div>`;
    const pick=c=>`<div class="person" data-await="${esc(c.id)}"><span><b>${esc(c.title||'Untitled meeting')}</b><br><small>${c.started_at?esc(new Date(c.started_at).toLocaleString()):''} · ${esc((c.attendees||[]).map(a=>a.email||a.name).filter(Boolean).join(', '))}</small></span><button class="primary" data-await-send>Send to Groundwork</button><button data-await-skip>Keep private</button><small role="alert"></small></div>`;
    const body=this.srcError?`<p class="error">${esc(this.srcError)}</p>`:!s?'<p class="muted">Loading…</p>':`
      ${s.sources.map(conn).join('')||'<p class="muted">No note taker connected yet.</p>'}
      <details ${s.sources.length?'':'open'}><summary>Connect a note taker</summary><form data-src-new>
        <label>Note taker<select name="provider">${(s.providers||[]).map(p=>`<option value="${esc(p)}">${esc(name[p]||p)}</option>`).join('')}</select></label>
        <label>API key<input name="api_key" type="password" autocomplete="off" required></label>
        <p class="note">Fathom: Settings → API Access. Fireflies: Settings → Developer settings. The key is checked, stored encrypted, and never shown again.</p>
        <label>Name (optional)<input name="label" maxlength="100" placeholder="e.g. Sales team account"></label>
        <h3>Which meetings to bring</h3>${radios('new-scope','with_consultant')}
        <p role="alert" class="error" hidden></p><div class="actions"><button class="primary" type="submit">Connect</button></div></form></details>
      ${waiting.length?`<h3>Meetings waiting for your choice · ${waiting.length}</h3><p class="note">Only the title and attendees are kept. Nothing is read until you send it.</p>${waiting.map(pick).join('')}`:''}`;
    return `<section class="section"><details ${waiting.length?'open':''}><summary>Meeting recordings${waiting.length?` · ${waiting.length} waiting for your choice`:''}</summary><p class="note">Connect the note taker your business uses and choose which meetings Groundwork may read. Ideas from them go to review; nothing lands on the board by itself.</p>${body}</details></section>`;
  }
  wireRecordings(){
    const root=this.shadowRoot,reload=()=>this.loadSources();
    const form=root.querySelector('[data-src-new]');
    if(form)form.onsubmit=async e=>{e.preventDefault();const err=form.querySelector('[role="alert"]'),btn=form.querySelector('[type="submit"]'),f=form.elements;err.hidden=true;btn.disabled=true;
      try{await this.request('POST','/call-sources',{provider:f.provider.value,api_key:f.api_key.value,scope:form.querySelector('input[name="new-scope"]:checked')?.value,...(f.label.value.trim()?{label:f.label.value.trim()}:{})});reload();}
      catch(x){err.textContent=x.message;err.hidden=false;btn.disabled=false;}};
    root.querySelectorAll('[data-source]').forEach(box=>{
      const id=box.dataset.source,err=box.querySelector(':scope > [role="alert"]');
      const act=async(b,method,path,body)=>{err.hidden=true;b.disabled=true;try{await this.request(method,'/call-sources/'+id+path,body);reload();}catch(x){err.textContent=x.message;err.hidden=false;b.disabled=false;}};
      box.querySelector('[data-src-sync]').onclick=e=>act(e.currentTarget,'POST','/sync');
      box.querySelector('[data-src-pause]').onclick=e=>act(e.currentTarget,'PATCH','',{paused:!!e.currentTarget.dataset.srcPause});
      box.querySelector('[data-src-scope]').onclick=e=>act(e.currentTarget,'PATCH','',{scope:box.querySelector('input[name="scope-'+id+'"]:checked')?.value});
      box.querySelector('[data-src-rekey]').onclick=e=>act(e.currentTarget,'PATCH','',{api_key:box.querySelector('[data-src-key]').value});
      box.querySelector('[data-src-remove]').onclick=e=>act(e.currentTarget,'DELETE','');
    });
    root.querySelectorAll('[data-await]').forEach(row=>{
      const id=row.dataset.await,msg=row.querySelector('[role="alert"]');
      // Sending reads the meeting in the background; its ideas show up in review a minute later.
      const act=async(b,path,done)=>{b.disabled=true;try{await this.request('POST','/calls/'+id+path,{});msg.textContent=done;setTimeout(()=>this.emit('refresh'),done?1500:0);}catch(x){msg.textContent=x.message;b.disabled=false;}};
      row.querySelector('[data-await-send]').onclick=e=>act(e.currentTarget,'/send',this.t('Sent. Its ideas reach review in about a minute.'));
      row.querySelector('[data-await-skip]').onclick=e=>act(e.currentTarget,'/skip','');
    });
  }
  // Editor only: the queue shows who raised each idea, by name, and that never goes into a client-facing view.
  reviewQueue(){
    if(!this.can('editor'))return '';
    const all=this.candidates||[],pending=all.filter(c=>c.status==='pending'),decided=all.length-pending.length;
    const opps=this.data.nodes.filter(n=>n.improvement.kind==='Opportunity');
    const link=(url,text)=>/^https:\/\//.test(url||'')?` · <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`:'';
    const side={client:'client',consultant:'consultant'};
    const from=c=>{const s=c.source||{};
      if(s.kind==='fathom_call')return `Call · ${esc(s.call_title||'Untitled call')}${s.call_date?' · '+esc(new Date(s.call_date).toLocaleDateString()):''}${s.timestamp?' · '+esc(s.timestamp):''} · raised by ${esc(s.speaker||'unknown')} (${esc(side[s.side]||'side unknown')})${link(s.url,'Open recording')}`;
      return `Interview · ${esc(s.agent_name||'Lobby')} · ${esc(s.audience||'')} · ${esc(c.people)} ${c.people===1?'person':'people'}`;};
    const item=c=>{const call=c.source?.kind==='fathom_call',figures=call?c.source.figures||[]:[];
      return `<div class="cand" data-cand="${esc(c.id)}"><div class="track"><span class="tag">${esc(c.affected_area||'Not mapped')}</span><small>${from(c)}</small></div>
      <h3>${esc(c.title)}</h3><p class="pre">${esc(c.observation)}</p>${(c.quotes||[]).map(q=>`<blockquote>“${esc(q)}”</blockquote>`).join('')}
      ${figures.length?`<p class="note">Said aloud, kept as quotes, not converted: ${figures.map(esc).join(' · ')}</p>`:''}
      ${c.suggested_project_id&&c.suggested_project_title?`<p class="note">Looks like <b>${esc(c.suggested_project_title)}</b> already on the board. Consider attaching instead.</p>`:''}
      <div class="actions"><button class="primary" data-cand-accept>Accept as a new card</button><button data-cand-edit>Edit</button></div>
      ${opps.length?`<details><summary>Attach to an existing card</summary><label>Card<select data-attach-to>${opps.map(n=>`<option value="${esc(n.id)}" ${n.id===c.suggested_project_id?'selected':''}>${esc(n.title)}</option>`).join('')}</select></label><button data-cand-attach>Attach as evidence</button></details>`:''}
      <details><summary>Reject</summary><label>Why${call?' (required for an idea from a call)':' (optional)'}<input data-reject-reason maxlength="2000"></label><button data-cand-dismiss>Reject</button></details>
      <p role="alert" class="error" hidden></p></div>`;};
    const body=this.candError?`<p class="error">${esc(this.candError)}</p>`:!this.candidates?'<p class="muted">Loading…</p>':pending.map(item).join('')||'<p class="muted">Nothing waiting for review.</p>';
    return `<section class="section"><details ${pending.length?'open':''}><summary>Review queue · ${this.candidates?pending.length+' waiting':'…'}${decided?` · ${decided} decided`:''}</summary><p class="note">Ideas from interviews and recorded calls. Nothing is on the board until you accept it; an accepted idea lands as Proposed with its value not measured yet. A figure someone said stays a quote and never becomes money or hours.</p>${body}</details></section>`;
  }
  // Decisions and commitments from recorded calls are notes on the cycle log, never opportunities. Editor only (names).
  // Links beside the board. Editor adds, edits, archives; the owner may add one; readers only read. A host opts in with the
  // `documents` attribute once it routes /documents; without it the section stays hidden, so other hosts are unchanged.
  documents(){
    const docs=this.data.documents;if(!Array.isArray(docs)||!this.hasAttribute('documents'))return '';
    const live=docs.filter(d=>!d.archived_at),old=docs.filter(d=>d.archived_at),kind=k=>(docKinds.find(x=>x[0]===k)||[k,k])[1];
    const card=id=>this.data.nodes.find(n=>n.id===id);
    const size=n=>n>=1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';
    // An agreement file shows who signed it; a signed-in owner or editor who has not signed gets the Sign button.
    const signing=d=>d.kind!=='agreement'||!d.file_name?'':`<div class="sigs">${(d.signatures||[]).map(x=>`<p class="signed"><span class="tag ok">Signed</span> ${esc(x.signer_name)} <small>${esc(x.signer_role==='owner'?'Business owner':'Consultant')} · ${esc(new Date(x.signed_at).toLocaleString())}</small></p>`).join('')||'<p class="muted">Not signed yet.</p>'}${!d.signed_by_me&&['owner','editor'].includes(this.data.role)?`<button class="primary" data-doc-sign="${d.id}">Sign</button>`:''}</div>`;
    const row=d=>`<div class="done doc"><div class="tags"><span class="tag">${esc(kind(d.kind))}</span><small>Added by the ${esc(d.created_by_role==='owner'?'business owner':'consultant')}</small></div><h3>${/^https:\/\//.test(d.url||'')?`<a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.title)}</a>`:d.file_name?`<button class="link" data-doc-file="${d.id}">${esc(d.title)}</button>`:esc(d.title)}</h3>${d.file_name?`<p><small>${esc(d.file_name)} · ${esc(size(d.size_bytes))}</small></p>`:''}${d.project_id&&card(d.project_id)?`<p>For <button class="link" data-node="${d.project_id}">${esc(card(d.project_id).title)}</button></p>`:''}${signing(d)}${this.can('editor')?`<div class="actions"><button data-doc-edit="${d.id}">Edit</button><button data-doc-archive="${d.id}">Archive</button></div>`:''}</div>`;
    return `<section class="section"><div class="heading"><h2>Documents</h2>${['owner','editor'].includes(this.data.role)?'<div class="track"><button data-doc-upload>Upload a file</button><button data-doc-add>Add a link</button></div>':''}</div>
      <div class="delivered">${live.map(row).join('')||'<p class="muted">No documents yet.</p>'}</div>
      ${this.can('editor')&&old.length?`<details><summary>Archived documents · ${old.length}</summary>${old.map(d=>`<div class="person"><span>${esc(d.title)}</span><small>${esc(d.archived_reason||'')}</small><span></span><button data-doc-restore="${d.id}">Restore</button></div>`).join('')}</details>`:''}</section>`;
  }
  wireDocuments(){
    const root=this.shadowRoot,find=id=>(this.data.documents||[]).find(d=>d.id===id);
    const act=async(b,path,body)=>{b.disabled=true;try{await this.request('POST',path,body);this.emit('refresh');}catch(e){this.error=e.message;this.render();}};
    root.querySelector('[data-doc-add]')?.addEventListener('click',()=>this.editDocument(null));
    root.querySelector('[data-doc-upload]')?.addEventListener('click',()=>this.uploadDocument());
    root.querySelectorAll('[data-doc-file]').forEach(b=>b.onclick=()=>this.openFile(find(b.dataset.docFile)));
    root.querySelectorAll('[data-doc-sign]').forEach(b=>b.onclick=()=>this.signDocument(find(b.dataset.docSign)));
    root.querySelectorAll('[data-doc-edit]').forEach(b=>b.onclick=()=>this.editDocument(find(b.dataset.docEdit)));
    root.querySelectorAll('[data-doc-archive]').forEach(b=>b.onclick=()=>{const d=find(b.dataset.docArchive);act(b,'/documents/'+d.id+'/archive',{revision:d.revision});});
    root.querySelectorAll('[data-doc-restore]').forEach(b=>b.onclick=()=>{const d=find(b.dataset.docRestore);act(b,'/documents/'+d.id+'/restore',{revision:d.revision});});
  }
  editDocument(doc){
    const cards=[['','None'],...this.data.nodes.filter(n=>n.improvement.kind==='Opportunity').map(n=>[n.id,n.title])];
    const d=this.open(`<div class="heading"><h2>${doc?'Edit document':'Add a link'}</h2><button data-close>Cancel</button></div><form>${this.field('Title','title',doc?.title||'')}${this.select('Kind','kind',doc?.kind||'plan',docKinds)}${doc?.file_name?'':this.field('Link (https://…)','url',doc?.url||'','url')}${this.select('For opportunity (optional)','project_id',doc?.project_id||'',cards)}<p class="note">Share the document itself so the people in this workspace can open it. The link is saved, not the file.</p><p role="alert" class="error" hidden></p><div class="actions"><button class="primary" type="submit">Save</button></div></form>`);
    const form=d.querySelector('form');
    form.onsubmit=async e=>{e.preventDefault();const err=form.querySelector('[role="alert"]'),btn=form.querySelector('[type="submit"]'),f=form.elements;err.hidden=true;btn.disabled=true;
      const body={title:f.title.value,kind:f.kind.value,...(doc?.file_name?{}:{url:f.url.value.trim()}),project_id:f.project_id.value||null};
      try{await this.request(doc?'PATCH':'POST',doc?'/documents/'+doc.id:'/documents',doc?{...body,revision:doc.revision}:body);d.close();this.emit('refresh');}catch(e){err.textContent=e.message;err.hidden=false;btn.disabled=false;}};
  }
  // A file is stored privately; the host sends the form as is. Agreements are signed after upload.
  uploadDocument(){
    const cards=[['','None'],...this.data.nodes.filter(n=>n.improvement.kind==='Opportunity').map(n=>[n.id,n.title])];
    const d=this.open(`<div class="heading"><h2>Upload a file</h2><button data-close>Cancel</button></div><form>${this.field('Title','title','')}${this.select('Kind','kind','agreement',docKinds)}<label>File (PDF, Word, Excel, PowerPoint, image; up to 20 MB)<input name="file" type="file" required accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg,.webp,.txt"></label>${this.select('For opportunity (optional)','project_id','',cards)}<p class="note">The file is kept privately and opens only for people in this workspace. An agreement can be signed once it is uploaded.</p><p role="alert" class="error" hidden></p><div class="actions"><button class="primary" type="submit">Upload</button></div></form>`);
    const form=d.querySelector('form');
    form.onsubmit=async e=>{e.preventDefault();const err=form.querySelector('[role="alert"]'),btn=form.querySelector('[type="submit"]'),f=form.elements;err.hidden=true;btn.disabled=true;
      const fd=new FormData();fd.append('title',f.title.value);fd.append('kind',f.kind.value);if(f.project_id.value)fd.append('project_id',f.project_id.value);fd.append('file',f.file.files[0]);
      try{await this.request('POST','/documents/upload',fd);d.close();this.emit('refresh');}catch(e){err.textContent=this.t(e.message);err.hidden=false;btn.disabled=false;}};
  }
  // Files come back through the API with the viewer's own access; a window opened on the click keeps popup blockers quiet.
  async openFile(doc){
    const win=window.open('','_blank');
    try{const blob=await this.request('GET','/documents/'+doc.id+'/file',undefined,'blob');const url=URL.createObjectURL(blob);
      if(win)win.location.href=url;else{const a=document.createElement('a');a.href=url;a.download=doc.file_name;a.click();}setTimeout(()=>URL.revokeObjectURL(url),60000);}
    catch(e){win?.close();this.error=e.message;this.render();}
  }
  signDocument(doc){
    const consent='I have read this document and I sign it electronically. My typed name is my signature. / קראתי את המסמך ואני חותם/ת עליו באופן אלקטרוני. השם שהקלדתי הוא החתימה שלי.';
    const d=this.open(`<div class="heading"><h2>Sign: ${esc(doc.title)}</h2><button data-close>Cancel</button></div><form><p><button type="button" data-open-doc>Open the document</button></p><p class="note">Signing binds your name to this exact file (fingerprint ${esc(String(doc.sha256||'').slice(0,12))}…). The date and time are recorded with it.</p>${this.field('Full name','full_name','')}<label class="opt"><span><input type="checkbox" name="consent" style="width:auto"> <bdi>${esc(consent)}</bdi></span></label><p role="alert" class="error" hidden></p><div class="actions"><button class="primary" type="submit">Sign</button></div></form>`);
    const form=d.querySelector('form');
    form.querySelector('[data-open-doc]').onclick=()=>this.openFile(doc);
    form.onsubmit=async e=>{e.preventDefault();const err=form.querySelector('[role="alert"]'),btn=form.querySelector('[type="submit"]'),f=form.elements;err.hidden=true;btn.disabled=true;
      try{await this.request('POST','/documents/'+doc.id+'/sign',{full_name:f.full_name.value,consent:f.consent.checked});d.close();this.emit('refresh');}catch(e){err.textContent=this.t(e.message);err.hidden=false;btn.disabled=false;}};
  }
  callLog(){
    const calls=this.data.call_log||[];if(!this.can('editor')||!calls.length)return '';
    const list=(title,rows,who)=>rows?.length?`<h3>${title}</h3><ul>${rows.map(r=>`<li>${esc(r.text)}${r[who]?` <small>· ${esc(r[who])}</small>`:''}${r.timestamp?` <small>· ${esc(r.timestamp)}</small>`:''}</li>`).join('')}</ul>`:'';
    return `<section class="section"><details><summary>Recorded calls · ${calls.length}</summary>${calls.map(c=>`<div class="done call"><b>${esc(c.title||'Untitled call')}</b><p>${c.started_at?esc(new Date(c.started_at).toLocaleString()):'Date unknown'} · ${esc(c.candidates_created)} idea${c.candidates_created===1?'':'s'} sent to review${/^https:\/\//.test(c.url||'')?` · <a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">Open recording</a>`:''}</p>${list('Decided',c.notes?.decisions,'speaker')}${list('Committed',c.notes?.commitments,'owner')}</div>`).join('')}</details></section>`;
  }
  editCandidate(c){
    const d=this.open(`<div class="heading"><h2>Edit before deciding</h2><button data-close>Cancel</button></div><form>${this.field('Title','title',c.title)}<label>What was said<textarea name="observation" rows="6">${esc(c.observation)}</textarea></label><p class="note">Quotes stay as they were said.</p><p role="alert" class="error" hidden></p><div class="actions"><button class="primary" type="submit">Save</button></div></form>`);
    const form=d.querySelector('form');
    form.onsubmit=async e=>{e.preventDefault();const err=form.querySelector('[role="alert"]'),btn=form.querySelector('[type="submit"]');err.hidden=true;btn.disabled=true;
      try{await this.request('PATCH','/candidates/'+c.id,{title:form.elements.title.value,observation:form.elements.observation.value});d.close();this.loadCandidates();}catch(e){err.textContent=e.message;err.hidden=false;btn.disabled=false;}};
  }
  // Three numbers, never added together. Every line is one evidence type; business-confirmed lines come first.
  headline(h){
    const col=(title,lines,sub)=>{const shown=lines.filter(l=>l.records&&(l.usd!==null||l.time_usd!==null||l.unpriced_hours!==null));
      const row=l=>`<div class="hl"><span class="tag ${esc(l.type)}">${esc(l.type)}</span><b>${l.usd!==null?esc(money(l.usd,this.cur)):'—'}</b>${l.time_usd!==null?`<small>+ ${esc(money(l.time_usd,this.cur))} of time (conversion)</small>`:''}${l.unpriced_hours!==null?`<small>${esc(money(l.unpriced_hours,'hours'))} not priced</small>`:''}</div>`;
      const part=(c,label)=>{const ls=shown.filter(l=>l.confirmed===c);return ls.length?`<p class="hlgroup">${label}</p>${ls.map(row).join('')}`:'';};
      return `<div class="hlcol"><h3>${title}</h3><small>${sub}</small>${part(true,'Confirmed by the business')}${part(false,'Not yet confirmed')||''}${shown.length?'':'<p class="muted">Nothing quantified yet</p>'}</div>`;};
    return `<section class="section"><h2>Value</h2><div class="headline">${col('One-time value',h.one_time,'once')}${col('Monthly recurring',h.per_month,'every month')}${col('Annualized',h.annualized,'monthly × 12 · run-rate, not money received')}</div><p class="note">${esc(h.note)}</p></section>`;
  }
  tree(parent,nodes){return nodes.filter(n=>n.parent_id===parent).map(n=>`<div class="map"><button data-node="${n.id}"><small>${esc(n.improvement.kind)}</small> · ${esc(n.title)}</button>${this.tree(n.id,nodes)}</div>`).join('');}
  open(html){const d=this.shadowRoot.querySelector('dialog');d.innerHTML=`<div class="detail">${html}</div>`;this.localize(d);if(!d.open)d.showModal();d.querySelector('[data-close]')?.addEventListener('click',()=>d.close());return d;}
  detail(id){
    const n=this.data.nodes.find(n=>n.id===id),v=n.improvement;
    const g=v.groundwork;const names=ids=>(ids||[]).map(id=>this.data.anatomy?.find(a=>a.id===id)?.name||'Unresolved reference').join(' · ')||'Not yet mapped';
    const d=this.open(`<div class="heading"><span class="eyebrow">${esc(v.kind)} · ${esc(v.status)}</span><button data-close>Close</button></div><h1>${esc(n.title)}</h1><p>${esc(n.description)}</p><p><b>Owner:</b> ${esc(v.owner||'Not set')} · <b>Review date:</b> ${esc(v.review_date||'Not set')}</p>${n.gaps?.length?`<p class="gaptext"><b>Missing:</b> ${esc(n.gaps.join(' · '))}</p>`:''}${this.approvalPanel(n)}<div class="notice">${esc(n.priority_assessment.explanation)}</div><div class="two"><div><h3>Desired outcome</h3><p>${esc(v.desired_outcome)}</p><h3>Hypothesis</h3><p>${esc(v.hypothesis||'Not yet recorded')}</p><h3>Baseline → Target</h3><p>${esc(v.baseline||'Baseline needed')} → ${esc(v.target||'Target to agree')}</p></div><div><h3>KPIs</h3><p>${esc(v.kpis.join(' · '))}</p><h3>Input → Output</h3><p>${esc(n.inputs.join(' · '))} → ${esc(n.outputs.join(' · '))}</p><h3>Dependencies</h3><p>${esc(n.dependencies.map(id=>this.data.nodes.find(x=>x.id===id)?.title||id).join(' · ')||'None recorded')}</p></div></div>
    <h2>Affected business anatomy</h2><p>${esc(names(g?.affected_anatomy_ids))}</p><p><b>Objectives:</b> ${esc(names(g?.objective_ids))}</p><p><b>Intervention type:</b> ${esc(g?.change_types.join(' · ')||'Unknown')} · <b>Delivery evidence:</b> ${esc(g?.delivery||'unknown')}</p><h3>Observation and diagnosis</h3><p>${esc(g?.observation||n.description)}</p><p>${esc(g?.diagnosis||'Diagnosis not recorded')}</p><h3>Measurement design</h3>${g?.measurement_plan?Object.entries(g.measurement_plan).map(([key,value])=>`<p><b>${esc(key.replaceAll('_',' '))}:</b> ${esc(value||'Unknown')}</p>`).join(''):'<p>Baseline needed. Define metric version, population, comparison window, source, method and guardrails before execution.</p>'}
    <h2>Improvement cycle · Round ${v.cycle.round}</h2><div class="cycle">${cycle.map(c=>`<span class="${c===v.cycle.stage?'selected':''}">${esc(c)}</span>`).join('')}</div><p class="pre">${esc(v.cycle.notes[v.cycle.stage]||'Record the learning and evidence at this step.')}</p><p>Decision: ${esc(v.cycle.decision||'Not yet made')}</p><h2>Impact and evidence</h2>${n.impact_results.length?n.impact_results.map(i=>`<div class="impact"><span class="tag ${esc(i.type)}">${esc(i.type)}</span>${i.outcome?` <span class="tag">${esc(i.outcome.category)} · ${esc(i.outcome.basis)}</span>`:''}<h3>${esc(i.metric)}</h3><p>${esc(impactText(i))}</p><p>Before: ${esc(i.baseline??'Missing')} · After: ${esc(i.actual??'Not measured')} · Target: ${esc(i.target??'Not agreed')}</p><p>${esc(i.period)}</p><p>${esc(i.expected)}</p><p class="pre">Evidence: ${esc(i.evidence||'Needed')}</p><p>${esc(i.assumptions)}</p>${i.calculation?`<p>Calculation: ${esc(i.calculation.operation)} (${i.calculation.inputs.map(esc).join(', ')})</p>`:''}</div>`).join(''):'<p>No impact evidence recorded.</p>'}
    <h3>Learning and professional / company knowledge</h3><p class="pre">${esc(v.knowledge)}</p><p class="pre">${esc(v.learning||'Learning to record')}</p><h3>Documentation / SOP updates</h3><p class="pre">${esc(v.documentation||'Update needed')}</p><h3>Evidence sources</h3><ul>${v.sources.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><h2>Comments</h2><div data-comments><p class="muted">Loading…</p></div>${['owner','editor'].includes(this.data.role)?`<form data-comment-form><input type="hidden" name="parent_id"><label><span data-replying>Add a comment</span><textarea name="body" rows="3" maxlength="4000"></textarea></label><div class="actions"><button class="primary" type="submit">Post</button><button type="button" data-cancel-reply hidden>Not a reply</button></div><p role="alert" class="error" hidden></p></form>`:''}
    <div class="actions">${this.data.role==='editor'?'<button class="primary" data-edit>Edit / advance cycle</button>':''}<button data-history>Change history</button></div>${this.data.role==='editor'?`<details><summary>Archive this card</summary><label>Why (optional)<input name="archive_reason" data-archive-reason maxlength="2000"></label><div class="actions"><button data-archive>Archive</button></div><p role="alert" class="error" data-archive-error hidden></p></details>`:''}<div data-events></div>`);
    d.querySelector('[data-edit]')?.addEventListener('click',()=>this.edit(n));
    this.wireApproval(d,n);this.loadComments(d,n);
    const archive=d.querySelector('[data-archive]');
    if(archive)archive.onclick=async()=>{archive.disabled=true;const err=d.querySelector('[data-archive-error]');err.hidden=true;try{await this.request('POST','/nodes/'+n.id+'/archive',{revision:n.revision,reason:d.querySelector('[data-archive-reason]').value.trim()||undefined});d.close();this.emit('refresh');}catch(e){err.textContent=e.message;err.hidden=false;archive.disabled=false;}};
    d.querySelector('[data-history]').onclick=()=>this.emit('history',{id,target:d.querySelector('[data-events]')});
  }
  // Value sign-off. The backend decides who may move where; buttons only offer the next step for this role, and back for the editor.
  approvalPanel(n){
    const a=n.value_approval;if(!a)return '';
    const states=this.data.approval_states||[],ix=states.findIndex(s=>s.key===a.state),cur=states[ix],next=cur?.terminal?null:states[ix+1];
    const forward=next&&next.allowed_roles.includes(this.data.role),back=this.can('editor')&&ix>0;
    return `<div class="notice"><div class="track"><b>Value sign-off:</b> ${this.approvalTag(n)}<small>Proposed by ${esc(a.proposed_by||'unknown')} · entered by ${esc(a.entered_by||'unknown')}</small></div><p>${a.value_delivered?'The business has confirmed this value.':'Value stays Expected or Estimated until the business confirms it.'}</p>${forward||back?`<label>Note (needed to move back)<input data-approval-note maxlength="4000"></label><div class="actions">${forward?`<button class="primary" data-approve="${esc(next.key)}">Move to ${esc(next.label)}</button>`:''}${back?`<button data-approve="${esc(states[ix-1].key)}">Back to ${esc(states[ix-1].label)}</button>`:''}</div><p role="alert" class="error" data-approval-error hidden></p>`:''}</div>`;
  }
  wireApproval(d,n){
    d.querySelectorAll('[data-approve]').forEach(b=>b.onclick=async()=>{
      const err=d.querySelector('[data-approval-error]');err.hidden=true;b.disabled=true;
      try{const note=d.querySelector('[data-approval-note]').value.trim();await this.request('POST','/nodes/'+n.id+'/approval',{to:b.dataset.approve,revision:n.revision,...(note?{note}:{})});
        d.close();this.emit('refresh');}
      catch(e){err.textContent=e.message;err.hidden=false;b.disabled=false;}});
  }
  async loadComments(d,n){
    const box=d.querySelector('[data-comments]'),form=d.querySelector('[data-comment-form]'),f=form?.elements;
    const who=r=>r==='owner'?'Business owner':'Consultant';
    const draw=rows=>{const kids=p=>rows.filter(c=>(c.parent_id||null)===p);const one=c=>`<div class="comment"><small>${esc(who(c.role))} · ${esc(new Date(c.created_at).toLocaleString())}</small><p class="pre">${esc(c.body)}</p>${form?`<button type="button" data-reply="${c.id}">Reply</button>`:''}${kids(c.id).map(one).join('')}</div>`;
      box.innerHTML=kids(null).map(one).join('')||'<p class="muted">No comments yet.</p>';this.localize(box);
      box.querySelectorAll('[data-reply]').forEach(b=>b.onclick=()=>{f.parent_id.value=b.dataset.reply;form.querySelector('[data-replying]').textContent=this.t('Reply');form.querySelector('[data-cancel-reply]').hidden=false;f.body.focus();});};
    try{draw(await this.request('GET','/nodes/'+n.id+'/comments'));}catch(e){box.innerHTML=`<p class="error">${esc(e.message)}</p>`;}
    if(!form)return;
    form.querySelector('[data-cancel-reply]').onclick=()=>{f.parent_id.value='';form.querySelector('[data-replying]').textContent=this.t('Add a comment');form.querySelector('[data-cancel-reply]').hidden=true;};
    form.onsubmit=async e=>{e.preventDefault();const err=form.querySelector('[role="alert"]'),btn=form.querySelector('[type="submit"]');err.hidden=true;btn.disabled=true;
      try{await this.request('POST','/nodes/'+n.id+'/comments',{body:f.body.value,...(f.parent_id.value?{parent_id:f.parent_id.value}:{})});form.reset();form.querySelector('[data-cancel-reply]').onclick();draw(await this.request('GET','/nodes/'+n.id+'/comments'));}
      catch(e){err.textContent=e.message;err.hidden=false;}btn.disabled=false;};
  }
  // A proposal is a title and a description; everything else is the consultant's to fill in, shown as missing until then.
  propose(){
    const d=this.open(`<div class="heading"><h2>Propose an idea</h2><button data-close>Cancel</button></div><form>${this.field('What should change?','title','')}${this.area('Why — what you see today','description','')}<p class="note">It lands as Proposed. The consultant reviews it, fills in the details and decides what comes first.</p><p role="alert" class="error" hidden></p><div class="actions"><button class="primary" type="submit">Propose</button></div></form>`);
    const form=d.querySelector('form');
    form.onsubmit=async e=>{e.preventDefault();const err=form.querySelector('[role="alert"]'),btn=form.querySelector('[type="submit"]');err.hidden=true;btn.disabled=true;
      try{await this.request('POST','/proposals',{title:form.elements.title.value,description:form.elements.description.value});d.close();this.emit('refresh');}catch(e){err.textContent=e.message;err.hidden=false;btn.disabled=false;}};
  }
  edit(n,kind='Opportunity'){
    const fresh={title:'',description:'',parent_id:null,inputs:[],outputs:[],dependencies:[],improvement:{kind,status:'Discovered',desired_outcome:'',owner:'Unassigned',hypothesis:'',baseline:'',target:'',kpis:[],knowledge:'',learning:'',documentation:'',impact:null,confidence:null,effort:null,urgency:null,priority_reason:'',impacts:[],sources:[],cycle:{stage:'Learning',round:1,notes:{},decision:''}}};
    const original=structuredClone(n||fresh),v=original.improvement;
    v.groundwork ||= {version:1,affected_anatomy_ids:[],objective_ids:[],change_types:[],observation:original.description,diagnosis:'',delivery:'unknown',measurement_plan:null};
    const g=v.groundwork;
    const refs=(label,key,type)=>`<label>${label}<select multiple name="${key}" size="3">${(this.data.anatomy||[]).filter(a=>type==='Objective'?a.entity_type==='Objective':a.entity_type!=='Objective'&&a.entity_type!=='Purpose').map(a=>`<option value="${a.id}" ${g[key].includes(a.id)?'selected':''}>${esc(a.entity_type)} · ${esc(a.name)}</option>`).join('')}</select></label>`;
    const options=[['','Unplaced — map later'],...this.data.nodes.filter(x=>x.id!==n?.id).map(x=>[x.id,x.title])];
    const impactFields=(i,index)=>`<div class="impact" data-impact="${index}"><h3>Evidence ${index+1}</h3><div class="formgrid">${this.select('Evidence type',`i${index}_type`,i.type,evidence)}${this.field('Metric',`i${index}_metric`,i.metric)}${this.field('Unit',`i${index}_unit`,i.unit)}${this.field('Period / observation date',`i${index}_period`,i.period)}${['baseline','actual','target'].map(k=>this.field(k,`i${index}_${k}`,i[k]??'','number')).join('')}</div>${this.area('Expected effect',`i${index}_expected`,i.expected)}${this.area('Inspectable evidence / source',`i${index}_evidence`,i.evidence)}${this.area('Assumptions',`i${index}_assumptions`,i.assumptions)}<div class="formgrid">${this.select(`Business outcome (Revenue/Cost in ${this.cur}, Hours in hours)`,`i${index}_category`,i.outcome?.category||'',[['','Not an outcome value'],...outcomes])}${this.select('Basis',`i${index}_basis`,i.outcome?.basis||'per month',['per month','one-time'])}${this.select('Whose time (Hours saved only)',`i${index}_person`,i.outcome?.person||'',[['','Nobody named · hours only'],...(this.data.workspace.people||[]).map(p=>[p.key,p.name])])}</div><div class="formgrid">${this.select('Estimate operation (estimated evidence only)',`i${index}_operation`,i.calculation?.operation||'',['','difference','ratio','product'])}${this.field('Two numeric inputs, comma separated',`i${index}_inputs`,i.calculation?.inputs.join(', ')||'')}</div></div>`;
    const d=this.open(`<div class="heading"><h2>${n?'Update initiative':'Map new work'}</h2><button data-close>Cancel</button></div><form><div class="formgrid">${this.field('Title','title',original.title)}${n?`<p>Kind: ${esc(v.kind)}</p>`:this.select('Work type','kind',v.kind,kinds)}${this.select('Parent','parent_id',original.parent_id||'',options)}${this.select('Pipeline stage','status',v.status,n?stages:['Discovered'])}${this.field('Owner / assignee','owner',v.owner)}${this.field('Next review date','review_date',v.review_date||'','date')}${this.field('KPIs (one per line is also accepted)','kpis',v.kpis.join('; '))}</div>${this.area('Problem / observation','description',original.description)}${refs('Affected business anatomy (empty means unmapped)','affected_anatomy_ids')}${refs('Business objectives','objective_ids','Objective')}<label>Change types<select multiple name="change_types" size="3">${changes.map(c=>`<option value="${c}" ${g.change_types.includes(c)?'selected':''}>${c}</option>`).join('')}</select></label>${this.area('Diagnosis and uncertainty','diagnosis',g.diagnosis)}${this.select('Delivery evidence','delivery',g.delivery,['unknown','proposed','code-present','source-reported'])}<details><summary>Measurement design · required before execution</summary>${['metric','definition_version','population','window','source','method','baseline_gap','guardrails'].map(k=>this.area(k.replaceAll('_',' '),'plan_'+k,g.measurement_plan?.[k]||'')).join('')}</details>${this.area('Desired outcome','desired_outcome',v.desired_outcome)}${this.area('Assumption / hypothesis','hypothesis',v.hypothesis)}<div class="formgrid">${this.area('Baseline','baseline',v.baseline)}${this.area('Target','target',v.target)}${this.area('Inputs (one per line)','inputs',original.inputs.join('\n'))}${this.area('Outputs (one per line)','outputs',original.outputs.join('\n'))}</div><label>Dependencies<select name="dependencies" multiple size="4">${this.data.nodes.filter(x=>x.id!==n?.id).map(x=>`<option value="${x.id}" ${original.dependencies.includes(x.id)?'selected':''}>${esc(x.title)}</option>`).join('')}</select></label><div class="formgrid">${['impact','confidence','effort','urgency'].map(k=>this.select(k+' (1 low · 2 medium · 3 high)',k,v[k]===null?'':String(v[k]),[['','Not assessed'],'1','2','3'])).join('')}</div>${this.area('Why this priority?','priority_reason',v.priority_reason)}<h3>Improvement cycle · ${esc(v.cycle.stage)} · Round ${v.cycle.round}</h3>${this.area('Notes for the current cycle step','cycle_notes',v.cycle.notes[v.cycle.stage]||'')}${this.select('Decision at Improving','decision',v.cycle.decision,['','continue','improve','replace','stop'])}${n?`<label><span><input style="width:auto" type="checkbox" name="advance"> Advance to ${esc(cycle[(cycle.indexOf(v.cycle.stage)+1)%cycle.length])} after saving these notes</span></label>`:''}${this.area('Company / process / professional knowledge','knowledge',v.knowledge)}${this.area('Learning','learning',v.learning)}${this.area('Documentation / SOP updates','documentation',v.documentation)}${this.area('Evidence sources (one per line)','sources',v.sources.join('\n'))}<h3>Impact evidence</h3><div data-impacts>${v.impacts.map(impactFields).join('')}</div><button type="button" data-add>Add evidence</button><p role="alert" class="error" hidden></p><div class="actions"><button class="primary" type="submit">Save changes</button></div></form>`);
    const form=d.querySelector('form');let count=v.impacts.length;
    d.querySelector('[data-add]').onclick=()=>{d.querySelector('[data-impacts]').insertAdjacentHTML('beforeend',impactFields({type:evidence[3]},count++));};
    form.onsubmit=async e=>{
      e.preventDefault();const fd=new FormData(form),get=k=>String(fd.get(k)??''),lines=k=>get(k).split(k==='kpis'?/\n|;/:/\n/).map(s=>s.trim()).filter(Boolean);
      const body={title:get('title'),description:get('description'),parent_id:get('parent_id')||null,inputs:lines('inputs'),outputs:lines('outputs'),dependencies:fd.getAll('dependencies'),revision:original.revision,improvement:structuredClone(v)};
      const next=body.improvement;
      const plan=Object.fromEntries(['metric','definition_version','population','window','source','method','baseline_gap','guardrails'].map(k=>[k,get('plan_'+k)]));
      next.groundwork={version:1,affected_anatomy_ids:fd.getAll('affected_anatomy_ids'),objective_ids:fd.getAll('objective_ids'),change_types:fd.getAll('change_types'),observation:get('description'),diagnosis:get('diagnosis'),delivery:get('delivery'),measurement_plan:Object.values(plan).some(x=>x.trim())?plan:null};
      next.review_date=get('review_date');
      for(const k of ['status','owner','desired_outcome','hypothesis','baseline','target','priority_reason','knowledge','learning','documentation'])next[k]=get(k);
      if(!n)next.kind=get('kind');for(const k of ['impact','confidence','effort','urgency'])next[k]=get(k)===''?null:Number(get(k));next.kpis=lines('kpis');next.sources=lines('sources');next.cycle.notes[v.cycle.stage]=get('cycle_notes');next.cycle.decision=get('decision');
      if(fd.has('advance')){const ix=(cycle.indexOf(v.cycle.stage)+1)%cycle.length;next.cycle.stage=cycle[ix];if(ix===0){next.cycle.round++;}}
      next.impacts=Array.from({length:count},(_,j)=>{const i={};for(const k of ['type','metric','unit','period','expected','evidence','assumptions'])i[k]=get(`i${j}_${k}`);for(const k of ['baseline','actual','target']){const raw=get(`i${j}_${k}`);i[k]=raw===''?null:Number(raw);}const op=get(`i${j}_operation`);if(op)i.calculation={operation:op,inputs:get(`i${j}_inputs`).split(',').map(Number)};const cat=get(`i${j}_category`),person=get(`i${j}_person`);if(cat)i.outcome={category:cat,basis:get(`i${j}_basis`),...(cat==='Hours saved'&&person?{person}:{})};return i;});
      const button=form.querySelector('[type="submit"]'),error=form.querySelector('[role="alert"]');button.disabled=true;error.hidden=true;
      this.emit('save',{id:n?.id||null,body,done:(err)=>{button.disabled=false;if(err){error.textContent=err;error.hidden=false;}else d.close();}});
    };
  }
}
customElements.define('groundwork-improvement',GroundworkImprovement);
