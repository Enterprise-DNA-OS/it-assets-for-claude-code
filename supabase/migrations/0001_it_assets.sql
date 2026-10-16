create function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;
create function immutable_record() returns trigger language plpgsql as $$
begin raise exception 'This record is append-only'; end $$;
create table people (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name))>0),
 team text not null, purpose text not null check(length(trim(purpose))>0), review_on date not null,
 departed_on date, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table assets (
 id uuid primary key default gen_random_uuid(), tag text not null unique check(length(trim(tag))>0),
 name text not null check(length(trim(name))>0), serial text, category text not null, site text not null,
 owner text not null check(length(trim(owner))>0),
 state text not null default 'unverified' check(state in ('unverified','stock','in_use','repair','retired','disposed')),
 warranty_until date, support_until date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index assets_tag_case on assets(lower(tag));
create unique index assets_serial_case on assets(lower(serial)) where serial is not null;
create index assets_state_support on assets(state,support_until);
create table custody (
 id uuid primary key default gen_random_uuid(), asset_id uuid not null references assets,
 person_id uuid not null references people, issued_on date not null, due_on date not null,
 issue_evidence text not null check(length(trim(issue_evidence))>0), returned_on date,
 return_evidence text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(due_on>=issued_on), check(returned_on is null or returned_on>=issued_on),
 check((returned_on is null and return_evidence is null) or (returned_on is not null and length(trim(return_evidence))>0))
);
create unique index custody_one_active on custody(asset_id) where returned_on is null;
create index custody_person on custody(person_id);
create index custody_due on custody(due_on) where returned_on is null;
create table observations (
 id uuid primary key default gen_random_uuid(), asset_id uuid not null references assets,
 seen_on date not null, site text not null, evidence text not null check(length(trim(evidence))>0), actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index observations_asset_date on observations(asset_id,seen_on desc);
create table licences (
 id uuid primary key default gen_random_uuid(), name text not null unique, seats integer not null check(seats>=0),
 expires_on date not null, evidence text not null check(length(trim(evidence))>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table installations (
 id uuid primary key default gen_random_uuid(), asset_id uuid not null references assets,
 licence_id uuid not null references licences, installed_on date not null,
 evidence text not null check(length(trim(evidence))>0), removed_on date, removal_evidence text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(removed_on is null or removed_on>=installed_on),
 check((removed_on is null and removal_evidence is null) or (removed_on is not null and length(trim(removal_evidence))>0))
);
create unique index installations_active on installations(asset_id,licence_id) where removed_on is null;
create index installations_licence on installations(licence_id);
create table disposals (
 id uuid primary key default gen_random_uuid(), asset_id uuid not null unique references assets,
 disposed_on date not null, method text not null check(length(trim(method))>0),
 evidence text not null check(length(trim(evidence))>0), approved_by text not null check(length(trim(approved_by))>0),
 retention_review text not null check(length(trim(retention_review))>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table source_rows (
 id uuid primary key default gen_random_uuid(), namespace text not null, source_key text not null,
 asset_id uuid not null references assets, raw jsonb not null, mapped jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(namespace,source_key)
);
create index source_rows_asset on source_rows(asset_id);
create table audit_events (
 id uuid primary key default gen_random_uuid(), command text not null, actor text not null,
 details jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
do $$ declare t text; begin
 foreach t in array array['people','assets','custody','observations','licences','installations','disposals','source_rows','audit_events'] loop
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 if t in ('observations','disposals','source_rows','audit_events') then
 execute format('create trigger immutable before update or delete on %I for each row execute function immutable_record()',t);
 else
 execute format('create trigger updated before update on %I for each row execute function touch_updated_at()',t);
 end if;
 end loop;
end $$;
create view v_custody with(security_invoker=true) as
 select c.id,c.asset_id,c.person_id,a.tag,a.name asset,p.name person,p.team,a.site,c.issued_on,c.due_on,
 current_date-c.due_on days_overdue,p.departed_on,c.returned_on,c.issue_evidence,c.return_evidence
 from custody c join assets a on a.id=c.asset_id join people p on p.id=c.person_id;
create view v_stocktake with(security_invoker=true) as
 select a.id,a.tag,a.name,a.site,a.owner,a.state,a.support_until,a.warranty_until,
 (select max(o.seen_on) from observations o where o.asset_id=a.id) last_seen,
 current_date-(select max(o.seen_on) from observations o where o.asset_id=a.id) days_unseen
 from assets a;
create view v_licences with(security_invoker=true) as
 select l.id,l.name,l.seats,l.expires_on,l.evidence,
 (select count(*)::int from installations i where i.licence_id=l.id and i.removed_on is null) installed,
 l.seats-(select count(*)::int from installations i where i.licence_id=l.id and i.removed_on is null) available,
 l.expires_on<current_date expired from licences l;
create view v_renewals with(security_invoker=true) as
 select id,tag name,'warranty' kind,warranty_until due_on,owner from assets where state not in ('disposed','retired') and warranty_until<=current_date+60
 union all select id,tag,'support',support_until,owner from assets where state not in ('disposed','retired') and support_until<=current_date+60
 union all select id,name,'licence',expires_on,'IT manager' from licences where expires_on<=current_date+60;
revoke all on v_custody,v_stocktake,v_licences,v_renewals from public;
