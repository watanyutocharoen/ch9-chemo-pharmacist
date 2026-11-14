// ===== ฐานข้อมูลสูตรยา =====
// แก้ไข/เพิ่มสูตรได้ที่ไฟล์นี้ไฟล์เดียว (ดูวิธีใน README.md) แล้วอัปเดต DB_VERSION ทุกครั้ง
const DB_VERSION = 'v1.4 (14 พ.ย. 2569)';
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
  gtn: 'มะเร็งเนื้อรก (GTN)', bone: 'มะเร็งกระดูก (Osteosarcoma)',
  other: 'Sarcoma / สมอง / ไทรอยด์ / GIST'
};
const CANCER_KW = {
  breast: 'breast เต้านม', crc: 'colon rectal colorectal ลำไส้ ทวารหนัก crc', gastric: 'gastric stomach esophag กระเพาะ หลอดอาหาร gej',
  hcc: 'hcc liver hepatocellular ตับ', biliary: 'cholangio biliary btc gallbladder ท่อน้ำดี ถุงน้ำดี cca', pancreas: 'pancrea ตับอ่อน',
  lung: 'lung nsclc sclc ปอด', hn: 'head neck npc nasopharyn ศีรษะ ลำคอ โพรงหลังจมูก ช่องปาก', cervix: 'cervix cervical ปากมดลูก',
  ovary: 'ovary ovarian รังไข่', endomet: 'endometri uterine มดลูก', bladder: 'bladder urothelial กระเพาะปัสสาวะ',
  prostate: 'prostate ต่อมลูกหมาก', kidney: 'renal rcc kidney ไต', gct: 'testicular germ cell อัณฑะ',
  lymphoma: 'lymphoma dlbcl hodgkin ต่อมน้ำเหลือง nhl', myeloma: 'myeloma mm ไขกระดูก', leukemia: 'leukemia aml cml apl มะเร็งเม็ดเลือด',
  gtn: 'gtn gestational trophoblastic choriocarcinoma molar เนื้อรก ครรภ์ไข่ปลาอุก', bone: 'osteosarcoma bone กระดูก',
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
{ c:'breast', n:'FAC', kw:'cbrc13 cbrc22', s:'Adjuvant / Metastatic', cy:'q21 วัน × 6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CBrC13/CBrC22); Buzdar', d:[
  d('Fluorouracil',500,'mg/m2','D1','IV'), d('Doxorubicin',50,'mg/m2','D1','IV'), d('Cyclophosphamide',500,'mg/m2','D1','IV')]},
{ c:'breast', n:'CMF (oral cyclophosphamide, classic)', kw:'cbrc11 cbrc21 bonadonna', s:'Adjuvant / Metastatic', cy:'q28 วัน × 6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CBrC11/CBrC21); Bonadonna', d:[
  d('Cyclophosphamide (oral)',100,'mg/m2','D1–14','PO OD',{roundTo:50}), d('Methotrexate',40,'mg/m2','D1, D8','IV'), d('Fluorouracil',600,'mg/m2','D1, D8','IV')]},
{ c:'breast', n:'Paclitaxel q3w (หลัง AC)', kw:'cbrc14b calgb 9344', s:'Adjuvant', cy:'q21 วัน × 4', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CBrC14B); CALGB 9344', d:[
  d('Paclitaxel',175,'mg/m2','D1','IV 3 ชม.')]},
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
{ c:'breast', n:'Megestrol acetate', kw:'cbrh44 megace', s:'HR+ Metastatic (ฮอร์โมน)', cy:'ทุกวัน', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CBrH44)', d:[d('Megestrol acetate',160,'mg','ทุกวัน','PO OD')]},
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
{ c:'crc', n:'5-FU/LV Mayo Clinic', kw:'mayo meyo เมโย 5fu lv fufa', s:'Adjuvant / Metastatic (colon, gastric)', cy:'q28 วัน × 6', ref:'Poon JCO 1989 (Mayo/NCCTG); INT-0089', d:[
  d('Leucovorin (calcium folinate)',20,'mg/m2','D1–5 (ก่อน 5-FU)','IV push',{nDays:5}), d('Fluorouracil bolus',425,'mg/m2','D1–5','IV push',{nDays:5})],
  note:'ขนาดเป็น "ต่อวัน" × 5 วัน · เสี่ยง mucositis/neutropenia สูงกว่าแบบ infusion — ปัจจุบันมักใช้ sLV5FU2 แทน'},
{ c:'crc', n:'5-FU/LV Roswell Park (weekly)', kw:'roswell 5fu lv weekly', s:'Adjuvant colon', cy:'ทุกสัปดาห์ × 6 ใน 8 สัปดาห์ (1 รอบ) × 4 รอบ', ref:'NSABP C-03/C-04', d:[
  d('Leucovorin (calcium folinate)',500,'mg/m2','D1, 8, 15, 22, 29, 36','IV 2 ชม.'), d('Fluorouracil bolus',500,'mg/m2','D1, 8, 15, 22, 29, 36 (1 ชม. หลังเริ่ม LV)','IV push')],
  note:'ระวัง diarrhea รุนแรง'},
{ c:'crc', n:'sLV5FU2 (simplified de Gramont)', kw:'de gramont lv5fu2 5fu lv', s:'Adjuvant / Metastatic (ผู้ป่วยไม่เหมาะกับ oxaliplatin)', cy:'q14 วัน', ref:'Tournigand; NCCN', d:[
  d('Leucovorin (calcium folinate)',400,'mg/m2','D1','IV 2 ชม.',{note:'levoleucovorin 200 mg/m2'}), d('Fluorouracil bolus',400,'mg/m2','D1','IV push'),
  d('Fluorouracil infusion',2400,'mg/m2','D1–2 (CI 46 ชม.)','IV CI',{note:'ขนาดรวมตลอด 46 ชม.'})]},
{ c:'crc', n:'FOLFOX4', kw:'cccr14 ccrc14 folfox 4 de gramont oxaliplatin', s:'Adjuvant / Metastatic', cy:'q14 วัน × 12', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CCrC14); MOSAIC', d:[
  d('Oxaliplatin',85,'mg/m2','D1','IV 2 ชม.'), d('Leucovorin (calcium folinate)',200,'mg/m2','D1–2','IV 2 ชม.',{nDays:2}),
  d('Fluorouracil bolus',400,'mg/m2','D1–2','IV push',{nDays:2}), d('Fluorouracil infusion',600,'mg/m2','D1–2 (CI 22 ชม./วัน)','IV CI',{nDays:2})]},
{ c:'crc', n:'LV5FU2 (de Gramont classic)', kw:'de gramont lv5fu2', s:'Adjuvant / Metastatic', cy:'q14 วัน', ref:'de Gramont JCO 1997', d:[
  d('Leucovorin (calcium folinate)',200,'mg/m2','D1–2','IV 2 ชม.',{nDays:2}), d('Fluorouracil bolus',400,'mg/m2','D1–2','IV push',{nDays:2}),
  d('Fluorouracil infusion',600,'mg/m2','D1–2 (CI 22 ชม./วัน)','IV CI',{nDays:2})]},
{ c:'crc', n:'Tegafur-uracil (UFT) + Leucovorin', kw:'ccrc13 uft tegafur', s:'Adjuvant (Stage II ความเสี่ยงสูง)', cy:'D1–28 ทุก 35 วัน × 5', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CCrC13); NSABP C-06', d:[
  d('Tegafur-uracil (UFT)',300,'mg/m2','D1–28 (ขนาดต่อวัน แบ่ง 3 มื้อ)','PO',{roundTo:100,note:'ขนาดเป็น "ต่อวัน" (คิดตาม tegafur) แบ่งให้วันละ 3 มื้อ'}),
  d('Leucovorin (oral)',90,'mg','D1–28 (ต่อวัน แบ่ง 3 มื้อ)','PO',{note:'30 mg × 3 มื้อ'})]},
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
{ c:'gastric', n:'CF (Cisplatin + 5-FU)', kw:'csmc21 cesc51 cf pf', s:'Gastric/Esophagus metastatic; CRT', cy:'q28 วัน × 6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CSmC21/CEsC51)', d:[
  d('Cisplatin',80,'mg/m2','D1','IV',{note:'protocol ไทยกำหนด 75–100 mg/m2'}), d('Fluorouracil infusion',1000,'mg/m2','D1–4 (CI)','IV CI',{nDays:4,note:'protocol ไทยกำหนด 750–1,000 mg/m2/วัน'})]},
{ c:'gastric', n:'Carboplatin + 5-FU', kw:'csmc22 cesc52 cesc15', s:'Gastric/Esophagus (ไม่เหมาะกับ cisplatin)', cy:'q28 วัน × 6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CSmC22/CEsC52)', d:[
  d('Carboplatin',5,'AUC','D1','IV',{cap:750,note:'protocol ไทย: Max ≤750 mg'}), d('Fluorouracil infusion',1000,'mg/m2','D1–4 (CI)','IV CI',{nDays:4,note:'750–1,000 mg/m2/วัน'})]},
{ c:'gastric', n:'DCF (Docetaxel + Cisplatin + 5-FU)', kw:'dcf tcf v325', s:'Gastric metastatic', cy:'q21 วัน', ref:'V325 (Van Cutsem)', d:[
  d('Docetaxel',75,'mg/m2','D1','IV'), d('Cisplatin',75,'mg/m2','D1','IV'), d('Fluorouracil infusion',750,'mg/m2','D1–5 (CI)','IV CI',{nDays:5})], note:'Toxicity สูง ควรให้ G-CSF'},
{ c:'gastric', n:'Paclitaxel q3w (gastric/esophagus)', kw:'csmc32 cesc53', s:'2nd line', cy:'q21 วัน × 4–6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CSmC32/CEsC53)', d:[d('Paclitaxel',175,'mg/m2','D1','IV 3 ชม.')]},
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
{ c:'biliary', n:'GEMOX', kw:'gemox gemcitabine oxaliplatin', s:'Advanced', cy:'q14 วัน', ref:'André (GERCOR); NCCN', d:[
  d('Gemcitabine',1000,'mg/m2','D1','IV (10 mg/m2/min)'), d('Oxaliplatin',100,'mg/m2','D2','IV 2 ชม.')]},
{ c:'biliary', n:'5-FU/LV + RT (biliary postop CRT)', kw:'cholangio crt 5fu leucovorin', s:'Adjuvant CRT (margin+/node+)', cy:'C1–2 ระหว่างฉายแสง แล้ว 5-FU/LV q28 วัน', ref:'คู่มือแนวทางการรักษาโรคมะเร็งในผู้ใหญ่ สปสช. 2561 (บทมะเร็งตับและท่อน้ำดี Protocol 1)', d:[
  d('Fluorouracil bolus',400,'mg/m2','D1–4 และ D29–32 ของ RT','IV',{nDays:4}), d('Leucovorin (calcium folinate)',20,'mg/m2','D1–4 และ D29–32 ของ RT','IV',{nDays:4})],
  note:'หลังครบ RT ต่อด้วย 5-FU 375–425 + LV 20 mg/m2/วัน D1–5 q28 วัน (ดูสูตร Mayo)'},
{ c:'biliary', n:'Cisplatin + 5-FU (biliary)', kw:'cholangio cf', s:'Advanced/Metastatic', cy:'q28 วัน × 6', ref:'คู่มือแนวทางการรักษาโรคมะเร็งในผู้ใหญ่ สปสช. 2561 (Protocol 2)', d:[
  d('Cisplatin',75,'mg/m2','D1','IV',{note:'protocol 75–100 mg/m2'}), d('Fluorouracil infusion',1000,'mg/m2','D1–4 (CI)','IV CI',{nDays:4})], note:'แทน cisplatin ด้วย carboplatin AUC 5 (max 750 mg) ได้'},
{ c:'biliary', n:'Gemcitabine + Cisplatin 75 (q21, D1)', kw:'cholangio gemcis', s:'Advanced/Metastatic', cy:'q21 วัน × 6', ref:'คู่มือแนวทางการรักษาโรคมะเร็งในผู้ใหญ่ สปสช. 2561 (Protocol 2 ข้อ 4)', d:[
  d('Gemcitabine',1000,'mg/m2','D1, D8','IV',{note:'1,000–1,250 mg/m2'}), d('Cisplatin',75,'mg/m2','D1','IV')], note:'⚠ ต่างจาก ABC-02 (cisplatin 25 mg/m2 D1, D8) — ตรวจให้ตรงกับสูตรที่แพทย์ระบุ'},
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
{ c:'lung', n:'PE2 (Cisplatin 80 + Etoposide)', kw:'cluc13 pe2', s:'SCLC', cy:'q21 วัน × 4–6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CLuC13)', d:[d('Cisplatin',80,'mg/m2','D1','IV'), d('Etoposide',100,'mg/m2','D1–3','IV')]},
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
{ c:'hn', n:'Carboplatin q3w + RT (NPC)', kw:'cnac12a', s:'NPC CCRT (ไม่เหมาะกับ cisplatin)', cy:'q21 วัน × 3', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CNaC12a)', d:[d('Carboplatin',5,'AUC','D1','IV',{note:'protocol ไทย AUC 5–6'})]},
{ c:'hn', n:'Carboplatin weekly + RT', kw:'cnac14a ccxc14', s:'NPC/H&N/Cervix CCRT (ไม่เหมาะกับ cisplatin)', cy:'ทุกสัปดาห์ × 5–8', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CNaC14a/CCxC14)', d:[d('Carboplatin',2,'AUC','ทุกสัปดาห์','IV')]},
{ c:'hn', n:'PF: Carboplatin + 5-FU (NPC)', kw:'cnac12b cnac22b cnac34', s:'NPC adjuvant/neoadjuvant/metastatic', cy:'q28 วัน × 3–6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CNaC12b/22b/34)', d:[
  d('Carboplatin',5,'AUC','D1','IV'), d('Fluorouracil infusion',1000,'mg/m2','D1–4 (CI)','IV CI',{nDays:4})]},
{ c:'hn', n:'Carboplatin + Paclitaxel (NPC/H&N)', kw:'cnac35', s:'NPC metastatic/recurrent', cy:'q21 วัน × 6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CNaC35)', d:[d('Paclitaxel',175,'mg/m2','D1','IV 3 ชม.'), d('Carboplatin',5,'AUC','D1','IV')]},
{ c:'hn', n:'Cisplatin single agent (NPC metastatic)', kw:'cnac31', s:'NPC metastatic/recurrent', cy:'q21 วัน × 6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CNaC31)', d:[d('Cisplatin',80,'mg/m2','D1','IV')]},
{ c:'hn', n:'Paclitaxel single agent (NPC/H&N)', kw:'cnac36', s:'Metastatic/recurrent', cy:'q21 วัน', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CNaC36)', d:[d('Paclitaxel',175,'mg/m2','D1','IV 3 ชม.')]},
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
{ c:'cervix', n:'Cisplatin q3–4w + RT', kw:'ccxc12', s:'CCRT', cy:'q21–28 วัน × 3', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CCxC12)', d:[d('Cisplatin',75,'mg/m2','D1','IV',{note:'protocol ไทย 70–75 mg/m2'})]},
{ c:'cervix', n:'Cisplatin + 5-FU (cervix)', kw:'ccxc13 ccxc22 ccxc36 pf', s:'CCRT / Neoadjuvant / Metastatic', cy:'q21 วัน × 3–6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CCxC13/22/36); RTOG 90-01', d:[
  d('Cisplatin',75,'mg/m2','D1','IV'), d('Fluorouracil infusion',1000,'mg/m2','D1–4 (CI)','IV CI',{nDays:4})]},
{ c:'cervix', n:'Cisplatin single agent (cervix metastatic)', kw:'ccxc31 ccxc21', s:'Metastatic / Neoadjuvant', cy:'q21 วัน × 6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CCxC31)', d:[d('Cisplatin',75,'mg/m2','D1','IV')]},
{ c:'cervix', n:'Paclitaxel single agent (cervix)', kw:'ccxc37 ccxc45', s:'Metastatic', cy:'q21 วัน × 6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CCxC37/45)', d:[d('Paclitaxel',175,'mg/m2','D1','IV 3 ชม.')]},
{ c:'cervix', n:'Mitomycin C single agent', kw:'ccxc43', s:'2nd line', cy:'ทุก 6–8 สัปดาห์ × 4', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CCxC43)', d:[d('Mitomycin',10,'mg/m2','D1','IV',{note:'สะสมไม่ควรเกิน ~50 mg/m2 (เสี่ยง HUS/ไขกระดูกกดนาน)'})]},
{ c:'cervix', n:'5-FU single agent (cervix)', kw:'ccxc44', s:'2nd line', cy:'q28 วัน × 6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CCxC44)', d:[d('Fluorouracil infusion',1000,'mg/m2','D1–4 (CI)','IV CI',{nDays:4})]},
{ c:'cervix', n:'Pembrolizumab + CCRT', s:'Locally advanced (FIGO III–IVA)', cy:'200 mg q3w × 5 → 400 mg q6w × 15', ref:'KEYNOTE-A18', d:[
  d('Pembrolizumab (ระหว่าง CRT)',200,'mg','q21 วัน × 5','IV'), d('Cisplatin',40,'mg/m2','ทุกสัปดาห์ × 5–6','IV'), d('Pembrolizumab (maintenance)',400,'mg','q42 วัน × 15','IV')]},
{ c:'cervix', n:'Paclitaxel + Cis/Carbo ± Bevacizumab ± Pembrolizumab', s:'Persistent/Recurrent/Metastatic', cy:'q21 วัน', ref:'GOG 240; KEYNOTE-826', d:[
  d('Paclitaxel',175,'mg/m2','D1','IV 3 ชม.'), d('Cisplatin',50,'mg/m2','D1','IV',{note:'หรือ carboplatin AUC 5'}), d('Bevacizumab',15,'mg/kg','D1','IV',{note:'ถ้าให้ร่วม'}), d('Pembrolizumab',200,'mg','D1','IV',{note:'PD-L1 CPS ≥1'})]},
{ c:'cervix', n:'Etoposide + Carboplatin (neuroendocrine)', kw:'small cell neuroendocrine cervix ep', s:'Neuroendocrine/small cell cervix', cy:'q21 วัน', ref:'TGCS standing order (สมาคมมะเร็งนรีเวชไทย 2568)', d:[
  d('Etoposide',100,'mg/m2','D1–3','IV 4 ชม.'), d('Carboplatin',5,'AUC','D1','IV',{note:'AUC 5–6'})]},
{ c:'cervix', n:'Etoposide + Cisplatin (neuroendocrine)', kw:'small cell neuroendocrine cervix ep', s:'Neuroendocrine/small cell cervix', cy:'q21 วัน', ref:'TGCS standing order (สมาคมมะเร็งนรีเวชไทย 2568)', d:[
  d('Etoposide',100,'mg/m2','D1–3','IV 4 ชม.'), d('Cisplatin',75,'mg/m2','D1','IV',{note:'TGCS 60–80 mg/m2'})]},
{ c:'cervix', n:'Gemcitabine + Cisplatin (cervix)', kw:'gemcis', s:'Metastatic/Recurrent', cy:'q21 วัน', ref:'TGCS standing order (สมาคมมะเร็งนรีเวชไทย 2568)', d:[
  d('Gemcitabine',1000,'mg/m2','D1, D8','IV 30 นาที'), d('Cisplatin',50,'mg/m2','D1','IV')], note:'ยืนยันวันให้ gemcitabine กับ protocol สถาบัน'},
{ c:'cervix', n:'Topotecan + Cisplatin', kw:'gog 179', s:'Metastatic/Recurrent', cy:'q21 วัน', ref:'TGCS standing order (สมาคมมะเร็งนรีเวชไทย 2568); GOG 179', d:[
  d('Topotecan',0.75,'mg/m2','D1–3','IV 30–60 นาที',{nDays:3}), d('Cisplatin',50,'mg/m2','D1','IV')]},
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
{ c:'ovary', n:'Carboplatin + Cyclophosphamide', kw:'covc11', s:'1st line (ไม่สามารถให้ paclitaxel)', cy:'q21–28 วัน × 3–6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (COvC11)', d:[d('Carboplatin',5,'AUC','D1','IV',{note:'AUC 5–6'}), d('Cyclophosphamide',600,'mg/m2','D1','IV')]},
{ c:'ovary', n:'Cisplatin + Paclitaxel (ovary)', kw:'covc14 gog 111', s:'1st line (ไม่สามารถให้ carboplatin)', cy:'q21 วัน × 6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (COvC14); GOG 111', d:[d('Paclitaxel',175,'mg/m2','D1','IV 3 ชม.'), d('Cisplatin',75,'mg/m2','D1','IV',{note:'protocol ไทย 75–100 mg/m2'})]},
{ c:'ovary', n:'Carboplatin single agent (ovary)', kw:'covc15 covc21', s:'ผู้สูงอายุ/ECOG ไม่ดี; 2nd line', cy:'q28 วัน × 6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (COvC15/COvC21); ICON3', d:[d('Carboplatin',5,'AUC','D1','IV',{note:'AUC 5–6'})]},
{ c:'ovary', n:'Gemcitabine single agent (ovary)', kw:'covc23', s:'2nd line', cy:'q21 วัน (D1,8) หรือ q28 (D1,8,15)', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (COvC23A/B)', d:[d('Gemcitabine',1000,'mg/m2','D1, D8','IV',{note:'protocol ไทย 800–1,250 mg/m2'})]},
{ c:'ovary', n:'Oral Etoposide', kw:'covc24', s:'2nd line', cy:'q28 วัน × 6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (COvC24)', d:[d('Etoposide (oral)',50,'mg/m2','D1–21','PO OD',{roundTo:50,note:'ขนาดต่อวัน'})]},
{ c:'ovary', n:'Cisplatin + Gemcitabine (ovary)', kw:'covc27', s:'2nd line', cy:'q21 วัน × 6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (COvC27)', d:[d('Gemcitabine',1000,'mg/m2','D1, D8','IV',{note:'800–1,250 mg/m2'}), d('Cisplatin',75,'mg/m2','D1','IV',{note:'75–100 mg/m2 หรือใช้ carboplatin แทน'})]},
{ c:'ovary', n:'Docetaxel + Carboplatin', kw:'scotroc', s:'1st line (แพ้/neuropathy จาก paclitaxel)', cy:'q21 วัน × 6', ref:'TGCS standing order (สมาคมมะเร็งนรีเวชไทย 2568); SCOTROC', d:[d('Docetaxel',75,'mg/m2','D1','IV 1 ชม.'), d('Carboplatin',5,'AUC','D1','IV')]},
{ c:'ovary', n:'Gemcitabine + Carboplatin + Bevacizumab', kw:'oceans', s:'Platinum-sensitive recurrent', cy:'q21 วัน', ref:'TGCS standing order (สมาคมมะเร็งนรีเวชไทย 2568); OCEANS', d:[
  d('Gemcitabine',1000,'mg/m2','D1, D8','IV'), d('Carboplatin',4,'AUC','D1','IV'), d('Bevacizumab',15,'mg/kg','D1','IV')]},
{ c:'ovary', n:'Paclitaxel weekly + Bevacizumab', kw:'aurelia', s:'Platinum-resistant', cy:'q28 วัน', ref:'TGCS standing order (สมาคมมะเร็งนรีเวชไทย 2568); AURELIA', d:[
  d('Paclitaxel',80,'mg/m2','D1, D8, D15, D22','IV 1 ชม.'), d('Bevacizumab',10,'mg/kg','D1, D15','IV',{note:'หรือ 15 mg/kg q21 วัน'})]},
{ c:'ovary', n:'PLD + Bevacizumab', kw:'aurelia liposomal', s:'Platinum-resistant', cy:'q28 วัน', ref:'TGCS standing order (สมาคมมะเร็งนรีเวชไทย 2568); AURELIA', d:[
  d('Pegylated liposomal doxorubicin',40,'mg/m2','D1','IV 1–2 ชม.'), d('Bevacizumab',10,'mg/kg','D1, D15','IV',{note:'หรือ 15 mg/kg q21 วัน'})]},
{ c:'ovary', n:'PLD + Carboplatin + Bevacizumab', kw:'liposomal', s:'Platinum-sensitive recurrent', cy:'q28 วัน', ref:'TGCS standing order (สมาคมมะเร็งนรีเวชไทย 2568); AGO-OVAR 2.21', d:[
  d('Pegylated liposomal doxorubicin',30,'mg/m2','D1','IV'), d('Carboplatin',5,'AUC','D1','IV'), d('Bevacizumab',10,'mg/kg','D1, D15','IV',{note:'หรือ 15 mg/kg q21 วัน'})]},
{ c:'ovary', n:'Topotecan weekly', kw:'topotecan', s:'Platinum-resistant', cy:'q28 วัน (D1, 8, 15)', ref:'TGCS standing order (สมาคมมะเร็งนรีเวชไทย 2568)', d:[d('Topotecan',4,'mg/m2','D1, D8, D15','IV 30–60 นาที')]},
{ c:'ovary', n:'Topotecan 5-day', kw:'topotecan', s:'Platinum-resistant', cy:'q21 วัน', ref:'TGCS standing order (สมาคมมะเร็งนรีเวชไทย 2568)', d:[d('Topotecan',1.25,'mg/m2','D1–5','IV 30 นาที',{nDays:5,note:'TGCS 1.25 หรือ 1.5 mg/m2'})]},
{ c:'ovary', n:'Topotecan + Bevacizumab', kw:'topotecan aurelia', s:'Platinum-resistant', cy:'q21 วัน', ref:'TGCS standing order (สมาคมมะเร็งนรีเวชไทย 2568)', d:[
  d('Topotecan',1.25,'mg/m2','D1–5','IV',{nDays:5,note:'1.25 หรือ 1.5 mg/m2'}), d('Bevacizumab',15,'mg/kg','D1','IV',{note:'TGCS 10 หรือ 15 mg/kg'})]},
{ c:'ovary', n:'Olaparib maintenance', s:'BRCA/HRD maintenance', cy:'ทุกวัน', ref:'SOLO-1; PAOLA-1', d:[d('Olaparib (tablet)',300,'mg','ทุกวัน','PO BID')]},
{ c:'ovary', n:'Niraparib maintenance', s:'Maintenance', cy:'ทุกวัน', ref:'PRIMA (individualized)', d:[
  d('Niraparib',0,'tier','ทุกวัน','PO OD',{tiers:[{lt:77,dose:200},{dose:300}],tierText:'<77 kg หรือ plt <150,000 = 200 mg; ≥77 kg และ plt ≥150,000 = 300 mg'})]},

// ---------------- ENDOMETRIUM ----------------
{ c:'endomet', n:'Carboplatin + Paclitaxel (endometrium)', s:'Advanced/Recurrent', cy:'q21 วัน × 6', ref:'GOG 209', d:[d('Paclitaxel',175,'mg/m2','D1','IV'), d('Carboplatin',5,'AUC','D1','IV')]},
{ c:'endomet', n:'Carboplatin + Paclitaxel + Dostarlimab', s:'Advanced/Recurrent', cy:'q21 วัน × 6 → 1000 mg q6w', ref:'RUBY', d:[
  d('Dostarlimab',500,'mg','D1 q21 × 6','IV'), d('Paclitaxel',175,'mg/m2','D1','IV'), d('Carboplatin',5,'AUC','D1','IV'), d('Dostarlimab (maintenance)',1000,'mg','q42 วัน','IV')]},
{ c:'endomet', n:'Carboplatin + Paclitaxel + Pembrolizumab', s:'Advanced/Recurrent', cy:'q21 วัน × 6 → 400 mg q6w', ref:'NRG-GY018', d:[
  d('Pembrolizumab',200,'mg','D1 q21 × 6','IV'), d('Paclitaxel',175,'mg/m2','D1','IV'), d('Carboplatin',5,'AUC','D1','IV'), d('Pembrolizumab (maintenance)',400,'mg','q42 วัน','IV')]},
{ c:'endomet', n:'AP (Cisplatin + Doxorubicin)', kw:'curc12 gog 122', s:'Advanced/Recurrent', cy:'q21 วัน × 6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CUrC12); GOG 107/122', d:[d('Doxorubicin',60,'mg/m2','D1','IV'), d('Cisplatin',50,'mg/m2','D1','IV')]},
{ c:'endomet', n:'Doxorubicin single agent (uterine)', kw:'curc15 curc32', s:'Endometrium / Uterine sarcoma', cy:'q21 วัน × 6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CUrC15/CUrC32)', d:[d('Doxorubicin',60,'mg/m2','D1','IV')]},
{ c:'endomet', n:'Megestrol acetate (endometrium)', kw:'curc16 curc41', s:'Hormone therapy', cy:'ทุกวัน', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CUrC16)', d:[d('Megestrol acetate',160,'mg','ทุกวัน','PO OD')]},
{ c:'endomet', n:'Cisplatin + Ifosfamide (carcinosarcoma)', kw:'curc21 gog 108 mmmt', s:'Carcinosarcoma', cy:'q21 วัน × 6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CUrC21); GOG 108', d:[
  d('Cisplatin',20,'mg/m2','D1–5','IV',{nDays:5}), d('Ifosfamide',1500,'mg/m2','D1–4','IV',{nDays:4}), d('Mesna',1000,'mg/m2','D1–4','IV',{nDays:4})]},
{ c:'endomet', n:'Doxorubicin + Ifosfamide (uterine sarcoma)', kw:'curc31', s:'Uterine sarcoma', cy:'q21 วัน × 6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CUrC31)', d:[
  d('Doxorubicin',50,'mg/m2','D1','IV'), d('Ifosfamide',1200,'mg/m2','D1–5','IV',{nDays:5}), d('Mesna',800,'mg/m2','D1–5','IV',{nDays:5})]},
{ c:'endomet', n:'Ifosfamide single agent (TGCS)', kw:'ifosfamide carcinosarcoma', s:'Carcinosarcoma/Recurrent', cy:'q21 วัน', ref:'TGCS standing order (สมาคมมะเร็งนรีเวชไทย 2568)', d:[
  d('Ifosfamide',2000,'mg/m2','D1–3','IV 4 ชม.',{nDays:3}), d('Mesna',400,'mg/m2','D1–3 ที่ 0, 4, 8 ชม. (20% ของ ifosfamide ต่อครั้ง)','IV',{note:'ขนาดต่อครั้ง × 3 ครั้ง/วัน × 3 วัน'})]},
{ c:'endomet', n:'Cisplatin + Ifosfamide (TGCS)', kw:'carcinosarcoma ifosfamide cisplatin', s:'Carcinosarcoma', cy:'q21 วัน', ref:'TGCS standing order (สมาคมมะเร็งนรีเวชไทย 2568)', d:[
  d('Cisplatin',20,'mg/m2','D1–4','IV',{nDays:4}), d('Ifosfamide',1500,'mg/m2','D1–4','IV 4 ชม.',{nDays:4}), d('Mesna',300,'mg/m2','D1–4 ที่ 0, 4, 8 ชม. (20% ของ ifosfamide ต่อครั้ง)','IV',{note:'ขนาดต่อครั้ง × 3 ครั้ง/วัน × 4 วัน'})],
  note:'protocol สปสช. ใช้ cisplatin D1–5 — ตรวจให้ตรงกับฉบับที่ใช้'},
{ c:'endomet', n:'Paclitaxel + Ifosfamide', kw:'gog 161 carcinosarcoma', s:'Carcinosarcoma', cy:'q21 วัน', ref:'TGCS standing order (สมาคมมะเร็งนรีเวชไทย 2568); GOG 161', d:[
  d('Paclitaxel',135,'mg/m2','D1','IV 3 ชม.'), d('Ifosfamide',1600,'mg/m2','D1–3','IV 4 ชม.',{nDays:3}), d('Mesna',320,'mg/m2','D1–3 ที่ 0, 4, 8 ชม. (20% ของ ifosfamide ต่อครั้ง)','IV',{note:'ขนาดต่อครั้ง × 3 ครั้ง/วัน × 3 วัน'})], note:'ควรให้ G-CSF'},
{ c:'endomet', n:'Paclitaxel weekly (endometrium)', kw:'paclitaxel', s:'Recurrent', cy:'ทุกสัปดาห์', ref:'TGCS standing order (สมาคมมะเร็งนรีเวชไทย 2568)', d:[d('Paclitaxel',80,'mg/m2','ทุกสัปดาห์','IV 1 ชม.')]},
{ c:'endomet', n:'Lenvatinib + Pembrolizumab', s:'Recurrent (pMMR)', cy:'q21 วัน', ref:'KEYNOTE-775', d:[d('Lenvatinib',20,'mg','ทุกวัน','PO OD'), d('Pembrolizumab',200,'mg','D1','IV')]},

// ---------------- BLADDER ----------------
{ c:'bladder', n:'Gemcitabine + Cisplatin (bladder)', s:'Neoadjuvant / Metastatic', cy:'q21 วัน × 4–6', ref:'NCCN (q21 variant)', d:[
  d('Gemcitabine',1000,'mg/m2','D1, D8','IV'), d('Cisplatin',70,'mg/m2','D1','IV')], note:'แบบ q28: gem D1,8,15 + cis 70 D2 (von der Maase)'},
{ c:'bladder', n:'dd MVAC', s:'Neoadjuvant / Metastatic', cy:'q14 วัน + G-CSF', ref:'EORTC 30924; VESPER', d:[
  d('Methotrexate',30,'mg/m2','D1','IV'), d('Vinblastine',3,'mg/m2','D2','IV'), d('Doxorubicin',30,'mg/m2','D2','IV'), d('Cisplatin',70,'mg/m2','D2','IV')]},
{ c:'bladder', n:'Gemcitabine + Carboplatin (cis-ineligible)', s:'Metastatic', cy:'q21 วัน', ref:'EORTC 30986', d:[d('Gemcitabine',1000,'mg/m2','D1, D8','IV'), d('Carboplatin',4.5,'AUC','D1','IV')]},
{ c:'bladder', n:'CMV', kw:'cmv methotrexate vinblastine cisplatin', s:'Adjuvant / Metastatic', cy:'q21 วัน × 4–6', ref:'คู่มือแนวทางการรักษาโรคมะเร็งในผู้ใหญ่ สปสช. 2561 (บทกระเพาะปัสสาวะ); Harker', d:[
  d('Methotrexate',30,'mg/m2','D1, D8','IV'), d('Vinblastine',4,'mg/m2','D1, D8','IV'), d('Cisplatin',100,'mg/m2','D2','IV',{note:'protocol 70–100 mg/m2'})], note:'ไตบกพร่อง (CrCl <60) หรืออายุ >70: ใช้ carboplatin AUC 5 (max 750 mg) แทน cisplatin'},
{ c:'bladder', n:'Gemcitabine + Carboplatin (protocol สปสช.)', kw:'gc carbo', s:'Adjuvant / Metastatic (แทน cisplatin)', cy:'q21 วัน × 4–6', ref:'คู่มือแนวทางการรักษาโรคมะเร็งในผู้ใหญ่ สปสช. 2561', d:[
  d('Gemcitabine',1000,'mg/m2','D1, D8','IV'), d('Carboplatin',5,'AUC','D1','IV',{cap:750,note:'Maximum ≤750 mg'})]},
{ c:'bladder', n:'Enfortumab vedotin + Pembrolizumab', s:'Metastatic 1st line', cy:'q21 วัน', ref:'EV-302', d:[
  d('Enfortumab vedotin',1.25,'mg/kg','D1, D8','IV',{cap:125,note:'สูงสุด 125 mg (น้ำหนัก ≥100 kg)'}), d('Pembrolizumab',200,'mg','D1','IV')]},
{ c:'bladder', n:'Avelumab maintenance', s:'Maintenance หลัง platinum', cy:'q14 วัน', ref:'JAVELIN Bladder 100', d:[d('Avelumab',800,'mg','D1','IV')]},

// ---------------- PROSTATE ----------------
{ c:'prostate', n:'Docetaxel + Prednisolone', s:'mCRPC / mHSPC', cy:'q21 วัน (mHSPC × 6)', ref:'TAX 327; CHAARTED', d:[
  d('Docetaxel',75,'mg/m2','D1','IV'), d('Prednisolone',5,'mg','ทุกวัน','PO BID',{note:'mHSPC (CHAARTED) อาจไม่ให้ prednisolone'})]},
{ c:'prostate', n:'Cabazitaxel', s:'mCRPC หลัง docetaxel', cy:'q21 วัน', ref:'TROPIC; PROSELICA (20 mg/m2)', d:[d('Cabazitaxel',25,'mg/m2','D1','IV'), d('Prednisolone',5,'mg','ทุกวัน','PO BID')], note:'PROSELICA: 20 mg/m2 non-inferior'},
{ c:'prostate', n:'Abiraterone + Prednisolone', s:'mCRPC / mHSPC', cy:'ทุกวัน', ref:'COU-AA; LATITUDE', d:[d('Abiraterone acetate',1000,'mg','ทุกวัน (ท้องว่าง)','PO OD'), d('Prednisolone',5,'mg','ทุกวัน','PO BID (mHSPC: OD)')]},
{ c:'prostate', n:'ADT (LHRH agonist)', kw:'cpsc01 cpsc02 leuprorelin goserelin triptorelin enantone zoladex', s:'ทุกระยะ', cy:'ทุก 3 เดือน', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CPsC01/02); label', d:[
  d('Leuprorelin',11.25,'mg','ทุก 90 วัน','SC/IM'), d('Goserelin',10.8,'mg','ทุก 90 วัน','SC implant'), d('Triptorelin',11.25,'mg','ทุก 90 วัน','IM')], note:'ใช้ตัวใดตัวหนึ่ง; รูปแบบรายเดือน: leuprorelin 3.75, goserelin 3.6, triptorelin 3.75 mg'},
{ c:'prostate', n:'First-gen antiandrogens', kw:'cpsc21 flutamide bicalutamide', s:'Combined androgen blockade', cy:'ทุกวัน', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CPsC21); label', d:[d('Flutamide',250,'mg','ทุกวัน','PO TID'), d('Bicalutamide',50,'mg','ทุกวัน','PO OD')], note:'ใช้ตัวใดตัวหนึ่ง'},
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
{ c:'lymphoma', n:'CVP', kw:'clpc11', s:'Indolent NHL', cy:'q21 วัน × 8', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CLpC11)', d:[
  d('Cyclophosphamide',750,'mg/m2','D1','IV'), d('Vincristine',1.4,'mg/m2','D1','IV push',{cap:2}), d('Prednisolone',100,'mg','D1–5','PO OD')], note:'เพิ่ม Rituximab 375 mg/m2 D1 = R-CVP'},
{ c:'lymphoma', n:'FC (Fludarabine + Cyclophosphamide)', kw:'clpc13 fcr', s:'CLL / Indolent', cy:'q28 วัน × 6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CLpC13); CLL8', d:[
  d('Fludarabine',25,'mg/m2','D1–3','IV',{nDays:3}), d('Cyclophosphamide',250,'mg/m2','D1–3','IV',{nDays:3})], note:'เพิ่ม Rituximab 375 (C1) / 500 mg/m2 (C2–6) = FCR; PJP/HSV prophylaxis'},
{ c:'lymphoma', n:'ESHAP', kw:'clpc14', s:'Relapsed lymphoma (salvage)', cy:'q21 วัน', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CLpC14); Velasquez', d:[
  d('Etoposide',40,'mg/m2','D1–4','IV',{nDays:4}), d('Methylprednisolone',500,'mg','D1–5','IV',{nDays:5}), d('Cisplatin',25,'mg/m2','D1–4 (CI)','IV CI',{nDays:4}), d('Cytarabine (high-dose)',2000,'mg/m2','D5','IV 2 ชม.')]},
{ c:'lymphoma', n:'DHAP', kw:'clpc15 r-dhap', s:'Relapsed lymphoma (salvage)', cy:'q21 วัน', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CLpC15); Velasquez 1988', d:[
  d('Dexamethasone',40,'mg','D1–4','IV/PO'), d('Cisplatin',100,'mg/m2','D1 (CI 24 ชม.)','IV CI'), d('Cytarabine (high-dose)',2000,'mg/m2','D2 q12 ชม. × 2 ครั้ง','IV 3 ชม.')], note:'เพิ่ม Rituximab = R-DHAP'},
{ c:'lymphoma', n:'EPOCH (dose level 1, ไม่มี R)', kw:'clpc16', s:'Aggressive lymphoma', cy:'q21 วัน', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CLpC16)', d:[
  d('Etoposide',50,'mg/m2','D1–4 (CI 96 ชม.)','IV CI',{nDays:4}), d('Doxorubicin',10,'mg/m2','D1–4 (CI 96 ชม.)','IV CI',{nDays:4}), d('Vincristine',0.4,'mg/m2','D1–4 (CI 96 ชม.)','IV CI',{nDays:4}),
  d('Cyclophosphamide',750,'mg/m2','D5','IV'), d('Prednisolone',60,'mg/m2','D1–5','PO BID')]},
{ c:'lymphoma', n:'ICE (ไม่มี R)', kw:'clpc17', s:'Relapsed lymphoma (salvage)', cy:'q21 วัน', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CLpC17)', d:[
  d('Etoposide',100,'mg/m2','D1–3','IV'), d('Carboplatin',5,'AUC','D2','IV',{cap:800}), d('Ifosfamide',5000,'mg/m2','D2 (CI 24 ชม.)','IV CI'), d('Mesna',5000,'mg/m2','D2 (CI 24 ชม.)','IV CI')]},
{ c:'lymphoma', n:'GDP (ไม่มี R)', kw:'clpc18', s:'Relapsed lymphoma (salvage)', cy:'q21 วัน', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CLpC18); LY.12', d:[
  d('Gemcitabine',1000,'mg/m2','D1, D8','IV'), d('Dexamethasone',40,'mg','D1–4','PO'), d('Cisplatin',75,'mg/m2','D1','IV')], note:'คู่มือ สปสช. Hemato: dexamethasone 10 mg q6h D1–4 (=40 mg/วัน), cisplatin 75 mg/m2 (แบบฟอร์ม NCI บางฉบับระบุ 45 mg/m2 — ยืนยันกับแพทย์)'},
{ c:'lymphoma', n:'GemOx ± Rituximab', kw:'gemox r-gemox', s:'Relapsed DLBCL (ไม่เหมาะกับ transplant)', cy:'q14 วัน', ref:'Mounier', d:[
  d('Rituximab',375,'mg/m2','D1','IV',{note:'ถ้าให้ร่วม'}), d('Gemcitabine',1000,'mg/m2','D2','IV'), d('Oxaliplatin',100,'mg/m2','D2','IV')]},
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
{ c:'myeloma', n:'CyD (transplant-candidate)', kw:'cmmc11', s:'Induction', cy:'q21 วัน × 4–6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CMmC11)', d:[
  d('Cyclophosphamide (oral)',500,'mg/m2','D1, D8, D15','PO',{roundTo:50}), d('Dexamethasone',40,'mg','D1–4, D9–12','PO')]},
{ c:'myeloma', n:'CyD (non-transplant)', kw:'cmmc21', s:'Induction', cy:'q28 วัน × 8–12', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CMmC21)', d:[
  d('Cyclophosphamide (oral)',300,'mg/m2','D1, D8, D15, D22','PO',{roundTo:50}), d('Dexamethasone',40,'mg','D1, D8, D15, D22','PO')]},
{ c:'myeloma', n:'MP (Melphalan + Prednisolone)', kw:'cmmc22', s:'Non-transplant', cy:'q42 วัน × 8–12', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (CMmC22)', d:[
  d('Melphalan',9,'mg/m2','D1–4','PO (ท้องว่าง)',{nDays:4,roundTo:2}), d('Prednisolone',60,'mg','D1–4','PO',{note:'บางแนวทางใช้ 60 mg/m2'})]},
{ c:'myeloma', n:'VMP', kw:'vista bortezomib melphalan', s:'Non-transplant', cy:'q42 วัน × 9', ref:'VISTA', d:[
  d('Bortezomib',1.3,'mg/m2','C1–4: D1,4,8,11,22,25,29,32; C5–9: D1,8,22,29','SC'), d('Melphalan',9,'mg/m2','D1–4','PO',{nDays:4,roundTo:2}), d('Prednisolone',60,'mg/m2','D1–4','PO',{nDays:4})]},
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
  d('Tretinoin (ATRA)',45,'mg/m2','ทุกวัน (แบ่ง 2 มื้อ)','PO',{roundTo:10,note:'ขนาดต่อวัน แบ่ง BID (แคปซูล 10 mg)'}), d('Arsenic trioxide',0.15,'mg/kg','ทุกวัน','IV')], note:'ติดตาม QTc, K, Mg; เฝ้าระวัง differentiation syndrome'},
{ c:'leukemia', n:'CML TKIs', s:'CML chronic phase', cy:'ทุกวัน', ref:'Label', d:[d('Imatinib',400,'mg','ทุกวัน','PO OD'), d('Nilotinib',300,'mg','ทุกวัน','PO BID'), d('Dasatinib',100,'mg','ทุกวัน','PO OD')], note:'ใช้ตัวใดตัวหนึ่ง'},

