-- Enable RLS for storage.objects
alter table storage.objects enable row level security;

-- Create policy to allow public read access to emoji-images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'emoji-images' );

-- Create policy to allow authenticated uploads to emoji-images
create policy "Allow Uploads"
  on storage.objects for insert
  with check ( bucket_id = 'emoji-images' );

-- Create policy to allow authenticated updates to emoji-images
create policy "Allow Updates"
  on storage.objects for update
  using ( bucket_id = 'emoji-images' );

-- Create policy to allow authenticated deletes from emoji-images
create policy "Allow Deletes"
  on storage.objects for delete
  using ( bucket_id = 'emoji-images' );

-- Create policy to allow inserts to emoji_config table
create policy "Allow emoji config inserts"
  on public.emoji_config for insert
  with check (true);

-- Create policy to allow updates to emoji_config table
create policy "Allow emoji config updates"
  on public.emoji_config for update
  using (true);

-- Create policy to allow deletes from emoji_config table
create policy "Allow emoji config deletes"
  on public.emoji_config for delete
  using (true);

-- Create policy to allow selects from emoji_config table
create policy "Allow emoji config selects"
  on public.emoji_config for select
  using (true); 