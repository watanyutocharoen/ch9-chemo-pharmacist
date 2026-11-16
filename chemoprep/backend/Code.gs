/**
 * ระบบบันทึกการผสมเคมีบำบัด v2 (แทนโปรแกรม Access IV Admixture — ส่วน Chemotherapy)
 * โรงพยาบาลจุฬารัตน์ 9 แอร์พอร์ต
 *
 * ติดตั้ง: ดู README.md
 * Deploy: เรียกใช้ในฐานะ "ฉัน" · ผู้มีสิทธิ์เข้าถึง "ทุกคนที่มีบัญชี Google" (ระบบมีหน้าเข้าสู่ระบบของตัวเอง)
 */

const TZ = 'Asia/Bangkok';
const DEFAULT_PW = '12345678';
const SESSION_SEC = 15 * 60;           // ไม่ได้ใช้งาน 15 นาที = หมดเวลา
const SH = {
  Visits:   ['id','date','vn','HN','ward','phcode','emcode','mixTime','wt','ht','scr','regimen','note','preparedAt','preparedBy','cancelled','photos','updatedAt','updatedBy',
              'doseStatus','doseIssues','doseReason','doseReasonNote','doseDetail','checkedBy'],
  Bottles:  ['id','visitId','date','bottleNo','productcde','mg','diluent','route','rate','rateUnit','tvol','note','printed'],
  Patients: ['HN','title','name','surname','dob','sex','allergyFlag','allergy','ward','offService','wt','ht','scr','lastVisit'],
  Products: ['productcde','productname','generic','mgPerMl','mlPerVial','unit','stRecon','stDilute','storage','recon','mlRecon','chemo','off'],
  Diluents: ['pcode','name','generic','mlPerBot','off'],
  Staff:    ['code','empId','name','fullName','role','active','canLogin','admin','mixer','pwHash'],
  Wards:    ['code','name','tel','partner'],
  Lookups:  ['type','code','text'],
  Titles:   ['code','title','sex'],
  Settings: ['key','value','note'],
  EyeFormulas: ['code','name','labelName','method','storage','expDays','active'],
  EyeDrops: ['id','date','seq','HN','ward','formula','directions','qty','prepTime','phcode','emcode','note','printed','updatedAt','updatedBy'],
  Logs:     ['time','code','name','action','detail']
};
const TEXT_COLS = ['id','visitId','date','mixTime','prepTime','preparedAt','dob','lastVisit','HN','productcde','pcode','diluent','phcode','emcode',
                   'rate','updatedAt','code','empId','storage','recon','ward','value','formula','directions','regimen','photos','time','pwHash',
                   'doseStatus','doseIssues','doseReason','doseReasonNote','doseDetail','checkedBy'];

// สูตรยาหยอดตาเริ่มต้น (อ้างอิงงานผลิตยา ฝ่ายเภสัชกรรม รพ.รามาธิบดี)
const EYE_DEFAULT = [
  ['AMK','Amikacin ED 50 mg/ml 10 ml','F. Amikacin Eye drop','ใช้ยา Amikacin ขนาด 500 มิลลิกรัม/2 มิลลิลิตร บรรจุในขวดยาหยอดตา แล้วเติมน้ำกลั่นสำหรับฉีดลงในขวดยาหยอดตาอีก 8 มิลลิลิตร','เก็บในตู้เย็น',7,1],
  ['AMB','Amphotericin ED 0.3% 10 ml','F. Amphotericin B Eye drop','ละลายยาฉีด Amphotericin B ขนาด 50 มิลลิกรัม โดยใช้น้ำกลั่นสำหรับฉีดจำนวน 10 มิลลิลิตร แบ่งน้ำยาที่ได้ใส่ขวดยาหยอดตาจำนวน 6 มิลลิลิตร แล้วผสมน้ำกลั่นสำหรับฉีดในขวดยาหยอดตาอีก 4 มิลลิลิตร','เก็บในตู้เย็น',7,1],
  ['CFZ','Cefazolin ED 50 mg/ml 10 ml','F. Cefazolin Eye drop','ใช้ syringe ดูดน้ำตาเทียม (Lac Oph) 2 มิลลิลิตร และน้ำกลั่นสำหรับฉีด 2 มิลลิลิตร รวมเป็น 4 มิลลิลิตร ละลายผงยาฉีด Cefazolin ที่ได้ 4 มิลลิลิตร ใส่ลงในขวดน้ำตาเทียม (Lac Oph) ที่เหลืออยู่ 8 มิลลิลิตร จะได้ Cefazolin 50 มิลลิกรัม/มิลลิลิตร จำนวน 10 มิลลิลิตร','เก็บในตู้เย็น',7,1],
  ['CAZ','Ceftazidime ED 50 mg/ml 10 ml','F. Ceftazidime Eye drop','ละลายผงยาฉีด Ceftazidime ขนาด 500 มิลลิกรัม โดยใช้น้ำกลั่นสำหรับฉีดจำนวน 10 มิลลิลิตร แล้วนำสารละลายที่ได้บรรจุในขวดยาหยอดตา','เก็บในตู้เย็น',7,1],
  ['GEN','Gentamicin ED 14 mg/ml 7 ml','F. Gentamicin Eye drop','ใช้ยาฉีด Gentamicin 80 มิลลิกรัม/2 มิลลิลิตร จำนวน 2 มิลลิลิตร ฉีดผสมลงในยาหยอดตา Gentamicin 0.3% 5 มิลลิลิตร จะได้ยาหยอดตา 7 มิลลิลิตร','อุณหภูมิห้อง',7,1],
  ['VAN','Vancomycin ED 50 mg/ml 10 ml','F. Vancomycin Eye drop','ละลายผงยาฉีด Vancomycin ขนาด 500 มิลลิกรัม โดยใช้น้ำกลั่นสำหรับฉีดจำนวน 10 มิลลิลิตร จากนั้นนำสารละลายที่ได้บรรจุในขวดยาหยอดตา','เก็บในตู้เย็น',7,1]
];