// ---------------- GTN ----------------
{ c:'gtn', n:'MTX-FA 8-day', kw:'methotrexate folinic gtn low risk', s:'Low-risk GTN', cy:'q14 วัน (จนกว่า hCG ปกติ + 2–3 รอบ)', ref:'FIGO/ESMO GTN; Charing Cross', d:[
  d('Methotrexate',1,'mg/kg','D1, D3, D5, D7','IM',{note:'หรือ 50 mg flat'}), d('Leucovorin (calcium folinate)',0.1,'mg/kg','D2, D4, D6, D8 (30 ชม. หลัง MTX)','IM/PO',{note:'หรือ 15 mg PO flat'})]},
{ c:'gtn', n:'Methotrexate weekly', kw:'mtx weekly gtn', s:'Low-risk GTN', cy:'ทุกสัปดาห์', ref:'GOG 174', d:[d('Methotrexate',50,'mg/m2','ทุกสัปดาห์','IM')]},
{ c:'gtn', n:'Actinomycin D pulse', kw:'dactinomycin pulse gtn', s:'Low-risk GTN', cy:'q14 วัน', ref:'GOG 174', d:[d('Actinomycin D (dactinomycin)',1.25,'mg/m2','D1','IV push',{cap:2,note:'สูงสุด 2 mg'})], note:'Vesicant รุนแรง'},
{ c:'gtn', n:'EMA-CO', kw:'ema co gtn high risk', s:'High-risk GTN', cy:'q14 วัน (EMA D1–2, CO D8)', ref:'Bower; FIGO', d:[
  d('Etoposide',100,'mg/m2','D1, D2','IV'), d('Methotrexate (push)',100,'mg/m2','D1','IV push'), d('Methotrexate (infusion)',200,'mg/m2','D1 (12 ชม.)','IV'),
  d('Actinomycin D (dactinomycin)',0.5,'mg','D1, D2','IV push',{note:'ขนาดคงที่ 0.5 mg'}), d('Leucovorin (calcium folinate)',15,'mg','q12 ชม. × 4 ครั้ง เริ่ม 24 ชม. หลัง MTX','PO/IM'),
  d('Cyclophosphamide',600,'mg/m2','D8','IV'), d('Vincristine',1,'mg/m2','D8','IV push',{cap:2})]},

