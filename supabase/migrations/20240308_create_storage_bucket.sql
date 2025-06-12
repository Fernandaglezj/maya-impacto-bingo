-- Create the emoji-images bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('emoji-images', 'emoji-images', true)
on conflict (id) do nothing;
 
-- Enable public access to the bucket
update storage.buckets
set public = true
where id = 'emoji-images'; 