function doGet(e) {
  if (e && e.parameter && e.parameter.api === 'ping') return json_({ ok: true, app: 'ChemoPrep', time: now_() });
  try {
    return HtmlService.createTemplateFromFile('Index').evaluate()
      .setTitle('บันทึกการผสมเคมีบำบัด · CH9 Airport')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {  // ใช้แบบ API อย่างเดียว (หน้าเว็บอยู่บน GitHub Pages)
    return HtmlService.createHtmlOutput('<meta charset="utf-8"><p style="font-family:sans-serif">ChemoPrep API ทำงานอยู่ ✅ — เปิดโปรแกรมที่ <a href="' + WEB_URL + '">' + WEB_URL + '</a></p>');
  }
}
const WEB_URL = 'https://watanyutocharoen.github.io/ch9-chemo-pharmacist/chemoprep/';
function include(name) { return HtmlService.createHtmlOutputFromFile(name).getContent(); }

function onOpen() {
  SpreadsheetApp.getUi().createMenu('ระบบเคมีบำบัด')
    .addItem('ตั้งค่าแผ่นงาน (ครั้งแรก / หลังอัปเดต)', 'setupSheets')
    .addItem('ล้างข้อมูลเก่าเกินกำหนด…', 'archiveOldMenu')
    .addToUi();
}

// =====================================================================
//  helpers
// =====================================================================
function ss_() { return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SSID')); }
function sheet_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('ไม่พบแผ่นงาน ' + name + ' — กดเมนู ระบบเคมีบำบัด › ตั้งค่าแผ่นงาน');
  return sh;
}
function hasSheet_(name) { return !!ss_().getSheetByName(name); }
function cell_(v, col) {
  if (v instanceof Date) {
    if (['mixTime','prepTime','preparedAt','updatedAt','time'].indexOf(col) >= 0) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd HH:mm');
    return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  }
  return v;
}
function headerMap_(sh) { const h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0]; const m = {}; h.forEach((x, i) => m[x] = i); return m; }
/** อ่านทั้งแผ่น — อ่านตามชื่อหัวคอลัมน์ (ทนต่อการสลับคอลัมน์) */
function read_(name) {
  if (!hasSheet_(name)) return [];
  const sh = sheet_(name), cols = SH[name], last = sh.getLastRow();
  if (last < 2) return [];
  const hm = headerMap_(sh);
  const vals = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  const out = [];
  for (let i = 0; i < vals.length; i++) {
    const r = vals[i];
    if (r[0] === '' || r[0] === null) continue;
    const o = { _row: i + 2 };
    for (let j = 0; j < cols.length; j++) { const k = hm[cols[j]]; o[cols[j]] = k === undefined ? '' : cell_(r[k], cols[j]); }
    out.push(o);
  }
  return out;
}
function toRow_(name, o) {
  const sh = sheet_(name), hm = headerMap_(sh), row = new Array(Object.keys(hm).length).fill('');
  SH[name].forEach(c => { if (hm[c] !== undefined) row[hm[c]] = (o[c] === undefined || o[c] === null) ? '' : o[c]; });
  return row;
}
function writeRow_(name, rowIdx, o) { const r = toRow_(name, o); sheet_(name).getRange(rowIdx, 1, 1, r.length).setValues([r]); }
function appendRows_(name, objs) {
  if (!objs.length) return;
  const sh = sheet_(name), rows = objs.map(o => toRow_(name, o));
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}
function now_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm'); }
function withLock_(fn) { const lock = LockService.getScriptLock(); lock.waitLock(20000); try { return fn(); } finally { lock.releaseLock(); } }
function findRows_(name, colName, value) {
  if (!hasSheet_(name)) return [];
  const sh = sheet_(name), hm = headerMap_(sh), last = sh.getLastRow();
  if (last < 2 || hm[colName] === undefined) return [];
  const vals = sh.getRange(2, hm[colName] + 1, last - 1, 1).getValues(), rows = [];
  for (let i = 0; i < vals.length; i++) if (String(cell_(vals[i][0], colName)) === String(value)) rows.push(i + 2);
  return rows;
}
function deleteRows_(name, rows) { const sh = sheet_(name); rows.sort((a, b) => b - a).forEach(r => sh.deleteRow(r)); }
function settings_() { const o = {}; read_('Settings').forEach(r => { o[r.key] = r.value; }); return o; }
function setSetting_(key, value, note) {
  const rows = findRows_('Settings', 'key', key);
  if (rows.length) writeRow_('Settings', rows[0], { key, value, note: note || read_('Settings').find(r => r._row === rows[0]).note });
  else appendRows_('Settings', [{ key, value, note: note || '' }]);
}
function strip_(o) { const c = Object.assign({}, o); delete c._row; delete c.pwHash; return c; }
function hash_(code, pw) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'ch9chemo|' + String(code).toUpperCase() + '|' + pw, Utilities.Charset.UTF_8);
  return raw.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

