-- Archifex SaaS foundation: tenant isolation and 30-day trial enforcement
--
-- Read access: always available to members of the workspace.
-- Write access: active subscription OR a non-expired 30-day trial with an
-- owner/admin/editor role. Expired trials can still read and export metadata,
-- but uploads and metadata changes are blocked by RLS.

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.workspace_role(target_workspace_id uuid)
returns public.workspace_role
language sql
stable
security definer
set search_path = public
as $$
  select wm.role
  from public.workspace_members wm
  where wm.workspace_id = target_workspace_id
    and wm.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'admin')
  );
$$;

create or replace function public.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = target_workspace_id
      and w.owner_id = auth.uid()
  );
$$;

create or replace function public.workspace_owner_id(target_workspace_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select w.owner_id
  from public.workspaces w
  where w.id = target_workspace_id
  limit 1;
$$;

create or replace function public.workspace_can_write(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    join public.workspaces w on w.id = wm.workspace_id
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'admin', 'editor')
      and (
        w.subscription_status = 'active'
        or (w.subscription_status = 'trialing' and now() <= w.trial_ends_at)
      )
  );
$$;

create or replace function public.create_workspace(p_name text, p_slug text default null)
returns public.workspaces
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  base_slug text;
  candidate_slug text;
  suffix integer := 0;
  created_workspace public.workspaces;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '28000';
  end if;

  if p_name is null or char_length(trim(p_name)) < 2 then
    raise exception 'Workspace name must contain at least two characters.' using errcode = '22023';
  end if;

  base_slug := lower(regexp_replace(coalesce(nullif(trim(p_slug), ''), p_name), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  if base_slug is null or base_slug = '' then
    base_slug := 'workspace';
  end if;

  candidate_slug := base_slug;
  while exists (select 1 from public.workspaces w where w.slug = candidate_slug) loop
    suffix := suffix + 1;
    candidate_slug := base_slug || '-' || suffix::text;
  end loop;

  insert into public.workspaces (name, slug, owner_id)
  values (trim(p_name), candidate_slug, current_user_id)
  returning * into created_workspace;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (created_workspace.id, current_user_id, 'owner');

  insert into public.categories (workspace_id, name, slug, created_by)
  values (created_workspace.id, 'عام', 'general', current_user_id);

  return created_workspace;
end;
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.categories enable row level security;
alter table public.documents enable row level security;
alter table public.archive_records enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "workspaces_select_member"
on public.workspaces for select
to authenticated
using (public.is_workspace_member(id));

create policy "workspaces_update_owner"
on public.workspaces for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "workspace_members_select_teammates"
on public.workspace_members for select
to authenticated
using (user_id = auth.uid() or public.is_workspace_member(workspace_id));

-- Only an owner may grant the owner role. Admins can manage editors/viewers,
-- but they cannot promote themselves or change the owner's membership.
create policy "workspace_members_insert_admin"
on public.workspace_members for insert
to authenticated
with check (
  public.is_workspace_admin(workspace_id)
  and public.workspace_can_write(workspace_id)
  and (role <> 'owner' or public.is_workspace_owner(workspace_id))
);

create policy "workspace_members_update_admin"
on public.workspace_members for update
to authenticated
using (
  public.is_workspace_admin(workspace_id)
  and public.workspace_can_write(workspace_id)
  and (
    user_id <> public.workspace_owner_id(workspace_id)
    or public.is_workspace_owner(workspace_id)
  )
)
with check (
  public.is_workspace_admin(workspace_id)
  and public.workspace_can_write(workspace_id)
  and (role <> 'owner' or public.is_workspace_owner(workspace_id))
  and (
    user_id <> public.workspace_owner_id(workspace_id)
    or public.is_workspace_owner(workspace_id)
  )
);

create policy "workspace_members_delete_admin"
on public.workspace_members for delete
to authenticated
using (
  public.is_workspace_admin(workspace_id)
  and public.workspace_can_write(workspace_id)
  and (
    user_id <> public.workspace_owner_id(workspace_id)
    or public.is_workspace_owner(workspace_id)
  )
);

create policy "categories_select_member"
on public.categories for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "categories_insert_writer"
on public.categories for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and public.workspace_can_write(workspace_id)
  and created_by = auth.uid()
);

create policy "categories_update_writer"
on public.categories for update
to authenticated
using (public.is_workspace_member(workspace_id) and public.workspace_can_write(workspace_id))
with check (
  public.is_workspace_member(workspace_id)
  and public.workspace_can_write(workspace_id)
);

create policy "categories_delete_writer"
on public.categories for delete
to authenticated
using (public.is_workspace_member(workspace_id) and public.workspace_can_write(workspace_id));

create policy "documents_select_member"
on public.documents for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "documents_insert_writer"
on public.documents for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and public.workspace_can_write(workspace_id)
  and uploaded_by = auth.uid()
);

create policy "documents_update_writer"
on public.documents for update
to authenticated
using (public.is_workspace_member(workspace_id) and public.workspace_can_write(workspace_id))
with check (
  public.is_workspace_member(workspace_id)
  and public.workspace_can_write(workspace_id)
);

create policy "documents_delete_writer"
on public.documents for delete
to authenticated
using (public.is_workspace_member(workspace_id) and public.workspace_can_write(workspace_id));

create policy "archive_records_select_member"
on public.archive_records for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "archive_records_insert_writer"
on public.archive_records for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and public.workspace_can_write(workspace_id)
  and archived_by = auth.uid()
);

create policy "audit_logs_select_member"
on public.audit_logs for select
to authenticated
using (public.is_workspace_member(workspace_id));

-- Audit rows are written only by security-definer triggers. Authenticated
-- clients may read them but cannot forge or edit audit history.

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke all on all tables in schema public from anon;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.ensure_document_tenant_consistency() from public, anon, authenticated;
revoke all on function public.ensure_archive_record_tenant_consistency() from public, anon, authenticated;
revoke all on function public.prevent_tenant_move() from public, anon, authenticated;
revoke all on function public.protect_workspace_billing_fields() from public, anon, authenticated;
revoke all on function public.log_document_activity() from public, anon, authenticated;

revoke all on function public.is_workspace_member(uuid) from public, anon;
revoke all on function public.workspace_role(uuid) from public, anon;
revoke all on function public.is_workspace_admin(uuid) from public, anon;
revoke all on function public.is_workspace_owner(uuid) from public, anon;
revoke all on function public.workspace_owner_id(uuid) from public, anon;
revoke all on function public.workspace_can_write(uuid) from public, anon;
revoke all on function public.create_workspace(text, text) from public, anon;

grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.workspace_role(uuid) to authenticated;
grant execute on function public.is_workspace_admin(uuid) to authenticated;
grant execute on function public.is_workspace_owner(uuid) to authenticated;
grant execute on function public.workspace_owner_id(uuid) to authenticated;
grant execute on function public.workspace_can_write(uuid) to authenticated;
grant execute on function public.create_workspace(text, text) to authenticated;