{ c:'gtn', n:'Actinomycin D 5-day', kw:'dactinomycin gtn', s:'Low-risk GTN', cy:'q14 วัน', ref:'TGCS standing order (สมาคมมะเร็งนรีเวชไทย 2568)', d:[d('Actinomycin D (dactinomycin)',0.5,'mg','D1–5','IV 30 นาที',{nDays:5,note:'ขนาดคงที่ 0.5 mg/วัน'})]},
{ c:'gtn', n:'EMA-EP', kw:'ema ep gtn high risk', s:'High-risk/resistant GTN', cy:'q14 วัน (EMA D1, EP D8)', ref:'TGCS standing order (สมาคมมะเร็งนรีเวชไทย 2568)', d:[
  d('Etoposide (EMA, D1)',100,'mg/m2','D1','IV'), d('Methotrexate (push)',100,'mg/m2','D1','IV push'), d('Methotrexate (infusion)',200,'mg/m2','D1 (12 ชม.)','IV'),
  d('Actinomycin D (dactinomycin)',0.5,'mg','D1','IV push'), d('Leucovorin (calcium folinate)',15,'mg','q12 ชม. × 4 ครั้ง (เริ่ม 24 ชม. หลัง MTX)','PO'),
  d('Etoposide (EP, D8)',100,'mg/m2','D8','IV 4 ชม.'), d('Cisplatin',75,'mg/m2','D8','IV 3 ชม.')]},
{ c:'gtn', n:'Low-dose Etoposide + Cisplatin (induction)', kw:'ep low dose gtn induction', s:'High tumor burden GTN (ก่อน EMA-CO)', cy:'ทุกสัปดาห์ × 1–3', ref:'TGCS standing order (สมาคมมะเร็งนรีเวชไทย 2568)', d:[
  d('Etoposide',100,'mg/m2','D1–2','IV 4 ชม.',{nDays:2}), d('Cisplatin',20,'mg/m2','D1–2','IV 3 ชม.',{nDays:2})]},

