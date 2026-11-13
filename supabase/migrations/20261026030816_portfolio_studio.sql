-- Dedicated portfolio database only. Do not apply to unrelated projects.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create table public.authorized_admins(user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now());
alter table public.authorized_admins enable row level security;
grant select on public.authorized_admins to authenticated;
create policy admin_self on public.authorized_admins for select to authenticated using(user_id=(select auth.uid()));
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$select auth.uid() is not null and exists(select 1 from public.authorized_admins where user_id=auth.uid())$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

create table public.content_items(
 id uuid primary key default gen_random_uuid(),kind text not null check(kind in('projects','services','packages','pages','profile','settings')),
 slug text not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),draft jsonb not null default '{}',published jsonb,
 archived boolean not null default false,position integer not null default 0,updated_at timestamptz not null default now(),unique(kind,slug),
 check(jsonb_typeof(draft)='object'),check(length(draft::text)<500000));
-- A separate public snapshot ensures drafts can never leak through column grants.
create table public.published_content(id uuid primary key references public.content_items(id) on delete cascade,kind text not null,slug text not null,published jsonb not null,position integer not null,updated_at timestamptz not null);
create table public.page_versions(id uuid primary key default gen_random_uuid(),content_id uuid not null references public.content_items(id) on delete cascade,data jsonb not null,created_at timestamptz not null default now());
create index page_versions_content_created on public.page_versions(content_id,created_at desc);
create table public.media_library(id text primary key,name text not null,alt text not null default '',mime text not null check(mime in('image/webp','image/jpeg','image/png','application/pdf','video/mp4')),bytes integer not null check(bytes>0),path text not null unique,created_at timestamptz not null default now());
create table public.quote_requests(id uuid primary key default gen_random_uuid(),name text not null,email text not null,phone text not null default '',company text not null default '',intent text not null,service text not null default '',budget text not null default '',message text not null,status text not null default 'nouveau' check(status in('nouveau','en-cours','devis-envoye','gagne','perdu','archive')),notes text not null default '',history jsonb not null default '[]',created_at timestamptz not null default now());
create index quote_requests_created on public.quote_requests(created_at desc);
create table public.quote_attachments(id uuid primary key default gen_random_uuid(),request_id uuid not null references public.quote_requests(id) on delete cascade,path text not null,name text not null,created_at timestamptz not null default now());
create table private.rate_limits(key text primary key,count integer not null,reset_at timestamptz not null);
alter table private.rate_limits enable row level security;

alter table public.content_items enable row level security;
alter table public.published_content enable row level security;
alter table public.page_versions enable row level security;
alter table public.media_library enable row level security;
alter table public.quote_requests enable row level security;
alter table public.quote_attachments enable row level security;
grant select,insert,update,delete on public.content_items,public.page_versions,public.media_library,public.quote_requests,public.quote_attachments to authenticated;
grant select on public.published_content,public.media_library to anon,authenticated;
grant all on public.content_items,public.published_content,public.page_versions,public.media_library,public.quote_requests,public.quote_attachments,public.authorized_admins to service_role;
create policy content_admin on public.content_items for all to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy versions_admin on public.page_versions for all to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy published_read on public.published_content for select to anon,authenticated using(true);
create policy media_admin on public.media_library for all to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy media_public on public.media_library for select to anon,authenticated using(exists(select 1 from public.published_content p where strpos(p.published::text,'/media/'||media_library.id)>0));
create policy requests_admin on public.quote_requests for all to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy attachments_admin on public.quote_attachments for all to authenticated using((select private.is_admin())) with check((select private.is_admin()));

-- Internal trigger needs to write the public snapshot, which clients cannot mutate.
create function private.sync_publication() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.published is not null and not new.archived then
  if new.kind='projects' and (coalesce((new.published->>'editorialApproved')::boolean,false)=false or coalesce((new.published->>'rightsApproved')::boolean,false)=false) then raise exception 'Editorial and rights approval required'; end if;
  if new.published->>'locale'='en' and coalesce((new.published->>'translationApproved')::boolean,false)=false then raise exception 'Translation approval required'; end if;
  insert into public.published_content values(new.id,new.kind,new.slug,new.published,new.position,new.updated_at) on conflict(id) do update set kind=excluded.kind,slug=excluded.slug,published=excluded.published,position=excluded.position,updated_at=excluded.updated_at;
 else delete from public.published_content where id=new.id; end if;
 return new;
