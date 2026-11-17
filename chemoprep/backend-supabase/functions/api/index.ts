// Supabase Edge Function: ChemoPrep API (คำขอ/คำตอบเหมือน Apps Script เดิม)
import postgres from 'npm:postgres@3.4.5';
import { handle, type Ctx, type Storage } from './core.ts';

const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { max: 4, prepare: false, idle_timeout: 30, connect_timeout: 10 });

let sbClient: any = null;
async function sb() {
  if (!sbClient) { const { createClient } = await import('npm:@supabase/supabase-js@2'); sbClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } }); }
  return sbClient;
}
const storage: Storage = {
  async put(bucket, path, bytes, mime) { const { error } = await (await sb()).storage.from(bucket).upload(path, bytes, { contentType: mime, upsert: true }); if (error) throw new Error('บันทึกไฟล์ไม่สำเร็จ: ' + error.message); },
  async get(bucket, path) { const { data, error } = await (await sb()).storage.from(bucket).download(path); if (error || !data) return null; return { bytes: new Uint8Array(await data.arrayBuffer()), mime: data.type || 'image/jpeg' }; },
  async remove(bucket, path) { await (await sb()).storage.from(bucket).remove([path]); },
  async signedUrl(bucket, path, sec, dl) { const { data, error } = await (await sb()).storage.from(bucket).createSignedUrl(path, sec, dl ? { download: dl } : undefined); if (error) throw new Error(error.message); return data.signedUrl; },
};
const mk = (r: any): Ctx => ({
  q: async (s, p = []) => [...await r.unsafe(s.replace(/(?<!text)::jsonb/g, '::text::jsonb'), p)],
  tx: (fn) => r.begin((t: any) => fn(mk(t))),
  storage,
});
const ctx = mk(sql);

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
const json = (o: any, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  const url = new URL(req.url);
  if (req.method === 'GET') {
    if (url.searchParams.get('api') === 'ping') return json({ ok: true, app: 'ChemoPrep', time: new Date().toISOString() });
    return new Response('ChemoPrep API ทำงานอยู่ ✅', { headers: { ...CORS, 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  let body: any;
  try { body = JSON.parse(await req.text()); } catch (_e) { return json({ ok: false, error: 'คำขอไม่ถูกต้อง' }); }
  return json(await handle(ctx, body));
});