// =====================================================================
//  เข้าสู่ระบบ / session / log
// =====================================================================
function log_(u, action, detail) {
  try {
    if (!hasSheet_('Logs')) return;
    appendRows_('Logs', [{ time: Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss'), code: u ? u.code : '', name: u ? u.name : '',
      action, detail: typeof detail === 'string' ? detail : JSON.stringify(detail || '') }]);
  } catch (e) { /* log ห้ามทำให้งานหลักล้ม */ }
}
// ---------- ข้อความ log ภาษาไทยที่อ่านง่าย ----------
function thd_(iso) { if (!iso) return '-'; const p = String(iso).slice(0, 10).split('-').map(Number); return p[2] + '/' + p[1] + '/' + (p[0] + 543); }
function patName_(hn) { const p = read_('Patients').find(x => String(x.HN) === String(hn)); return p ? ((p.title || '') + (p.name || '') + ' ' + (p.surname || '')).trim() : ''; }
function staffName_(code) { const s = read_('Staff').find(x => x.code === code); return s ? s.name : (code || '-'); }
const DOSE_TH_ = { pass: 'ผ่าน', fail: 'ไม่ผ่าน', incomplete: 'ข้อมูลไม่ครบ (ไม่ได้ตรวจ)' };
const REASON_TH_ = { prev: 'ผู้ป่วยเคยได้รับขนาดนี้มาก่อน', confirmed: 'ทวนแพทย์แล้ว แพทย์ยืนยัน', other: 'อื่นๆ' };
function caseRef_(v) { return `VN ${v.vn} ผสมวันที่ ${thd_(v.date)} · HN ${v.HN} ${patName_(v.HN)}`.trim(); }
function caseDesc_(v, bottles) {
  const prods = {}; read_('Products').forEach(p => prods[p.productcde] = p);
  const drugs = (bottles || []).map(b => { const p = prods[b.productcde] || {}; return (p.generic || p.productname || b.productcde) + ' ' + b.mg + ' ' + (p.unit || 'mg'); });
  let t = `${caseRef_(v)} เวลาผสม ${String(v.mixTime || '').slice(11, 16)} น. · ผู้ผสม ${staffName_(v.phcode)}${v.emcode ? ' / ผู้ช่วย ' + staffName_(v.emcode) : ''} · ${drugs.length} ขวด (${drugs.join(', ')})`;
  t += ` · ตรวจขนาดยา: ${DOSE_TH_[v.doseStatus] || '-'}`;
  if (v.doseStatus === 'fail') t += ` เพราะ ${v.doseIssues || '-'} → เหตุผล: ${REASON_TH_[v.doseReason] || '-'}${v.doseReasonNote ? ' (' + v.doseReasonNote + ')' : ''}`;
  if (v.doseStatus === 'incomplete' && v.doseReasonNote) t += ` (${v.doseReasonNote})`;
  return t;
}
const FIELD_TH_ = {
  Products: { productname: 'ชื่อยา', generic: 'ชื่อสามัญ', mgPerMl: 'ความเข้มข้น (ต่อ ml)', mlPerVial: 'ml/vial', unit: 'หน่วย', stRecon: 'stability หลังละลาย (วัน)', stDilute: 'stability หลังผสม (วัน)', storage: 'รหัสการเก็บ', recon: 'สารละลาย', mlRecon: 'ปริมาตรละลาย', off: 'เลิกใช้' },
  Patients: { title: 'คำนำหน้า', name: 'ชื่อ', surname: 'นามสกุล', dob: 'วันเกิด', sex: 'เพศ', ward: 'วอร์ด', allergyFlag: 'แพ้ยา', allergy: 'รายละเอียดแพ้ยา' },
  Diluents: { name: 'ชื่อ', generic: 'ชื่อบนฉลาก', mlPerBot: 'ปริมาณ ml/ขวด', off: 'เลิกใช้' },
  Staff: { empId: 'รหัสพนักงาน', name: 'ชื่อบนฉลาก', fullName: 'ชื่อ-นามสกุล', role: 'ตำแหน่ง', active: 'ใช้งาน', canLogin: 'เข้าระบบได้', admin: 'ผู้ดูแลระบบ', mixer: 'ผู้ผสมประจำ' },
  Wards: { name: 'ชื่อ', tel: 'โทร', partner: 'โรงพยาบาล' },
  EyeFormulas: { name: 'ชื่อสูตร', labelName: 'ชื่อบนฉลาก', method: 'วิธีเตรียม', storage: 'การเก็บรักษา', expDays: 'อายุ (วัน)', active: 'ใช้งาน' },
  Settings: { labelWidthMm: 'ความกว้างฉลาก (มม.)', labelHeightMm: 'ความสูงฉลาก (มม.)', labelRotate: 'หมุนฉลาก', labelYear: 'ปีบนฉลาก', defaultMixTime: 'เวลาผสมเริ่มต้น', shiftCutoff: 'เวลาแบ่งรอบเตรียมเคส', keepYears: 'เก็บข้อมูล (ปี)' }
};
const LOOKUP_TH_ = { storage: 'รหัสการเก็บ', eyeSide: 'ตัวเลือกตา', eyeFreq: 'ความถี่ยาหยอดตา' };
const MASTER_TH_ = { Products: 'ยา', Diluents: 'สารน้ำ', Staff: 'เจ้าหน้าที่', Wards: 'แผนก/วอร์ด/รพ.', EyeFormulas: 'สูตรยาหยอดตา' };
function fmtVal_(k, v) { if (['off', 'active', 'canLogin', 'admin', 'mixer', 'labelRotate', 'allergyFlag'].indexOf(k) >= 0) return +v ? 'ใช่' : 'ไม่'; if (k === 'role') return v === 'pharmacist' ? 'เภสัชกร' : 'ผู้ช่วยเภสัชกร'; return v === '' || v == null ? '(ว่าง)' : String(v).length > 40 ? String(v).slice(0, 40) + '…' : String(v); }
function changesTh_(name, a, b) {
  const map = FIELD_TH_[name] || {};
  return Object.keys(map).filter(k => b[k] !== undefined && String(a[k] ?? '') !== String(b[k] ?? '')).map(k => `${map[k]} ${fmtVal_(k, a[k])} → ${fmtVal_(k, b[k])}`).join(', ') || 'ไม่มีการเปลี่ยนแปลง';
}
function eyeDesc_(e) {
  const f = read_('EyeFormulas').find(x => x.code === e.formula) || {};
  let lines = []; try { lines = JSON.parse(e.directions || '[]'); } catch (er) {}
  return `HN ${e.HN} ${patName_(e.HN)} · ${f.name || e.formula} · ${e.qty || 1} ขวด · ผลิต ${thd_(e.prepTime)} ${String(e.prepTime || '').slice(11, 16)} น.` + (lines.length ? ' · วิธีใช้: ' + lines.map(l => l.text || '').filter(String).join(' / ') : '');
}
function auth_(token) {
  if (!token) throw new Error('SESSION_EXPIRED');
  const c = CacheService.getScriptCache(), raw = c.get('s_' + token);
  if (!raw) throw new Error('SESSION_EXPIRED');
  c.put('s_' + token, raw, SESSION_SEC);            // ต่ออายุทุกครั้งที่ใช้งาน
  return JSON.parse(raw);
}
function needAdmin_(u) { if (!+u.admin) throw new Error('ต้องเป็นผู้ดูแลระบบ (admin) จึงจะทำรายการนี้ได้'); }