// ---------------- BONE ----------------
{ c:'bone', n:'AP (Doxorubicin + Cisplatin)', kw:'cosc11 cosc21 osteosarcoma', s:'Osteosarcoma neoadjuvant/adjuvant', cy:'q21 วัน (รวมไม่เกิน 6 รอบ)', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (COsC11/21); EOI', d:[
  d('Doxorubicin',75,'mg/m2','D1 (หรือแบ่ง D1–3)','IV',{note:'protocol ไทย 60–75 mg/m2'}), d('Cisplatin',100,'mg/m2','D1','IV',{note:'protocol ไทย 75–100 mg/m2'})], note:'MAP (high-dose MTX) ทำเฉพาะสถาบันที่ตรวจระดับ MTX ได้'},
{ c:'bone', n:'IE (Ifosfamide + Etoposide)', kw:'cosc22 osteosarcoma ewing', s:'Osteosarcoma (necrosis <90%) / Ewing', cy:'q21 วัน × 6', ref:'สปสช./สถาบันมะเร็งแห่งชาติ protocol (COsC22)', d:[
  d('Etoposide',100,'mg/m2','D1–5','IV',{nDays:5,note:'80–100 mg/m2/วัน'}), d('Ifosfamide',1500,'mg/m2','D1–5','IV',{nDays:5,note:'1.2–1.5 g/m2/วัน'}), d('Mesna',1500,'mg/m2','D1–5 (ตาม protocol)','IV',{nDays:5})]},

