-- Archifex Storage isolation.
-- Object path contract: {workspace_id}/{document_id}/{file_name}
-- The first folder is the tenant key, checked by the same membership and trial
-- functions used for database rows.

create or replace function public.safe_storage_workspace_id(object_name text)
returns uuid
language plpgsql
immutable
security definer
set search_path = public, storage
as $$
begin
  return ((storage.foldername(object_name))[1])::uuid;
exception when others then
  return null;
end;
$$;

revoke all on function public.safe_storage_workspace_id(text) from public, anon;
grant execute on function public.safe_storage_workspace_id(text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('archifex-documents', 'archifex-documents', false, 52428800, null)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit;

drop policy if exists "archifex_documents_read" on storage.objects;
create policy "archifex_documents_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'archifex-documents'
  and public.is_workspace_member(public.safe_storage_workspace_id(name))
);

drop policy if exists "archifex_documents_insert" on storage.objects;
create policy "archifex_documents_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'archifex-documents'
  and public.workspace_can_write(public.safe_storage_workspace_id(name))
);

drop policy if exists "archifex_documents_update" on storage.objects;
create policy "archifex_documents_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'archifex-documents'
  and public.workspace_can_write(public.safe_storage_workspace_id(name))
)
with check (
  bucket_id = 'archifex-documents'
  and public.workspace_can_write(public.safe_storage_workspace_id(name))
);

drop policy if exists "archifex_documents_delete" on storage.objects;
create policy "archifex_documents_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'archifex-documents'
  and public.workspace_can_write(public.safe_storage_workspace_id(name))
);
