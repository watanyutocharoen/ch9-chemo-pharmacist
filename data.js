// ===== ฐานข้อมูลสูตรยา =====
// แก้ไข/เพิ่มสูตรได้ที่ไฟล์นี้ไฟล์เดียว (ดูวิธีใน README.md) แล้วอัปเดต DB_VERSION ทุกครั้ง
const DB_VERSION = 'v1.0 (14 พ.ย. 2569)';
// unit: mg/m2 | mg/kg | mg | AUC | units/m2 | units | tier
// opts: cap (mg สูงสุดต่อครั้ง), freq:'BID', nDays (CI ต่อวัน × วัน), roundTo, tiers, note
function d(n, dose, unit, days, route, o) { return Object.assign({ n, dose, unit, days, route }, o || {}); }

const CANCERS = {
  breast: 'มะเร็งเต้านม', crc: 'มะเร็งลำไส้ใหญ่/ทวารหนัก', gastric: 'มะเร็งกระเพาะอาหาร/หลอดอาหาร',
  hcc: 'มะเร็งตับ (HCC)', biliary: 'มะเร็งท่อน้ำดี/ถุงน้ำดี', pancreas: 'มะเร็งตับอ่อน',
  lung: 'มะเร็งปอด', hn: 'ศีรษะและลำคอ / โพรงหลังจมูก (NPC)', cervix: 'มะเร็งปากมดลูก',
  ovary: 'มะเร็งรังไข่', endomet: 'มะเร็งเยื่อบุโพรงมดลูก', bladder: 'มะเร็งกระเพาะปัสสาวะ/ทางเดินปัสสาวะ',
  prostate: 'มะเร็งต่อมลูกหมาก', kidney: 'มะเร็งไต (RCC)', gct: 'มะเร็งอัณฑะ / Germ cell',
  lymphoma: 'มะเร็งต่อมน้ำเหลือง', myeloma: 'Multiple myeloma', leukemia: 'มะเร็งเม็ดเลือดขาว',
  other: 'Sarcoma / สมอง / ไทรอยด์ / GIST'
};
const CANCER_KW = {
  breast: 'breast เต้านม', crc: 'colon rectal colorectal ลำไส้ ทวารหนัก crc', gastric: 'gastric stomach esophag กระเพาะ หลอดอาหาร gej',
  hcc: 'hcc liver hepatocellular ตับ', biliary: 'cholangio biliary btc gallbladder ท่อน้ำดี ถุงน้ำดี cca', pancreas: 'pancrea ตับอ่อน',
  lung: 'lung nsclc sclc ปอด', hn: 'head neck npc nasopharyn ศีรษะ ลำคอ โพรงหลังจมูก ช่องปาก', cervix: 'cervix cervical ปากมดลูก',
  ovary: 'ovary ovarian รังไข่', endomet: 'endometri uterine มดลูก', bladder: 'bladder urothelial กระเพาะปัสสาวะ',
  prostate: 'prostate ต่อมลูกหมาก', kidney: 'renal rcc kidney ไต', gct: 'testicular germ cell อัณฑะ',
  lymphoma: 'lymphoma dlbcl hodgkin ต่อมน้ำเหลือง nhl', myeloma: 'myeloma mm ไขกระดูก', leukemia: 'leukemia aml cml apl มะเร็งเม็ดเลือด',
  other: 'sarcoma glioblastoma gbm brain thyroid gist สมอง ไทรอยด์'
};