const MAX_FAIL = 5, LOCK_SEC = 15 * 60;
function apiLogin(code, pw) {
  code = String(code || '').trim().toUpperCase();
  if (!code) throw new Error('กรอกรหัสพนักงาน');
  const cache = CacheService.getScriptCache(), lk = 'lf_' + code, fails = Number(cache.get(lk) || 0);
  if (fails >= MAX_FAIL) { log_({ code, name: '' }, 'login-fail', `รหัส ${code} ถูกล็อก 15 นาที เพราะใส่รหัสผ่านผิดเกิน ${MAX_FAIL} ครั้ง`); throw new Error(`ใส่รหัสผ่านผิดเกิน ${MAX_FAIL} ครั้ง ล็อกไว้ 15 นาที หรือให้ผู้ดูแลระบบรีเซ็ตรหัสผ่าน`); }
  const staff = read_('Staff');
  const s = staff.find(x => String(x.empId).toUpperCase() === code) || staff.find(x => !x.empId && String(x.code).toUpperCase() === code);
  const fail = msg => { cache.put(lk, String(fails + 1), LOCK_SEC); log_({ code, name: s ? s.name : '' }, 'login-fail', msg + ` (ครั้งที่ ${fails + 1})`); throw new Error('รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง'); };
  if (!s || !+s.active || !+s.canLogin) fail('ไม่พบรหัสพนักงาน ' + code + ' หรือรหัสนี้ไม่มีสิทธิ์เข้าระบบ');
  const ok = s.pwHash ? s.pwHash === hash_(s.code, pw) : pw === DEFAULT_PW;
  if (!ok) fail('ใส่รหัสผ่านไม่ถูกต้อง');
  cache.remove(lk);
  const token = Utilities.getUuid();
  const u = { code: s.code, empId: s.empId, name: s.name, role: s.role, admin: +s.admin ? 1 : 0 };
  cache.put('s_' + token, JSON.stringify(u), SESSION_SEC);
  log_(u, 'login', 'เข้าสู่ระบบสำเร็จ');
  return { token, user: u, mustChange: !s.pwHash };
}
function apiLogout(token) {
  try { const u = auth_(token); log_(u, 'logout', 'กดออกจากระบบ'); } catch (e) {}
  CacheService.getScriptCache().remove('s_' + token);
  return true;
}
function apiAutoLogout(token) {
  try { const u = auth_(token); log_(u, 'auto-logout', 'ระบบออกให้อัตโนมัติ เพราะไม่ได้ใช้งาน 15 นาที'); } catch (e) {}
  CacheService.getScriptCache().remove('s_' + token);
  return true;
}
function apiPing(token) { auth_(token); return true; }
function apiChangePassword(token, oldPw, newPw) {
  const u = auth_(token);
  return withLock_(() => {
    const rows = findRows_('Staff', 'code', u.code); if (!rows.length) throw new Error('ไม่พบผู้ใช้');
    const s = read_('Staff').find(x => x._row === rows[0]);
    const ok = s.pwHash ? s.pwHash === hash_(u.code, oldPw) : oldPw === DEFAULT_PW;
    if (!ok) throw new Error('รหัสผ่านเดิมไม่ถูกต้อง');
    if (!newPw || String(newPw).length < 6) throw new Error('รหัสผ่านใหม่ต้องยาวอย่างน้อย 6 ตัว');
    if (newPw === DEFAULT_PW) throw new Error('ห้ามใช้รหัสผ่านตั้งต้น');
    s.pwHash = hash_(u.code, newPw); writeRow_('Staff', rows[0], s);
    log_(u, 'change-password', 'เปลี่ยนรหัสผ่านของตัวเอง');
    return true;
  });
}
function apiResetPassword(token, code) {
  const u = auth_(token); needAdmin_(u);
  return withLock_(() => {
    const rows = findRows_('Staff', 'code', code); if (!rows.length) throw new Error('ไม่พบรหัส ' + code);
    const s = read_('Staff').find(x => x._row === rows[0]); s.pwHash = ''; writeRow_('Staff', rows[0], s);
    CacheService.getScriptCache().remove('lf_' + String(s.empId || s.code).toUpperCase());
    log_(u, 'reset-password', `รีเซ็ตรหัสผ่านของ ${s.name} (${code}) กลับเป็นค่าตั้งต้น`);
    return true;
  });
}

// =====================================================================
//  ตั้งค่าแผ่นงาน
// =====================================================================
function setupSheets() {
  const ss = ss_();
  PropertiesService.getScriptProperties().setProperty('SSID', ss.getId());
  Object.keys(SH).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const want = SH[name];
    let head = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].filter(String) : [];
    // ย้ายชื่อคอลัมน์จากเวอร์ชันแรก
    if (name === 'Visits' && head.indexOf('prepTime') >= 0 && head.indexOf('mixTime') < 0) { sh.getRange(1, head.indexOf('prepTime') + 1).setValue('mixTime'); head[head.indexOf('prepTime')] = 'mixTime'; }
    want.forEach(c => { if (head.indexOf(c) < 0) { sh.getRange(1, head.length + 1).setValue(c); head.push(c); } });
    sh.getRange(1, 1, 1, head.length).setFontWeight('bold').setBackground('#1f6f8b').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    head.forEach((c, j) => { if (TEXT_COLS.indexOf(c) >= 0) sh.getRange(2, j + 1, Math.max(sh.getMaxRows() - 1, 1), 1).setNumberFormat('@'); });
  });
  if (read_('Settings').length === 0) {
    [['hospitalName', 'โรงพยาบาลจุฬารัตน์ 9 แอร์พอร์ต', 'ชื่อโรงพยาบาล'], ['keepYears', 3, 'เก็บข้อมูลย้อนหลังกี่ปี'],
     ['labelWidthMm', 86, 'ความกว้างฉลาก (มม.)'], ['labelHeightMm', 50, 'ความสูงฉลาก (มม.)'], ['labelRotate', 0, 'หมุนข้อความ 90°'],
     ['defaultMixTime', '', 'เวลาผสมเริ่มต้น (ว่าง = เวลาปัจจุบัน)'], ['shiftCutoff', '14:00', 'เวลาแบ่งรอบเตรียมเคสเช้า/บ่าย']]
      .forEach(r => appendRows_('Settings', [{ key: r[0], value: r[1], note: r[2] }]));
  }
  if (!settings_().shiftCutoff) setSetting_('shiftCutoff', '14:00', 'เวลาแบ่งรอบเตรียมเคสเช้า/บ่าย');
  ensureEyeLookups_();
  if (read_('EyeFormulas').length === 0) appendRows_('EyeFormulas', EYE_DEFAULT.map(r => Object.fromEntries(SH.EyeFormulas.map((c, i) => [c, r[i]]))));
  // เภสัชกรที่ใช้งานอยู่ให้เข้าระบบได้ ถ้ายังไม่เคยตั้ง
  const staff = read_('Staff');
  if (!staff.some(s => +s.canLogin)) staff.forEach(s => { if (s.role === 'pharmacist' && +s.active) { s.canLogin = 1; writeRow_('Staff', s._row, s); } });
  if (!staff.some(s => +s.admin)) { const first = read_('Staff').find(s => +s.canLogin); if (first) { first.admin = 1; writeRow_('Staff', first._row, first); } }
  try { SpreadsheetApp.getUi().alert('ตั้งค่าแผ่นงานเรียบร้อย'); } catch (e) {}
}

const EYE_SIDES = [['L', 'ข้างซ้าย'], ['R', 'ข้างขวา'], ['B', 'ทั้งสองข้าง'], ['A', 'ข้างที่เป็น']];
const EYE_FREQS = [['F2', 'ทุก 2 ชั่วโมง (ตลอด 24 ชั่วโมง)'], ['F1', 'ทุก 1 ชั่วโมง (ตลอด 24 ชั่วโมง)'], ['F2D', 'ทุก 2 ชั่วโมง (8.00 น. ถึง 20.00 น.)'], ['F4', 'ทุก 4 ชั่วโมง (ตลอด 24 ชั่วโมง)'],
  ['F6', 'ทุก 6 ชั่วโมง'], ['QID', 'วันละ 4 ครั้ง เช้า กลางวัน เย็น ก่อนนอน'], ['HS', 'ก่อนนอน']];
