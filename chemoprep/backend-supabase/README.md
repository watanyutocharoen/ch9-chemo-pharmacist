# ChemoPrep backend (Supabase)
- `functions/api` = Edge Function (Deno) ที่รับ `POST {fn,args}` เหมือน Apps Script เดิม
- ฐานข้อมูล: Postgres (ตารางตรงกับชีตเดิม) · รูปเคสอยู่ใน Storage bucket `photos` · ไฟล์รายงานใน `reports`
- GitHub Actions `keepalive.yml` ยิง ping ทุกวัน กัน Supabase free หยุดโปรเจกต์เมื่อไม่มีการใช้งาน 7 วัน
- Apps Script เดิม (`../backend/Code.gs`) เก็บไว้เป็นตัวสำรอง
