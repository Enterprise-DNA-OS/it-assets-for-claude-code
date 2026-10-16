#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';

export const archiveTables=['people','assets','custody','observations','licences','installations','disposals','source_rows','audit_events','schema_migrations'];
export const specs={
 help:[],assets:[],asset:['asset!'],people:[],custody:[],returns:[],stocktake:[],renewals:[],licences:[],
 'disposal-queue':[],compliance:[],attention:[],'weekly-review':[],history:[],'imported-assets':[],
 'add-person':['name!','team!','purpose!','review-on!'], 'depart-person':['person!','on!'],
 'review-person':['person!','purpose!','review-on!'],
 'add-asset':['tag!','name!','serial','category!','site!','owner!','warranty','support'],
 'log-stocktake':['asset!','on!','site!','evidence!'],
 checkout:['asset!','person!','on!','due!','evidence!'],checkin:['asset!','on!','evidence!'],
 'set-support':['asset!','owner!','warranty','support'],
 'send-repair':['asset!','evidence!'],'return-repair':['asset!','on!','site!','evidence!'],
 retire:['asset!','evidence!'],dispose:['asset!','on!','method!','evidence!','approved-by!','retention-review!'],
 'add-licence':['name!','seats!','expires!','evidence!'],
 'renew-licence':['licence!','seats!','expires!','evidence!'],
 'record-install':['asset!','licence!','on!','evidence!'],'remove-install':['asset!','licence!','on!','evidence!'],
 import:['file!','map!','namespace!','owner!'],export:['out'], 'draft-return':['asset!']
};
export const mutations=new Set(['add-person','depart-person','review-person','add-asset','log-stocktake','checkout','checkin','set-support','send-repair','return-repair','retire','dispose','add-licence','renew-licence','record-install','remove-install','import']);
export const commands=Object.keys(specs);
export function parse(argv){
 const [command='help',...rest]=argv;if(!specs[command])throw Error(`Unknown command ${command}. Use help.`);
 const opt={},pos=[];for(const arg of rest){
  if(!arg.startsWith('--')){pos.push(arg);continue;}
  const at=arg.indexOf('=');const key=arg.slice(2,at<0?undefined:at),value=at<0?true:arg.slice(at+1);
  if(Object.hasOwn(opt,key))throw Error(`Duplicate flag --${key}`);opt[key]=value;
 }
 if(command==='import'){if(pos.length!==1||pos[0]!=='assetexplorer')throw Error('Use import assetexplorer');}
 else if(pos.length)throw Error('Unexpected positional argument');
 const allowed=[...specs[command].map(x=>x.replace('!','')),'json',...(mutations.has(command)?['actor','dry-run']:[])];
 for(const [k,v] of Object.entries(opt)){
  if(!allowed.includes(k))throw Error(`Unknown flag --${k}`);
  if(['json','dry-run'].includes(k)){if(v!==true)throw Error(`--${k} is a boolean flag`);}
  else if(typeof v!=='string'||!v.trim())throw Error(`--${k} requires a nonempty value`);
 }
 for(const k of specs[command].filter(x=>x.endsWith('!')).map(x=>x.slice(0,-1)))if(!opt[k])throw Error(`Missing --${k}`);
 if(mutations.has(command)&&!opt.actor)throw Error('Mutation requires --actor');
 return {command,opt};
}
export function date(s,{past=false}={}){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s)))throw Error(`Invalid date ${s}: use YYYY-MM-DD`);
 const d=new Date(`${s}T00:00:00Z`);if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==s)throw Error(`Invalid date ${s}`);
 if(past&&s>new Date().toISOString().slice(0,10))throw Error('Observation date cannot be in the future');return s;
}
function seats(s){if(!/^\d+$/.test(String(s))||!Number.isSafeInteger(Number(s))||Number(s)>100000000)throw Error('Invalid seats');return Number(s);}
const one=async(db,sql,p=[]) => (await db.query(sql,p))[0];
async function resolve(db,table,q){
 const label=table==='assets'?"tag || ' ' || name":'name';
 const rows=await db.query(`select *,${label} as label from ${table} order by ${table==='assets'?'tag':'name'}`);
 const v=q.toLowerCase();let matches=rows.filter(r=>r.id.toLowerCase()===v||r.name.toLowerCase()===v||(r.tag||'').toLowerCase()===v);
 if(!matches.length)matches=rows.filter(r=>r.id.startsWith(v)||r.label.toLowerCase().includes(v));
 if(matches.length!==1)throw Error(`${matches.length?'Ambiguous':'No match'} ${table}: ${q}. Candidates: ${JSON.stringify((matches.length?matches:rows).map(r=>({id:r.id,name:r.label})))}`);
 return matches[0];
}
async function observation(db,a,o){
 const on=date(o.on,{past:true});const latest=await one(db,'select max(seen_on) seen_on from observations where asset_id=$1',[a.id]);
 if(latest.seen_on&&on<latest.seen_on)throw Error('Stocktake predates the latest observation');
 await db.query('insert into observations(asset_id,seen_on,site,evidence,actor) values($1,$2,$3,$4,$5)',[a.id,on,o.site,o.evidence,o.actor]);
 await db.query("update assets set site=$2,state=case when state='unverified' then 'stock' else state end where id=$1",[a.id,o.site]);
}
async function idle(db,a){
 if(await one(db,'select id from custody where asset_id=$1 and returned_on is null',[a.id]))throw Error('Return active custody first');
}
function state(a,allowed){if(!allowed.includes(a.state))throw Error(`Asset state ${a.state} must be ${allowed.join(' or ')}`);}
const writeJson=(out,data)=>{fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n',{flag:'wx'});return out;};

export async function dispatch(db,argv){
 const {command:c,opt:o}=parse(argv);
 if(!mutations.has(c))return read(db,c,o);
 await db.exec('BEGIN');
 try{
  // Serialize multi-record transitions for PostgreSQL as well as the embedded adapter.
  await db.exec('LOCK TABLE people,assets,custody,observations,licences,installations,disposals,source_rows,audit_events IN SHARE ROW EXCLUSIVE MODE');
  const result=await change(db,c,o);
  await db.query('insert into audit_events(command,actor,details) values($1,$2,$3::jsonb)',[c,o.actor,JSON.stringify({input:o,result})]);
  await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return {...result,dry_run:!!o['dry-run']};
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
async function change(db,c,o){
 if(c==='add-person')return one(db,'insert into people(name,team,purpose,review_on) values($1,$2,$3,$4) returning *',[o.name,o.team,o.purpose,date(o['review-on'])]);
 if(c==='depart-person'||c==='review-person'){
  const p=await resolve(db,'people',o.person);
  if(c==='depart-person'){
   if(p.departed_on)throw Error('Person already departed');
   return one(db,'update people set departed_on=$2 where id=$1 returning *',[p.id,date(o.on,{past:true})]);
  }
  return one(db,'update people set purpose=$2,review_on=$3 where id=$1 returning *',[p.id,o.purpose,date(o['review-on'])]);
 }
 if(c==='add-asset')return one(db,'insert into assets(tag,name,serial,category,site,owner,warranty_until,support_until) values($1,$2,$3,$4,$5,$6,$7,$8) returning *',[o.tag,o.name,o.serial||null,o.category,o.site,o.owner,o.warranty?date(o.warranty):null,o.support?date(o.support):null]);
 if(c==='add-licence')return one(db,'insert into licences(name,seats,expires_on,evidence) values($1,$2,$3,$4) returning *',[o.name,seats(o.seats),date(o.expires),o.evidence]);
 if(c==='renew-licence'){
  const l=await resolve(db,'licences',o.licence);
  return one(db,'update licences set seats=$2,expires_on=$3,evidence=$4 where id=$1 returning *',[l.id,seats(o.seats),date(o.expires),o.evidence]);
 }
 if(c==='import')return importAssets(db,o);
 const a=await resolve(db,'assets',o.asset);
 if(c==='set-support')return one(db,'update assets set owner=$2,warranty_until=$3,support_until=$4 where id=$1 returning *',[a.id,o.owner,o.warranty?date(o.warranty):a.warranty_until,o.support?date(o.support):a.support_until]);
 if(c==='log-stocktake'){
  state(a,['unverified','stock','in_use','repair']);await observation(db,a,o);return {id:a.id,observed_on:o.on};
 }
 if(c==='checkout'){
  state(a,['stock']);await idle(db,a);const p=await resolve(db,'people',o.person);if(p.departed_on)throw Error('Cannot issue equipment to a departed person');
  const on=date(o.on,{past:true}),due=date(o.due);if(due<on)throw Error('Due date precedes issue date');
  const prev=await one(db,'select max(returned_on) last_return from custody where asset_id=$1',[a.id]);
  if(prev.last_return&&on<prev.last_return)throw Error('Issue date precedes previous return');
  const result=await one(db,'insert into custody(asset_id,person_id,issued_on,due_on,issue_evidence) values($1,$2,$3,$4,$5) returning *',[a.id,p.id,on,due,o.evidence]);
  await db.query("update assets set state='in_use' where id=$1",[a.id]);return result;
 }
 if(c==='checkin'){
  state(a,['in_use']);const active=await one(db,'select * from custody where asset_id=$1 and returned_on is null',[a.id]);if(!active)throw Error('No active custody');
  const on=date(o.on,{past:true});if(on<active.issued_on)throw Error('Return date precedes issue date');
  const result=await one(db,'update custody set returned_on=$2,return_evidence=$3 where id=$1 returning *',[active.id,on,o.evidence]);
  await db.query("update assets set state='unverified' where id=$1",[a.id]);return result;
 }
 if(c==='send-repair'){state(a,['stock']);await idle(db,a);return one(db,"update assets set state='repair' where id=$1 returning *",[a.id]);}
 if(c==='return-repair'){
  state(a,['repair']);await observation(db,a,o);return one(db,"update assets set state='stock' where id=$1 returning *",[a.id]);
 }
 if(c==='retire'){
  state(a,['stock','repair','unverified']);await idle(db,a);return one(db,"update assets set state='retired' where id=$1 returning *",[a.id]);
 }
 if(c==='dispose'){
  state(a,['retired']);await idle(db,a);
  if(await one(db,'select id from installations where asset_id=$1 and removed_on is null',[a.id]))throw Error('Record removal of software installations first');
  const on=date(o.on,{past:true});
  const latest=await one(db,'select greatest((select max(seen_on) from observations where asset_id=$1),(select max(returned_on) from custody where asset_id=$1),(select max(removed_on) from installations where asset_id=$1)) last_on',[a.id]);
  if(latest.last_on&&on<latest.last_on)throw Error('Disposal date precedes recorded asset activity');
  const result=await one(db,'insert into disposals(asset_id,disposed_on,method,evidence,approved_by,retention_review) values($1,$2,$3,$4,$5,$6) returning *',[a.id,on,o.method,o.evidence,o['approved-by'],o['retention-review']]);
  await db.query("update assets set state='disposed' where id=$1",[a.id]);return result;
 }
 if(c==='record-install'||c==='remove-install'){
  const l=await resolve(db,'licences',o.licence),on=date(o.on,{past:true});
  if(c==='record-install'){
   state(a,['stock','in_use']);
   // Record observed reality even when it exceeds entitlements. The licence report flags it.
   return one(db,'insert into installations(asset_id,licence_id,installed_on,evidence) values($1,$2,$3,$4) returning *',[a.id,l.id,on,o.evidence]);
  }
  const i=await one(db,'select * from installations where asset_id=$1 and licence_id=$2 and removed_on is null',[a.id,l.id]);
  if(!i)throw Error('No active installation');if(on<i.installed_on)throw Error('Removal date precedes installation');
  return one(db,'update installations set removed_on=$2,removal_evidence=$3 where id=$1 returning *',[i.id,on,o.evidence]);
 }
 throw Error(`Not implemented: ${c}`);
}
async function importAssets(db,o){
 const rows=parseCsv(fs.readFileSync(o.file,'utf8'));if(!rows.length)throw Error('Empty CSV');
 const map=JSON.parse(fs.readFileSync(o.map,'utf8'));
 const allowed=['key','name','tag','serial','category','site','warranty','support'];
 for(const [k,v] of Object.entries(map))if(!allowed.includes(k)||typeof v!=='string'||!v.trim())throw Error(`Invalid mapping ${k}`);
 for(const k of ['key','name','tag','category','site'])if(!map[k])throw Error(`Mapping requires ${k}`);
 for(const col of Object.values(map))if(!Object.hasOwn(rows[0],col))throw Error(`Missing CSV column ${col}`);
 let imported=0,skipped=0;const keys=new Set();
 for(const raw of rows){
  const m=Object.fromEntries(Object.entries(map).map(([k,v])=>[k,raw[v].trim()]));
  for(const k of ['key','name','tag','category','site'])if(!m[k])throw Error(`Empty ${k}`);
  if(keys.has(m.key))throw Error(`Duplicate source key ${m.key}`);keys.add(m.key);
  if(m.warranty)date(m.warranty);if(m.support)date(m.support);
  const prior=await one(db,'select *,raw=$3::jsonb and mapped=$4::jsonb same from source_rows where namespace=$1 and source_key=$2',[o.namespace,m.key,JSON.stringify(raw),JSON.stringify(m)]);
  if(prior){if(!prior.same)throw Error(`Changed source row ${m.key}: reconcile explicitly before importing again`);skipped++;continue;}
  const a=await one(db,'insert into assets(tag,name,serial,category,site,owner,warranty_until,support_until) values($1,$2,$3,$4,$5,$6,$7,$8) returning id',[m.tag,m.name,m.serial||null,m.category,m.site,o.owner,m.warranty||null,m.support||null]);
  await db.query('insert into source_rows(namespace,source_key,asset_id,raw,mapped) values($1,$2,$3,$4::jsonb,$5::jsonb)',[o.namespace,m.key,a.id,JSON.stringify(raw),JSON.stringify(m)]);imported++;
 }
 return {imported,skipped,total:rows.length,verification:'All new assets are unverified. Original state and custodian remain in source rows.'};
}
async function read(db,c,o){
 const queries={
 assets:'select tag,name,category,site,owner,state,warranty_until,support_until,id from assets order by tag',
 people:'select * from people order by name',
 custody:'select tag,asset,person,team,issued_on,due_on,days_overdue,departed_on from v_custody where returned_on is null order by due_on,tag',
 returns:'select tag,person,team,due_on,days_overdue,departed_on from v_custody where returned_on is null and (due_on<current_date or departed_on is not null) order by due_on,tag',
 stocktake:"select tag,name,site,state,last_seen,days_unseen from v_stocktake where state<>'disposed' order by last_seen nulls first,tag",
 renewals:'select name,kind,due_on,owner from v_renewals order by due_on,name,kind',
 licences:'select name,seats,installed,available,expires_on,expired from v_licences order by name',
 'disposal-queue':"select a.tag,a.name,a.site,(select count(*)::int from installations i where i.asset_id=a.id and i.removed_on is null) installations_to_remove from assets a where state='retired' order by tag",
 history:'select command,actor,details,created_at from audit_events order by created_at,id',
 'imported-assets':'select s.namespace,s.source_key,a.tag,a.state,s.raw,s.mapped from source_rows s join assets a on a.id=s.asset_id order by s.namespace,s.source_key'
 };
 if(queries[c])return db.query(queries[c]);
 if(c==='help')return Object.entries(specs).map(([command,flags])=>({command:command==='import'?'import assetexplorer':command,flags:flags.map(x=>`--${x.replace('!','')}=<value>${x.endsWith('!')?' (required)':''}`).join(' ')+(mutations.has(command)?' --actor=<operator> (required) [--dry-run]':'')+' [--json]'}));
 if(c==='asset'){
  const a=await resolve(db,'assets',o.asset);
  return {asset:a,custody:await db.query('select * from v_custody where asset_id=$1 order by issued_on',[a.id]),observations:await db.query('select * from observations where asset_id=$1 order by seen_on desc',[a.id]),installations:await db.query('select i.*,l.name from installations i join licences l on l.id=i.licence_id where asset_id=$1',[a.id]),disposal:await db.query('select * from disposals where asset_id=$1',[a.id])};
 }
 if(c==='attention')return {
 returns:await read(db,'returns',{}),
 stocktake:await db.query("select tag,name,site,state,last_seen,days_unseen from v_stocktake where state not in ('disposed','retired') and (last_seen is null or days_unseen>90) order by tag"),
 renewals:await read(db,'renewals',{}),licences:await db.query('select name,seats,installed,available,expires_on from v_licences where available<0 or expired order by name')
 };
 if(c==='compliance'){
  const checks=[];
  const add=(rule,reference,records)=>checks.push({rule,reference,status:records.length?'REVIEW':'CLEAR',records});
  add('NCSC_ASSET_RECORD','docs/compliance.md#asset-records',await db.query("select tag,owner,serial,support_until,state from assets where state<>'disposed' and (serial is null or support_until is null or state='unverified') order by tag"));
  add('STOCKTAKE_HOUSE_RULE','docs/compliance.md#house-rules',(await read(db,'attention',{})).stocktake);
  add('PRIVACY_RETENTION','https://www.privacy.org.nz/privacy-principles/9/',await db.query('select name,purpose,review_on,departed_on from people where review_on<current_date order by name'));
  add('LICENCE_RECONCILIATION','docs/compliance.md#licences',(await read(db,'attention',{})).licences);
  add('DISPOSAL_EVIDENCE','docs/compliance.md#disposal',await db.query("select tag,name from assets a where state='disposed' and not exists(select 1 from disposals d where d.asset_id=a.id)"));
  checks.push({rule:'MANUAL_SECURITY',reference:'https://www.privacy.org.nz/privacy-principles/5/',status:'MANUAL',records:[{action:'Review access, backups, actual sanitisation and evidence authenticity. Record checks cannot prove these.'}]});return checks;
 }
 if(c==='weekly-review')return {custody:await read(db,'custody',{}),attention:await read(db,'attention',{}),compliance:await read(db,'compliance',{}),disposals:await read(db,'disposal-queue',{})};
 if(c==='export'){
  const records={};await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try{for(const t of archiveTables)records[t]=await db.query(`select * from ${t} order by ${t==='schema_migrations'?'name':'id'}`);await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
  const file=path.resolve(o.out||path.join(process.env.OUTPUT_DIR||REPO_ROOT,'exports',`it-assets-${randomUUID()}.json`));
  writeJson(file,{format:'it-assets-archive-v1',exported_at:new Date().toISOString(),records});return {file,counts:Object.fromEntries(Object.entries(records).map(([k,v])=>[k,v.length]))};
 }
 if(c==='draft-return'){
  const a=await resolve(db,'assets',o.asset);const current=await one(db,'select * from v_custody where asset_id=$1 and returned_on is null',[a.id]);if(!current)throw Error('No active custody');
  const dir=path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,`return-${a.tag.replace(/[^a-zA-Z0-9-]/g,'-')}-${randomUUID()}.md`);
  fs.writeFileSync(file,`# Internal return brief\n\nDraft only. Nothing sent.\n\nAsset: ${a.tag}, ${a.name}\nCustodian: ${current.person}\nDue: ${current.due_on}\nSite recorded: ${a.site}\n\nConfirm the actual return and condition before changing custody. The recorded due date is not proof the asset is missing.\n`,{flag:'wx'});return {file};
 }
 throw Error(`Unknown command ${c}`);
}
export function format(data){
 if(Array.isArray(data)){
  if(!data.length)return 'No records.';
  const keys=Object.keys(data[0]);const str=v=>typeof v==='object'&&v!==null?JSON.stringify(v):String(v??'');
  const rows=data.map(r=>keys.map(k=>str(r[k]).replace(/\r?\n/g,' ')));
  const widths=keys.map((k,i)=>Math.min(90,Math.max(k.length,...rows.map(r=>r[i].length))));
  const line=r=>r.map((v,i)=>(v.length>widths[i]?v.slice(0,widths[i]-3)+'...':v).padEnd(widths[i])).join(' | ');
  return [line(keys),widths.map(n=>'-'.repeat(n)).join('-+-'),...rows.map(line)].join('\n');
 }
 if(data&&typeof data==='object')return Object.entries(data).map(([k,v])=>`${k}:\n${Array.isArray(v)||typeof v==='object'?format(v):v}`).join('\n\n');
 return String(data);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{const args=process.argv.slice(2);const parsed=parse(args);db=await getDb();const result=await dispatch(db,args);console.log(parsed.opt.json?JSON.stringify(result,null,2):format(result));}
 catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