function ensureEyeLookups_() {
  const L = read_('Lookups');
  if (!L.some(x => x.type === 'eyeSide')) appendRows_('Lookups', EYE_SIDES.map(r => ({ type: 'eyeSide', code: r[0], text: r[1] })));
  if (!L.some(x => x.type === 'eyeFreq')) appendRows_('Lookups', EYE_FREQS.map(r => ({ type: 'eyeFreq', code: r[0], text: r[1] })));
}
// =====================================================================
//  API: ข้อมูลตั้งต้น
// =====================================================================
function apiBoot(token) {
  const u = auth_(token);
  try { ensureEyeLookups_(); } catch (e) {}
  return {
    user: u,
    products: read_('Products').map(strip_),
    diluents: read_('Diluents').map(strip_),
    staff: read_('Staff').map(strip_),
    wards: read_('Wards').map(strip_),
    lookups: read_('Lookups').map(strip_),
    titles: read_('Titles').map(strip_),
    eyeFormulas: read_('EyeFormulas').map(strip_),
    settings: settings_(),
    today: Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd')
  };
}

// =====================================================================
//  API: รายการเคส
//  mode 'mix'  = เคสที่ "วันผสม" ตรงกับ date
//  mode 'prep' = เคสที่ "เตรียมเคส" ในวันที่ date (ทุกวันผสม)
// =====================================================================
function listCases_(filterFn) {
  const visits = read_('Visits').filter(filterFn).map(strip_);
  const ids = {}; visits.forEach(v => ids[v.id] = 1);
  const bottles = read_('Bottles').filter(b => ids[b.visitId]).map(strip_);
  const hns = {}; visits.forEach(v => hns[v.HN] = 1);
  const patients = read_('Patients').filter(p => hns[p.HN]).map(strip_);
  visits.sort((a, b) => (a.date + String(a.vn).padStart(4, '0')).localeCompare(b.date + String(b.vn).padStart(4, '0')));
  return { visits, bottles, patients };
}
function apiList(token, mode, date) {
  auth_(token);
  const r = listCases_(v => mode === 'prep' ? String(v.preparedAt).slice(0, 10) === date : v.date === date);
  r.mode = mode; r.date = date;
  return r;
}

// ---------- ผู้ป่วย ----------
function apiSearchPatients(token, q) {
  auth_(token);
  q = String(q || '').trim().toLowerCase();
  if (q.length < 2) return [];
  const words = q.split(/\s+/);
  return read_('Patients').filter(p => { const hay = (p.HN + ' ' + p.name + ' ' + p.surname).toLowerCase(); return words.every(w => hay.indexOf(w) >= 0); })
    .sort((a, b) => String(b.lastVisit).localeCompare(String(a.lastVisit))).slice(0, 30).map(strip_);
}
function apiPatient(token, hn) {
  auth_(token);
  const p = read_('Patients').find(x => String(x.HN) === String(hn));
  const visits = read_('Visits').filter(v => String(v.HN) === String(hn) && !+v.cancelled).sort((a, b) => (b.date + b.vn).localeCompare(a.date + a.vn)).slice(0, 10).map(strip_);
  const ids = {}; visits.forEach(v => ids[v.id] = 1);
  return { patient: p ? strip_(p) : null, visits, bottles: read_('Bottles').filter(b => ids[b.visitId]).map(strip_) };
}
function apiSavePatient(token, p) {
  const u = auth_(token);
  return withLock_(() => {
    if (!p.HN) throw new Error('ต้องใส่ HN');
    const rows = findRows_('Patients', 'HN', p.HN);
    const old = rows.length ? read_('Patients').find(x => x._row === rows[0]) : {};
    const o = Object.assign({}, old, p); delete o._row;
    if (rows.length) writeRow_('Patients', rows[0], o); else appendRows_('Patients', [o]);
    log_(u, rows.length ? 'edit-patient' : 'add-patient', `HN ${o.HN} ${(o.title || '') + (o.name || '') + ' ' + (o.surname || '')}` + (rows.length ? ' · ' + (changesTh_('Patients', old, o) === 'ไม่มีการเปลี่ยนแปลง' ? 'แก้ไขข้อมูล' : changesTh_('Patients', old, o)) : '') + (+o.allergyFlag ? ' · แพ้ยา: ' + (o.allergy || '-') : ''));
    return strip_(o);
  });
}

