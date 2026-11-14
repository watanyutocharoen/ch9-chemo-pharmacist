// ===== Engine + UI =====
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const num = v => { const x = parseFloat(String(v).replace(',', '.')); return isFinite(x) ? x : null; };
function fmt(x) { if (x == null || !isFinite(x)) return '—'; const a = Math.abs(x);
  const v = a >= 100 ? Math.round(x) : a >= 10 ? Math.round(x * 10) / 10 : Math.round(x * 100) / 100;
  return v.toLocaleString('en-US', { maximumFractionDigits: 2 }); }

R.forEach((g, i) => { g.id = i; g.cls = [...new Set(g.d.map(x => (DL[drugKey(x.n)] || {}).cls).filter(c => c && c !== 'support'))]; });

const S = { p: { wt:'', ht:'', age:'', sex:'M', scr:'', scrFloor:true, crclWt:'actual', bsaF:'mosteller', bsaCap:'0', gfrCap:true },
  q:'', mode:'all', cancer:'', cls:'', reg:null, gPct:100, rows:[], extra:[], tab:'calc' };

function baseName(n) { return n.replace(/\s*\(.*?\)/g, '').replace(/\s+(bolus|infusion|loading|maintenance|weekly|push)$/i, '').trim(); }
function drugHay(g) { return g.d.map(x => x.n + ' ' + (BRAND[drugKey(x.n)] || '')).join(' '); }
function hl(text, terms) {
  let h = esc(text); if (!terms.length) return h;
  terms.forEach(t => { const re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'); h = h.replace(re, '<mark>$1</mark>'); });
  return h;
}
function drugNames(g) {
  const out = [];
  g.d.forEach(x => { const n = baseName(x.n);
    if (!out.includes(n)) out.push(n); });
  return out.join(' + ');
}

// ---------- patient ----------
function patient() {
  const p = S.p, wt = num(p.wt), ht = num(p.ht), age = num(p.age), scr = num(p.scr);
  const o = { wt, ht, age, scr, ok:false, okRenal:false, warn:[] };
  if (!(wt > 0 && ht > 0)) return o;
  o.ok = true;
  o.bsaM = Math.sqrt(ht * wt / 3600);
  o.bsaD = 0.007184 * Math.pow(wt, 0.425) * Math.pow(ht, 0.725);
  o.bsaRaw = p.bsaF === 'dubois' ? o.bsaD : o.bsaM;
  const cap = num(p.bsaCap);
  o.bsa = cap > 0 ? Math.min(o.bsaRaw, cap) : o.bsaRaw;
  o.bsaCapped = cap > 0 && o.bsaRaw > cap;
  o.bmi = wt / Math.pow(ht / 100, 2);
  const inch = ht / 2.54 - 60;
  o.ibw = (p.sex === 'M' ? 50 : 45.5) + 2.3 * inch;
  o.adjbw = o.ibw + 0.4 * (wt - o.ibw);
  if (wt < 25 || wt > 250) o.warn.push('น้ำหนักผิดปกติ — ตรวจหน่วย (kg)');
  if (ht < 100 || ht > 220) o.warn.push('ส่วนสูงผิดปกติ — ตรวจหน่วย (cm)');
  if (o.bmi >= 30) o.warn.push('BMI ≥30: ASCO แนะนำใช้น้ำหนักจริงและไม่ cap BSA สำหรับยาเคมีบำบัด (ยกเว้นสถาบันกำหนด) — สำหรับ CrCl พิจารณาใช้ Adjusted BW');
  if (age > 0 && scr > 0) {
    o.okRenal = true;
    o.scrUsed = p.scrFloor ? Math.max(scr, 0.7) : scr;
    let w = wt; if (p.crclWt === 'ideal') w = Math.min(o.ibw, wt); if (p.crclWt === 'adjusted') w = wt > o.ibw ? o.adjbw : wt;
    o.crclW = w;
    o.crcl = ((140 - age) * w) / (72 * o.scrUsed) * (p.sex === 'F' ? 0.85 : 1);
    o.gfr = p.gfrCap ? Math.min(o.crcl, 125) : o.crcl;
    if (scr > 15) o.warn.push('SCr สูงมาก — ตรวจว่าใส่หน่วย mg/dL (ถ้าเป็น µmol/L ให้หาร 88.4)');
  }
  return o;
}

// ---------- drug calc ----------
function calc(dr, P, pct) {
  const o = { lines:[], unitOut: dr.unit.startsWith('units') ? 'units' : 'mg', std:null, fin:null };
  if (dr.fixedText) { o.text = dr.fixedText; o.lines.push('ขนาดคงที่ตามผลิตภัณฑ์: ' + dr.fixedText); return o; }
  let full = null;
  switch (dr.unit) {
    case 'mg/m2': case 'units/m2':
      if (!P.ok) { o.need = 'กรอกน้ำหนัก/ส่วนสูง'; return o; }
      full = dr.dose * P.bsa; o.lines.push(`${dr.dose} ${dr.unit.replace('2','²')} × BSA ${P.bsa.toFixed(2)} m² = ${fmt(full)} ${o.unitOut}`); break;
    case 'mg/kg':
      if (!P.ok) { o.need = 'กรอกน้ำหนัก'; return o; }
      full = dr.dose * P.wt; o.lines.push(`${dr.dose} mg/kg × ${P.wt} kg = ${fmt(full)} mg`); break;
    case 'mg': case 'units': full = dr.dose; o.lines.push(`ขนาดคงที่ (flat dose) ${dr.dose} ${o.unitOut} — ไม่ขึ้นกับ BSA/น้ำหนัก`); break;
    case 'AUC':
      if (!P.okRenal) { o.need = 'กรอกอายุ, เพศ, SCr เพื่อคำนวณ CrCl'; return o; }
      full = dr.dose * (P.gfr + 25);
      o.lines.push(`Calvert: AUC ${dr.dose} × (GFR ${fmt(P.gfr)}${S.p.gfrCap && P.crcl > 125 ? ' [cap 125]' : ''} + 25) = ${fmt(full)} mg`);
      o.lines.push(`(ขนาดสูงสุดที่ AUC ${dr.dose} = ${dr.dose} × 150 = ${fmt(dr.dose * 150)} mg)`); break;
    case 'tier': {
      if (!P.ok) { o.need = 'กรอกน้ำหนัก'; return o; }
      const t = dr.tiers.find(t => t.lt == null || P.wt < t.lt); full = t.dose; o.lines.push(`ตามช่วงน้ำหนัก: ${dr.tierText} → น้ำหนัก ${P.wt} kg = ${full} mg`); break; }
  }
  o.raw = full;
  o.std = dr.cap ? Math.min(full, dr.cap) : full;
  let fin = full * pct / 100;
  if (pct !== 100) o.lines.push(`ปรับขนาด ${pct}% → ${fmt(full)} × ${pct}% = ${fmt(fin)} ${o.unitOut}`);
  if (dr.cap && fin > dr.cap) { o.capped = true; o.lines.push(`เกินขนาดสูงสุด → ใช้ cap ${dr.cap} mg`); fin = dr.cap; }
  o.fin = fin;
  if (dr.roundTo) { o.rounded = Math.round(fin / dr.roundTo) * dr.roundTo; o.lines.push(`ปัดตามขนาดเม็ด/แคปซูล (ทีละ ${dr.roundTo} mg) ≈ ${fmt(o.rounded)} mg (ต่างจากคำนวณ ${fmt((o.rounded - fin) / fin * 100)}%)`); }
  if (dr.freq === 'BID') o.lines.push(`= ${fmt(fin)} mg ต่อมื้อ, วันละ 2 มื้อ (รวม ${fmt(fin * 2)} mg/วัน)`);
  if (dr.nDays) o.lines.push(`= ${fmt(fin)} ${o.unitOut}/วัน × ${dr.nDays} วัน (รวม ${fmt(fin * dr.nDays)} ${o.unitOut}/รอบ)`);
  return o;
}

function verify(dr, c, P, ordered, pct) {
  if (ordered == null || c.std == null) return null;
  const ratio = ordered / c.std * 100, msgs = [];
  let lvl;
  if (ratio > 110) lvl = 'red'; else if (ratio > 105) lvl = 'amber'; else if (ratio >= 90) lvl = 'green'; else if (ratio >= 70) lvl = 'blue'; else lvl = 'amber';
  const label = { red:'สูงกว่ามาตรฐาน — ตรวจสอบกับแพทย์', amber: ratio > 100 ? 'สูงกว่ามาตรฐานเล็กน้อย' : 'ต่ำกว่ามาตรฐานมาก — ตรวจสอบ', green:'อยู่ในช่วงมาตรฐาน (±5–10%)', blue:'ลดขนาด — ตรวจว่าแพทย์ตั้งใจลด dose' }[lvl];
  msgs.push(`แพทย์สั่ง = ${fmt(ratio)}% ของขนาดมาตรฐาน (${fmt(c.std)} ${c.unitOut})`);
  if (pct !== 100 && c.fin) msgs.push(`เทียบกับขนาดที่ปรับไว้ ${pct}% (${fmt(c.fin)}) = ${fmt(ordered / c.fin * 100)}%`);
  const lib = DL[drugKey(dr.n)] || {};
  if ((dr.unit === 'mg/m2') && P.ok) {
    const perM2 = ordered / P.bsa; msgs.push(`เท่ากับ ${fmt(perM2)} mg/m²`);
    if (lib.maxSingle && !dr.nDays && perM2 > lib.maxSingle * 1.05) { lvl = 'red'; msgs.push(`⚠ เกินขนาดสูงสุดต่อครั้งที่พบในสูตรทั่วไป (${lib.maxSingle} mg/m²)`); }
  }
  if (dr.unit === 'mg/kg' && P.ok) msgs.push(`เท่ากับ ${fmt(ordered / P.wt)} mg/kg`);
  if (dr.unit === 'AUC' && P.okRenal) {
    msgs.push(`เท่ากับ AUC ≈ ${fmt(ordered / (P.gfr + 25))}`);
    if (ordered > dr.dose * 150 * 1.001) { lvl = 'red'; msgs.push(`⚠ เกินขนาดสูงสุดที่ AUC ${dr.dose} (${dr.dose * 150} mg)`); }
  }
  if (dr.cap && ordered > dr.cap * 1.001) { lvl = 'red'; msgs.push(`⚠ เกิน cap ${dr.cap} mg`); }
  if (drugKey(dr.n) === 'vincristine' && !dr.nDays && ordered > 2) { lvl = 'red'; msgs.push('⚠ Vincristine > 2 mg'); }
  return { lvl, label: lvl === 'red' && ratio <= 110 ? 'เกินขนาดสูงสุด — ตรวจสอบกับแพทย์' : label, msgs, ratio };
}

// ---------- render ----------
function renderPatient() {
  const P = patient(), box = $('#pcalc');
  if (!P.ok) { box.innerHTML = '<div class="hint">กรอกน้ำหนักและส่วนสูงเพื่อเริ่มคำนวณ</div>'; return P; }
  const chip = (k, v, sub) => `<div class="chip"><span>${k}</span><b>${v}</b>${sub ? `<i>${sub}</i>` : ''}</div>`;
  box.innerHTML = `<div class="chips">
    ${chip('BSA', P.bsa.toFixed(2) + ' m²', (S.p.bsaF === 'dubois' ? 'DuBois' : 'Mosteller') + (P.bsaCapped ? ` (cap จาก ${P.bsaRaw.toFixed(2)})` : ''))}
    ${chip('BMI', P.bmi.toFixed(1))}
    ${chip('IBW', fmt(P.ibw) + ' kg', 'AdjBW ' + fmt(P.adjbw))}
    ${P.okRenal ? chip('CrCl (C-G)', fmt(P.crcl) + ' mL/min', `SCr ใช้ ${P.scrUsed} · นน. ${fmt(P.crclW)} kg`) : chip('CrCl', '—', 'ต้องมีอายุ+SCr')}
    ${P.okRenal ? chip('GFR (Calvert)', fmt(P.gfr), S.p.gfrCap && P.crcl > 125 ? 'cap 125' : '') : ''}
  </div>${P.warn.map(w => `<div class="warn">${esc(w)}</div>`).join('')}`;
  return P;
}

function regList() {
  const q = S.q.trim().toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  const list = R.filter(g => {
    if (S.cancer && g.c !== S.cancer) return false;
    if (S.cls && !g.cls.includes(S.cls)) return false;
    if (!terms.length) return true;
    const reg = g.n + ' ' + (g.kw || ''), drug = drugHay(g), can = CANCERS[g.c] + ' ' + CANCER_KW[g.c] + ' ' + g.s;
    const hay = (S.mode === 'reg' ? reg : S.mode === 'drug' ? drug : S.mode === 'cancer' ? can : reg + ' ' + drug + ' ' + can + ' ' + g.ref).toLowerCase();
    return terms.every(t => hay.includes(t));
  });
  $('#count').textContent = `${list.length} สูตร`;
  const hlTerms = S.mode === 'cancer' ? [] : terms;
  // drug info card when searching a drug
  let info = '';
  if (terms.length && S.mode !== 'reg' && S.mode !== 'cancer') {
    const keys = [...new Set(R.flatMap(g => g.d.map(x => drugKey(x.n))))].filter(k => terms.every(t => (k + ' ' + (BRAND[k] || '')).toLowerCase().includes(t)));
    if (keys.length && keys.length <= 3) info = keys.map(k => { const L = DL[k] || {};
      return `<div class="dinfo"><b>💊 ${esc(k)}</b>${BRAND[k] ? ` <span class="brand">${esc(BRAND[k])}</span>` : ''} ${L.cls ? `<span class="b b-${L.cls}">${CLS_LABEL[L.cls]}</span>` : ''}
        <div class="dsub">อยู่ใน ${R.filter(g => g.d.some(x => drugKey(x.n) === k)).length} สูตร</div>
        ${L.note ? `<div>${esc(L.note)}</div>` : ''}${L.life ? `<div>⛔ ${esc(L.life)}</div>` : ''}${L.hep ? `<div>🟤 ตับ: ${esc(L.hep)}</div>` : ''}</div>`; }).join('');
  }
  $('#list').innerHTML = info + (list.length ? list.map(g => `<button class="ri ${S.reg && S.reg.id === g.id ? 'on' : ''}" data-id="${g.id}">
    <div class="rn">${hl(g.n, S.mode === 'drug' ? [] : hlTerms)}</div><div class="rd">${hl(drugNames(g), S.mode === 'reg' ? [] : hlTerms)}</div><div class="rs">${esc(CANCERS[g.c])} · ${esc(g.s)}</div>
    <div class="rt">${g.cls.map(c => `<span class="b b-${c}">${CLS_LABEL[c]}</span>`).join('')}</div></button>`).join('')
    : '<div class="hint">ไม่พบสูตร — ลองคำค้นอื่น เปลี่ยนโหมดค้นหา หรือใช้ "สร้างสูตรเอง"</div>');
}

function selectReg(g) {
  S.reg = g; S.gPct = 100; S.extra = [];
  S.rows = g.d.map(() => ({ pct:100, ord:'' }));
  render(); regList();
  if (window.innerWidth < 980) $('#main').scrollIntoView({ behavior:'smooth' });
}

function allDrugs() { return S.reg ? S.reg.d.concat(S.extra) : []; }

function renderMain() {
  const P = patient(), g = S.reg, m = $('#main');
  if (!g) { m.innerHTML = `<div class="empty"><div class="eico">℞</div><h3>เลือกสูตรยาจากรายการ</h3><p>ค้นหาด้วยชื่อสูตร ชื่อยา หรือชื่อโรค (ไทย/อังกฤษ) เช่น “FOLFOX”, “ท่อน้ำดี”, “trastuzumab”</p>
    <button class="btn" id="bCustom">+ สร้างสูตรเอง (ยาที่ไม่มีในฐานข้อมูล)</button></div>`; return; }
  const drugs = allDrugs();
  const rows = drugs.map((dr, i) => {
    const st = S.rows[i] || (S.rows[i] = { pct:S.gPct, ord:'' });
    const c = calc(dr, P, st.pct), lib = DL[drugKey(dr.n)] || {};
    const unitTxt = dr.fixedText ? '' : dr.unit === 'AUC' ? `AUC ${dr.dose}` : dr.unit === 'tier' ? dr.tierText : `${dr.dose} ${dr.unit.replace('m2','m²')}${dr.nDays ? '/วัน' : ''}`;
    const ren = lib.renal && P.okRenal ? lib.renal(P.crcl) : null;
    const v = verify(dr, c, P, num(st.ord), st.pct);
    const per = dr.freq === 'BID' ? ' /มื้อ' : dr.nDays ? ' /วัน' : '';
    const ordUnit = (c.unitOut || 'mg') + per;
    return `<div class="drug ${v ? 'v-' + v.lvl : ''}">
      <div class="dh"><div><div class="dn">${esc(dr.n)} ${lib.cls ? `<span class="b b-${lib.cls}">${CLS_LABEL[lib.cls]}</span>` : ''}${dr.custom ? ' <span class="b">เพิ่มเอง</span>' : ''}</div>
        <div class="dm">${esc(unitTxt)} · ${esc(dr.days)} · ${esc(dr.route)}${dr.cap ? ` · cap ${dr.cap} mg` : ''}</div></div>
        ${dr.custom ? `<button class="x" data-del="${i}" title="ลบ">×</button>` : ''}</div>
      <div class="dg">
        <div class="cell"><label>ขนาดมาตรฐาน (100%)</label><div class="big mono">${c.text ? esc(c.text) : c.need ? `<span class="need">${esc(c.need)}</span>` : fmt(c.std) + ' <small>' + c.unitOut + per + '</small>'}</div></div>
        <div class="cell"><label>% ปรับขนาด</label><input class="pct" type="number" inputmode="decimal" data-pct="${i}" value="${st.pct}" min="0" max="150"></div>
        <div class="cell hl"><label>ขนาดที่ควรได้</label><div class="big mono">${c.fin != null ? fmt(c.fin) + ' <small>' + c.unitOut + per + '</small>' : '—'}${c.capped ? ' <span class="b b-cap">cap</span>' : ''}</div>
          ${c.rounded != null ? `<div class="sub">ปัดตามเม็ด ≈ ${fmt(c.rounded)} mg</div>` : ''}${dr.nDays && c.fin != null ? `<div class="sub">รวม ${fmt(c.fin * dr.nDays)} ${c.unitOut}/รอบ</div>` : ''}</div>
        <div class="cell ord"><label>แพทย์สั่ง (${ordUnit})</label><input type="number" inputmode="decimal" data-ord="${i}" value="${esc(st.ord)}" placeholder="ใส่เพื่อตรวจ" ${c.text ? 'disabled' : ''}></div>
      </div>
      ${v ? `<div class="vres v-${v.lvl}"><b>${v.lvl === 'green' ? '✓' : v.lvl === 'red' ? '✕' : '!'} ${esc(v.label)}</b><ul>${v.msgs.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      ${ren ? `<div class="ren ${ren.lvl}"><b>ไต (CrCl ${fmt(P.crcl)}):</b> ${esc(ren.text)} ${ren.pct != null && ren.pct > 0 ? `<button class="mini" data-apply="${i}" data-v="${ren.pct}">ใช้ ${ren.pct}%</button>` : ''}</div>` : ''}
      <details><summary>วิธีคำนวณ & ข้อควรระวัง</summary><div class="how">
        ${c.lines.map(l => `<div class="mono">${esc(l)}</div>`).join('')}
        ${dr.note ? `<div class="nt">📝 ${esc(dr.note)}</div>` : ''}
        ${BRAND[drugKey(dr.n)] ? `<div class="nt">🏷 ชื่อการค้า: ${esc(BRAND[drugKey(dr.n)])}</div>` : ''}
        ${lib.note ? `<div class="nt">💊 ${esc(lib.note)}</div>` : ''}
        ${lib.hep ? `<div class="nt">🟤 ตับ: ${esc(lib.hep)}</div>` : ''}
        ${lib.life ? `<div class="nt">⛔ ${esc(lib.life)}</div>` : ''}
      </div></details></div>`;
  }).join('');
  m.innerHTML = `<div class="rh">
      <div><div class="eyebrow">${esc(CANCERS[g.c] || 'สูตรกำหนดเอง')}</div><h2>${esc(g.n)}</h2>
      <div class="meta"><span>📋 ${esc(g.s)}</span><span>🔁 ${esc(g.cy)}</span><span>📚 ${esc(g.ref)}</span></div>
      ${g.note ? `<div class="gnote">${esc(g.note)}</div>` : ''}</div>
      <div class="gp"><label>ปรับขนาดทั้งสูตร</label><select id="gPct">${[100,90,85,80,75,70,60,50].map(v => `<option ${S.gPct == v ? 'selected' : ''}>${v}</option>`).join('')}</select><span>%</span></div>
    </div>
    ${!P.ok ? '<div class="warn">⚠ ยังไม่ได้กรอกน้ำหนัก/ส่วนสูง — ยังคำนวณขนาดยาไม่ได้</div>' : ''}
    <div class="drugs">${rows}</div>
    <details class="addbox"><summary>+ เพิ่มยาในสูตรนี้ (เช่น ยาที่แพทย์สั่งเพิ่ม)</summary>
      <div class="addf"><input id="aN" placeholder="ชื่อยา"><input id="aD" type="number" inputmode="decimal" placeholder="ขนาด">
      <select id="aU"><option>mg/m2</option><option>mg/kg</option><option>mg</option><option>AUC</option><option>units/m2</option><option>units</option></select>
      <input id="aDay" placeholder="วันที่ให้ เช่น D1"><input id="aR" placeholder="วิธีให้ เช่น IV"><button class="btn" id="aAdd">เพิ่ม</button></div></details>
    <div class="actions"><button class="btn" id="bCopy">📋 คัดลอกสรุป</button><button class="btn ghost" id="bPrint">🖨 พิมพ์</button><span id="copyMsg"></span></div>`;
}

function summaryText() {
  const P = patient(), g = S.reg; if (!g) return '';
  const L = [`สรุปการคำนวณ: ${g.n} (${CANCERS[g.c] || 'กำหนดเอง'}) — ${g.cy}`,
    `ผู้ป่วย: นน. ${P.wt ?? '-'} kg, สส. ${P.ht ?? '-'} cm, อายุ ${P.age ?? '-'} ปี, เพศ ${S.p.sex === 'M' ? 'ชาย' : 'หญิง'}, SCr ${P.scr ?? '-'} mg/dL`,
    `BSA ${P.ok ? P.bsa.toFixed(2) : '-'} m² | CrCl ${P.okRenal ? fmt(P.crcl) : '-'} mL/min | GFR(Calvert) ${P.okRenal ? fmt(P.gfr) : '-'}`, ''];
  allDrugs().forEach((dr, i) => {
    const st = S.rows[i], c = calc(dr, P, st.pct), v = verify(dr, c, P, num(st.ord), st.pct);
    const per = dr.freq === 'BID' ? '/มื้อ' : dr.nDays ? '/วัน' : '';
    L.push(`• ${dr.n} [${dr.fixedText || (dr.unit === 'AUC' ? 'AUC ' + dr.dose : dr.dose + ' ' + dr.unit)}] ${dr.days}: ควรได้ ${c.text || fmt(c.fin) + ' ' + c.unitOut + per}${st.pct !== 100 ? ` (${st.pct}%)` : ''}`
      + (v ? ` | แพทย์สั่ง ${st.ord} → ${fmt(v.ratio)}% ${v.lvl === 'green' ? 'OK' : 'ตรวจสอบ'}` : ''));
  });
  L.push('', `อ้างอิง: ${g.ref} | คำนวณโดย: เภสัชกรเคมีบำบัด รพ.จุฬารัตน์ 9 แอร์พอร์ต — ${new Date().toLocaleString('th-TH')}`);
  return L.join('\n');
}

function render() { renderPatient(); renderMain(); }

// ---------- events ----------
function bind() {
  document.querySelectorAll('[data-p]').forEach(el => {
    const k = el.dataset.p;
    el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' || el.type === 'radio' ? 'change' : 'input', () => {
      if (el.type === 'radio' && !el.checked) return;
      S.p[k] = el.type === 'checkbox' ? el.checked : el.value; render();
    });
  });
  $('#q').addEventListener('input', e => { S.q = e.target.value; regList(); });
  $('#smode').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; S.mode = b.dataset.m;
    document.querySelectorAll('#smode [data-m]').forEach(x => x.classList.toggle('on', x === b));
    const ph = { all:'ค้นหา: สูตร, ยา, ชื่อการค้า, โรค…', reg:'ชื่อสูตร เช่น FOLFOX, R-CHOP, AC', drug:'ชื่อยา/ชื่อการค้า เช่น cisplatin, Herceptin', cancer:'ชื่อโรค เช่น ท่อน้ำดี, NPC, lung' }[S.mode];
    $('#q').placeholder = ph; if (S.mode === 'drug') $('#q').setAttribute('list', 'drugList'); else $('#q').removeAttribute('list'); $('#q').focus(); regList(); });
  $('#cancers').addEventListener('change', e => { S.cancer = e.target.value; regList(); });
  $('#clsf').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; S.cls = b.dataset.k;
    document.querySelectorAll('#clsf [data-k]').forEach(x => x.classList.toggle('on', x.dataset.k === S.cls)); regList(); });
  $('#list').addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) selectReg(R[+b.dataset.id]); });
  document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { S.tab = b.dataset.tab;
    document.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('on', x === b));
    $('#calcView').hidden = S.tab !== 'calc'; $('#refView').hidden = S.tab !== 'ref'; }));
  const main = $('#main');
  main.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.pct != null) { S.rows[+t.dataset.pct].pct = num(t.value) ?? 0; refreshKeepFocus(t); }
    if (t.dataset.ord != null) { S.rows[+t.dataset.ord].ord = t.value; refreshKeepFocus(t); }
  });
  main.addEventListener('change', e => { if (e.target.id === 'gPct') { S.gPct = +e.target.value; S.rows.forEach(r => r.pct = S.gPct); renderMain(); } });
  main.addEventListener('click', e => {
    const t = e.target;
    if (t.dataset.apply != null) { S.rows[+t.dataset.apply].pct = +t.dataset.v; renderMain(); }
    if (t.dataset.del != null) { const i = +t.dataset.del, k = i - S.reg.d.length; S.extra.splice(k, 1); S.rows.splice(i, 1); renderMain(); }
    if (t.id === 'bCustom') { selectReg({ id:-1, c:'', n:'สูตรกำหนดเอง', s:'ผู้ใช้กำหนด', cy:'—', ref:'ตามคำสั่งแพทย์/โปรโตคอลสถาบัน', d:[], cls:[] }); setTimeout(() => { const a = document.querySelector('.addbox'); if (a) a.open = true; }, 0); }
    if (t.id === 'aAdd') {
      const n = $('#aN').value.trim(), dose = num($('#aD').value), u = $('#aU').value;
      if (!n || dose == null) { $('#aN').focus(); return; }
      S.extra.push(d(n, dose, u, $('#aDay').value || '-', $('#aR').value || '-', { custom:true })); S.rows.push({ pct:S.gPct, ord:'' }); renderMain();
    }
    if (t.id === 'bCopy') { const txt = summaryText();
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => $('#copyMsg').textContent = 'คัดลอกแล้ว ✓')
        .catch(() => { $('#copyMsg').innerHTML = '<textarea class="cp" rows="8">' + esc(txt) + '</textarea>'; }); }
    if (t.id === 'bPrint') { try { window.print(); } catch (_) {} }
  });
}
function refreshKeepFocus(t) {
  const key = t.dataset.pct != null ? 'data-pct' : 'data-ord', i = t.getAttribute(key), pos = t.selectionStart;
  renderMain();
  const n = document.querySelector(`[${key}="${i}"]`); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (_) {} }
}

function init() {
  $('#cancers').insertAdjacentHTML('beforeend', Object.entries(CANCERS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join(''));
  const dk = [...new Set(R.flatMap(g => g.d.map(x => drugKey(x.n))))].sort();
  $('#drugList').innerHTML = dk.map(k => `<option value="${esc(k)}">${esc(BRAND[k] || '')}</option>`).join('') + dk.flatMap(k => (BRAND[k] || '').split(' ').filter(b => b.length > 2).map(b => `<option value="${esc(b)}">${esc(k)}</option>`)).join('');
  document.querySelectorAll('.dbv').forEach(e => e.textContent = DB_VERSION);
  document.querySelectorAll('.dbn').forEach(e => e.textContent = R.length);
  bind(); render(); regList();
}
document.addEventListener('DOMContentLoaded', init);