// ---------------- LEUKEMIA (สปสช. Hemato) ----------------
{ c:'leukemia', n:'Hyper-CVAD course A (1,3,5,7)', kw:'all hypercvad hyper-cvad', s:'Adult ALL', cy:'สลับกับ course B ทุก 21–28 วัน (รวม 8 courses)', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช. (บท ALL); Kantarjian', d:[
  d('Cyclophosphamide',300,'mg/m2','q12 ชม. D1–3 (6 ครั้ง)','IV 3 ชม.',{note:'ขนาดต่อครั้ง'}), d('Mesna',600,'mg/m2','D1–3 (CI 24 ชม./วัน)','IV CI',{nDays:3}),
  d('Vincristine',2,'mg','D4, D11','IV push',{note:'ขนาดคงที่ 2 mg'}), d('Doxorubicin',50,'mg/m2','D4','IV'), d('Dexamethasone',40,'mg','D1–4, D11–14','PO/IV'),
  d('Methotrexate (IT)',12,'mg','D2','Intrathecal'), d('Cytarabine (IT)',100,'mg','D6','Intrathecal')], note:'G-CSF support; ⚠ vincristine ห้ามให้ทางไขสันหลัง'},
{ c:'leukemia', n:'Hyper-CVAD course B (2,4,6,8): HD-MTX + Ara-C', kw:'all hypercvad high dose methotrexate cytarabine', s:'Adult ALL', cy:'สลับกับ course A', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช. (บท ALL)', d:[
  d('Methotrexate (loading)',200,'mg/m2','D1 (2 ชม.)','IV'), d('Methotrexate (infusion)',800,'mg/m2','D1 (22 ชม.)','IV'),
  d('Leucovorin (calcium folinate)',50,'mg','เริ่มหลัง MTX แล้ว 15 mg q6 ชม. × 16 ครั้ง','IV',{note:'ปรับตามระดับ MTX'}), d('Cytarabine (high-dose)',3000,'mg/m2','q12 ชม. D2–3 (4 ครั้ง)','IV 2 ชม.',{note:'อายุ >60: 1,000 mg/m2'}),
  d('Methylprednisolone',50,'mg','BID D1–3','IV'), d('Methotrexate (IT)',12,'mg','D2','Intrathecal'), d('Cytarabine (IT)',100,'mg','D6','Intrathecal')], note:'ต้องตรวจระดับ MTX, alkalinize ปัสสาวะ, หลีกเลี่ยง PPI/NSAIDs/TMP-SMX'},
{ c:'leukemia', n:'ALL maintenance (POMP)', kw:'all maintenance 6mp mercaptopurine', s:'Adult ALL', cy:'ทุก 4 สัปดาห์ × 2 ปี', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.', d:[
  d('Vincristine',1.4,'mg/m2','D1 ทุก 4 สัปดาห์','IV',{cap:2}), d('Prednisolone',40,'mg/m2','D1–5 ทุก 4 สัปดาห์','PO',{nDays:5,note:'⚠ ต้นฉบับคู่มือ สปสช. พิมพ์ prednisolone เป็น mg/kg/d — ขนาดที่ถูกต้องคือ mg/m2/d'}),
  d('Mercaptopurine (6-MP)',50,'mg/m2','ทุกวัน','PO OD',{roundTo:25}), d('Methotrexate (oral)',20,'mg/m2','ทุกสัปดาห์','PO',{roundTo:2.5})]},
{ c:'leukemia', n:'GMALL induction phase I', kw:'all gmall', s:'Adult ALL (Ph−)', cy:'D1–28', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช. (GMALL)', d:[
  d('Prednisolone',60,'mg/m2','D1–28','PO',{nDays:28,note:'⚠ ต้นฉบับคู่มือ สปสช. พิมพ์ prednisolone เป็น mg/kg/d — ขนาดที่ถูกต้องคือ mg/m2/d'}), d('Vincristine',1.4,'mg/m2','D1, 8, 15, 22','IV',{cap:2}),
  d('Doxorubicin',25,'mg/m2','D1, 8, 15, 22','IV',{note:'GMALL ต้นฉบับใช้ daunorubicin'}), d('L-asparaginase',5000,'units/m2','D15–28','IV')], note:'ผู้ป่วย tumor burden สูง: pretreatment VCR 2 mg D1 + prednisolone 60 mg/m2 D1–7'},
{ c:'leukemia', n:'GMALL induction phase II', kw:'all gmall', s:'Adult ALL (Ph−)', cy:'D29–57', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช. (GMALL)', d:[
  d('Cyclophosphamide',1000,'mg/m2','D29, 43, 57','IV'), d('Cytarabine',75,'mg/m2','D31–34, 38–41, 45–48, 52–55','IV/SC'),
  d('Mercaptopurine (6-MP)',60,'mg/m2','D29–57','PO OD',{roundTo:25}), d('Methotrexate (IT)',10,'mg','D31, 38, 45, 52','Intrathecal',{note:'protocol GMALL ต้นฉบับ 15 mg'})]},
{ c:'leukemia', n:'Adapted TPOG phase I induction', kw:'all tpog', s:'Adult ALL', cy:'D1–28', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช. (Adapted TPOG)', d:[
  d('Prednisolone',60,'mg/m2','D1–28','PO',{nDays:28,note:'⚠ ต้นฉบับคู่มือ สปสช. พิมพ์ prednisolone เป็น mg/kg/d — ขนาดที่ถูกต้องคือ mg/m2/d'}), d('Vincristine',1.4,'mg/m2','D1, 8, 15, 22','IV',{cap:2}), d('Doxorubicin',25,'mg/m2','D1, 8, 15, 22','IV'),
  d('L-asparaginase',10000,'units/m2','D4, 6, 8, 10, 12, 14','IM'), d('Methotrexate (IT)',12,'mg','D1, 8, 22','Intrathecal')], note:'phase ถัดไป (augmented consolidation / interim maintenance / delayed intensification) ดูในคู่มือ สปสช.'},
{ c:'leukemia', n:'Low-dose Cytarabine (LDAC)', kw:'aml ldac elderly', s:'AML ผู้สูงอายุ/unfit', cy:'q28 วัน', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช. (บท AML)', d:[d('Cytarabine',20,'mg','BID × 10 วัน','SC',{note:'ขนาดคงที่ 20 mg ต่อครั้ง'})]},
{ c:'leukemia', n:'MEC (salvage AML)', kw:'aml relapsed mitoxantrone etoposide', s:'Relapsed AML', cy:'q28 วัน × 2', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช. (บท AML)', d:[
  d('Mitoxantrone',8,'mg/m2','D1–5','IV',{nDays:5}), d('Etoposide',100,'mg/m2','D1–5','IV',{nDays:5}), d('Cytarabine (high-dose)',1000,'mg/m2','D1–5','IV',{nDays:5})]},
{ c:'leukemia', n:'APL induction AIDA (LPA2005)', kw:'apl atra idarubicin pethema lpa', s:'APL ทุกกลุ่มเสี่ยง', cy:'จนได้ CR (ATRA ไม่เกิน 90 วัน)', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช. (บท APL); PETHEMA LPA2005', d:[
  d('Tretinoin (ATRA)',45,'mg/m2','D1 จนได้ CR (สูงสุด 90 วัน)','PO แบ่ง BID',{roundTo:10,note:'ขนาดต่อวัน (แคปซูล 10 mg)'}), d('Idarubicin',12,'mg/m2','D2, 4, 6, 8','IV')], note:'เฝ้าระวัง differentiation syndrome, coagulopathy'},
{ c:'leukemia', n:'APL consolidation – high risk (LPA2005)', kw:'apl consolidation', s:'APL high risk, อายุ <65', cy:'3 courses ทุกเดือน', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.; LPA2005', d:[
  d('Tretinoin (ATRA)',45,'mg/m2','D1–15 ทุก course','PO แบ่ง BID',{roundTo:10,note:'ขนาดต่อวัน (แคปซูล 10 mg)'}), d('Idarubicin (course 1)',5,'mg/m2','C1: D1–4','IV'), d('Cytarabine (course 1)',1000,'mg/m2','C1: D1–4 (CI)','IV CI',{nDays:4}),
  d('Mitoxantrone (course 2)',10,'mg/m2','C2: D1–5','IV',{nDays:5}), d('Idarubicin (course 3)',12,'mg/m2','C3: D1','IV'), d('Cytarabine (course 3)',150,'mg/m2','C3: q8 ชม. D1–4','SC',{note:'ต่อครั้ง (ต้นฉบับพิมพ์ g/m2 — ที่ถูกคือ mg/m2)'})]},
{ c:'leukemia', n:'APL consolidation – low/intermediate risk (LPA2005)', kw:'apl consolidation', s:'APL low/intermediate risk หรืออายุ >65', cy:'3 courses ทุกเดือน', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.; LPA2005', d:[
  d('Tretinoin (ATRA)',45,'mg/m2','D1–15 ทุก course','PO แบ่ง BID',{roundTo:10,note:'ขนาดต่อวัน (แคปซูล 10 mg)'}), d('Idarubicin (course 1)',5,'mg/m2','C1: D1–4','IV',{note:'intermediate risk 7 mg/m2'}),
  d('Mitoxantrone (course 2)',10,'mg/m2','C2: D1–3','IV',{nDays:3}), d('Idarubicin (course 3)',12,'mg/m2','C3: D1 (intermediate: D1–2)','IV')]},
{ c:'leukemia', n:'APL maintenance (LPA2005)', kw:'apl maintenance', s:'APL', cy:'2 ปี', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.; LPA2005', d:[
  d('Tretinoin (ATRA)',45,'mg/m2','D1–15 ทุก 3 เดือน','PO แบ่ง BID',{roundTo:10,note:'ขนาดต่อวัน (แคปซูล 10 mg)'}), d('Mercaptopurine (6-MP)',50,'mg/m2','ทุกวัน','PO OD',{roundTo:25,note:'คู่มือ สปสช. ระบุ 90 mg/m2 — LPA2005 ต้นฉบับ 50 mg/m2 ยืนยันกับแพทย์'}),
  d('Methotrexate (oral)',15,'mg/m2','ทุกสัปดาห์','PO',{roundTo:2.5})]},