// ---------- บันทึกเคส ----------
function apiSaveVisit(token, v, bottles, listMode, listDate) {
  const u = auth_(token);
  return withLock_(() => {
    if (!v.HN) throw new Error('ต้องใส่ HN');
    if (!v.date) throw new Error('ต้องใส่วันที่ผสม');
    let old = null, moved = '';
    if (v.id) {
      const r = findRows_('Visits', 'id', v.id);
      if (r.length) old = read_('Visits').find(x => x._row === r[0]);
    }
    // เปลี่ยนวันผสม → ย้ายไปเลข VN ของวันใหม่
    if (old && old.date !== v.date) {
      moved = old.date;
      deleteRows_('Bottles', findRows_('Bottles', 'visitId', old.id));
      deleteRows_('Visits', findRows_('Visits', 'id', old.id));
      v.id = '';
    }
    if (!v.id) {
      const sameDay = read_('Visits').filter(x => x.date === v.date);
      v.vn = sameDay.reduce((m, x) => Math.max(m, Number(x.vn) || 0), 0) + 1;
      v.id = v.date + '-' + v.vn;
    }
    // ตรวจสอบขนาดยา: ต้องตรวจ หรือระบุว่าข้อมูลไม่ครบ · ถ้าไม่ผ่านต้องมีเหตุผล
    if (['pass', 'fail', 'incomplete'].indexOf(v.doseStatus) < 0) throw new Error('ยังไม่ได้ตรวจสอบขนาดยา');
    if (v.doseStatus === 'fail') {
      if (['prev', 'confirmed', 'other'].indexOf(v.doseReason) < 0) throw new Error('ผลตรวจขนาดยาไม่ผ่าน ต้องเลือกเหตุผลก่อนบันทึก');
      if (v.doseReason === 'other' && !String(v.doseReasonNote || '').trim()) throw new Error('เลือก “อื่นๆ” ต้องระบุเหตุผล');
    }
    if (v.doseStatus === 'pass') { v.doseReason = ''; v.doseReasonNote = ''; }
    v.checkedBy = u.code;
    v.preparedAt = (old && old.preparedAt) || v.preparedAt || now_();       // วันเวลาเตรียมเคส = ครั้งแรกที่กดบันทึก
    v.preparedBy = (old && old.preparedBy) || v.preparedBy || u.code;
    v.photos = old ? old.photos : (v.photos || '');
    v.cancelled = old ? old.cancelled : (v.cancelled || 0);
    v.updatedAt = now_(); v.updatedBy = u.code;
    const vr = findRows_('Visits', 'id', v.id);
    if (vr.length) writeRow_('Visits', vr[0], v); else appendRows_('Visits', [v]);

    const printedMap = {};
    read_('Bottles').filter(b => b.visitId === v.id).forEach(b => printedMap[b.productcde + '|' + b.mg + '|' + b.diluent] = b.printed);
    deleteRows_('Bottles', findRows_('Bottles', 'visitId', v.id));
    appendRows_('Bottles', (bottles || []).filter(b => b.productcde).map((b, i) => Object.assign({}, b, {
      id: v.id + '-' + (i + 1), visitId: v.id, date: v.date, printed: b.printed || printedMap[b.productcde + '|' + b.mg + '|' + b.diluent] || 0 })));

    const pr = findRows_('Patients', 'HN', v.HN);
    if (pr.length) {
      const p = read_('Patients').find(x => x._row === pr[0]);
      if (!p.lastVisit || v.date >= p.lastVisit) p.lastVisit = v.date;
      ['wt', 'ht', 'scr'].forEach(k => { if (v[k] !== '' && v[k] != null) p[k] = v[k]; });
      writeRow_('Patients', pr[0], p);
    }
    log_(u, old ? 'edit-case' : 'add-case', (moved ? `ย้ายวันผสมจาก ${thd_(moved)} → ` : '') + caseDesc_(v, bottles));
    const out = apiList(token, listMode || 'mix', listDate || v.date);
    out.savedId = v.id;
    return out;
  });
}
function apiDeleteVisit(token, id, listMode, listDate) {
  const u = auth_(token);
  return withLock_(() => {
    const v = read_('Visits').find(x => x.id === id);
    deleteRows_('Bottles', findRows_('Bottles', 'visitId', id));
    deleteRows_('Visits', findRows_('Visits', 'id', id));
    log_(u, 'delete-case', v ? 'ลบ ' + caseRef_(v) : 'ลบเคส ' + id);
    return apiList(token, listMode, listDate);
  });
}
function apiSetCancelled(token, id, flag, reason) {
  const u = auth_(token);
  return withLock_(() => {
    const r = findRows_('Visits', 'id', id); if (!r.length) throw new Error('ไม่พบเคส');
    const v = read_('Visits').find(x => x._row === r[0]);
    v.cancelled = flag ? 1 : 0;
    if (flag && reason) v.note = (v.note ? v.note + ' | ' : '') + 'ยกเลิก: ' + reason;
    v.updatedAt = now_(); v.updatedBy = u.code;
    writeRow_('Visits', r[0], v);
    log_(u, flag ? 'cancel-case' : 'uncancel-case', caseRef_(v) + (flag ? ' · เหตุผล: ' + (reason || 'ไม่ระบุ') : ' · กลับมาเป็นเคสปกติ'));
    return strip_(v);
  });
}
function apiMarkPrinted(token, ids, isReprint, visitIds) {
  const u = auth_(token);
  return withLock_(() => {
    const sh = sheet_('Bottles'), col = headerMap_(sh).printed + 1, want = {};
    ids.forEach(i => want[i] = 1);
    read_('Bottles').forEach(b => { if (want[b.id]) sh.getRange(b._row, col).setValue((Number(b.printed) || 0) + 1); });
    log_(u, isReprint ? 'reprint-label' : 'print-label', `${isReprint ? 'พิมพ์ซ้ำ' : 'พิมพ์'}ฉลากขวดยา ${ids.length} ดวง · ` + (visitIds || []).map(id => { const v = read_('Visits').find(x => x.id === id); return v ? caseRef_(v) : id; }).join(' | '));
    return true;
  });
}

// ---------- รูปเคส ----------
function photoFolder_(date) {
  const st = settings_();
  let root;
  try { root = st.photoFolderId ? DriveApp.getFolderById(st.photoFolderId) : null; } catch (e) { root = null; }
  if (!root) { root = DriveApp.createFolder('ChemoPrep รูปเคส'); setSetting_('photoFolderId', root.getId(), 'โฟลเดอร์รูปเคสใน Drive'); }
  const ym = date.slice(0, 7), d = date;
  const sub = (parent, name) => { const it = parent.getFoldersByName(name); return it.hasNext() ? it.next() : parent.createFolder(name); };
  return sub(sub(root, ym), d);
}
function apiAddPhoto(token, visitId, dataUrl) {
  const u = auth_(token);
  return withLock_(() => {
    const r = findRows_('Visits', 'id', visitId); if (!r.length) throw new Error('ไม่พบเคส (บันทึกเคสก่อนถ่ายรูป)');
    const v = read_('Visits').find(x => x._row === r[0]);
    const m = String(dataUrl).match(/^data:(image\/\w+);base64,(.+)$/); if (!m) throw new Error('ไฟล์รูปไม่ถูกต้อง');
    const n = (String(v.photos || '').split(',').filter(String).length) + 1;
    const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], `${v.date}_VN${v.vn}_${v.HN}_${n}.jpg`);
    const f = photoFolder_(v.date).createFile(blob);
    v.photos = String(v.photos || '').split(',').filter(String).concat(f.getId()).join(',');
    writeRow_('Visits', r[0], v);
    log_(u, 'add-photo', `เพิ่มรูปเคส (${f.getName()}) · ${caseRef_(v)}`);
    return strip_(v);
  });
}
function apiGetPhotos(token, visitId) {
  auth_(token);
  const v = read_('Visits').find(x => x.id === visitId); if (!v) return [];
  return String(v.photos || '').split(',').filter(String).map(id => {
    try { const f = DriveApp.getFileById(id); return { id, name: f.getName(), url: f.getUrl(), data: 'data:' + f.getMimeType() + ';base64,' + Utilities.base64Encode(f.getBlob().getBytes()) }; }
    catch (e) { return { id, name: '(ไม่พบไฟล์)', data: '' }; }
  });
}
function apiDeletePhoto(token, visitId, fileId) {
  const u = auth_(token);
  return withLock_(() => {
    const r = findRows_('Visits', 'id', visitId); if (!r.length) throw new Error('ไม่พบเคส');
    const v = read_('Visits').find(x => x._row === r[0]);
    v.photos = String(v.photos || '').split(',').filter(x => x && x !== fileId).join(',');
    writeRow_('Visits', r[0], v);
    try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e) {}
    log_(u, 'delete-photo', `ลบรูปเคส 1 รูป · ${caseRef_(v)}`);
    return strip_(v);
  });
}