end $$;
revoke all on function private.sync_publication() from public;
create trigger sync_publication after insert or update on public.content_items for each row execute function private.sync_publication();

create function public.save_content(p_id uuid,p_kind text,p_slug text,p_draft jsonb,p_position integer,p_expected timestamptz default null) returns void language plpgsql security invoker set search_path='' as $$
declare previous public.content_items;
begin
 if not private.is_admin() then raise exception 'Forbidden';end if;
 select * into previous from public.content_items where id=p_id for update;
 if found then
  if p_expected is not null and previous.updated_at<>p_expected then raise exception 'Concurrent modification: reload first';end if;
  insert into public.page_versions(content_id,data) values(p_id,previous.draft);
  update public.content_items set kind=p_kind,slug=p_slug,draft=p_draft,position=p_position,updated_at=clock_timestamp() where id=p_id;
 else insert into public.content_items(id,kind,slug,draft,position) values(p_id,p_kind,p_slug,p_draft,p_position);end if;
end $$;
revoke all on function public.save_content(uuid,text,text,jsonb,integer,timestamptz) from public;
grant execute on function public.save_content(uuid,text,text,jsonb,integer,timestamptz) to authenticated;

create function private.protect_media() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from public.content_items where strpos(draft::text,'/media/'||old.id)>0 or strpos(coalesce(published::text,''),'/media/'||old.id)>0) or exists(select 1 from public.page_versions where strpos(data::text,'/media/'||old.id)>0) then raise exception 'Media is referenced'; end if;
 return old;
end $$;
revoke all on function private.protect_media() from public;
create trigger protect_media before delete on public.media_library for each row execute function private.protect_media();

create function public.update_inquiry(p_id uuid,p_status text,p_notes text) returns void language plpgsql security invoker set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Forbidden';end if;
 if length(p_notes)>20000 then raise exception 'Notes too long';end if;
 update public.quote_requests set status=p_status,notes=p_notes,history=history||jsonb_build_array(jsonb_build_object('at',now(),'status',p_status,'note','Mise à jour administrateur')) where id=p_id;
end $$;
revoke all on function public.update_inquiry(uuid,text,text) from public;
grant execute on function public.update_inquiry(uuid,text,text) to authenticated;

-- Only the server secret role can call this after Turnstile verification.
grant all on private.rate_limits to service_role;
create policy rate_service on private.rate_limits for all to service_role using(true) with check(true);
create function public.receive_inquiry(p_id uuid,p_data jsonb,p_rate_key text) returns void language plpgsql security invoker set search_path='' as $$
declare current_count integer;
begin
 if length(p_data->>'message')<20 or length(p_data->>'message')>6000 or length(p_data->>'email')>254 then raise exception 'Invalid inquiry';end if;
 insert into private.rate_limits values(p_rate_key,1,now()+interval '1 hour') on conflict(key) do update set count=case when private.rate_limits.reset_at<now() then 1 else private.rate_limits.count+1 end,reset_at=case when private.rate_limits.reset_at<now() then now()+interval '1 hour' else private.rate_limits.reset_at end returning count into current_count;
 if current_count>5 then raise exception 'Rate limit exceeded';end if;
 insert into public.quote_requests(id,name,email,phone,company,intent,service,budget,message,history) values(p_id,p_data->>'name',p_data->>'email',coalesce(p_data->>'phone',''),coalesce(p_data->>'company',''),p_data->>'intent',coalesce(p_data->>'service',''),coalesce(p_data->>'budget',''),p_data->>'message',jsonb_build_array(jsonb_build_object('at',now(),'status','nouveau','note','Demande reçue')));
end $$;
revoke all on function public.receive_inquiry(uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.receive_inquiry(uuid,jsonb,text) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('portfolio-media','portfolio-media',false,4194304,array['image/webp','image/jpeg','image/png','application/pdf','video/mp4']),('quote-attachments','quote-attachments',false,4194304,array['application/pdf','image/jpeg','image/png']) on conflict(id) do nothing;
create policy portfolio_storage_read on storage.objects for select to anon,authenticated using(bucket_id='portfolio-media' and exists(select 1 from public.media_library m where m.path=name));
create policy portfolio_storage_admin on storage.objects for all to authenticated using(bucket_id in('portfolio-media','quote-attachments') and (select private.is_admin())) with check(bucket_id in('portfolio-media','quote-attachments') and (select private.is_admin()));