// ---------------- LYMPHOMA (สปสช. Hemato) ----------------
{ c:'lymphoma', n:'R-CEOP', kw:'ceop cardiac', s:'DLBCL (ไม่เหมาะกับ anthracycline)', cy:'q21 วัน × 6–8', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.', d:[
  d('Rituximab',375,'mg/m2','D1','IV'), d('Cyclophosphamide',750,'mg/m2','D1','IV'), d('Etoposide (D1)',50,'mg/m2','D1','IV'), d('Etoposide (D2–3)',100,'mg/m2','D2–3','PO/IV',{nDays:2}),
  d('Vincristine',1.4,'mg/m2','D1','IV',{cap:2}), d('Prednisolone',100,'mg','D1–5','PO')]},
{ c:'lymphoma', n:'R-Chlorambucil', kw:'chlorambucil cll', s:'CLL / Indolent (ผู้สูงอายุ)', cy:'q28 วัน × 6', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.', d:[
  d('Rituximab (C1)',375,'mg/m2','C1 D1','IV'), d('Rituximab (C2–6)',500,'mg/m2','D1','IV'), d('Chlorambucil',0.5,'mg/kg','D1, D15','PO',{note:'หรือ 0.14 mg/kg/วัน D1–7'})]},
{ c:'lymphoma', n:'Obinutuzumab + Chlorambucil', kw:'gclb cll11 gazyva', s:'CLL', cy:'q28 วัน × 6', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.; CLL11', d:[
  d('Obinutuzumab',1000,'mg','C1: D1 (100 mg) + D2 (900 mg), D8, D15; C2–6: D1','IV'), d('Chlorambucil',0.5,'mg/kg','D1, D15','PO')]},
{ c:'lymphoma', n:'Ibrutinib', kw:'btk cll mcl', s:'CLL / MCL', cy:'ทุกวัน', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.; label', d:[d('Ibrutinib',420,'mg','ทุกวัน','PO OD',{note:'MCL ใช้ 560 mg'})]},
{ c:'lymphoma', n:'Rituximab weekly × 4', kw:'rituximab single', s:'Indolent NHL', cy:'ทุกสัปดาห์ × 4', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.', d:[d('Rituximab',375,'mg/m2','D1, 8, 15, 22','IV')]},
{ c:'lymphoma', n:'SMILE', kw:'nk/t nkt nasal', s:'Extranodal NK/T-cell lymphoma', cy:'q28 วัน × 2–6', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.; Yamaguchi JCO 2011', d:[
  d('Methotrexate (high-dose)',2000,'mg/m2','D1 (6 ชม.)','IV'), d('Leucovorin (calcium folinate)',15,'mg','q6 ชม. × 4 ครั้ง เริ่ม 24 ชม. หลัง MTX','IV',{note:'สปสช.: 200 mg/m2 ที่ 24 ชม. แล้ว 15 mg/m2 q6h จน MTX <0.05 µM'}),
  d('Ifosfamide',1500,'mg/m2','D2–4','IV',{nDays:3}), d('Mesna',300,'mg/m2','ที่ 0, 4, 8 ชม. D2–4','IV',{note:'ต่อครั้ง'}), d('Etoposide',100,'mg/m2','D2–4','IV',{nDays:3}),
  d('Dexamethasone',40,'mg','D2–4','IV/PO'), d('L-asparaginase',6000,'units/m2','D8, 10, 12, 14, 16, 18, 20','IV',{note:'คู่มือ สปสช. ระบุ D2, 4, 6, 8'})], note:'G-CSF ตั้งแต่ D6'},
{ c:'lymphoma', n:'L-asparaginase-CHOP (NK/T)', kw:'nk/t asparaginase chop', s:'NK/T-cell lymphoma', cy:'q21 วัน × 6', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.', d:[
  d('Cyclophosphamide',750,'mg/m2','D1','IV'), d('Doxorubicin',50,'mg/m2','D1','IV'), d('Vincristine',1.4,'mg/m2','D1','IV',{cap:2}),
  d('Dexamethasone',10,'mg','D1–8','IV'), d('L-asparaginase',6000,'units/m2','D2–8','IM',{nDays:7})]},
{ c:'lymphoma', n:'Escalated BEACOPDac (protocol สปสช.)', kw:'beacopp beacodd hodgkin escalated', s:'Hodgkin advanced', cy:'q21 วัน × 4–6', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช. (ใช้ dacarbazine แทน procarbazine)', d:[
  d('Bleomycin',10,'units/m2','D8','IV'), d('Etoposide',200,'mg/m2','D1–3','IV',{nDays:3}), d('Doxorubicin',35,'mg/m2','D1','IV'), d('Cyclophosphamide',1250,'mg/m2','D1','IV'),
  d('Mesna',1000,'mg/m2','ก่อนและหลัง cyclophosphamide 4 ชม.','IV'), d('Vincristine',1.4,'mg/m2','D8','IV',{cap:2}), d('Dacarbazine',250,'mg/m2','D2–3','IV',{nDays:2}), d('Dexamethasone',40,'mg','D1–4','PO')],
  note:'G-CSF จำเป็น'},
{ c:'lymphoma', n:'High-dose Methotrexate (CNS prophylaxis)', kw:'hd-mtx cns', s:'DLBCL high CNS risk', cy:'q21 วัน × 2', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.', d:[
  d('Methotrexate (high-dose)',3500,'mg/m2','D1','IV 2–4 ชม.'), d('Leucovorin (calcium folinate)',50,'mg','q6 ชม. เริ่ม 24 ชม. หลังเริ่ม MTX จนระดับ MTX ต่ำพอ','IV')], note:'ตรวจระดับ MTX, hydration + alkalinization'},
{ c:'lymphoma', n:'High-dose Methotrexate (PCNSL)', kw:'pcnsl cns lymphoma', s:'Primary CNS lymphoma', cy:'q14 วัน', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.', d:[
  d('Methotrexate (high-dose)',3500,'mg/m2','D1','IV',{cap:8000,note:'protocol 3–8 g/m2 (สูงสุด 8,000 mg)'}), d('Leucovorin (calcium folinate)',50,'mg','q6 ชม. เริ่ม 24 ชม. หลังเริ่ม MTX','IV')]},
{ c:'lymphoma', n:'IT chemotherapy (CNS prophylaxis)', kw:'intrathecal it mtx', s:'CNS prophylaxis', cy:'q21 วัน × 4', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.', d:[d('Methotrexate (IT)',12,'mg','D1','Intrathecal'), d('Cytarabine (IT)',50,'mg','D1','Intrathecal')], note:'⚠ ยา IT ต้องแยกเตรียม/ติดฉลากชัด ห้ามมี vinca alkaloid ในบริเวณเดียวกัน'},

// ---------------- MYELOMA (สปสช. Hemato) ----------------
{ c:'myeloma', n:'BCD (Bortezomib + Cyclophosphamide + Dex) q21', kw:'cybord vcd', s:'Myeloma', cy:'q21 วัน × 4–6', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.', d:[
  d('Bortezomib',1.3,'mg/m2','D1, 4, 8, 11','IV/SC'), d('Cyclophosphamide (oral)',500,'mg/m2','D1, 8, 15','PO',{roundTo:50}), d('Dexamethasone',40,'mg','D1–4, D9–12','PO')]},
{ c:'myeloma', n:'Bortezomib + Dexamethasone (Vd)', kw:'bd vd', s:'Myeloma', cy:'q21 วัน × 4–8', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.', d:[d('Bortezomib',1.3,'mg/m2','D1, 4, 8, 11','IV/SC'), d('Dexamethasone',40,'mg','D1–4, D9–12','PO')]},
{ c:'myeloma', n:'Lenalidomide + Dexamethasone (Rd)', kw:'rd', s:'Myeloma', cy:'q28 วัน', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.; FIRST', d:[d('Lenalidomide',25,'mg','D1–21','PO OD'), d('Dexamethasone',40,'mg','D1, 8, 15, 22','PO')]},
{ c:'myeloma', n:'CTD (Cyclophosphamide + Thalidomide + Dex)', kw:'ctd', s:'Myeloma', cy:'q21 วัน × 4–6', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.', d:[
  d('Cyclophosphamide (oral)',300,'mg/m2','D1, 8, 15','PO',{roundTo:50}), d('Thalidomide',100,'mg','D1–21','PO HS'), d('Dexamethasone',40,'mg','D1–4, D9–12','PO')], note:'VTE prophylaxis'},
{ c:'myeloma', n:'MPT (Melphalan + Prednisolone + Thalidomide)', kw:'mpt', s:'Non-transplant', cy:'q28 วัน × 12', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.; Palumbo', d:[
  d('Melphalan',4,'mg/m2','D1–7','PO',{nDays:7,roundTo:2}), d('Prednisolone',40,'mg/m2','D1–7','PO',{nDays:7,note:'⚠ ต้นฉบับคู่มือ สปสช. พิมพ์ prednisolone เป็น mg/kg/d — ขนาดที่ถูกต้องคือ mg/m2/d'}), d('Thalidomide',100,'mg','D1–28','PO HS')]},
{ c:'myeloma', n:'VTD (Bortezomib + Thalidomide + Dex)', kw:'vtd', s:'Transplant-candidate induction', cy:'q21 วัน', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.', d:[
  d('Bortezomib',1.3,'mg/m2','D1, 4, 8, 11','IV/SC'), d('Thalidomide',200,'mg','D1–21','PO HS',{note:'หลายแนวทางเริ่ม 100 mg'}), d('Dexamethasone',40,'mg','D1–4 (± D9–12)','PO')]},
{ c:'myeloma', n:'Bortezomib + PLD', kw:'doxil liposomal', s:'Relapsed myeloma', cy:'q21 วัน × 8', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.; DOXIL-MMY-3001', d:[d('Bortezomib',1.3,'mg/m2','D1, 4, 8, 11','IV/SC'), d('Pegylated liposomal doxorubicin',30,'mg/m2','D4','IV')]},
{ c:'myeloma', n:'VRd-lite (protocol สปสช.)', kw:'rvd lite', s:'ผู้สูงอายุ/frail', cy:'q28 วัน × 8', ref:'คู่มือ Protocol Adult Hematology CA เล่ม 2 สปสช.', d:[
  d('Bortezomib',1,'mg/m2','D1, 4, 8, 11','IV/SC'), d('Lenalidomide',15,'mg','D1–14','PO OD'), d('Dexamethasone',20,'mg','D1–2, 4–5, 8–9, 11–12','PO')]},

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
