insert into people(id,name,team,purpose,review_on,departed_on) values
 ('10000000-0000-0000-0000-000000000001','Mara Chen','Operations','Equipment custody',current_date+180,null),
 ('10000000-0000-0000-0000-000000000002','Theo Ward','Accounts','Recover issued equipment',current_date-10,current_date-4),
 ('10000000-0000-0000-0000-000000000003','Nina Patel','Support','Equipment custody',current_date+90,null) on conflict do nothing;
insert into assets(id,tag,name,serial,category,site,owner,state,warranty_until,support_until) values
 ('20000000-0000-0000-0000-000000000001','LAP-101','Harbour laptop','DEMO-101','Laptop','Wellington','IT manager','in_use',current_date+20,current_date+200),
 ('20000000-0000-0000-0000-000000000002','LAP-102','Harbour laptop','DEMO-102','Laptop','Auckland','IT manager','in_use',current_date-30,current_date-5),
 ('20000000-0000-0000-0000-000000000003','LAP-103','Spare laptop','DEMO-103','Laptop','Wellington','IT manager','stock',current_date+300,current_date+500),
 ('20000000-0000-0000-0000-000000000004','RTR-201','Branch router','DEMO-201','Router','Dunedin','IT manager','retired',current_date-60,current_date-20),
 ('20000000-0000-0000-0000-000000000005','MON-301','Meeting display','DEMO-301','Display','Auckland','Office manager','unverified',null,null)
 on conflict do nothing;
insert into custody(id,asset_id,person_id,issued_on,due_on,issue_evidence) values
 ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',current_date-40,current_date+30,'Fictional handover 101'),
 ('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002',current_date-100,current_date-7,'Fictional handover 102') on conflict do nothing;
insert into observations(id,asset_id,seen_on,site,evidence,actor) values
 ('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',current_date-5,'Wellington','Fictional physical check','Demo operator'),
 ('40000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002',current_date-100,'Auckland','Fictional physical check','Demo operator'),
 ('40000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003',current_date-2,'Wellington','Fictional store check','Demo operator') on conflict do nothing;
insert into licences(id,name,seats,expires_on,evidence) values
 ('50000000-0000-0000-0000-000000000001','Drafting Desktop',1,current_date+25,'Fictional per-device entitlement'),
 ('50000000-0000-0000-0000-000000000002','Archive Reader',2,current_date-3,'Fictional per-device entitlement') on conflict do nothing;
insert into installations(id,asset_id,licence_id,installed_on,evidence) values
 ('60000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',current_date-30,'Fictional install record'),
 ('60000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000001',current_date-30,'Fictional install record') on conflict do nothing;
insert into assets(id,tag,name,serial,category,site,owner,state) values
 ('20000000-0000-0000-0000-000000000006','LAP-099','Disposed legacy laptop','DEMO-099','Laptop','Wellington','IT manager','disposed') on conflict do nothing;
insert into disposals(id,asset_id,disposed_on,method,evidence,approved_by,retention_review) values
 ('70000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000006',current_date-20,'Certified destruction','Fictional certificate DEMO-099','Demo IT manager','Fictional backup retention review complete') on conflict do nothing;
