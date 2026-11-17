// ระบบบันทึกการผสมเคมีบำบัด — หลังบ้านบน Supabase (พอร์ตจาก Apps Script Code.gs)
// รับ/ตอบรูปแบบเดิม: POST {fn, args} → {ok, data | error}
// ไม่พึ่ง Deno โดยตรง: รับ db + storage เข้ามา เพื่อทดสอบด้วย Node ได้

export const TZ = 'Asia/Bangkok';
const DEFAULT_PW = '12345678';
const SESSION_SEC = 15 * 60;
const MAX_FAIL = 5, LOCK_SEC = 15 * 60;

export const SH: Record<string, string[]> = {
  Visits: ['id','date','vn','HN','ward','phcode','emcode','mixTime','wt','ht','scr','regimen','note','preparedAt','preparedBy','cancelled','photos','updatedAt','updatedBy',
    'doseStatus','doseIssues','doseReason','doseReasonNote','doseDetail','checkedBy'],
  Bottles: ['id','visitId','date','bottleNo','productcde','mg','diluent','route','rate','rateUnit','tvol','note','printed'],
  Patients: ['HN','title','name','surname','dob','sex','allergyFlag','allergy','ward','offService','wt','ht','scr','lastVisit'],
  Products: ['productcde','productname','generic','mgPerMl','mlPerVial','unit','stRecon','stDilute','storage','recon','mlRecon','chemo','off'],
  Diluents: ['pcode','name','generic','mlPerBot','off'],
  Staff: ['code','empId','name','fullName','role','active','canLogin','admin','mixer','pwHash'],
  Wards: ['code','name','tel','partner'],
  Lookups: ['type','code','text'],
  Titles: ['code','title','sex'],
  Settings: ['key','value','note'],
  EyeFormulas: ['code','name','labelName','method','storage','expDays','active'],
  EyeDrops: ['id','date','seq','HN','ward','formula','directions','qty','prepTime','phcode','emcode','note','printed','updatedAt','updatedBy'],
  Logs: ['time','code','name','action','detail'],
};
export const PK: Record<string, string[]> = {
  Visits: ['id'], Bottles: ['id'], Patients: ['HN'], Products: ['productcde'], Diluents: ['pcode'], Staff: ['code'], Wards: ['code'],
  Lookups: ['type', 'code'], Titles: ['code'], Settings: ['key'], EyeFormulas: ['code'], EyeDrops: ['id'], Logs: [],
};
const TEXT_COLS = new Set(['id','visitId','date','mixTime','prepTime','preparedAt','dob','lastVisit','HN','productcde','pcode','diluent','phcode','emcode',
  'rate','updatedAt','code','empId','storage','recon','ward','value','formula','directions','regimen','photos','time','pwHash',
  'doseStatus','doseIssues','doseReason','doseReasonNote','doseDetail','checkedBy']);

export type Q = (sql: string, params?: any[]) => Promise<any[]>;
export interface Storage {
  put(bucket: string, path: string, bytes: Uint8Array, mime: string): Promise<void>;
  get(bucket: string, path: string): Promise<{ bytes: Uint8Array; mime: string } | null>;
  remove(bucket: string, path: string): Promise<void>;
  signedUrl(bucket: string, path: string, sec: number, dl?: string): Promise<string>;
}
export interface Ctx { q: Q; tx: <T>(fn: (c: Ctx) => Promise<T>) => Promise<T>; storage: Storage; }