// ---------- รายงาน ----------
function apiReport(token, from, to) {
  const u = auth_(token);
  const r = listCases_(v => v.date >= from && v.date <= to);
  r.eyes = read_('EyeDrops').filter(e => e.date >= from && e.date <= to).map(strip_);
  const hns = {}; r.patients.forEach(p => hns[p.HN] = 1);
  r.eyes.forEach(e => { if (!hns[e.HN]) { const p = read_('Patients').find(x => String(x.HN) === String(e.HN)); if (p) { r.patients.push(strip_(p)); hns[e.HN] = 1; } } });
  log_(u, 'view-report', `ดูรายงานวันที่ผสม ${thd_(from)} ถึง ${thd_(to)}`);
  return r;
}
/** สร้างรายงานเป็น Google Sheet (ดาวน์โหลดเป็น Excel ได้จากเมนู ไฟล์) */
function apiExportReport(token, title, rows, colors) {
  const u = auth_(token);
  const st = settings_();
  let folder;
  try { folder = st.reportFolderId ? DriveApp.getFolderById(st.reportFolderId) : null; } catch (e) { folder = null; }
  if (!folder) { folder = DriveApp.createFolder('ChemoPrep รายงาน'); setSetting_('reportFolderId', folder.getId(), 'โฟลเดอร์รายงานใน Drive'); }
  const ss = SpreadsheetApp.create(title);
  DriveApp.getFileById(ss.getId()).moveTo(folder);
  const sh = ss.getSheets()[0]; sh.setName('รายงาน');
  const w = rows.reduce((m, r) => Math.max(m, r.length), 1);
  const data = rows.map(r => r.concat(new Array(w - r.length).fill('')));
  sh.getRange(1, 1, data.length, w).setNumberFormat('@').setValues(data).setFontFamily('Sarabun').setFontSize(11);
  sh.getRange(1, 1, 1, w).merge().setFontSize(16).setFontWeight('bold');
  (colors || []).forEach(c => sh.getRange(c[0], 1, 1, w).setBackground(c[1]).setFontWeight(c[2] ? 'bold' : 'normal'));
  sh.autoResizeColumns(1, w);
  log_(u, 'export-report', 'สร้างไฟล์ ' + title);
  return ss.getUrl();
}

// ---------- ตั้งค่า (ข้อมูลหลัก) ----------
const EDITABLE = { Products: 'productcde', Diluents: 'pcode', Staff: 'code', Wards: 'code', EyeFormulas: 'code' };
function apiSaveMaster(token, name, obj) {
  const u = auth_(token);
  if (!EDITABLE[name]) throw new Error('แก้ไขแผ่นงานนี้ไม่ได้');
  if (name === 'Staff') needAdmin_(u);
  return withLock_(() => {
    const key = EDITABLE[name];
    if (name === 'Staff') {
      obj.empId = String(obj.empId || '').trim().toUpperCase();
      if (!obj.code) obj.code = obj.empId || ('S' + Date.now().toString(36).toUpperCase());
      if (obj.empId && read_('Staff').some(x => String(x.empId).toUpperCase() === obj.empId && x.code !== obj.code)) throw new Error('รหัสพนักงาน ' + obj.empId + ' มีคนใช้แล้ว');
      if (+obj.canLogin && !obj.empId && obj._new) throw new Error('ต้องใส่รหัสพนักงานก่อน จึงจะเข้าระบบได้');
    }
    if (!obj[key]) throw new Error('ต้องใส่รหัส');
    obj[key] = String(obj[key]).trim();
    const rows = findRows_(name, key, obj[key]);
    const old = rows.length ? read_(name).find(x => x._row === rows[0]) : null;
    if (obj._new && old) throw new Error('รหัส ' + obj[key] + ' มีอยู่แล้ว');
    delete obj._new;
    const o = Object.assign({}, old || {}, obj);
    if (name === 'Staff' && old) o.pwHash = old.pwHash;            // ไม่ให้แก้รหัสผ่านผ่านทางนี้
    if (name === 'Staff' && !old) o.pwHash = '';
    if (name === 'Products' && !old && o.chemo === undefined) o.chemo = 1;
    delete o._row;
    if (rows.length) writeRow_(name, rows[0], o); else appendRows_(name, [o]);
    log_(u, (old ? 'edit-' : 'add-') + name, `${old ? 'แก้ไข' : 'เพิ่ม'}${MASTER_TH_[name] || name} ${obj[key]}${o.name || o.productname ? ' (' + (o.productname || o.name) + ')' : ''}` + (old ? ': ' + changesTh_(name, old, o) : ''));
    return read_(name).map(strip_);
  });
}
function diff_(a, b) { const d = {}; Object.keys(b).forEach(k => { if (k !== '_row' && k !== 'pwHash' && String(a[k]) !== String(b[k])) d[k] = [a[k], b[k]]; }); return d; }
function apiSaveLookup(token, type, code, text, oldCode) {
  const u = auth_(token);
  return withLock_(() => {
    const all = read_('Lookups'), hit = all.find(x => x.type === type && String(x.code) === String(oldCode || code));
    if (hit) writeRow_('Lookups', hit._row, { type, code, text }); else appendRows_('Lookups', [{ type, code, text }]);
    const what = type === 'storage' ? `“${code}” = ${text}` : `“${text}”`;
    log_(u, hit ? 'edit-lookup' : 'add-lookup', `${hit ? 'แก้ไข' : 'เพิ่ม'}${LOOKUP_TH_[type] || type} ${what}` + (hit && hit.text !== text ? ` (เดิม: ${hit.text})` : ''));
    return read_('Lookups').map(strip_);
  });
}
function apiDeleteLookup(token, type, code) {
  const u = auth_(token);
  return withLock_(() => {
    const hit = read_('Lookups').find(x => x.type === type && String(x.code) === String(code));
    if (hit) { deleteRows_('Lookups', [hit._row]); log_(u, 'delete-lookup', `ลบ${LOOKUP_TH_[type] || type} “${hit.text}”` + (type === 'storage' ? ` (รหัส ${code})` : '')); }
    return read_('Lookups').map(strip_);
  });
}
function apiSaveSettings(token, obj) {
  const u = auth_(token); needAdmin_(u);
  return withLock_(() => { const before = settings_(); Object.keys(obj).forEach(k => setSetting_(k, obj[k])); log_(u, 'edit-settings', 'แก้ค่าระบบ: ' + changesTh_('Settings', before, obj)); return settings_(); });
}
function apiLogs(token, from, to, q) {
  const u = auth_(token); needAdmin_(u);
  q = String(q || '').toLowerCase();
  return read_('Logs').filter(l => String(l.time).slice(0, 10) >= from && String(l.time).slice(0, 10) <= to &&
    (!q || (l.code + ' ' + l.name + ' ' + l.action + ' ' + l.detail).toLowerCase().indexOf(q) >= 0)).reverse().slice(0, 1000).map(strip_);
}

