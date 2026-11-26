-- Bucket dan policy ini SUDAH diterapkan pada proyek BookSwap Campus.
-- File ini untuk dokumentasi/referensi; tidak perlu dijalankan ulang.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('book-covers', 'book-covers', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view book covers" on storage.objects;
create policy "Public can view book covers" on storage.objects for select to anon, authenticated using (bucket_id = 'book-covers');

drop policy if exists "Users upload own book covers" on storage.objects;
create policy "Users upload own book covers" on storage.objects for insert to authenticated with check (bucket_id = 'book-covers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update own book covers" on storage.objects;
create policy "Users update own book covers" on storage.objects for update to authenticated using (bucket_id = 'book-covers' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'book-covers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete own book covers" on storage.objects;
create policy "Users delete own book covers" on storage.objects for delete to authenticated using (bucket_id = 'book-covers' and (storage.foldername(name))[1] = auth.uid()::text);
