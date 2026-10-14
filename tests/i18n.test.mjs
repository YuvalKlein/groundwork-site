import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
// Load the shared bundle's translation helpers without a browser: stub the custom-element API.
const ctx = vm.createContext({HTMLElement: class {}, customElements: {define() {}}});
vm.runInContext(readFileSync('client-os/improvement-view.js', 'utf8') + ';globalThis.__he={heText,HE};', ctx);
const {heText, HE} = ctx.__he;
test('every Hebrew entry is filled in', () => {
  for (const [en, he] of Object.entries(HE)) assert.ok(typeof he === 'string' && he.trim() && he !== en, en);
});
test('labels, counts and composites translate; surrounding spaces stay', () => {
  assert.equal(heText('Discovered'), 'זוהתה');
  assert.equal(heText(' Proposed '), ' הוצע ');
  assert.equal(heText('3 missing'), '3 שדות חסרים');
  assert.equal(heText('1 missing'), 'שדה אחד חסר');
  assert.equal(heText('Opportunity · Discovered'), 'הזדמנות · זוהתה');
  assert.equal(heText('Missing: Baseline, Effort'), 'חסר: נקודת בסיס, מאמץ');
  assert.equal(heText('Baseline needed → Target to agree'), 'נדרשת נקודת בסיס ← יעד לסיכום');
  assert.equal(heText('Some baseline → Target to agree'), 'Some baseline ← יעד לסיכום');
  assert.equal(heText('Proposed by yuval · entered by owner'), 'הוצע על ידי היועץ · הוזן על ידי בעלת העסק');
  assert.match(heText('Impact null × confidence 1 × urgency 2 ÷ effort null. Coarse 1–3 judgments, not an ROI forecast. Reason.'), /^השפעה null × ביטחון 1 .* Reason\.$/);
});
test("people's own text is left as written", () => {
  for (const s of ['Self-serve digital courses', 'Consultant + Owner', '15 of 16 course products have 0 members', '']) assert.equal(heText(s), s);
});
test('the page shell translates only its marked labels', () => {
  const src = readFileSync('client-os/shell-i18n.js', 'utf8');
  const els = [{textContent: 'Sign out', dataset: {}}, {textContent: 'Workspace', dataset: {}}];
  const doc = {documentElement: {}, querySelectorAll: () => els};
  const run = (lang, nav) => {const c = vm.createContext({window: {groundworkCallback: lang ? '?lang=' + lang : ''}, document: doc, navigator: {language: nav}, localStorage: {getItem() {return null;}, setItem() {}}, URLSearchParams}); vm.runInContext(src, c); return c.window.groundworkShell;};
  const he = run('he', 'en-US');
  assert.equal(doc.documentElement.dir, 'rtl');
  assert.deepEqual(els.map(e => e.textContent), ['יציאה', 'סביבת עבודה']);
  he.apply('en');
  assert.deepEqual(els.map(e => e.textContent), ['Sign out', 'Workspace']);
  assert.equal(doc.documentElement.dir, 'ltr');
  assert.equal(run('', 'he-IL').lang, 'he');
  assert.equal(run('', 'en-US').lang, 'en');
});
