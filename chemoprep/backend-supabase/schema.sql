create table if not exists public.visits (
  _n bigserial,
  "id" text not null default '',
  "date" text not null default '',
  "vn" text not null default '',
  "HN" text not null default '',
  "ward" text not null default '',
  "phcode" text not null default '',
  "emcode" text not null default '',
  "mixTime" text not null default '',
  "wt" text not null default '',
  "ht" text not null default '',
  "scr" text not null default '',
  "regimen" text not null default '',
  "note" text not null default '',
  "preparedAt" text not null default '',
  "preparedBy" text not null default '',
  "cancelled" text not null default '',
  "photos" text not null default '',
  "updatedAt" text not null default '',
  "updatedBy" text not null default '',
  "doseStatus" text not null default '',
  "doseIssues" text not null default '',
  "doseReason" text not null default '',
  "doseReasonNote" text not null default '',
  "doseDetail" text not null default '',
  "checkedBy" text not null default '',
  primary key ("id")
);
alter table public.visits enable row level security;
create index if not exists visits_date_i on public.visits ("date");
create index if not exists visits_preparedat_i on public.visits ("preparedAt");
create index if not exists visits_hn_i on public.visits ("HN");
create index if not exists visits__n_i on public.visits (_n);
create table if not exists public.bottles (
  _n bigserial,
  "id" text not null default '',
  "visitId" text not null default '',
  "date" text not null default '',
  "bottleNo" text not null default '',
  "productcde" text not null default '',
  "mg" text not null default '',
  "diluent" text not null default '',
  "route" text not null default '',
  "rate" text not null default '',
  "rateUnit" text not null default '',
  "tvol" text not null default '',
  "note" text not null default '',
  "printed" text not null default '',
  primary key ("id")
);
alter table public.bottles enable row level security;
create index if not exists bottles_visitid_i on public.bottles ("visitId");
create index if not exists bottles_date_i on public.bottles ("date");
create index if not exists bottles__n_i on public.bottles (_n);
create table if not exists public.patients (
  _n bigserial,
  "HN" text not null default '',
  "title" text not null default '',
  "name" text not null default '',
  "surname" text not null default '',
  "dob" text not null default '',
  "sex" text not null default '',
  "allergyFlag" text not null default '',
  "allergy" text not null default '',
  "ward" text not null default '',
  "offService" text not null default '',
  "wt" text not null default '',
  "ht" text not null default '',
  "scr" text not null default '',
  "lastVisit" text not null default '',
  primary key ("HN")
);
alter table public.patients enable row level security;
create index if not exists patients__n_i on public.patients (_n);
create table if not exists public.products (
  _n bigserial,
  "productcde" text not null default '',
  "productname" text not null default '',
  "generic" text not null default '',
  "mgPerMl" text not null default '',
  "mlPerVial" text not null default '',
  "unit" text not null default '',
  "stRecon" text not null default '',
  "stDilute" text not null default '',
  "storage" text not null default '',
  "recon" text not null default '',
  "mlRecon" text not null default '',
  "chemo" text not null default '',
  "off" text not null default '',
  primary key ("productcde")
);
alter table public.products enable row level security;
create index if not exists products__n_i on public.products (_n);
create table if not exists public.diluents (
  _n bigserial,
  "pcode" text not null default '',
  "name" text not null default '',
  "generic" text not null default '',
  "mlPerBot" text not null default '',
  "off" text not null default '',
  primary key ("pcode")
);
alter table public.diluents enable row level security;
create index if not exists diluents__n_i on public.diluents (_n);
create table if not exists public.staff (
  _n bigserial,
  "code" text not null default '',
  "empId" text not null default '',
  "name" text not null default '',
  "fullName" text not null default '',
  "role" text not null default '',
  "active" text not null default '',
  "canLogin" text not null default '',
  "admin" text not null default '',
  "mixer" text not null default '',
  "pwHash" text not null default '',
  primary key ("code")
);
alter table public.staff enable row level security;
create index if not exists staff__n_i on public.staff (_n);
create table if not exists public.wards (
  _n bigserial,
  "code" text not null default '',
  "name" text not null default '',
  "tel" text not null default '',
  "partner" text not null default '',
  primary key ("code")
);
alter table public.wards enable row level security;
create index if not exists wards__n_i on public.wards (_n);
create table if not exists public.lookups (
  _n bigserial,
  "type" text not null default '',
  "code" text not null default '',
  "text" text not null default '',
  primary key ("type","code")
);
alter table public.lookups enable row level security;
create index if not exists lookups__n_i on public.lookups (_n);
create table if not exists public.titles (
  _n bigserial,
  "code" text not null default '',
  "title" text not null default '',
  "sex" text not null default '',
  primary key ("code")
);
alter table public.titles enable row level security;
create index if not exists titles__n_i on public.titles (_n);
create table if not exists public.settings (
  _n bigserial,
  "key" text not null default '',
  "value" text not null default '',
  "note" text not null default '',
  primary key ("key")
);
alter table public.settings enable row level security;
create index if not exists settings__n_i on public.settings (_n);
create table if not exists public.eyeformulas (
  _n bigserial,
  "code" text not null default '',
  "name" text not null default '',
  "labelName" text not null default '',
  "method" text not null default '',
  "storage" text not null default '',
  "expDays" text not null default '',
  "active" text not null default '',
  primary key ("code")
);
alter table public.eyeformulas enable row level security;
create index if not exists eyeformulas__n_i on public.eyeformulas (_n);
create table if not exists public.eyedrops (
  _n bigserial,
  "id" text not null default '',
  "date" text not null default '',
  "seq" text not null default '',
  "HN" text not null default '',
  "ward" text not null default '',
  "formula" text not null default '',
  "directions" text not null default '',
  "qty" text not null default '',
  "prepTime" text not null default '',
  "phcode" text not null default '',
  "emcode" text not null default '',
  "note" text not null default '',
  "printed" text not null default '',
  "updatedAt" text not null default '',
  "updatedBy" text not null default '',
  primary key ("id")
);
alter table public.eyedrops enable row level security;
create index if not exists eyedrops_date_i on public.eyedrops ("date");
create index if not exists eyedrops__n_i on public.eyedrops (_n);
create table if not exists public.logs (
  _n bigserial,
  "time" text not null default '',
  "code" text not null default '',
  "name" text not null default '',
  "action" text not null default '',
  "detail" text not null default ''
);
alter table public.logs enable row level security;
create index if not exists logs_time_i on public.logs ("time");
create index if not exists logs__n_i on public.logs (_n);
create table if not exists public.sessions (token text primary key, u jsonb not null, exp timestamptz not null);
create table if not exists public.login_fails (code text primary key, n int not null default 0, until timestamptz);
create table if not exists public.import_tokens (token text primary key);
alter table public.sessions enable row level security;
alter table public.login_fails enable row level security;
alter table public.import_tokens enable row level security;