const R = [
// ---------------- BREAST ----------------
{ c:'breast', n:'AC', s:'Adjuvant/Neoadjuvant', cy:'q21 วัน × 4', ref:'NSABP B-15; NCCN', d:[
  d('Doxorubicin',60,'mg/m2','D1','IV push/infusion'), d('Cyclophosphamide',600,'mg/m2','D1','IV')]},
{ c:'breast', n:'dd AC (dose-dense)', s:'Adjuvant/Neoadjuvant', cy:'q14 วัน × 4 + G-CSF', ref:'CALGB 9741', d:[
  d('Doxorubicin',60,'mg/m2','D1','IV'), d('Cyclophosphamide',600,'mg/m2','D1','IV')], note:'ต้องให้ G-CSF support ทุกรอบ'},
{ c:'breast', n:'EC', s:'Adjuvant/Neoadjuvant', cy:'q21 วัน × 4', ref:'NCCN; บางสถาบันใช้ epirubicin 100', d:[
  d('Epirubicin',90,'mg/m2','D1','IV'), d('Cyclophosphamide',600,'mg/m2','D1','IV')]},
{ c:'breast', n:'FEC 100', s:'Adjuvant', cy:'q21 วัน × 3 (→ Docetaxel × 3)', ref:'PACS 01', d:[
  d('Fluorouracil',500,'mg/m2','D1','IV'), d('Epirubicin',100,'mg/m2','D1','IV'), d('Cyclophosphamide',500,'mg/m2','D1','IV')]},
{ c:'breast', n:'Paclitaxel weekly (หลัง AC)', s:'Adjuvant/Neoadjuvant', cy:'ทุกสัปดาห์ × 12', ref:'ECOG E1199', d:[
  d('Paclitaxel',80,'mg/m2','D1 ทุกสัปดาห์','IV 1 ชม.')]},
{ c:'breast', n:'Docetaxel q3w (หลัง FEC/AC)', s:'Adjuvant', cy:'q21 วัน × 3 (หลัง FEC) หรือ × 4 ที่ 75–100', ref:'PACS 01; ECOG E1199', d:[
  d('Docetaxel',100,'mg/m2','D1','IV 1 ชม.')], note:'หลัง AC × 4 มักใช้ 75–100 mg/m2; ตรวจ protocol ที่แพทย์ระบุ'},
{ c:'breast', n:'TC (Docetaxel + Cyclophosphamide)', s:'Adjuvant', cy:'q21 วัน × 4–6', ref:'US Oncology 9735', d:[
  d('Docetaxel',75,'mg/m2','D1','IV'), d('Cyclophosphamide',600,'mg/m2','D1','IV')]},
{ c:'breast', n:'CMF (IV)', s:'Adjuvant', cy:'q28 วัน × 6', ref:'Bonadonna; NCCN', d:[
  d('Cyclophosphamide',600,'mg/m2','D1, D8','IV'), d('Methotrexate',40,'mg/m2','D1, D8','IV'), d('Fluorouracil',600,'mg/m2','D1, D8','IV')]},
{ c:'breast', n:'TCHP', s:'HER2+ Neoadjuvant/Adjuvant', cy:'q21 วัน × 6', ref:'TRYPHAENA; NCCN', d:[
  d('Docetaxel',75,'mg/m2','D1','IV'), d('Carboplatin',6,'AUC','D1','IV'),
  d('Trastuzumab (loading C1)',8,'mg/kg','D1 รอบแรก','IV 90 นาที'), d('Trastuzumab (maintenance)',6,'mg/kg','D1 รอบถัดไป','IV 30 นาที'),
  d('Pertuzumab (loading C1)',840,'mg','D1 รอบแรก','IV 60 นาที'), d('Pertuzumab (maintenance)',420,'mg','D1 รอบถัดไป','IV 30–60 นาที')],
  note:'Trastuzumab ให้ต่อจนครบ 1 ปี; ตรวจ LVEF ก่อนเริ่มและทุก 3 เดือน'},
{ c:'breast', n:'TCH', s:'HER2+ Adjuvant', cy:'q21 วัน × 6', ref:'BCIRG 006', d:[
  d('Docetaxel',75,'mg/m2','D1','IV'), d('Carboplatin',6,'AUC','D1','IV'),
  d('Trastuzumab (loading C1)',8,'mg/kg','D1 รอบแรก','IV'), d('Trastuzumab (maintenance)',6,'mg/kg','D1 รอบถัดไป','IV')]},
{ c:'breast', n:'Paclitaxel + Trastuzumab weekly (APT)', s:'HER2+ Adjuvant (stage I)', cy:'ทุกสัปดาห์ × 12 → Trastuzumab q3w ครบ 1 ปี', ref:'APT trial (Tolaney)', d:[
  d('Paclitaxel',80,'mg/m2','ทุกสัปดาห์','IV'), d('Trastuzumab (loading)',4,'mg/kg','สัปดาห์แรก','IV'),
  d('Trastuzumab (weekly)',2,'mg/kg','ทุกสัปดาห์','IV'), d('Trastuzumab (q3w หลังครบ 12 สัปดาห์)',6,'mg/kg','q21 วัน','IV')]},
{ c:'breast', n:'Docetaxel + Trastuzumab + Pertuzumab (THP)', s:'HER2+ Metastatic', cy:'q21 วัน', ref:'CLEOPATRA', d:[
  d('Docetaxel',75,'mg/m2','D1','IV'), d('Trastuzumab (loading C1)',8,'mg/kg','D1 รอบแรก','IV'), d('Trastuzumab (maintenance)',6,'mg/kg','D1','IV'),
  d('Pertuzumab (loading C1)',840,'mg','D1 รอบแรก','IV'), d('Pertuzumab (maintenance)',420,'mg','D1','IV')]},
{ c:'breast', n:'Trastuzumab SC', s:'HER2+', cy:'q21 วัน (ครบ 1 ปีใน adjuvant)', ref:'HannaH; label', d:[
  d('Trastuzumab SC',600,'mg','D1','SC 2–5 นาที')], note:'ขนาดคงที่ ไม่ต้องให้ loading dose'},
{ c:'breast', n:'Pertuzumab/Trastuzumab SC (Phesgo)', s:'HER2+', cy:'q21 วัน', ref:'FeDeriCa; label', d:[
  d('Phesgo loading (pertuzumab 1200/trastuzumab 600)',1,'mg','รอบแรก','SC',{fixedText:'1 vial 1200 mg/600 mg (15 mL)'}),
  d('Phesgo maintenance (pertuzumab 600/trastuzumab 600)',1,'mg','รอบถัดไป','SC',{fixedText:'1 vial 600 mg/600 mg (10 mL)'})]},
{ c:'breast', n:'T-DM1 (Trastuzumab emtansine)', s:'HER2+ Adjuvant (residual) / Metastatic', cy:'q21 วัน (adjuvant × 14)', ref:'KATHERINE; EMILIA', d:[
  d('Trastuzumab emtansine',3.6,'mg/kg','D1','IV')], note:'ห้ามสลับกับ trastuzumab ธรรมดา (ชื่อคล้ายกัน)'},
{ c:'breast', n:'T-DXd (Trastuzumab deruxtecan) – breast', s:'HER2+/HER2-low Metastatic', cy:'q21 วัน', ref:'DESTINY-Breast03/04', d:[
  d('Trastuzumab deruxtecan',5.4,'mg/kg','D1','IV')], note:'มะเร็งกระเพาะใช้ 6.4 mg/kg; เฝ้าระวัง ILD'},
{ c:'breast', n:'KEYNOTE-522 ช่วงที่ 1: Pembro + Paclitaxel + Carboplatin', s:'TNBC Neoadjuvant', cy:'12 สัปดาห์ (pembro/carbo q3w × 4)', ref:'KEYNOTE-522', d:[
  d('Pembrolizumab',200,'mg','D1 q21 วัน','IV'), d('Paclitaxel',80,'mg/m2','ทุกสัปดาห์ × 12','IV'), d('Carboplatin',5,'AUC','D1 q21 วัน','IV')],
  note:'ทางเลือก carboplatin AUC 1.5 ทุกสัปดาห์'},
{ c:'breast', n:'KEYNOTE-522 ช่วงที่ 2: Pembro + AC/EC', s:'TNBC Neoadjuvant', cy:'q21 วัน × 4', ref:'KEYNOTE-522', d:[
  d('Pembrolizumab',200,'mg','D1','IV'), d('Doxorubicin',60,'mg/m2','D1','IV',{note:'หรือ Epirubicin 90 mg/m2'}), d('Cyclophosphamide',600,'mg/m2','D1','IV')],
  note:'หลังผ่าตัดให้ pembrolizumab ต่อ q3w × 9 รอบ'},
{ c:'breast', n:'Capecitabine (single agent)', s:'Metastatic / Adjuvant (CREATE-X)', cy:'q21 วัน (D1–14)', ref:'Label; CREATE-X', d:[
  d('Capecitabine',1250,'mg/m2','D1–14','PO',{freq:'BID',roundTo:150})], note:'หลายสถาบันใช้ 1000 mg/m2 BID เพื่อลด toxicity — ตรวจว่าแพทย์ตั้งใจใช้ขนาดใด'},
{ c:'breast', n:'Gemcitabine + Carboplatin', s:'Metastatic (TNBC)', cy:'q21 วัน', ref:'NCCN', d:[
  d('Gemcitabine',1000,'mg/m2','D1, D8','IV'), d('Carboplatin',2,'AUC','D1, D8','IV')]},
{ c:'breast', n:'Gemcitabine + Paclitaxel', s:'Metastatic', cy:'q21 วัน', ref:'JHQG (Albain)', d:[
  d('Paclitaxel',175,'mg/m2','D1','IV 3 ชม.'), d('Gemcitabine',1250,'mg/m2','D1, D8','IV')]},
{ c:'breast', n:'Docetaxel single agent', s:'Metastatic', cy:'q21 วัน', ref:'NCCN (60–100 mg/m2)', d:[
  d('Docetaxel',75,'mg/m2','D1','IV')]},
{ c:'breast', n:'Paclitaxel q3w', s:'Metastatic', cy:'q21 วัน', ref:'NCCN', d:[d('Paclitaxel',175,'mg/m2','D1','IV 3 ชม.')]},
{ c:'breast', n:'nab-Paclitaxel q3w', s:'Metastatic', cy:'q21 วัน', ref:'Label', d:[d('Paclitaxel protein-bound (nab)',260,'mg/m2','D1','IV 30 นาที')], note:'ห้ามสลับกับ paclitaxel ธรรมดา (ขนาดต่างกัน)'},
{ c:'breast', n:'Vinorelbine weekly', s:'Metastatic', cy:'ทุกสัปดาห์', ref:'NCCN (25–30 mg/m2)', d:[d('Vinorelbine',25,'mg/m2','ทุกสัปดาห์','IV 6–10 นาที')]},
{ c:'breast', n:'Eribulin', s:'Metastatic', cy:'q21 วัน', ref:'EMBRACE; label (eribulin mesylate)', d:[
  d('Eribulin mesylate',1.4,'mg/m2','D1, D8','IV 2–5 นาที')], note:'1.4 mg/m2 eribulin mesylate = 1.23 mg/m2 eribulin (base) ตามฉลากยุโรป — ตรวจหน่วยบนฉลาก'},
{ c:'breast', n:'Sacituzumab govitecan', s:'mTNBC / HR+ Metastatic', cy:'q21 วัน', ref:'ASCENT; TROPiCS-02', d:[d('Sacituzumab govitecan',10,'mg/kg','D1, D8','IV')]},
{ c:'breast', n:'Palbociclib + Letrozole', s:'HR+/HER2− Metastatic', cy:'q28 วัน', ref:'PALOMA-2', d:[
  d('Palbociclib',125,'mg','D1–21','PO OD'), d('Letrozole',2.5,'mg','ทุกวัน','PO OD')]},
{ c:'breast', n:'Ribociclib + AI (metastatic)', s:'HR+/HER2− Metastatic', cy:'q28 วัน', ref:'MONALEESA-2/7', d:[
  d('Ribociclib',600,'mg','D1–21','PO OD'), d('Letrozole',2.5,'mg','ทุกวัน','PO OD')], note:'ติดตาม QTc และ LFT'},
{ c:'breast', n:'Ribociclib + AI (adjuvant)', s:'HR+/HER2− Early (NATALEE)', cy:'q28 วัน × 3 ปี', ref:'NATALEE', d:[
  d('Ribociclib',400,'mg','D1–21','PO OD'), d('Letrozole',2.5,'mg','ทุกวัน','PO OD')], note:'adjuvant ใช้ 400 mg (ไม่ใช่ 600)'},
{ c:'breast', n:'Abemaciclib + Endocrine', s:'HR+/HER2− Early (monarchE) / Metastatic', cy:'ต่อเนื่อง (adjuvant 2 ปี)', ref:'monarchE; MONARCH-3', d:[
  d('Abemaciclib',150,'mg','ทุกวัน','PO BID'), d('Letrozole',2.5,'mg','ทุกวัน','PO OD',{note:'หรือ anastrozole 1 mg / tamoxifen 20 mg'})]},
{ c:'breast', n:'Fulvestrant', s:'HR+ Metastatic', cy:'D1, 15, 29 แล้ว q28 วัน', ref:'CONFIRM', d:[d('Fulvestrant',500,'mg','D1, D15, D29 แล้วทุก 28 วัน','IM (250 mg × 2 เข็ม)')]},
{ c:'breast', n:'Endocrine single agents', s:'HR+', cy:'ทุกวัน', ref:'Label', d:[
  d('Tamoxifen',20,'mg','ทุกวัน','PO OD'), d('Letrozole',2.5,'mg','ทุกวัน','PO OD'), d('Anastrozole',1,'mg','ทุกวัน','PO OD'), d('Exemestane',25,'mg','ทุกวัน','PO OD')],
  note:'ใช้เพียง 1 ตัว — แสดงไว้เพื่อตรวจขนาดมาตรฐาน'},
{ c:'breast', n:'Lapatinib + Capecitabine', s:'HER2+ Metastatic', cy:'q21 วัน', ref:'EGF100151', d:[
  d('Lapatinib',1250,'mg','ทุกวัน','PO OD'), d('Capecitabine',1000,'mg/m2','D1–14','PO',{freq:'BID',roundTo:150})]},
{ c:'breast', n:'Olaparib (gBRCA)', s:'Adjuvant (OlympiA) / Metastatic', cy:'ต่อเนื่อง (adjuvant 1 ปี)', ref:'OlympiA; OlympiAD', d:[d('Olaparib (tablet)',300,'mg','ทุกวัน','PO BID')]},

// ---------------- COLORECTAL ----------------
{ c:'crc', n:'mFOLFOX6', s:'Adjuvant / Metastatic', cy:'q14 วัน (adjuvant × 12)', ref:'NCCN; MOSAIC', d:[
  d('Oxaliplatin',85,'mg/m2','D1','IV 2 ชม.'), d('Leucovorin (calcium folinate)',400,'mg/m2','D1','IV 2 ชม.',{note:'ถ้าใช้ levoleucovorin = 200 mg/m2'}),
  d('Fluorouracil bolus',400,'mg/m2','D1','IV push'), d('Fluorouracil infusion',2400,'mg/m2','D1–2 (CI 46 ชม.)','IV CI',{note:'ขนาดรวมตลอด 46 ชม.'})]},
{ c:'crc', n:'FOLFIRI', s:'Metastatic', cy:'q14 วัน', ref:'NCCN; Tournigand', d:[
  d('Irinotecan',180,'mg/m2','D1','IV 90 นาที'), d('Leucovorin (calcium folinate)',400,'mg/m2','D1','IV 2 ชม.'),
  d('Fluorouracil bolus',400,'mg/m2','D1','IV push'), d('Fluorouracil infusion',2400,'mg/m2','D1–2 (CI 46 ชม.)','IV CI',{note:'ขนาดรวมตลอด 46 ชม.'})]},
{ c:'crc', n:'CAPOX (XELOX)', s:'Adjuvant / Metastatic', cy:'q21 วัน (adjuvant × 4–8)', ref:'NO16966; XELOXA; IDEA', d:[
  d('Oxaliplatin',130,'mg/m2','D1','IV 2 ชม.'), d('Capecitabine',1000,'mg/m2','D1–14','PO',{freq:'BID',roundTo:150})]},
{ c:'crc', n:'Capecitabine (adjuvant)', s:'Adjuvant colon', cy:'q21 วัน × 8', ref:'X-ACT', d:[d('Capecitabine',1250,'mg/m2','D1–14','PO',{freq:'BID',roundTo:150})]},
{ c:'crc', n:'Capecitabine + RT (rectal)', s:'Neoadjuvant CRT', cy:'ทุกวันที่ฉายแสง (5 วัน/สัปดาห์)', ref:'NCCN; NSABP R-04', d:[d('Capecitabine',825,'mg/m2','วันที่ฉายแสง','PO',{freq:'BID',roundTo:150})]},
{ c:'crc', n:'mFOLFOX6 + Bevacizumab', s:'Metastatic', cy:'q14 วัน', ref:'NCCN', d:[
  d('Oxaliplatin',85,'mg/m2','D1','IV'), d('Leucovorin (calcium folinate)',400,'mg/m2','D1','IV'), d('Fluorouracil bolus',400,'mg/m2','D1','IV push'),
  d('Fluorouracil infusion',2400,'mg/m2','D1–2 (CI 46 ชม.)','IV CI'), d('Bevacizumab',5,'mg/kg','D1','IV')]},
{ c:'crc', n:'FOLFIRI + Bevacizumab', s:'Metastatic', cy:'q14 วัน', ref:'NCCN', d:[
  d('Irinotecan',180,'mg/m2','D1','IV'), d('Leucovorin (calcium folinate)',400,'mg/m2','D1','IV'), d('Fluorouracil bolus',400,'mg/m2','D1','IV push'),
  d('Fluorouracil infusion',2400,'mg/m2','D1–2 (CI 46 ชม.)','IV CI'), d('Bevacizumab',5,'mg/kg','D1','IV')]},
{ c:'crc', n:'CAPOX + Bevacizumab', s:'Metastatic', cy:'q21 วัน', ref:'NO16966', d:[
  d('Oxaliplatin',130,'mg/m2','D1','IV'), d('Capecitabine',1000,'mg/m2','D1–14','PO',{freq:'BID',roundTo:150}), d('Bevacizumab',7.5,'mg/kg','D1','IV')]},
{ c:'crc', n:'FOLFOX/FOLFIRI + Cetuximab (q2w)', s:'Metastatic RAS wild-type (left-sided)', cy:'q14 วัน', ref:'NCCN; CRYSTAL/TAILOR', d:[
  d('Cetuximab',500,'mg/m2','D1','IV 2 ชม. (รอบแรก)'), d('Oxaliplatin',85,'mg/m2','D1','IV',{note:'หรือ irinotecan 180 mg/m2 (FOLFIRI)'}),
  d('Leucovorin (calcium folinate)',400,'mg/m2','D1','IV'), d('Fluorouracil bolus',400,'mg/m2','D1','IV push'), d('Fluorouracil infusion',2400,'mg/m2','D1–2 (CI 46 ชม.)','IV CI')],
  note:'ทางเลือก cetuximab 400 mg/m2 loading แล้ว 250 mg/m2 ทุกสัปดาห์'},
{ c:'crc', n:'mFOLFOX6 + Panitumumab', s:'Metastatic RAS wild-type', cy:'q14 วัน', ref:'PRIME; PARADIGM', d:[
  d('Panitumumab',6,'mg/kg','D1','IV'), d('Oxaliplatin',85,'mg/m2','D1','IV'), d('Leucovorin (calcium folinate)',400,'mg/m2','D1','IV'),
  d('Fluorouracil bolus',400,'mg/m2','D1','IV push'), d('Fluorouracil infusion',2400,'mg/m2','D1–2 (CI 46 ชม.)','IV CI')]},
{ c:'crc', n:'FOLFOXIRI ± Bevacizumab', s:'Metastatic', cy:'q14 วัน', ref:'TRIBE', d:[
  d('Irinotecan',165,'mg/m2','D1','IV'), d('Oxaliplatin',85,'mg/m2','D1','IV'), d('Leucovorin (calcium folinate)',200,'mg/m2','D1','IV'),
  d('Fluorouracil infusion',3200,'mg/m2','D1–2 (CI 48 ชม.)','IV CI',{note:'ไม่มี bolus'}), d('Bevacizumab',5,'mg/kg','D1','IV',{note:'ถ้าให้ร่วม'})]},
{ c:'crc', n:'XELIRI (CAPIRI)', s:'Metastatic', cy:'q21 วัน', ref:'AXEPT', d:[
  d('Irinotecan',200,'mg/m2','D1','IV'), d('Capecitabine',800,'mg/m2','D1–14','PO',{freq:'BID',roundTo:150})]},
{ c:'crc', n:'Irinotecan single agent', s:'Metastatic', cy:'q14 วัน (หรือ 300–350 mg/m2 q21)', ref:'NCCN', d:[d('Irinotecan',180,'mg/m2','D1','IV')]},
{ c:'crc', n:'Trifluridine/Tipiracil + Bevacizumab', s:'Metastatic (3rd line)', cy:'q28 วัน', ref:'SUNLIGHT; RECOURSE', d:[
  d('Trifluridine/tipiracil',35,'mg/m2','D1–5, D8–12','PO',{freq:'BID',cap:80,roundTo:5,note:'สูงสุด 80 mg/มื้อ (คิดตาม trifluridine)'}), d('Bevacizumab',5,'mg/kg','D1, D15','IV')]},
{ c:'crc', n:'Regorafenib', s:'Metastatic', cy:'q28 วัน (D1–21)', ref:'CORRECT; ReDOS', d:[d('Regorafenib',160,'mg','D1–21','PO OD')], note:'ReDOS: เริ่ม 80 mg แล้วเพิ่ม 40 mg/สัปดาห์ถึง 160 mg'},
{ c:'crc', n:'Pembrolizumab (MSI-H/dMMR)', s:'Metastatic', cy:'q21 วัน (หรือ 400 mg q6w)', ref:'KEYNOTE-177', d:[d('Pembrolizumab',200,'mg','D1','IV')]},

// ---------------- GASTRIC / ESOPHAGUS ----------------
{ c:'gastric', n:'FLOT', s:'Perioperative', cy:'q14 วัน × 4 ก่อน + 4 หลังผ่าตัด', ref:'FLOT4-AIO', d:[
  d('Docetaxel',50,'mg/m2','D1','IV'), d('Oxaliplatin',85,'mg/m2','D1','IV'), d('Leucovorin (calcium folinate)',200,'mg/m2','D1','IV'),
  d('Fluorouracil infusion',2600,'mg/m2','D1 (CI 24 ชม.)','IV CI')]},
{ c:'gastric', n:'FLOT + Durvalumab', s:'Perioperative (resectable)', cy:'FLOT q14 วัน; Durvalumab q4w × 4 แล้วเดี่ยว × 10', ref:'MATTERHORN (FDA พ.ย. 2025)', d:[
  d('Durvalumab',1500,'mg','D1 ทุก 4 สัปดาห์','IV',{note:'น้ำหนัก <30 kg ใช้ 20 mg/kg'}), d('Docetaxel',50,'mg/m2','D1, D15','IV'), d('Oxaliplatin',85,'mg/m2','D1, D15','IV'),
  d('Leucovorin (calcium folinate)',200,'mg/m2','D1, D15','IV'), d('Fluorouracil infusion',2600,'mg/m2','D1, D15 (CI 24 ชม.)','IV CI')]},
{ c:'gastric', n:'CAPOX (adjuvant gastric)', s:'Adjuvant', cy:'q21 วัน × 8', ref:'CLASSIC', d:[
  d('Oxaliplatin',130,'mg/m2','D1','IV'), d('Capecitabine',1000,'mg/m2','D1–14','PO',{freq:'BID',roundTo:150})]},
{ c:'gastric', n:'CAPOX + Nivolumab', s:'Metastatic HER2−', cy:'q21 วัน', ref:'CheckMate 649', d:[
  d('Nivolumab',360,'mg','D1','IV'), d('Oxaliplatin',130,'mg/m2','D1','IV'), d('Capecitabine',1000,'mg/m2','D1–14','PO',{freq:'BID',roundTo:150})]},
{ c:'gastric', n:'mFOLFOX6 + Nivolumab', s:'Metastatic HER2−', cy:'q14 วัน', ref:'CheckMate 649', d:[
  d('Nivolumab',240,'mg','D1','IV'), d('Oxaliplatin',85,'mg/m2','D1','IV'), d('Leucovorin (calcium folinate)',400,'mg/m2','D1','IV'),
  d('Fluorouracil bolus',400,'mg/m2','D1','IV push'), d('Fluorouracil infusion',2400,'mg/m2','D1–2 (CI 46 ชม.)','IV CI')]},
{ c:'gastric', n:'Cisplatin + Capecitabine + Trastuzumab', s:'Metastatic HER2+', cy:'q21 วัน', ref:'ToGA', d:[
  d('Cisplatin',80,'mg/m2','D1','IV'), d('Capecitabine',1000,'mg/m2','D1–14','PO',{freq:'BID',roundTo:150}),
  d('Trastuzumab (loading C1)',8,'mg/kg','D1 รอบแรก','IV'), d('Trastuzumab (maintenance)',6,'mg/kg','D1','IV')]},
{ c:'gastric', n:'Paclitaxel + Ramucirumab', s:'Metastatic 2nd line', cy:'q28 วัน', ref:'RAINBOW', d:[
  d('Paclitaxel',80,'mg/m2','D1, D8, D15','IV'), d('Ramucirumab',8,'mg/kg','D1, D15','IV')]},
{ c:'gastric', n:'Paclitaxel weekly', s:'Metastatic 2nd line', cy:'q28 วัน', ref:'WJOG 4007', d:[d('Paclitaxel',80,'mg/m2','D1, D8, D15','IV')]},
{ c:'gastric', n:'T-DXd (gastric)', s:'HER2+ Metastatic 2nd line', cy:'q21 วัน', ref:'DESTINY-Gastric01/04', d:[d('Trastuzumab deruxtecan',6.4,'mg/kg','D1','IV')], note:'ขนาดต่างจากมะเร็งเต้านม (5.4 mg/kg)'},
{ c:'gastric', n:'CROSS (Carboplatin + Paclitaxel weekly + RT)', s:'Esophagus Neoadjuvant CRT', cy:'ทุกสัปดาห์ × 5', ref:'CROSS', d:[
  d('Paclitaxel',50,'mg/m2','ทุกสัปดาห์','IV'), d('Carboplatin',2,'AUC','ทุกสัปดาห์','IV')]},
{ c:'gastric', n:'Cisplatin + 5-FU + RT (definitive)', s:'Esophagus Definitive CRT', cy:'q28 วัน (สัปดาห์ 1, 5, 8, 11)', ref:'RTOG 85-01', d:[
  d('Cisplatin',75,'mg/m2','D1','IV'), d('Fluorouracil infusion',1000,'mg/m2','D1–4 (CI)','IV CI',{nDays:4})]},
{ c:'gastric', n:'Nivolumab adjuvant (esophagus)', s:'Adjuvant หลัง CRT+ผ่าตัด', cy:'240 mg q2w × 16 สัปดาห์ → 480 mg q4w (รวม 1 ปี)', ref:'CheckMate 577', d:[
  d('Nivolumab (16 สัปดาห์แรก)',240,'mg','q14 วัน','IV'), d('Nivolumab (หลังจากนั้น)',480,'mg','q28 วัน','IV')]},

// ---------------- HCC ----------------
{ c:'hcc', n:'Atezolizumab + Bevacizumab', s:'Advanced 1st line', cy:'q21 วัน', ref:'IMbrave150', d:[
  d('Atezolizumab',1200,'mg','D1','IV'), d('Bevacizumab',15,'mg/kg','D1','IV')], note:'ประเมิน/รักษา varices ก่อนเริ่ม bevacizumab'},
{ c:'hcc', n:'STRIDE (Tremelimumab + Durvalumab)', s:'Advanced 1st line', cy:'Tremelimumab ครั้งเดียว; Durvalumab q4w', ref:'HIMALAYA', d:[
  d('Tremelimumab (ครั้งเดียว C1)',300,'mg','D1 รอบแรกเท่านั้น','IV'), d('Durvalumab',1500,'mg','D1 q28 วัน','IV')], note:'น้ำหนัก <30 kg: tremelimumab 4 mg/kg, durvalumab 20 mg/kg'},
{ c:'hcc', n:'Lenvatinib', s:'Advanced 1st line', cy:'ทุกวัน', ref:'REFLECT', d:[
  d('Lenvatinib',0,'tier','ทุกวัน','PO OD',{tiers:[{lt:60,dose:8},{dose:12}],tierText:'<60 kg = 8 mg; ≥60 kg = 12 mg'})]},
{ c:'hcc', n:'Sorafenib', s:'Advanced', cy:'ทุกวัน', ref:'SHARP; Asia-Pacific', d:[d('Sorafenib',400,'mg','ทุกวัน','PO BID')]},
{ c:'hcc', n:'Regorafenib (HCC 2nd line)', s:'หลัง sorafenib', cy:'q28 วัน (D1–21)', ref:'RESORCE', d:[d('Regorafenib',160,'mg','D1–21','PO OD')]},

// ---------------- BILIARY ----------------
{ c:'biliary', n:'Gemcitabine + Cisplatin + Durvalumab', s:'Advanced 1st line', cy:'q21 วัน × 8 แล้ว Durvalumab 1500 mg q4w', ref:'TOPAZ-1', d:[
  d('Durvalumab',1500,'mg','D1','IV'), d('Gemcitabine',1000,'mg/m2','D1, D8','IV'), d('Cisplatin',25,'mg/m2','D1, D8','IV')]},
{ c:'biliary', n:'Gemcitabine + Cisplatin + Pembrolizumab', s:'Advanced 1st line', cy:'q21 วัน (Gem/Cis × 8)', ref:'KEYNOTE-966', d:[
  d('Pembrolizumab',200,'mg','D1','IV'), d('Gemcitabine',1000,'mg/m2','D1, D8','IV'), d('Cisplatin',25,'mg/m2','D1, D8','IV')]},
{ c:'biliary', n:'Gemcitabine + Cisplatin', s:'Advanced 1st line', cy:'q21 วัน × 8', ref:'ABC-02', d:[
  d('Gemcitabine',1000,'mg/m2','D1, D8','IV'), d('Cisplatin',25,'mg/m2','D1, D8','IV')], note:'Cisplatin 25 mg/m2 (ไม่ใช่ 75) — จุดผิดพลาดบ่อย'},
{ c:'biliary', n:'Capecitabine adjuvant (biliary)', s:'Adjuvant', cy:'q21 วัน × 8', ref:'BILCAP', d:[d('Capecitabine',1250,'mg/m2','D1–14','PO',{freq:'BID',roundTo:150})]},
{ c:'biliary', n:'mFOLFOX (biliary 2nd line)', s:'Advanced 2nd line', cy:'q14 วัน', ref:'ABC-06', d:[
  d('Oxaliplatin',85,'mg/m2','D1','IV'), d('Leucovorin (calcium folinate)',350,'mg','D1','IV',{note:'ABC-06 ใช้ขนาดคงที่: L-folinic acid 175 mg (= calcium folinate 350 mg) — บางสถาบันใช้ 400 mg/m2 แบบ mFOLFOX6'}),
  d('Fluorouracil bolus',400,'mg/m2','D1','IV push'), d('Fluorouracil infusion',2400,'mg/m2','D1–2 (CI 46 ชม.)','IV CI')]},
{ c:'biliary', n:'Gemcitabine single agent', s:'Advanced', cy:'q28 วัน', ref:'NCCN', d:[d('Gemcitabine',1000,'mg/m2','D1, D8, D15','IV 30 นาที')]},

// ---------------- PANCREAS ----------------
{ c:'pancreas', n:'mFOLFIRINOX (adjuvant)', s:'Adjuvant', cy:'q14 วัน × 12', ref:'PRODIGE 24', d:[
  d('Oxaliplatin',85,'mg/m2','D1','IV'), d('Leucovorin (calcium folinate)',400,'mg/m2','D1','IV'), d('Irinotecan',150,'mg/m2','D1','IV'),
  d('Fluorouracil infusion',2400,'mg/m2','D1–2 (CI 46 ชม.)','IV CI',{note:'ไม่มี bolus'})]},
{ c:'pancreas', n:'FOLFIRINOX (metastatic)', s:'Metastatic', cy:'q14 วัน', ref:'ACCORD 11', d:[
  d('Oxaliplatin',85,'mg/m2','D1','IV'), d('Irinotecan',180,'mg/m2','D1','IV'), d('Leucovorin (calcium folinate)',400,'mg/m2','D1','IV'),
  d('Fluorouracil bolus',400,'mg/m2','D1','IV push'), d('Fluorouracil infusion',2400,'mg/m2','D1–2 (CI 46 ชม.)','IV CI')], note:'หลายสถาบันตัด bolus และลด irinotecan เป็น 150 (modified)'},
{ c:'pancreas', n:'Gemcitabine + nab-Paclitaxel', s:'Metastatic', cy:'q28 วัน', ref:'MPACT', d:[
  d('Paclitaxel protein-bound (nab)',125,'mg/m2','D1, D8, D15','IV'), d('Gemcitabine',1000,'mg/m2','D1, D8, D15','IV')]},
{ c:'pancreas', n:'Gemcitabine + Capecitabine', s:'Adjuvant', cy:'q28 วัน × 6', ref:'ESPAC-4', d:[
  d('Gemcitabine',1000,'mg/m2','D1, D8, D15','IV'), d('Capecitabine',830,'mg/m2','D1–21','PO',{freq:'BID',roundTo:150})]},
{ c:'pancreas', n:'Gemcitabine single agent', s:'Adjuvant / Metastatic', cy:'q28 วัน', ref:'CONKO-001', d:[d('Gemcitabine',1000,'mg/m2','D1, D8, D15','IV')]},

// ---------------- LUNG ----------------
{ c:'lung', n:'Carboplatin + Paclitaxel', s:'NSCLC', cy:'q21 วัน × 4–6', ref:'ECOG 1594', d:[
  d('Paclitaxel',200,'mg/m2','D1','IV 3 ชม.'), d('Carboplatin',6,'AUC','D1','IV')], note:'บางสถาบันใช้ AUC 5'},
{ c:'lung', n:'Cisplatin + Pemetrexed', s:'NSCLC non-squamous', cy:'q21 วัน × 4', ref:'JMDB', d:[
  d('Pemetrexed',500,'mg/m2','D1','IV 10 นาที'), d('Cisplatin',75,'mg/m2','D1','IV')], note:'ต้องได้ folic acid + vitamin B12 และ dexamethasone premed'},
{ c:'lung', n:'Carboplatin + Pemetrexed + Pembrolizumab', s:'NSCLC non-squamous 1st line', cy:'q21 วัน × 4 → pembro + pemetrexed', ref:'KEYNOTE-189', d:[
  d('Pembrolizumab',200,'mg','D1','IV'), d('Pemetrexed',500,'mg/m2','D1','IV'), d('Carboplatin',5,'AUC','D1','IV',{note:'หรือ cisplatin 75 mg/m2'})]},
{ c:'lung', n:'Carboplatin + Paclitaxel + Pembrolizumab', s:'NSCLC squamous 1st line', cy:'q21 วัน × 4', ref:'KEYNOTE-407', d:[
  d('Pembrolizumab',200,'mg','D1','IV'), d('Paclitaxel',200,'mg/m2','D1','IV'), d('Carboplatin',6,'AUC','D1','IV')]},
{ c:'lung', n:'Cisplatin + Gemcitabine', s:'NSCLC', cy:'q21 วัน × 4–6', ref:'JMDB (gem arm)', d:[
  d('Gemcitabine',1250,'mg/m2','D1, D8','IV'), d('Cisplatin',75,'mg/m2','D1','IV')]},
{ c:'lung', n:'Carboplatin + Gemcitabine', s:'NSCLC', cy:'q21 วัน × 4–6', ref:'NCCN', d:[
  d('Gemcitabine',1000,'mg/m2','D1, D8','IV'), d('Carboplatin',5,'AUC','D1','IV')]},
{ c:'lung', n:'Cisplatin + Vinorelbine (adjuvant)', s:'NSCLC Adjuvant', cy:'q21 วัน × 4', ref:'LACE; BC Cancer', d:[
  d('Cisplatin',80,'mg/m2','D1','IV'), d('Vinorelbine',30,'mg/m2','D1, D8','IV')]},
{ c:'lung', n:'Carboplatin + Paclitaxel weekly + RT', s:'NSCLC CRT', cy:'ทุกสัปดาห์ระหว่างฉายแสง', ref:'RTOG 0617', d:[
  d('Paclitaxel',45,'mg/m2','ทุกสัปดาห์','IV'), d('Carboplatin',2,'AUC','ทุกสัปดาห์','IV')], note:'หลายสถาบันใช้ paclitaxel 45–50 mg/m2'},
{ c:'lung', n:'Durvalumab consolidation', s:'Stage III หลัง CRT', cy:'q4w (หรือ 10 mg/kg q2w) × 12 เดือน', ref:'PACIFIC', d:[d('Durvalumab',1500,'mg','q28 วัน','IV',{note:'หรือ 10 mg/kg q14 วัน'})]},
{ c:'lung', n:'Docetaxel single agent', s:'NSCLC 2nd line', cy:'q21 วัน', ref:'TAX 317', d:[d('Docetaxel',75,'mg/m2','D1','IV')]},
{ c:'lung', n:'Pembrolizumab single agent', s:'NSCLC PD-L1 ≥50% / อื่นๆ', cy:'q21 วัน (หรือ 400 mg q6w)', ref:'KEYNOTE-024', d:[d('Pembrolizumab',200,'mg','D1','IV')]},
{ c:'lung', n:'Atezolizumab single agent', s:'NSCLC', cy:'q21 วัน (840 q2w / 1680 q4w)', ref:'IMpower110; OAK', d:[d('Atezolizumab',1200,'mg','D1','IV')]},
{ c:'lung', n:'Nivolumab single agent', s:'NSCLC 2nd line', cy:'q14 วัน (หรือ 480 mg q4w)', ref:'CheckMate 017/057', d:[d('Nivolumab',240,'mg','D1','IV')]},
{ c:'lung', n:'Cisplatin + Etoposide (SCLC)', s:'SCLC', cy:'q21 วัน × 4–6', ref:'NCCN', d:[
  d('Cisplatin',75,'mg/m2','D1','IV',{note:'บาง protocol 80 mg/m2 D1 หรือ 25 mg/m2 D1–3'}), d('Etoposide',100,'mg/m2','D1–3','IV')]},
{ c:'lung', n:'Carboplatin + Etoposide + Atezolizumab', s:'ES-SCLC', cy:'q21 วัน × 4 → atezolizumab', ref:'IMpower133', d:[
  d('Atezolizumab',1200,'mg','D1','IV'), d('Carboplatin',5,'AUC','D1','IV'), d('Etoposide',100,'mg/m2','D1–3','IV')]},
{ c:'lung', n:'Carboplatin/Cisplatin + Etoposide + Durvalumab', s:'ES-SCLC', cy:'q21 วัน × 4 → durvalumab 1500 q4w', ref:'CASPIAN', d:[
  d('Durvalumab',1500,'mg','D1','IV'), d('Carboplatin',5,'AUC','D1','IV',{note:'หรือ cisplatin 75–80 mg/m2'}), d('Etoposide',100,'mg/m2','D1–3','IV')]},
{ c:'lung', n:'Carboplatin + Etoposide', s:'SCLC', cy:'q21 วัน × 4–6', ref:'NCCN', d:[d('Carboplatin',5,'AUC','D1','IV'), d('Etoposide',100,'mg/m2','D1–3','IV')]},
{ c:'lung', n:'Osimertinib', s:'EGFR+ (1st line / adjuvant ADAURA)', cy:'ทุกวัน', ref:'FLAURA; ADAURA', d:[d('Osimertinib',80,'mg','ทุกวัน','PO OD')]},
{ c:'lung', n:'Gefitinib / Erlotinib / Afatinib', s:'EGFR+', cy:'ทุกวัน', ref:'IPASS; OPTIMAL; LUX-Lung', d:[
  d('Gefitinib',250,'mg','ทุกวัน','PO OD'), d('Erlotinib',150,'mg','ทุกวัน','PO OD'), d('Afatinib',40,'mg','ทุกวัน','PO OD')], note:'ใช้ตัวใดตัวหนึ่ง'},
{ c:'lung', n:'ALK TKI (Alectinib / Lorlatinib / Crizotinib)', s:'ALK+', cy:'ทุกวัน', ref:'ALEX; CROWN; PROFILE 1014', d:[
  d('Alectinib',600,'mg','ทุกวัน','PO BID'), d('Lorlatinib',100,'mg','ทุกวัน','PO OD'), d('Crizotinib',250,'mg','ทุกวัน','PO BID')], note:'ใช้ตัวใดตัวหนึ่ง'},

// ---------------- HEAD & NECK / NPC ----------------
{ c:'hn', n:'Cisplatin 100 q3w + RT', s:'CCRT (H&N / NPC)', cy:'q21 วัน × 2–3', ref:'RTOG 9501; Al-Sarraf', d:[d('Cisplatin',100,'mg/m2','D1, D22, D43','IV')], note:'cumulative cisplatin ≥200 mg/m2 สัมพันธ์กับผลลัพธ์ที่ดี'},
{ c:'hn', n:'Cisplatin weekly + RT', s:'CCRT (H&N / NPC)', cy:'ทุกสัปดาห์ × 6–7', ref:'Noronha; NPC trials', d:[d('Cisplatin',40,'mg/m2','ทุกสัปดาห์','IV')], note:'บางสถาบันกำหนด cap ต่อครั้ง (เช่น 70 mg) — ตรวจ protocol สถาบัน'},
{ c:'hn', n:'NPC induction GP (Gem + Cis)', s:'NPC Induction (ก่อน CCRT)', cy:'q21 วัน × 3', ref:'Zhang NEJM 2019', d:[
  d('Gemcitabine',1000,'mg/m2','D1, D8','IV'), d('Cisplatin',80,'mg/m2','D1','IV')]},
{ c:'hn', n:'NPC induction TPF', s:'NPC Induction', cy:'q21 วัน × 3', ref:'Sun Lancet Oncol 2016', d:[
  d('Docetaxel',60,'mg/m2','D1','IV'), d('Cisplatin',60,'mg/m2','D1','IV'), d('Fluorouracil infusion',600,'mg/m2','D1–5 (CI)','IV CI',{nDays:5})]},
{ c:'hn', n:'NPC adjuvant PF', s:'NPC Adjuvant (หลัง CCRT)', cy:'q28 วัน × 3', ref:'Intergroup 0099', d:[
  d('Cisplatin',80,'mg/m2','D1','IV'), d('Fluorouracil infusion',1000,'mg/m2','D1–4 (CI)','IV CI',{nDays:4})]},
{ c:'hn', n:'NPC metronomic Capecitabine (adjuvant)', s:'NPC Adjuvant high-risk', cy:'ทุกวัน × 1 ปี', ref:'Chen Lancet 2021', d:[d('Capecitabine',650,'mg/m2','ทุกวัน','PO',{freq:'BID',roundTo:150})]},
{ c:'hn', n:'Gem + Cis (NPC recurrent/metastatic)', s:'NPC Metastatic', cy:'q21 วัน × 4–6', ref:'Zhang Lancet 2016 (GEM20110714)', d:[
  d('Gemcitabine',1000,'mg/m2','D1, D8','IV'), d('Cisplatin',80,'mg/m2','D1','IV')]},
{ c:'hn', n:'H&N induction TPF', s:'H&N Induction', cy:'q21 วัน × 3–4', ref:'TAX 323', d:[
  d('Docetaxel',75,'mg/m2','D1','IV'), d('Cisplatin',75,'mg/m2','D1','IV'), d('Fluorouracil infusion',750,'mg/m2','D1–5 (CI)','IV CI',{nDays:5})], note:'TAX 324: cisplatin 100 + 5FU 1000 mg/m2/day D1–4'},
{ c:'hn', n:'EXTREME (Platinum + 5FU + Cetuximab)', s:'H&N Recurrent/Metastatic', cy:'q21 วัน × 6 → cetuximab weekly', ref:'EXTREME', d:[
  d('Cisplatin',100,'mg/m2','D1','IV',{note:'หรือ carboplatin AUC 5'}), d('Fluorouracil infusion',1000,'mg/m2','D1–4 (CI)','IV CI',{nDays:4}),
  d('Cetuximab (loading)',400,'mg/m2','ครั้งแรก','IV 2 ชม.'), d('Cetuximab (weekly)',250,'mg/m2','ทุกสัปดาห์','IV 1 ชม.')]},
{ c:'hn', n:'Pembrolizumab + Platinum + 5FU', s:'H&N Recurrent/Metastatic', cy:'q21 วัน × 6 → pembro', ref:'KEYNOTE-048', d:[
  d('Pembrolizumab',200,'mg','D1','IV'), d('Cisplatin',100,'mg/m2','D1','IV',{note:'หรือ carboplatin AUC 5'}), d('Fluorouracil infusion',1000,'mg/m2','D1–4 (CI)','IV CI',{nDays:4})]},
{ c:'hn', n:'Cetuximab + RT', s:'H&N (ไม่เหมาะกับ cisplatin)', cy:'loading 1 สัปดาห์ก่อน RT แล้ว weekly', ref:'Bonner', d:[
  d('Cetuximab (loading)',400,'mg/m2','1 สัปดาห์ก่อน RT','IV'), d('Cetuximab (weekly)',250,'mg/m2','ทุกสัปดาห์ระหว่าง RT','IV')]},

// ---------------- CERVIX ----------------
{ c:'cervix', n:'Cisplatin weekly + RT', s:'CCRT', cy:'ทุกสัปดาห์ × 5–6', ref:'GOG 120; RTOG 90-01', d:[d('Cisplatin',40,'mg/m2','ทุกสัปดาห์','IV')], note:'หลายสถาบัน cap 70 mg/ครั้ง'},
{ c:'cervix', n:'Pembrolizumab + CCRT', s:'Locally advanced (FIGO III–IVA)', cy:'200 mg q3w × 5 → 400 mg q6w × 15', ref:'KEYNOTE-A18', d:[
  d('Pembrolizumab (ระหว่าง CRT)',200,'mg','q21 วัน × 5','IV'), d('Cisplatin',40,'mg/m2','ทุกสัปดาห์ × 5–6','IV'), d('Pembrolizumab (maintenance)',400,'mg','q42 วัน × 15','IV')]},
{ c:'cervix', n:'Paclitaxel + Cis/Carbo ± Bevacizumab ± Pembrolizumab', s:'Persistent/Recurrent/Metastatic', cy:'q21 วัน', ref:'GOG 240; KEYNOTE-826', d:[
  d('Paclitaxel',175,'mg/m2','D1','IV 3 ชม.'), d('Cisplatin',50,'mg/m2','D1','IV',{note:'หรือ carboplatin AUC 5'}), d('Bevacizumab',15,'mg/kg','D1','IV',{note:'ถ้าให้ร่วม'}), d('Pembrolizumab',200,'mg','D1','IV',{note:'PD-L1 CPS ≥1'})]},
{ c:'cervix', n:'Carboplatin + Paclitaxel (cervix)', s:'Metastatic', cy:'q21 วัน', ref:'JCOG 0505', d:[d('Paclitaxel',175,'mg/m2','D1','IV'), d('Carboplatin',5,'AUC','D1','IV')]},

// ---------------- OVARY ----------------
{ c:'ovary', n:'Carboplatin + Paclitaxel q3w', s:'1st line', cy:'q21 วัน × 6', ref:'GOG 158; ICON', d:[d('Paclitaxel',175,'mg/m2','D1','IV 3 ชม.'), d('Carboplatin',5,'AUC','D1','IV',{note:'AUC 5–6'})]},
{ c:'ovary', n:'Dose-dense Paclitaxel + Carboplatin', s:'1st line', cy:'q21 วัน × 6', ref:'JGOG 3016', d:[d('Paclitaxel',80,'mg/m2','D1, D8, D15','IV'), d('Carboplatin',6,'AUC','D1','IV')]},
{ c:'ovary', n:'Weekly Carboplatin + Paclitaxel', s:'1st line (ผู้สูงอายุ/เปราะบาง)', cy:'ทุกสัปดาห์ × 18', ref:'MITO-7', d:[d('Paclitaxel',60,'mg/m2','ทุกสัปดาห์','IV'), d('Carboplatin',2,'AUC','ทุกสัปดาห์','IV')]},
{ c:'ovary', n:'Carboplatin + Paclitaxel + Bevacizumab', s:'1st line high risk', cy:'q21 วัน', ref:'GOG 218 (15 mg/kg); ICON7 (7.5 mg/kg)', d:[
  d('Paclitaxel',175,'mg/m2','D1','IV'), d('Carboplatin',5,'AUC','D1','IV'), d('Bevacizumab',15,'mg/kg','D1 (เริ่มรอบ 2)','IV',{note:'ICON7 ใช้ 7.5 mg/kg'})]},
{ c:'ovary', n:'Carboplatin + PLD', s:'Platinum-sensitive recurrent', cy:'q28 วัน', ref:'CALYPSO', d:[d('Pegylated liposomal doxorubicin',30,'mg/m2','D1','IV'), d('Carboplatin',5,'AUC','D1','IV')]},
{ c:'ovary', n:'Carboplatin + Gemcitabine', s:'Platinum-sensitive recurrent', cy:'q21 วัน', ref:'AGO-OVAR 2.5', d:[d('Gemcitabine',1000,'mg/m2','D1, D8','IV'), d('Carboplatin',4,'AUC','D1','IV')]},
{ c:'ovary', n:'PLD single agent', s:'Platinum-resistant', cy:'q28 วัน', ref:'NCCN', d:[d('Pegylated liposomal doxorubicin',40,'mg/m2','D1','IV')], note:'ห้ามสลับกับ doxorubicin ธรรมดา'},
{ c:'ovary', n:'Paclitaxel weekly (ovary)', s:'Platinum-resistant', cy:'ทุกสัปดาห์', ref:'NCCN', d:[d('Paclitaxel',80,'mg/m2','ทุกสัปดาห์','IV')]},
{ c:'ovary', n:'Olaparib maintenance', s:'BRCA/HRD maintenance', cy:'ทุกวัน', ref:'SOLO-1; PAOLA-1', d:[d('Olaparib (tablet)',300,'mg','ทุกวัน','PO BID')]},
{ c:'ovary', n:'Niraparib maintenance', s:'Maintenance', cy:'ทุกวัน', ref:'PRIMA (individualized)', d:[
  d('Niraparib',0,'tier','ทุกวัน','PO OD',{tiers:[{lt:77,dose:200},{dose:300}],tierText:'<77 kg หรือ plt <150,000 = 200 mg; ≥77 kg และ plt ≥150,000 = 300 mg'})]},

// ---------------- ENDOMETRIUM ----------------
{ c:'endomet', n:'Carboplatin + Paclitaxel (endometrium)', s:'Advanced/Recurrent', cy:'q21 วัน × 6', ref:'GOG 209', d:[d('Paclitaxel',175,'mg/m2','D1','IV'), d('Carboplatin',5,'AUC','D1','IV')]},
{ c:'endomet', n:'Carboplatin + Paclitaxel + Dostarlimab', s:'Advanced/Recurrent', cy:'q21 วัน × 6 → 1000 mg q6w', ref:'RUBY', d:[
  d('Dostarlimab',500,'mg','D1 q21 × 6','IV'), d('Paclitaxel',175,'mg/m2','D1','IV'), d('Carboplatin',5,'AUC','D1','IV'), d('Dostarlimab (maintenance)',1000,'mg','q42 วัน','IV')]},
{ c:'endomet', n:'Carboplatin + Paclitaxel + Pembrolizumab', s:'Advanced/Recurrent', cy:'q21 วัน × 6 → 400 mg q6w', ref:'NRG-GY018', d:[
  d('Pembrolizumab',200,'mg','D1 q21 × 6','IV'), d('Paclitaxel',175,'mg/m2','D1','IV'), d('Carboplatin',5,'AUC','D1','IV'), d('Pembrolizumab (maintenance)',400,'mg','q42 วัน','IV')]},
{ c:'endomet', n:'Lenvatinib + Pembrolizumab', s:'Recurrent (pMMR)', cy:'q21 วัน', ref:'KEYNOTE-775', d:[d('Lenvatinib',20,'mg','ทุกวัน','PO OD'), d('Pembrolizumab',200,'mg','D1','IV')]},

// ---------------- BLADDER ----------------
{ c:'bladder', n:'Gemcitabine + Cisplatin (bladder)', s:'Neoadjuvant / Metastatic', cy:'q21 วัน × 4–6', ref:'NCCN (q21 variant)', d:[
  d('Gemcitabine',1000,'mg/m2','D1, D8','IV'), d('Cisplatin',70,'mg/m2','D1','IV')], note:'แบบ q28: gem D1,8,15 + cis 70 D2 (von der Maase)'},
{ c:'bladder', n:'dd MVAC', s:'Neoadjuvant / Metastatic', cy:'q14 วัน + G-CSF', ref:'EORTC 30924; VESPER', d:[
  d('Methotrexate',30,'mg/m2','D1','IV'), d('Vinblastine',3,'mg/m2','D2','IV'), d('Doxorubicin',30,'mg/m2','D2','IV'), d('Cisplatin',70,'mg/m2','D2','IV')]},
{ c:'bladder', n:'Gemcitabine + Carboplatin (cis-ineligible)', s:'Metastatic', cy:'q21 วัน', ref:'EORTC 30986', d:[d('Gemcitabine',1000,'mg/m2','D1, D8','IV'), d('Carboplatin',4.5,'AUC','D1','IV')]},
{ c:'bladder', n:'Enfortumab vedotin + Pembrolizumab', s:'Metastatic 1st line', cy:'q21 วัน', ref:'EV-302', d:[
  d('Enfortumab vedotin',1.25,'mg/kg','D1, D8','IV',{cap:125,note:'สูงสุด 125 mg (น้ำหนัก ≥100 kg)'}), d('Pembrolizumab',200,'mg','D1','IV')]},
{ c:'bladder', n:'Avelumab maintenance', s:'Maintenance หลัง platinum', cy:'q14 วัน', ref:'JAVELIN Bladder 100', d:[d('Avelumab',800,'mg','D1','IV')]},

// ---------------- PROSTATE ----------------
{ c:'prostate', n:'Docetaxel + Prednisolone', s:'mCRPC / mHSPC', cy:'q21 วัน (mHSPC × 6)', ref:'TAX 327; CHAARTED', d:[
  d('Docetaxel',75,'mg/m2','D1','IV'), d('Prednisolone',5,'mg','ทุกวัน','PO BID',{note:'mHSPC (CHAARTED) อาจไม่ให้ prednisolone'})]},
{ c:'prostate', n:'Cabazitaxel', s:'mCRPC หลัง docetaxel', cy:'q21 วัน', ref:'TROPIC; PROSELICA (20 mg/m2)', d:[d('Cabazitaxel',25,'mg/m2','D1','IV'), d('Prednisolone',5,'mg','ทุกวัน','PO BID')], note:'PROSELICA: 20 mg/m2 non-inferior'},
{ c:'prostate', n:'Abiraterone + Prednisolone', s:'mCRPC / mHSPC', cy:'ทุกวัน', ref:'COU-AA; LATITUDE', d:[d('Abiraterone acetate',1000,'mg','ทุกวัน (ท้องว่าง)','PO OD'), d('Prednisolone',5,'mg','ทุกวัน','PO BID (mHSPC: OD)')]},
{ c:'prostate', n:'Androgen receptor inhibitors', s:'mCRPC / mHSPC / nmCRPC', cy:'ทุกวัน', ref:'Label', d:[
  d('Enzalutamide',160,'mg','ทุกวัน','PO OD'), d('Apalutamide',240,'mg','ทุกวัน','PO OD'), d('Darolutamide',600,'mg','ทุกวัน','PO BID')], note:'ใช้ตัวใดตัวหนึ่ง'},

// ---------------- KIDNEY ----------------
{ c:'kidney', n:'Pembrolizumab + Axitinib', s:'Advanced 1st line', cy:'q21 วัน', ref:'KEYNOTE-426', d:[d('Pembrolizumab',200,'mg','D1','IV'), d('Axitinib',5,'mg','ทุกวัน','PO BID')]},
{ c:'kidney', n:'Nivolumab + Cabozantinib', s:'Advanced 1st line', cy:'q14 วัน', ref:'CheckMate 9ER', d:[d('Nivolumab',240,'mg','D1','IV'), d('Cabozantinib',40,'mg','ทุกวัน','PO OD')]},
{ c:'kidney', n:'Lenvatinib + Pembrolizumab (RCC)', s:'Advanced 1st line', cy:'q21 วัน', ref:'CLEAR', d:[d('Lenvatinib',20,'mg','ทุกวัน','PO OD'), d('Pembrolizumab',200,'mg','D1','IV')]},
{ c:'kidney', n:'Sunitinib / Pazopanib', s:'Advanced', cy:'Sunitinib 4 สัปดาห์ on / 2 off', ref:'Label', d:[d('Sunitinib',50,'mg','D1–28 q42 วัน','PO OD'), d('Pazopanib',800,'mg','ทุกวัน','PO OD')], note:'ใช้ตัวใดตัวหนึ่ง'},
{ c:'kidney', n:'Cabozantinib single agent', s:'Advanced', cy:'ทุกวัน', ref:'METEOR; CABOSUN', d:[d('Cabozantinib',60,'mg','ทุกวัน','PO OD')]},

// ---------------- GERM CELL ----------------
{ c:'gct', n:'BEP', s:'Germ cell', cy:'q21 วัน × 3–4', ref:'Einhorn; Williams', d:[
  d('Bleomycin',30,'units','D1, D8, D15','IV',{note:'ขนาดคงที่ 30 units (ไม่คิดตาม BSA)'}), d('Etoposide',100,'mg/m2','D1–5','IV'), d('Cisplatin',20,'mg/m2','D1–5','IV')],
  note:'Bleomycin สะสมตลอดชีวิตไม่ควรเกิน 400 units; ตรวจ PFT'},
{ c:'gct', n:'EP', s:'Germ cell (good risk)', cy:'q21 วัน × 4', ref:'NCCN', d:[d('Etoposide',100,'mg/m2','D1–5','IV'), d('Cisplatin',20,'mg/m2','D1–5','IV')]},

// ---------------- LYMPHOMA ----------------
{ c:'lymphoma', n:'R-CHOP-21', s:'DLBCL / FL', cy:'q21 วัน × 6', ref:'GELA LNH98-5', d:[
  d('Rituximab',375,'mg/m2','D1','IV'), d('Cyclophosphamide',750,'mg/m2','D1','IV'), d('Doxorubicin',50,'mg/m2','D1','IV'),
  d('Vincristine',1.4,'mg/m2','D1','IV push',{cap:2,note:'cap 2 mg'}), d('Prednisolone',100,'mg','D1–5','PO OD')]},
{ c:'lymphoma', n:'Pola-R-CHP', s:'DLBCL (IPI ≥2)', cy:'q21 วัน × 6 (+ R × 2)', ref:'POLARIX', d:[
  d('Polatuzumab vedotin',1.8,'mg/kg','D1','IV'), d('Rituximab',375,'mg/m2','D1','IV'), d('Cyclophosphamide',750,'mg/m2','D1','IV'),
  d('Doxorubicin',50,'mg/m2','D1','IV'), d('Prednisolone',100,'mg','D1–5','PO OD')]},
{ c:'lymphoma', n:'CHOP-21', s:'PTCL', cy:'q21 วัน × 6', ref:'NCCN', d:[
  d('Cyclophosphamide',750,'mg/m2','D1','IV'), d('Doxorubicin',50,'mg/m2','D1','IV'), d('Vincristine',1.4,'mg/m2','D1','IV push',{cap:2}), d('Prednisolone',100,'mg','D1–5','PO OD')]},
{ c:'lymphoma', n:'CHOEP-21', s:'PTCL (อายุน้อย)', cy:'q21 วัน × 6', ref:'DSHNHL', d:[
  d('Cyclophosphamide',750,'mg/m2','D1','IV'), d('Doxorubicin',50,'mg/m2','D1','IV'), d('Vincristine',1.4,'mg/m2','D1','IV push',{cap:2}),
  d('Etoposide',100,'mg/m2','D1–3','IV'), d('Prednisolone',100,'mg','D1–5','PO OD')]},
{ c:'lymphoma', n:'R-CVP', s:'Follicular / Indolent', cy:'q21 วัน × 8', ref:'Marcus', d:[
  d('Rituximab',375,'mg/m2','D1','IV'), d('Cyclophosphamide',750,'mg/m2','D1','IV'), d('Vincristine',1.4,'mg/m2','D1','IV push',{cap:2}), d('Prednisolone',40,'mg/m2','D1–5','PO OD')]},
{ c:'lymphoma', n:'BR (Bendamustine + Rituximab)', s:'Indolent / MCL', cy:'q28 วัน × 6', ref:'StiL NHL1; BRIGHT', d:[
  d('Bendamustine',90,'mg/m2','D1, D2','IV'), d('Rituximab',375,'mg/m2','D1','IV')]},
{ c:'lymphoma', n:'R-GDP', s:'Relapsed DLBCL (salvage)', cy:'q21 วัน', ref:'NCIC-CTG LY.12', d:[
  d('Rituximab',375,'mg/m2','D1','IV'), d('Gemcitabine',1000,'mg/m2','D1, D8','IV'), d('Dexamethasone',40,'mg','D1–4','PO OD'), d('Cisplatin',75,'mg/m2','D1','IV')]},
{ c:'lymphoma', n:'R-ICE', s:'Relapsed DLBCL (salvage)', cy:'q14–21 วัน', ref:'Kewalramani', d:[
  d('Rituximab',375,'mg/m2','D1','IV'), d('Etoposide',100,'mg/m2','D1–3','IV'), d('Carboplatin',5,'AUC','D2','IV',{cap:800,note:'สูงสุด 800 mg'}),
  d('Ifosfamide',5000,'mg/m2','D2 (CI 24 ชม.)','IV CI'), d('Mesna',5000,'mg/m2','D2 (CI 24 ชม. ร่วมกับ ifosfamide)','IV CI')]},
{ c:'lymphoma', n:'ABVD', s:'Hodgkin', cy:'q28 วัน × 2–6', ref:'Bonadonna; RATHL', d:[
  d('Doxorubicin',25,'mg/m2','D1, D15','IV'), d('Bleomycin',10,'units/m2','D1, D15','IV'), d('Vinblastine',6,'mg/m2','D1, D15','IV'), d('Dacarbazine',375,'mg/m2','D1, D15','IV')]},
{ c:'lymphoma', n:'BV-AVD', s:'Hodgkin stage III–IV', cy:'q28 วัน × 6 + G-CSF', ref:'ECHELON-1', d:[
  d('Brentuximab vedotin',1.2,'mg/kg','D1, D15','IV',{cap:120,note:'สูงสุด 120 mg'}), d('Doxorubicin',25,'mg/m2','D1, D15','IV'), d('Vinblastine',6,'mg/m2','D1, D15','IV'), d('Dacarbazine',375,'mg/m2','D1, D15','IV')]},
{ c:'lymphoma', n:'Brentuximab vedotin single agent', s:'Hodgkin / ALCL', cy:'q21 วัน', ref:'Label', d:[d('Brentuximab vedotin',1.8,'mg/kg','D1','IV',{cap:180,note:'สูงสุด 180 mg'})]},
{ c:'lymphoma', n:'DA-EPOCH-R (dose level 1)', s:'Aggressive B-cell (PMBCL, Burkitt, double-hit)', cy:'q21 วัน (ปรับ dose level ตาม ANC nadir)', ref:'Dunleavy NEJM 2013', d:[
  d('Rituximab',375,'mg/m2','D1','IV'), d('Etoposide',50,'mg/m2','D1–4 (CI 96 ชม.)','IV CI',{nDays:4}), d('Doxorubicin',10,'mg/m2','D1–4 (CI 96 ชม.)','IV CI',{nDays:4}),
  d('Vincristine',0.4,'mg/m2','D1–4 (CI 96 ชม.)','IV CI',{nDays:4,note:'ไม่มี cap ใน DA-EPOCH'}), d('Cyclophosphamide',750,'mg/m2','D5','IV'), d('Prednisolone',60,'mg/m2','D1–5','PO BID')],
  note:'ขนาดแสดงเป็นต่อวัน (dose level 1); ปรับ ±20% ทุกรอบตาม ANC nadir'},
{ c:'lymphoma', n:'Rituximab single / maintenance', s:'Indolent', cy:'Maintenance q8–12 สัปดาห์', ref:'PRIMA', d:[d('Rituximab',375,'mg/m2','D1','IV')], note:'Rituximab SC = 1400 mg ขนาดคงที่ (หลังได้ IV ครั้งแรก)'},

// ---------------- MYELOMA ----------------
{ c:'myeloma', n:'VRd', s:'Newly diagnosed', cy:'q21 วัน × 8', ref:'SWOG S0777', d:[
  d('Bortezomib',1.3,'mg/m2','D1, D4, D8, D11','SC'), d('Lenalidomide',25,'mg','D1–14','PO OD'), d('Dexamethasone',20,'mg','D1, 2, 4, 5, 8, 9, 11, 12','PO')]},
{ c:'myeloma', n:'VCd (CyBorD)', s:'Newly diagnosed', cy:'q28 วัน', ref:'Reeder; Mayo', d:[
  d('Cyclophosphamide',300,'mg/m2','D1, D8, D15, D22','PO'), d('Bortezomib',1.5,'mg/m2','D1, D8, D15, D22','SC'), d('Dexamethasone',40,'mg','D1, D8, D15, D22','PO')]},
{ c:'myeloma', n:'Daratumumab SC + Rd (DRd)', s:'Newly diagnosed transplant-ineligible', cy:'q28 วัน', ref:'MAIA', d:[
  d('Daratumumab SC',1800,'mg','สัปดาห์ 1–8 ทุกสัปดาห์, 9–24 q2w, หลังจากนั้น q4w','SC',{note:'IV: 16 mg/kg'}), d('Lenalidomide',25,'mg','D1–21','PO OD'), d('Dexamethasone',40,'mg','ทุกสัปดาห์','PO')]},
{ c:'myeloma', n:'Thalidomide + Dexamethasone', s:'Myeloma', cy:'q28 วัน', ref:'ECOG E1A00', d:[d('Thalidomide',200,'mg','ทุกวัน','PO HS'), d('Dexamethasone',40,'mg','D1, D8, D15, D22','PO')], note:'ต้องให้ VTE prophylaxis'},

// ---------------- LEUKEMIA ----------------
{ c:'leukemia', n:'7+3 (Cytarabine + Daunorubicin)', s:'AML Induction', cy:'1 รอบ', ref:'E1900 (dauno 90); NCCN', d:[
  d('Cytarabine',100,'mg/m2','D1–7 (CI 24 ชม./วัน)','IV CI',{nDays:7,note:'บาง protocol 200 mg/m2/วัน'}), d('Daunorubicin',60,'mg/m2','D1–3','IV',{note:'60–90 mg/m2'})]},
{ c:'leukemia', n:'7+3 (Cytarabine + Idarubicin)', s:'AML Induction', cy:'1 รอบ', ref:'NCCN', d:[
  d('Cytarabine',100,'mg/m2','D1–7 (CI)','IV CI',{nDays:7}), d('Idarubicin',12,'mg/m2','D1–3','IV')]},
{ c:'leukemia', n:'HiDAC consolidation', s:'AML Consolidation (อายุ <60)', cy:'q28 วัน × 3–4', ref:'CALGB 8525', d:[d('Cytarabine (high-dose)',3000,'mg/m2','q12 ชม. D1, D3, D5 (6 ครั้ง)','IV 3 ชม.')], note:'อายุ ≥60 ใช้ 1000–1500 mg/m2; ต้องให้ steroid eye drops; ระวัง cerebellar toxicity เมื่อไตเสื่อม'},
{ c:'leukemia', n:'Azacitidine + Venetoclax', s:'AML unfit', cy:'q28 วัน', ref:'VIALE-A', d:[
  d('Azacitidine',75,'mg/m2','D1–7','SC/IV'), d('Venetoclax',400,'mg','D1–28 (ramp-up 100→200→400 mg ในรอบแรก)','PO OD')], note:'ลดขนาด venetoclax เมื่อใช้ร่วม azole (เช่น posaconazole → 70 mg)'},
{ c:'leukemia', n:'Azacitidine single agent', s:'MDS / AML', cy:'q28 วัน', ref:'AZA-001', d:[d('Azacitidine',75,'mg/m2','D1–7','SC')]},
{ c:'leukemia', n:'Decitabine', s:'MDS / AML', cy:'q28 วัน', ref:'Label (5-day)', d:[d('Decitabine',20,'mg/m2','D1–5','IV 1 ชม.')]},
{ c:'leukemia', n:'ATRA + Arsenic trioxide', s:'APL low/intermediate risk', cy:'Induction จนกว่า CR', ref:'APL0406 (Lo-Coco)', d:[
  d('Tretinoin (ATRA)',45,'mg/m2','ทุกวัน (แบ่ง 2 มื้อ)','PO',{note:'ต่อวัน แบ่ง BID'}), d('Arsenic trioxide',0.15,'mg/kg','ทุกวัน','IV')], note:'ติดตาม QTc, K, Mg; เฝ้าระวัง differentiation syndrome'},
{ c:'leukemia', n:'CML TKIs', s:'CML chronic phase', cy:'ทุกวัน', ref:'Label', d:[d('Imatinib',400,'mg','ทุกวัน','PO OD'), d('Nilotinib',300,'mg','ทุกวัน','PO BID'), d('Dasatinib',100,'mg','ทุกวัน','PO OD')], note:'ใช้ตัวใดตัวหนึ่ง'},

// ---------------- OTHER ----------------
{ c:'other', n:'Doxorubicin single agent', s:'Soft tissue sarcoma', cy:'q21 วัน × 6', ref:'EORTC 62012', d:[d('Doxorubicin',75,'mg/m2','D1','IV')]},
{ c:'other', n:'AI (Doxorubicin + Ifosfamide)', s:'Soft tissue sarcoma', cy:'q21 วัน + G-CSF', ref:'EORTC 62012', d:[
  d('Doxorubicin',75,'mg/m2','D1 (หรือแบ่ง D1–3)','IV'), d('Ifosfamide',2500,'mg/m2','D1–4','IV',{nDays:4}), d('Mesna',2500,'mg/m2','D1–4 (ตาม protocol)','IV',{nDays:4})]},
{ c:'other', n:'Gemcitabine + Docetaxel', s:'Sarcoma (uLMS, etc.)', cy:'q21 วัน', ref:'GeDDiS', d:[d('Gemcitabine',675,'mg/m2','D1, D8','IV',{note:'GeDDiS 675; Maki 900 mg/m2'}), d('Docetaxel',75,'mg/m2','D8','IV')]},
{ c:'other', n:'Imatinib (GIST)', s:'GIST adjuvant / advanced', cy:'ทุกวัน (adjuvant 3 ปี)', ref:'SSG XVIII', d:[d('Imatinib',400,'mg','ทุกวัน','PO OD')], note:'KIT exon 9: 800 mg/วัน (advanced)'},
{ c:'other', n:'Temozolomide + RT (Stupp) – concurrent', s:'Glioblastoma', cy:'ทุกวันระหว่าง RT (42 วัน)', ref:'Stupp EORTC/NCIC', d:[d('Temozolomide',75,'mg/m2','ทุกวัน × 42 วัน','PO',{roundTo:5})], note:'ต้องให้ PJP prophylaxis'},
{ c:'other', n:'Temozolomide adjuvant (Stupp)', s:'Glioblastoma', cy:'q28 วัน × 6 (D1–5)', ref:'Stupp', d:[d('Temozolomide',150,'mg/m2','D1–5','PO',{roundTo:5,note:'รอบ 1 = 150; รอบ 2–6 เพิ่มเป็น 200 mg/m2 ถ้าทนได้'})]},
{ c:'other', n:'Lenvatinib (thyroid)', s:'RAI-refractory DTC', cy:'ทุกวัน', ref:'SELECT', d:[d('Lenvatinib',24,'mg','ทุกวัน','PO OD')], note:'ขนาดต่างจาก HCC (8/12 mg) และ RCC/endometrium (20 mg)'},
];