// ---------- ยาหยอดตา ----------
function apiEyeDay(token, date) {
  auth_(token);
  const eyes = read_('EyeDrops').filter(e => e.date === date).map(strip_).sort((a, b) => Number(a.seq) - Number(b.seq));
  const hns = {}; eyes.forEach(e => hns[e.HN] = 1);
  return { date, eyes, patients: read_('Patients').filter(p => hns[p.HN]).map(strip_) };
}
function apiSaveEye(token, e) {
  const u = auth_(token);
  return withLock_(() => {
    if (!e.HN) throw new Error('ต้องใส่ HN');
    if (!e.formula) throw new Error('ต้องเลือกสูตรยา');
    const isNew = !e.id;
    if (isNew) {
      e.seq = read_('EyeDrops').filter(x => x.date === e.date).reduce((m, x) => Math.max(m, Number(x.seq) || 0), 0) + 1;
      e.id = 'E' + e.date + '-' + e.seq; e.printed = 0;
    }
    e.updatedAt = now_(); e.updatedBy = u.code;
    const rows = findRows_('EyeDrops', 'id', e.id);
    if (rows.length) writeRow_('EyeDrops', rows[0], e); else appendRows_('EyeDrops', [e]);
    log_(u, isNew ? 'add-eyedrop' : 'edit-eyedrop', eyeDesc_(e));
    return Object.assign(apiEyeDay(token, e.date), { savedId: e.id });
  });
}
function apiDeleteEye(token, id) {
  const u = auth_(token);
  return withLock_(() => {
    const rows = findRows_('EyeDrops', 'id', id);
    const delE = rows.length ? read_('EyeDrops').find(x => x._row === rows[0]) : null;
    const date = delE ? delE.date : '';
    deleteRows_('EyeDrops', rows);
    log_(u, 'delete-eyedrop', delE ? 'ลบ ' + eyeDesc_(delE) : 'ลบรายการ ' + id);
    return apiEyeDay(token, date);
  });
}
function apiMarkEyePrinted(token, ids, isReprint) {
  const u = auth_(token);
  return withLock_(() => {
    const sh = sheet_('EyeDrops'), col = headerMap_(sh).printed + 1, want = {};
    ids.forEach(i => want[i] = 1);
    read_('EyeDrops').forEach(e => { if (want[e.id]) sh.getRange(e._row, col).setValue((Number(e.printed) || 0) + 1); });
    log_(u, isReprint ? 'reprint-eyedrop' : 'print-eyedrop', `${isReprint ? 'พิมพ์ซ้ำ' : 'พิมพ์'}ฉลากยาหยอดตา · ` + ids.map(id => { const e = read_('EyeDrops').find(x => x.id === id); return e ? eyeDesc_(e) : id; }).join(' | '));
    return true;
  });
}

// =====================================================================
//  ล้างข้อมูลเก่า
// =====================================================================
function archiveOldMenu() {
  const ui = SpreadsheetApp.getUi();
  const years = Number(settings_().keepYears) || 3;
  const res = ui.alert('ล้างข้อมูลเก่า', 'จะย้ายข้อมูลที่เก่ากว่า ' + years + ' ปี ไปเก็บในไฟล์สำรองใหม่ใน Drive แล้วลบออกจากไฟล์นี้\nดำเนินการต่อ?', ui.ButtonSet.YES_NO);
  if (res !== ui.Button.YES) return;
  const r = archiveOld_(years);
  ui.alert('เรียบร้อย', 'ย้ายออก ' + r.visits + ' เคส / ' + r.bottles + ' ขวด / ยาหยอดตา ' + (r.eyedrops || 0) + ' / log ' + (r.logs || 0) + '\nไฟล์สำรอง: ' + r.url, ui.ButtonSet.OK);
}
function archiveOld_(years) {
  return withLock_(() => {
    const d = new Date(); d.setFullYear(d.getFullYear() - years);
    const cut = Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
    const arc = SpreadsheetApp.create('สำรองข้อมูลเคมีบำบัด ก่อน ' + cut);
    const out = {};
    [['Visits', 'date'], ['Bottles', 'date'], ['EyeDrops', 'date'], ['Logs', 'time']].forEach(([name, col]) => {
      if (!hasSheet_(name)) return;
      const sh = sheet_(name), all = read_(name), old = all.filter(r => String(r[col]).slice(0, 10) < cut);
      out[name.toLowerCase()] = old.length;
      if (!old.length) return;
      const a = arc.insertSheet(name);
      a.getRange(1, 1, 1, SH[name].length).setValues([SH[name]]);
      a.getRange(2, 1, old.length, SH[name].length).setNumberFormat('@').setValues(old.map(r => SH[name].map(c => r[c])));
      const keep = all.filter(r => String(r[col]).slice(0, 10) >= cut).map(r => toRow_(name, r));
      const last = sh.getLastRow();
      if (last > 1) sh.getRange(2, 1, last - 1, sh.getLastColumn()).clearContent();
      if (keep.length) sh.getRange(2, 1, keep.length, keep[0].length).setValues(keep);
    });
    const def = arc.getSheetByName('Sheet1') || arc.getSheetByName('แผ่น1') || arc.getSheetByName('ชีต1');
    if (def && arc.getSheets().length > 1) arc.deleteSheet(def);
    out.url = arc.getUrl();
    return out;
  });
}

// =====================================================================
//  JSON API สำหรับหน้าเว็บที่โฮสต์บน GitHub Pages
//  POST {fn, args} (Content-Type: text/plain) → {ok, data | error}
// =====================================================================
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (er) { return json_({ ok: false, error: 'คำขอไม่ถูกต้อง' }); }
  const fn = API_[req && req.fn];
  if (!fn) return json_({ ok: false, error: 'ไม่รู้จักคำสั่ง ' + (req && req.fn) });
  try { return json_({ ok: true, data: fn.apply(null, Array.isArray(req.args) ? req.args : []) }); }
  catch (err) { return json_({ ok: false, error: String(err && err.message || err) }); }
}
const API_ = { apiLogin, apiLogout, apiAutoLogout, apiPing, apiChangePassword, apiResetPassword, apiBoot, apiList, apiSearchPatients, apiPatient, apiSavePatient,
  apiSaveVisit, apiDeleteVisit, apiSetCancelled, apiMarkPrinted, apiAddPhoto, apiGetPhotos, apiDeletePhoto, apiReport, apiExportReport, apiSaveMaster, apiSaveLookup,
  apiDeleteLookup, apiSaveSettings, apiLogs, apiEyeDay, apiSaveEye, apiDeleteEye, apiMarkEyePrinted };
