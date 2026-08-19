-- Bucket público para as imagens dos produtos (fotos das raças).
-- Upload/edição só para usuários autenticados; leitura é pública.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_storage_public_read" on storage.objects;
create policy "product_images_storage_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "product_images_storage_admin_insert" on storage.objects;
create policy "product_images_storage_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

drop policy if exists "product_images_storage_admin_update" on storage.objects;
create policy "product_images_storage_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

drop policy if exists "product_images_storage_admin_delete" on storage.objects;
create policy "product_images_storage_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');