// ---------------------------------------------------------------- helpers
const T = (name: string) => name.toLowerCase();
const QI = (c: string) => '"' + c + '"';
const conv = (name: string, r: any) => {
  const o: any = {};
  for (const c of SH[name]) {
    let v = r[c];
    if (v === null || v === undefined) v = '';
    if (v !== '' && !TEXT_COLS.has(c) && /^-?\d+(\.\d+)?$/.test(v) && String(Number(v)) === v) v = Number(v);
    o[c] = v;
  }
  return o;
};
const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, hourCycle: 'h23', ...o }).format(d);
const nowFull = () => fmt(new Date(), { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
const now_ = () => nowFull().slice(0, 16);
const today_ = () => nowFull().slice(0, 10);
const jarr = (a: any[]) => JSON.stringify(a.map(String));
const IN = (n: number) => `(select jsonb_array_elements_text($${n}::text::jsonb))`;

async function read_(c: Ctx, name: string, where = '', params: any[] = [], order = '_n'): Promise<any[]> {
  const rows = await c.q(`select * from public.${T(name)} ${where ? 'where ' + where : ''} order by ${order}`, params);
  return rows.map(r => conv(name, r));
}
async function upsert_(c: Ctx, name: string, o: any) {
  const cols = SH[name], pk = PK[name];
  const vals = cols.map(k => (o[k] === undefined || o[k] === null) ? '' : String(o[k]));
  const ph = cols.map((_, i) => '$' + (i + 1)).join(',');
  let sql = `insert into public.${T(name)} (${cols.map(QI).join(',')}) values (${ph})`;
  if (pk.length) {
    const upd = cols.filter(k => !pk.includes(k)).map(k => `${QI(k)}=excluded.${QI(k)}`).join(',');
    sql += ` on conflict (${pk.map(QI).join(',')}) do update set ${upd || QI(pk[0]) + '=excluded.' + QI(pk[0])}`;
  }
  await c.q(sql, vals);
}
async function insertMany_(c: Ctx, name: string, objs: any[]) {
  for (const o of objs) await upsert_(c, name, o);
}
const strip_ = (o: any) => { const c = { ...o }; delete c._row; delete c.pwHash; return c; };
async function hash_(code: string, pw: string) {
  const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ch9chemo|' + String(code).toUpperCase() + '|' + pw));
  return [...new Uint8Array(raw)].map(b => b.toString(16).padStart(2, '0')).join('');
}
const uuid = () => crypto.randomUUID();
const lock_ = async <T>(c: Ctx, fn: (c: Ctx) => Promise<T>) => c.tx(async t => { await t.q('select pg_advisory_xact_lock(7001)'); return fn(t); });
const err = (m: string) => new Error(m);

async function settings_(c: Ctx) { const o: any = {}; (await read_(c, 'Settings')).forEach(r => { o[r.key] = r.value; }); return o; }
async function setSetting_(c: Ctx, key: string, value: any, note?: string) {
  const old = (await read_(c, 'Settings', '"key"=$1', [key]))[0];
  await upsert_(c, 'Settings', { key, value, note: note !== undefined ? note : (old ? old.note : '') });
}

// ---------------------------------------------------------------- log
async function log_(c: Ctx, u: any, action: string, detail: any) {
  try {
    await c.q('insert into public.logs ("time","code","name","action","detail") values ($1,$2,$3,$4,$5)',
      [nowFull(), u ? u.code : '', u ? u.name : '', action, typeof detail === 'string' ? detail : JSON.stringify(detail || '')]);
  } catch (_e) { /* log ห้ามทำให้งานหลักล้ม */ }
}
const thd_ = (iso: any) => { if (!iso) return '-'; const p = String(iso).slice(0, 10).split('-').map(Number); return p[2] + '/' + p[1] + '/' + (p[0] + 543); };
async function patName_(c: Ctx, hn: any) { const p = (await read_(c, 'Patients', '"HN"=$1', [String(hn)]))[0]; return p ? ((p.title || '') + (p.name || '') + ' ' + (p.surname || '')).trim() : ''; }
async function staffName_(c: Ctx, code: any) { const s = (await read_(c, 'Staff', '"code"=$1', [String(code)]))[0]; return s ? s.name : (code || '-'); }
const DOSE_TH_: any = { pass: 'ผ่าน', fail: 'ไม่ผ่าน', incomplete: 'ข้อมูลไม่ครบ (ไม่ได้ตรวจ)' };
const REASON_TH_: any = { prev: 'ผู้ป่วยเคยได้รับขนาดนี้มาก่อน', confirmed: 'ทวนแพทย์แล้ว แพทย์ยืนยัน', other: 'อื่นๆ' };
async function caseRef_(c: Ctx, v: any) { return `VN ${v.vn} ผสมวันที่ ${thd_(v.date)} · HN ${v.HN} ${await patName_(c, v.HN)}`.trim(); }
async function caseDesc_(c: Ctx, v: any, bottles: any[]) {
  const prods: any = {}; (await read_(c, 'Products')).forEach(p => prods[p.productcde] = p);
  const drugs = (bottles || []).map(b => { const p = prods[b.productcde] || {}; return (p.generic || p.productname || b.productcde) + ' ' + b.mg + ' ' + (p.unit || 'mg'); });
  let t = `${await caseRef_(c, v)} เวลาผสม ${String(v.mixTime || '').slice(11, 16)} น. · ผู้ผสม ${await staffName_(c, v.phcode)}${v.emcode ? ' / ผู้ช่วย ' + await staffName_(c, v.emcode) : ''} · ${drugs.length} ขวด (${drugs.join(', ')})`;
  t += ` · ตรวจขนาดยา: ${DOSE_TH_[v.doseStatus] || '-'}`;
  if (v.doseStatus === 'fail') t += ` เพราะ ${v.doseIssues || '-'} → เหตุผล: ${REASON_TH_[v.doseReason] || '-'}${v.doseReasonNote ? ' (' + v.doseReasonNote + ')' : ''}`;
  if (v.doseStatus === 'incomplete' && v.doseReason === 'continuous') t = t.replace('ข้อมูลไม่ครบ (ไม่ได้ตรวจ)', 'เคสต่อเนื่องหลายวัน (ไม่ได้ตรวจ)');
  if (v.doseStatus === 'incomplete' && v.doseReasonNote) t += ` (${v.doseReasonNote})`;
  return t;
}
const FIELD_TH_: any = {
  Products: { productname: 'ชื่อยา', generic: 'ชื่อสามัญ', mgPerMl: 'ความเข้มข้น (ต่อ ml)', mlPerVial: 'ml/vial', unit: 'หน่วย', stRecon: 'stability หลังละลาย (วัน)', stDilute: 'stability หลังผสม (วัน)', storage: 'รหัสการเก็บ', recon: 'สารละลาย', mlRecon: 'ปริมาตรละลาย', off: 'เลิกใช้' },
  Patients: { title: 'คำนำหน้า', name: 'ชื่อ', surname: 'นามสกุล', dob: 'วันเกิด', sex: 'เพศ', ward: 'วอร์ด', allergyFlag: 'แพ้ยา', allergy: 'รายละเอียดแพ้ยา' },
  Diluents: { name: 'ชื่อ', generic: 'ชื่อบนฉลาก', mlPerBot: 'ปริมาณ ml/ขวด', off: 'เลิกใช้' },
  Staff: { empId: 'รหัสพนักงาน', name: 'ชื่อบนฉลาก', fullName: 'ชื่อ-นามสกุล', role: 'ตำแหน่ง', active: 'ใช้งาน', canLogin: 'เข้าระบบได้', admin: 'ผู้ดูแลระบบ', mixer: 'ผู้ผสมประจำ' },
  Wards: { name: 'ชื่อ', tel: 'โทร', partner: 'โรงพยาบาล' },
  EyeFormulas: { name: 'ชื่อสูตร', labelName: 'ชื่อบนฉลาก', method: 'วิธีเตรียม', storage: 'การเก็บรักษา', expDays: 'อายุ (วัน)', active: 'ใช้งาน' },
  Settings: { labelWidthMm: 'ความกว้างฉลาก (มม.)', labelHeightMm: 'ความสูงฉลาก (มม.)', labelRotate: 'หมุนฉลาก', labelYear: 'ปีบนฉลาก', defaultMixTime: 'เวลาผสมเริ่มต้น', shiftCutoff: 'เวลาแบ่งรอบเตรียมเคส', keepYears: 'เก็บข้อมูล (ปี)' },
};
const LOOKUP_TH_: any = { storage: 'รหัสการเก็บ', eyeSide: 'ตัวเลือกตา', eyeFreq: 'ความถี่ยาหยอดตา' };
const MASTER_TH_: any = { Products: 'ยา', Diluents: 'สารน้ำ', Staff: 'เจ้าหน้าที่', Wards: 'แผนก/วอร์ด/รพ.', EyeFormulas: 'สูตรยาหยอดตา' };
const fmtVal_ = (k: string, v: any) => {
  if (['off', 'active', 'canLogin', 'admin', 'mixer', 'labelRotate', 'allergyFlag'].includes(k)) return +v ? 'ใช่' : 'ไม่';
  if (k === 'role') return v === 'pharmacist' ? 'เภสัชกร' : 'ผู้ช่วยเภสัชกร';
  return v === '' || v == null ? '(ว่าง)' : String(v).length > 40 ? String(v).slice(0, 40) + '…' : String(v);
};
const changesTh_ = (name: string, a: any, b: any) => {
  const map = FIELD_TH_[name] || {};
  return Object.keys(map).filter(k => b[k] !== undefined && String(a[k] ?? '') !== String(b[k] ?? '')).map(k => `${map[k]} ${fmtVal_(k, a[k])} → ${fmtVal_(k, b[k])}`).join(', ') || 'ไม่มีการเปลี่ยนแปลง';
};
async function eyeDesc_(c: Ctx, e: any) {
  const f = (await read_(c, 'EyeFormulas', '"code"=$1', [String(e.formula)]))[0] || {};
  let lines: any[] = []; try { lines = JSON.parse(e.directions || '[]'); } catch (_er) { /* */ }
  return `HN ${e.HN} ${await patName_(c, e.HN)} · ${f.name || e.formula} · ${e.qty || 1} ขวด · ผลิต ${thd_(e.prepTime)} ${String(e.prepTime || '').slice(11, 16)} น.` + (lines.length ? ' · วิธีใช้: ' + lines.map(l => l.text || '').filter(String).join(' / ') : '');
}

// ---------------------------------------------------------------- session
async function auth_(c: Ctx, token: any, allowMustChange = false) {
  if (!token) throw err('SESSION_EXPIRED');
  const r = await c.q(`update public.sessions set exp = now() + ($2 || ' seconds')::interval where token=$1 and exp>now() returning u`, [String(token), String(SESSION_SEC)]);
  if (!r.length) throw err('SESSION_EXPIRED');
  const u = typeof r[0].u === 'string' ? JSON.parse(r[0].u) : r[0].u;
  if (u.mustChange && !allowMustChange) throw err('MUST_CHANGE_PW: ต้องเปลี่ยนรหัสผ่านตั้งต้นก่อนใช้งาน');
  return u;
}
const needAdmin_ = (u: any) => { if (!+u.admin) throw err('ต้องเป็นผู้ดูแลระบบ (admin) จึงจะทำรายการนี้ได้'); };

// ---------------------------------------------------------------- master / boot
async function ensureEyeLookups_(c: Ctx) {
  const L = await read_(c, 'Lookups');
  const sides = [['L', 'ข้างซ้าย'], ['R', 'ข้างขวา'], ['B', 'ทั้งสองข้าง'], ['A', 'ข้างที่เป็น']];
  const freqs = [['F2', 'ทุก 2 ชั่วโมง (ตลอด 24 ชั่วโมง)'], ['F1', 'ทุก 1 ชั่วโมง (ตลอด 24 ชั่วโมง)'], ['F2D', 'ทุก 2 ชั่วโมง (8.00 น. ถึง 20.00 น.)'], ['F4', 'ทุก 4 ชั่วโมง (ตลอด 24 ชั่วโมง)'],
    ['F6', 'ทุก 6 ชั่วโมง'], ['QID', 'วันละ 4 ครั้ง เช้า กลางวัน เย็น ก่อนนอน'], ['HS', 'ก่อนนอน']];
  if (!L.some(x => x.type === 'eyeSide')) for (const r of sides) await upsert_(c, 'Lookups', { type: 'eyeSide', code: r[0], text: r[1] });
  if (!L.some(x => x.type === 'eyeFreq')) for (const r of freqs) await upsert_(c, 'Lookups', { type: 'eyeFreq', code: r[0], text: r[1] });
}
async function master_(c: Ctx) {
  const [products, diluents, staff, wards, lookups, titles, eyeFormulas, settings] = await Promise.all([
    read_(c, 'Products'), read_(c, 'Diluents'), read_(c, 'Staff'), read_(c, 'Wards'), read_(c, 'Lookups'), read_(c, 'Titles'), read_(c, 'EyeFormulas'), settings_(c)]);
  return { products: products.map(strip_), diluents: diluents.map(strip_), staff: staff.map(strip_), wards: wards.map(strip_),
    lookups: lookups.map(strip_), titles: titles.map(strip_), eyeFormulas: eyeFormulas.map(strip_), settings };
}
async function bootData_(c: Ctx, u: any, listMode: string, listDate: string) {
  const today = today_();
  const [m, list] = await Promise.all([master_(c), listMode ? listCases(c, listMode, listDate || today) : Promise.resolve(null)]);
  const r: any = Object.assign({ user: u, today }, m);
  if (list) r.list = list;
  return r;
}

// ---------------------------------------------------------------- list
async function listCasesWhere(c: Ctx, where: string, params: any[]) {
  const visits = (await read_(c, 'Visits', where, params)).map(strip_);
  const ids = visits.map(v => v.id);
  const bottles = ids.length ? (await read_(c, 'Bottles', `"visitId" in ${IN(1)}`, [jarr(ids)])).map(strip_) : [];
  const hns = [...new Set(visits.map(v => String(v.HN)))];
  const patients = hns.length ? (await read_(c, 'Patients', `"HN" in ${IN(1)}`, [jarr(hns)])).map(strip_) : [];
  visits.sort((a, b) => (a.date + String(a.vn).padStart(4, '0')).localeCompare(b.date + String(b.vn).padStart(4, '0')));
  return { visits, bottles, patients };
}
async function listCases(c: Ctx, mode: string, d: string) {
  const r: any = mode === 'prep'
    ? await listCasesWhere(c, 'substr("preparedAt",1,10)=$1', [d])
    : await listCasesWhere(c, '"date"=$1', [d]);
  r.mode = mode; r.date = d; return r;
}

// ---------------------------------------------------------------- API
const API: Record<string, (c: Ctx, ...a: any[]) => Promise<any>> = {
  async apiLogin(c, code, pw, withBoot) {
    code = String(code || '').trim().toUpperCase();
    if (!code) throw err('กรอกรหัสพนักงาน');
    await c.q(`delete from public.sessions where exp < now() - interval '1 day'`);
    const fr = (await c.q('select n, until from public.login_fails where code=$1', [code]))[0];
    const fails = fr && fr.until && new Date(fr.until) > new Date() ? Number(fr.n) : 0;
    if (fails >= MAX_FAIL) {
      await log_(c, { code, name: '' }, 'login-fail', `รหัส ${code} ถูกล็อก 15 นาที เพราะใส่รหัสผ่านผิดเกิน ${MAX_FAIL} ครั้ง`);
      throw err(`ใส่รหัสผ่านผิดเกิน ${MAX_FAIL} ครั้ง ล็อกไว้ 15 นาที หรือให้ผู้ดูแลระบบรีเซ็ตรหัสผ่าน`);
    }
    const staff = await read_(c, 'Staff');
    const s = staff.find(x => String(x.empId).toUpperCase() === code) || staff.find(x => !x.empId && String(x.code).toUpperCase() === code);
    const fail = async (msg: string) => {
      await c.q(`insert into public.login_fails (code,n,until) values ($1,$2, now() + ($3 || ' seconds')::interval)
        on conflict (code) do update set n=$2, until=excluded.until`, [code, fails + 1, String(LOCK_SEC)]);
      await log_(c, { code, name: s ? s.name : '' }, 'login-fail', msg + ` (ครั้งที่ ${fails + 1})`);
      throw err('รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง');
    };
    if (!s || !+s.active || !+s.canLogin) await fail('ไม่พบรหัสพนักงาน ' + code + ' หรือรหัสนี้ไม่มีสิทธิ์เข้าระบบ');
    const ok = s.pwHash ? s.pwHash === await hash_(s.code, pw) : pw === DEFAULT_PW;
    if (!ok) await fail('ใส่รหัสผ่านไม่ถูกต้อง');
    await c.q('delete from public.login_fails where code=$1', [code]);
    const token = uuid();
    const u = { code: s.code, empId: s.empId, name: s.name, role: s.role, admin: +s.admin ? 1 : 0, mustChange: s.pwHash ? 0 : 1 };
    await c.q(`insert into public.sessions (token,u,exp) values ($1,$2::text::jsonb, now() + ($3 || ' seconds')::interval)`, [token, JSON.stringify(u), String(SESSION_SEC)]);
    await log_(c, u, 'login', 'เข้าสู่ระบบสำเร็จ');
    const out: any = { token, user: u, mustChange: !s.pwHash };
    if (withBoot && s.pwHash) out.boot = await bootData_(c, u, 'prep', '');
    return out;
  },
  async apiLogout(c, token) {
    try { const u = await auth_(c, token, true); await log_(c, u, 'logout', 'กดออกจากระบบ'); } catch (_e) { /* */ }
    await c.q('delete from public.sessions where token=$1', [String(token)]); return true;
  },
  async apiAutoLogout(c, token) {
    try { const u = await auth_(c, token, true); await log_(c, u, 'auto-logout', 'ระบบออกให้อัตโนมัติ เพราะไม่ได้ใช้งาน 15 นาที'); } catch (_e) { /* */ }
    await c.q('delete from public.sessions where token=$1', [String(token)]); return true;
  },
  async apiPing(c, token) { await auth_(c, token, true); return true; },
  async apiChangePassword(c, token, oldPw, newPw) {
    const u = await auth_(c, token, true);
    return lock_(c, async t => {
      const s = (await read_(t, 'Staff', '"code"=$1', [u.code]))[0]; if (!s) throw err('ไม่พบผู้ใช้');
      const ok = s.pwHash ? s.pwHash === await hash_(u.code, oldPw) : oldPw === DEFAULT_PW;
      if (!ok) throw err('รหัสผ่านเดิมไม่ถูกต้อง');
      if (!newPw || String(newPw).length < 6) throw err('รหัสผ่านใหม่ต้องยาวอย่างน้อย 6 ตัว');
      if (newPw === DEFAULT_PW) throw err('ห้ามใช้รหัสผ่านตั้งต้น');
      s.pwHash = await hash_(u.code, newPw); await upsert_(t, 'Staff', s);
      await log_(t, u, 'change-password', 'เปลี่ยนรหัสผ่านของตัวเอง');
      if (u.mustChange) { u.mustChange = 0; await t.q('update public.sessions set u=$2::text::jsonb where token=$1', [String(token), JSON.stringify(u)]); }
      return true;
    });
  },
  async apiResetPassword(c, token, code) {
    const u = await auth_(c, token); needAdmin_(u);
    return lock_(c, async t => {
      const s = (await read_(t, 'Staff', '"code"=$1', [String(code)]))[0]; if (!s) throw err('ไม่พบรหัส ' + code);
      s.pwHash = ''; await upsert_(t, 'Staff', s);
      await t.q('delete from public.login_fails where code=$1', [String(s.empId || s.code).toUpperCase()]);
      await log_(t, u, 'reset-password', `รีเซ็ตรหัสผ่านของ ${s.name} (${code}) กลับเป็นค่าตั้งต้น`);
      return true;
    });
  },
  async apiBoot(c, token, listMode, listDate) { const u = await auth_(c, token); return bootData_(c, u, listMode, listDate); },
  async apiList(c, token, mode, date) { await auth_(c, token); return listCases(c, mode, date); },

  async apiSearchPatients(c, token, q) {
    await auth_(c, token);
    q = String(q || '').trim().toLowerCase();
    if (q.length < 2) return [];
    const words = q.split(/\s+/);
    const conds = words.map((_w, i) => `lower("HN" || ' ' || "name" || ' ' || "surname") like $${i + 1}`).join(' and ');
    const params = words.map(w => '%' + w.replace(/[\\%_]/g, m => '\\' + m) + '%');
    const rows = await read_(c, 'Patients', conds, params, `"lastVisit" desc, _n`);
    return rows.slice(0, 30).map(strip_);
  },
  async apiPatient(c, token, hn) {
    await auth_(c, token);
    const p = (await read_(c, 'Patients', '"HN"=$1', [String(hn)]))[0];
    const all = (await read_(c, 'Visits', `"HN"=$1 and "cancelled" in ('','0')`, [String(hn)]));
    const visits = all.sort((a, b) => (b.date + b.vn).localeCompare(a.date + a.vn)).slice(0, 10).map(strip_);
    const ids = visits.map(v => v.id);
    return { patient: p ? strip_(p) : null, visits, bottles: ids.length ? (await read_(c, 'Bottles', `"visitId" in ${IN(1)}`, [jarr(ids)])).map(strip_) : [] };
  },
  async apiSavePatient(c, token, p) {
    const u = await auth_(c, token);
    return lock_(c, async t => {
      if (!p.HN) throw err('ต้องใส่ HN');
      const old = (await read_(t, 'Patients', '"HN"=$1', [String(p.HN)]))[0];
      const o = Object.assign({}, old || {}, p); delete o._row;
      await upsert_(t, 'Patients', o);
      await log_(t, u, old ? 'edit-patient' : 'add-patient', `HN ${o.HN} ${(o.title || '') + (o.name || '') + ' ' + (o.surname || '')}` + (old ? ' · ' + (changesTh_('Patients', old, o) === 'ไม่มีการเปลี่ยนแปลง' ? 'แก้ไขข้อมูล' : changesTh_('Patients', old, o)) : '') + (+o.allergyFlag ? ' · แพ้ยา: ' + (o.allergy || '-') : ''));
      return strip_(o);
    });
  },

  async apiSaveVisit(c, token, v, bottles, listMode, listDate) {
    const u = await auth_(c, token);
    return lock_(c, async t => {
      if (!v.HN) throw err('ต้องใส่ HN');
      if (!v.date) throw err('ต้องใส่วันที่ผสม');
      let old: any = null, moved = '';
      if (v.id) old = (await read_(t, 'Visits', '"id"=$1', [String(v.id)]))[0] || null;
      if (old && old.date !== v.date) {
        moved = old.date;
        await t.q('delete from public.bottles where "visitId"=$1', [String(old.id)]);
        await t.q('delete from public.visits where "id"=$1', [String(old.id)]);
        v.id = '';
      }
      if (!v.id) {
        const sameDay = await read_(t, 'Visits', '"date"=$1', [String(v.date)]);
        v.vn = sameDay.reduce((m, x) => Math.max(m, Number(x.vn) || 0), 0) + 1;
        v.id = v.date + '-' + v.vn;
      }
      if (!['pass', 'fail', 'incomplete'].includes(v.doseStatus)) throw err('ยังไม่ได้ตรวจสอบขนาดยา');
      if (v.doseStatus === 'fail') {
        if (!['prev', 'confirmed', 'other'].includes(v.doseReason)) throw err('ผลตรวจขนาดยาไม่ผ่าน ต้องเลือกเหตุผลก่อนบันทึก');
        if (v.doseReason === 'other' && !String(v.doseReasonNote || '').trim()) throw err('เลือก “อื่นๆ” ต้องระบุเหตุผล');
      }
      if (v.doseStatus === 'pass') { v.doseReason = ''; v.doseReasonNote = ''; }
      v.checkedBy = u.code;
      v.preparedAt = (old && old.preparedAt) || v.preparedAt || now_();
      v.preparedBy = (old && old.preparedBy) || v.preparedBy || u.code;
      v.photos = old ? old.photos : (v.photos || '');
      v.cancelled = old ? old.cancelled : (v.cancelled || 0);
      v.updatedAt = now_(); v.updatedBy = u.code;
      await upsert_(t, 'Visits', v);

      const printedMap: any = {};
      (await read_(t, 'Bottles', '"visitId"=$1', [String(v.id)])).forEach(b => printedMap[b.productcde + '|' + b.mg + '|' + b.diluent] = b.printed);
      await t.q('delete from public.bottles where "visitId"=$1', [String(v.id)]);
      const nb = (bottles || []).filter((b: any) => b.productcde).map((b: any, i: number) => Object.assign({}, b, {
        id: v.id + '-' + (i + 1), visitId: v.id, date: v.date, printed: b.printed || printedMap[b.productcde + '|' + b.mg + '|' + b.diluent] || 0 }));
      await insertMany_(t, 'Bottles', nb);

      const p = (await read_(t, 'Patients', '"HN"=$1', [String(v.HN)]))[0];
      if (p) {
        if (!p.lastVisit || v.date >= p.lastVisit) p.lastVisit = v.date;
        for (const k of ['wt', 'ht', 'scr']) if (v[k] !== '' && v[k] != null) p[k] = v[k];
        await upsert_(t, 'Patients', p);
      }
      await log_(t, u, old ? 'edit-case' : 'add-case', (moved ? `ย้ายวันผสมจาก ${thd_(moved)} → ` : '') + await caseDesc_(t, v, bottles));
      const out = await listCases(t, listMode || 'mix', listDate || v.date);
      out.savedId = v.id;
      return out;
    });
  },
  async apiDeleteVisit(c, token, id, listMode, listDate) {
    const u = await auth_(c, token);
    return lock_(c, async t => {
      const v = (await read_(t, 'Visits', '"id"=$1', [String(id)]))[0];
      await t.q('delete from public.bottles where "visitId"=$1', [String(id)]);
      await t.q('delete from public.visits where "id"=$1', [String(id)]);
      await log_(t, u, 'delete-case', v ? 'ลบ ' + await caseRef_(t, v) : 'ลบเคส ' + id);
      return listCases(t, listMode, listDate);
    });
  },
  async apiSetCancelled(c, token, id, flag, reason) {
    const u = await auth_(c, token);
    return lock_(c, async t => {
      const v = (await read_(t, 'Visits', '"id"=$1', [String(id)]))[0]; if (!v) throw err('ไม่พบเคส');
      v.cancelled = flag ? 1 : 0;
      if (flag && reason) v.note = (v.note ? v.note + ' | ' : '') + 'ยกเลิก: ' + reason;
      v.updatedAt = now_(); v.updatedBy = u.code;
      await upsert_(t, 'Visits', v);
      await log_(t, u, flag ? 'cancel-case' : 'uncancel-case', await caseRef_(t, v) + (flag ? ' · เหตุผล: ' + (reason || 'ไม่ระบุ') : ' · กลับมาเป็นเคสปกติ'));
      return strip_(v);
    });
  },
  async apiMarkPrinted(c, token, ids, isReprint, visitIds) {
    const u = await auth_(c, token);
    return lock_(c, async t => {
      await t.q(`update public.bottles set "printed" = (coalesce(nullif("printed",'')::numeric,0)+1)::text where "id" in ${IN(1)}`, [jarr(ids || [])]);
      const refs: string[] = [];
      for (const id of (visitIds || [])) { const v = (await read_(t, 'Visits', '"id"=$1', [String(id)]))[0]; refs.push(v ? await caseRef_(t, v) : id); }
      await log_(t, u, isReprint ? 'reprint-label' : 'print-label', `${isReprint ? 'พิมพ์ซ้ำ' : 'พิมพ์'}ฉลากขวดยา ${(ids || []).length} ดวง · ` + refs.join(' | '));
      return true;
    });
  },

  // ---------- รูปเคส (เก็บใน Supabase Storage; รูปเก่าที่เป็น id ของ Drive ยังแสดงเป็นลิงก์)
  async apiAddPhoto(c, token, visitId, dataUrl) {
    const u = await auth_(c, token);
    const m = String(dataUrl).match(/^data:(image\/[\w+.-]+);base64,(.+)$/); if (!m) throw err('ไฟล์รูปไม่ถูกต้อง');
    const bin = Uint8Array.from(atob(m[2]), ch => ch.charCodeAt(0));
    return lock_(c, async t => {
      const v = (await read_(t, 'Visits', '"id"=$1', [String(visitId)]))[0]; if (!v) throw err('ไม่พบเคส (บันทึกเคสก่อนถ่ายรูป)');
      const cur = String(v.photos || '').split(',').filter(String);
      const ext = m[1].includes('png') ? 'png' : m[1].includes('webp') ? 'webp' : m[1].includes('heic') ? 'heic' : 'jpg';
      const path = `${v.date.slice(0, 7)}/${v.date}/VN${v.vn}_${v.HN}_${cur.length + 1}_${uuid().slice(0, 8)}.${ext}`;
      await t.storage.put('photos', path, bin, m[1]);
      v.photos = cur.concat(path).join(',');
      await upsert_(t, 'Visits', v);
      await log_(t, u, 'add-photo', `เพิ่มรูปเคส (${path.split('/').pop()}) · ${await caseRef_(t, v)}`);
      return strip_(v);
    });
  },
  async apiGetPhotos(c, token, visitId) {
    await auth_(c, token);
    const v = (await read_(c, 'Visits', '"id"=$1', [String(visitId)]))[0]; if (!v) return [];
    const ids = String(v.photos || '').split(',').filter(String);
    return Promise.all(ids.map(async id => {
      if (!id.includes('/')) return { id, name: '(รูปเดิมใน Google Drive)', url: 'https://drive.google.com/file/d/' + id + '/view', data: '' };
      try {
        const f = await c.storage.get('photos', id); if (!f) return { id, name: '(ไม่พบไฟล์)', data: '' };
        let s = ''; const CH = 0x8000; for (let i = 0; i < f.bytes.length; i += CH) s += String.fromCharCode(...f.bytes.subarray(i, i + CH));
        return { id, name: id.split('/').pop(), url: '', data: /^image\/(jpeg|png|gif|webp)$/.test(f.mime) ? 'data:' + f.mime + ';base64,' + btoa(s) : '' };
      } catch (_e) { return { id, name: '(ไม่พบไฟล์)', data: '' }; }
    }));
  },
  async apiDeletePhoto(c, token, visitId, fileId) {
    const u = await auth_(c, token);
    return lock_(c, async t => {
      const v = (await read_(t, 'Visits', '"id"=$1', [String(visitId)]))[0]; if (!v) throw err('ไม่พบเคส');
      v.photos = String(v.photos || '').split(',').filter((x: string) => x && x !== fileId).join(',');
      await upsert_(t, 'Visits', v);
      if (String(fileId).includes('/')) { try { await t.storage.remove('photos', fileId); } catch (_e) { /* */ } }
      await log_(t, u, 'delete-photo', `ลบรูปเคส 1 รูป · ${await caseRef_(t, v)}`);
      return strip_(v);
    });
  },

  // ---------- รายงาน
  async apiReport(c, token, from, to) {
    const u = await auth_(c, token);
    const r: any = await listCasesWhere(c, '"date">=$1 and "date"<=$2', [String(from), String(to)]);
    r.eyes = (await read_(c, 'EyeDrops', '"date">=$1 and "date"<=$2', [String(from), String(to)])).map(strip_);
    const hns: any = {}; r.patients.forEach((p: any) => hns[p.HN] = 1);
    for (const e of r.eyes) if (!hns[e.HN]) { const p = (await read_(c, 'Patients', '"HN"=$1', [String(e.HN)]))[0]; if (p) { r.patients.push(strip_(p)); hns[e.HN] = 1; } }
    await log_(c, u, 'view-report', `ดูรายงานวันที่ผสม ${thd_(from)} ถึง ${thd_(to)}`);
    return r;
  },
  /** สร้างไฟล์รายงาน (CSV เปิดด้วย Excel ได้) เก็บใน Supabase Storage แล้วคืนลิงก์ดาวน์โหลดที่หมดอายุใน 24 ชม. */
  async apiExportReport(c, token, title, rows, _colors) {
    const u = await auth_(c, token);
    const esc = (x: any) => { const s = String(x ?? ''); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const csv = '﻿' + (rows || []).map((r: any[]) => r.map(esc).join(',')).join('\r\n');
    const dl = `${nowFull().replace(/[: ]/g, '-')}_${String(title).replace(/[\\/:*?"<>|]/g, '_')}.csv`;
    const name = `${nowFull().replace(/[: ]/g, '-')}_${uuid().slice(0, 8)}.csv`;
    await c.storage.put('reports', name, new TextEncoder().encode(csv), 'text/csv; charset=utf-8');
    await log_(c, u, 'export-report', 'สร้างไฟล์ ' + title);
    return c.storage.signedUrl('reports', name, 86400, dl);
  },

  // ---------- ตั้งค่า
  async apiSaveMaster(c, token, name, obj) {
    const u = await auth_(c, token);
    const EDITABLE: any = { Products: 'productcde', Diluents: 'pcode', Staff: 'code', Wards: 'code', EyeFormulas: 'code' };
    if (!EDITABLE[name]) throw err('แก้ไขแผ่นงานนี้ไม่ได้');
    if (name === 'Staff') needAdmin_(u);
    return lock_(c, async t => {
      const key = EDITABLE[name];
      if (name === 'Staff') {
        obj.empId = String(obj.empId || '').trim().toUpperCase();
        if (!obj.code) obj.code = obj.empId || ('S' + Date.now().toString(36).toUpperCase());
        if (obj.empId && (await read_(t, 'Staff')).some(x => String(x.empId).toUpperCase() === obj.empId && x.code !== obj.code)) throw err('รหัสพนักงาน ' + obj.empId + ' มีคนใช้แล้ว');
        if (+obj.canLogin && !obj.empId && obj._new) throw err('ต้องใส่รหัสพนักงานก่อน จึงจะเข้าระบบได้');
      }
      if (!obj[key]) throw err('ต้องใส่รหัส');
      obj[key] = String(obj[key]).trim();
      const old = (await read_(t, name, `${QI(key)}=$1`, [obj[key]]))[0] || null;
      if (obj._new && old) throw err('รหัส ' + obj[key] + ' มีอยู่แล้ว');
      delete obj._new;
      const o = Object.assign({}, old || {}, obj);
      if (name === 'Staff' && old) o.pwHash = old.pwHash;
      if (name === 'Staff' && !old) o.pwHash = '';
      if (name === 'Products' && !old && o.chemo === undefined) o.chemo = 1;
      delete o._row;
      await upsert_(t, name, o);
      await log_(t, u, (old ? 'edit-' : 'add-') + name, `${old ? 'แก้ไข' : 'เพิ่ม'}${MASTER_TH_[name] || name} ${obj[key]}${o.name || o.productname ? ' (' + (o.productname || o.name) + ')' : ''}` + (old ? ': ' + changesTh_(name, old, o) : ''));
      return (await read_(t, name)).map(strip_);
    });
  },
  async apiSaveLookup(c, token, type, code, text, oldCode) {
    const u = await auth_(c, token);
    return lock_(c, async t => {
      const hit = (await read_(t, 'Lookups', '"type"=$1 and "code"=$2', [String(type), String(oldCode || code)]))[0];
      if (hit && oldCode && String(oldCode) !== String(code)) await t.q('delete from public.lookups where "type"=$1 and "code"=$2', [String(type), String(oldCode)]);
      await upsert_(t, 'Lookups', { type, code, text });
      const what = type === 'storage' ? `“${code}” = ${text}` : `“${text}”`;
      await log_(t, u, hit ? 'edit-lookup' : 'add-lookup', `${hit ? 'แก้ไข' : 'เพิ่ม'}${LOOKUP_TH_[type] || type} ${what}` + (hit && hit.text !== text ? ` (เดิม: ${hit.text})` : ''));
      return (await read_(t, 'Lookups')).map(strip_);
    });
  },
  async apiDeleteLookup(c, token, type, code) {
    const u = await auth_(c, token);
    return lock_(c, async t => {
      const hit = (await read_(t, 'Lookups', '"type"=$1 and "code"=$2', [String(type), String(code)]))[0];
      if (hit) { await t.q('delete from public.lookups where "type"=$1 and "code"=$2', [String(type), String(code)]); await log_(t, u, 'delete-lookup', `ลบ${LOOKUP_TH_[type] || type} “${hit.text}”` + (type === 'storage' ? ` (รหัส ${code})` : '')); }
      return (await read_(t, 'Lookups')).map(strip_);
    });
  },
  async apiSaveSettings(c, token, obj) {
    const u = await auth_(c, token); needAdmin_(u);
    return lock_(c, async t => {
      const before = await settings_(t);
      for (const k of Object.keys(obj)) await setSetting_(t, k, obj[k]);
      await log_(t, u, 'edit-settings', 'แก้ค่าระบบ: ' + changesTh_('Settings', before, obj));
      return settings_(t);
    });
  },
  async apiLogs(c, token, from, to, q) {
    const u = await auth_(c, token); needAdmin_(u);
    q = String(q || '').toLowerCase();
    const rows = await read_(c, 'Logs', 'substr("time",1,10)>=$1 and substr("time",1,10)<=$2', [String(from), String(to)], '_n desc');
    return rows.filter(l => !q || (l.code + ' ' + l.name + ' ' + l.action + ' ' + l.detail).toLowerCase().includes(q)).slice(0, 1000).map(strip_);
  },

  // ---------- ยาหยอดตา
  async apiEyeDay(c, token, date) { await auth_(c, token); return eyeDay_(c, date); },
  async apiSaveEye(c, token, e) {
    const u = await auth_(c, token);
    return lock_(c, async t => {
      if (!e.HN) throw err('ต้องใส่ HN');
      if (!e.formula) throw err('ต้องเลือกสูตรยา');
      const isNew = !e.id;
      if (isNew) {
        e.seq = (await read_(t, 'EyeDrops', '"date"=$1', [String(e.date)])).reduce((m, x) => Math.max(m, Number(x.seq) || 0), 0) + 1;
        e.id = 'E' + e.date + '-' + e.seq; e.printed = 0;
      }
      e.updatedAt = now_(); e.updatedBy = u.code;
      await upsert_(t, 'EyeDrops', e);
      await log_(t, u, isNew ? 'add-eyedrop' : 'edit-eyedrop', await eyeDesc_(t, e));
      return Object.assign(await eyeDay_(t, e.date), { savedId: e.id });
    });
  },
  async apiDeleteEye(c, token, id) {
    const u = await auth_(c, token);
    return lock_(c, async t => {
      const delE = (await read_(t, 'EyeDrops', '"id"=$1', [String(id)]))[0];
      const date = delE ? delE.date : '';
      await t.q('delete from public.eyedrops where "id"=$1', [String(id)]);
      await log_(t, u, 'delete-eyedrop', delE ? 'ลบ ' + await eyeDesc_(t, delE) : 'ลบรายการ ' + id);
      return eyeDay_(t, date);
    });
  },
  async apiMarkEyePrinted(c, token, ids, isReprint) {
    const u = await auth_(c, token);
    return lock_(c, async t => {
      await t.q(`update public.eyedrops set "printed" = (coalesce(nullif("printed",'')::numeric,0)+1)::text where "id" in ${IN(1)}`, [jarr(ids || [])]);
      const ds: string[] = [];
      for (const id of (ids || [])) { const e = (await read_(t, 'EyeDrops', '"id"=$1', [String(id)]))[0]; ds.push(e ? await eyeDesc_(t, e) : id); }
      await log_(t, u, isReprint ? 'reprint-eyedrop' : 'print-eyedrop', `${isReprint ? 'พิมพ์ซ้ำ' : 'พิมพ์'}ฉลากยาหยอดตา · ` + ds.join(' | '));
      return true;
    });
  },
};
async function eyeDay_(c: Ctx, date: string) {
  const eyes = (await read_(c, 'EyeDrops', '"date"=$1', [String(date)])).map(strip_).sort((a, b) => Number(a.seq) - Number(b.seq));
  const hns = [...new Set(eyes.map(e => String(e.HN)))];
  return { date, eyes, patients: hns.length ? (await read_(c, 'Patients', `"HN" in ${IN(1)}`, [jarr(hns)])).map(strip_) : [] };
}

export const FUNCS = Object.keys(API);

/** ประมวลผลคำขอ 1 รายการ → {ok, data | error} */
export async function handle(c: Ctx, req: any) {
  const fn = API[req && req.fn];
  if (!fn) return { ok: false, error: 'ไม่รู้จักคำสั่ง ' + (req && req.fn) };
  const t0 = Date.now();
  try { const data = await fn(c, ...(Array.isArray(req.args) ? req.args : [])); return { ok: true, data, ms: Date.now() - t0 }; }
  catch (e: any) { return { ok: false, error: String((e && e.message) || e) }; }
}

/** นำเข้าข้อมูลจาก Google Sheet (ใช้ครั้งเดียวตอนย้ายระบบ) */
export async function importRows(c: Ctx, table: string, rows: any[], truncate: boolean) {
  if (!SH[table]) throw err('ไม่รู้จักตาราง ' + table);
  const cols = SH[table];
  await c.tx(async t => {
    if (truncate) await t.q(`truncate public.${T(table)} restart identity`);
    const sel = cols.map(k => `x.${QI(k)}`).join(',');
    const def = cols.map(k => `${QI(k)} text`).join(',');
    let sql = `insert into public.${T(table)} (${cols.map(QI).join(',')}) select ${sel} from jsonb_to_recordset($1::text::jsonb) as x(${def})`;
    const pk = PK[table];
    if (pk.length) sql += ` on conflict (${pk.map(QI).join(',')}) do update set ${cols.filter(k => !pk.includes(k)).map(k => `${QI(k)}=excluded.${QI(k)}`).join(',') || QI(pk[0]) + '=excluded.' + QI(pk[0])}`;
    const clean = rows.map(r => Object.fromEntries(cols.map(k => [k, r[k] === null || r[k] === undefined ? '' : String(r[k])])));
    // กัน key ซ้ำในชุดเดียวกัน (เอาแถวหลังสุด)
    let uniq = clean;
    if (pk.length) { const m = new Map(); clean.forEach(r => m.set(pk.map(k => r[k]).join('\u0001'), r)); uniq = [...m.values()]; }
    if (uniq.length) await t.q(sql, [JSON.stringify(uniq)]);
  });
  return rows.length;
}
