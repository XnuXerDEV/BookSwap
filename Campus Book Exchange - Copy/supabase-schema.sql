-- BookSwap Campus - skema Supabase yang sudah diterapkan pada proyek cloud.
-- Data etalase contoh (20 buku) sudah dimasukkan ke proyek Supabase BookSwap Campus.
-- Jalankan file ini hanya pada proyek Supabase BARU; jangan jalankan pada proyek yang
-- sudah memiliki tabel dan kebijakan yang sama kecuali memahami dampaknya.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id text primary key,
  name text not null,
  email text not null,
  campus text,
  phone text,
  bio text,
  avatar_url text,
  color text default '#d2c1a6',
  created_at timestamptz not null default now()
);

create table if not exists public.books (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  author text not null,
  category text not null,
  condition text not null,
  price integer not null check (price between 1000 and 2000000),
  original_price integer,
  description text not null,
  campus text not null,
  swap boolean default false,
  photo_url text,
  photo_alt text,
  seller_id text not null,
  seller_name text not null,
  seller_initials text default 'TK',
  seller_color text default '#d6bc9b',
  cover text default 'creative',
  status text default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id text primary key,
  book_id text not null,
  book_title text not null,
  book_price integer not null,
  book_author text,
  book_cover text default 'creative',
  book_photo_url text,
  book_photo_alt text,
  book_category text,
  seller_id text not null,
  seller_name text not null,
  seller_initials text default 'TK',
  seller_color text default '#d6bc9b',
  seller_campus text,
  buyer_id text not null,
  buyer_name text not null,
  last_message text,
  last_message_timestamp bigint,
  unread_count integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id text primary key,
  conversation_id text not null references public.conversations(id) on delete cascade,
  sender_id text not null,
  sender_name text not null,
  text text not null,
  timestamp bigint not null,
  read boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_books_status_created on public.books(status, created_at desc);
create index if not exists idx_messages_conversation on public.messages(conversation_id, timestamp);
create index if not exists idx_conversations_participants on public.conversations(buyer_id, seller_id);

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Profiles read own" on public.profiles;
create policy "Profiles read own" on public.profiles for select to authenticated using (id = auth.uid()::text);
drop policy if exists "Profiles insert own" on public.profiles;
create policy "Profiles insert own" on public.profiles for insert to authenticated with check (id = auth.uid()::text);
drop policy if exists "Profiles update own" on public.profiles;
create policy "Profiles update own" on public.profiles for update to authenticated using (id = auth.uid()::text) with check (id = auth.uid()::text);

drop policy if exists "Books public read active" on public.books;
create policy "Books public read active" on public.books for select to anon, authenticated using (status = 'active' or seller_id = auth.uid()::text);
drop policy if exists "Books authenticated insert own" on public.books;
create policy "Books authenticated insert own" on public.books for insert to authenticated with check (seller_id = auth.uid()::text);
drop policy if exists "Books seller update own" on public.books;
create policy "Books seller update own" on public.books for update to authenticated using (seller_id = auth.uid()::text) with check (seller_id = auth.uid()::text);
drop policy if exists "Books seller delete own" on public.books;
create policy "Books seller delete own" on public.books for delete to authenticated using (seller_id = auth.uid()::text);

drop policy if exists "Conversations participants read" on public.conversations;
create policy "Conversations participants read" on public.conversations for select to authenticated using (buyer_id = auth.uid()::text or seller_id = auth.uid()::text);
drop policy if exists "Buyers create conversations" on public.conversations;
create policy "Buyers create conversations" on public.conversations for insert to authenticated with check (buyer_id = auth.uid()::text);
drop policy if exists "Participants update conversations" on public.conversations;
create policy "Participants update conversations" on public.conversations for update to authenticated using (buyer_id = auth.uid()::text or seller_id = auth.uid()::text) with check (buyer_id = auth.uid()::text or seller_id = auth.uid()::text);

drop policy if exists "Message participants read" on public.messages;
create policy "Message participants read" on public.messages for select to authenticated using (
  exists (select 1 from public.conversations c where c.id = conversation_id and (c.buyer_id = auth.uid()::text or c.seller_id = auth.uid()::text))
);
drop policy if exists "Conversation participants send messages" on public.messages;
create policy "Conversation participants send messages" on public.messages for insert to authenticated with check (
  sender_id = auth.uid()::text and exists (
    select 1 from public.conversations c where c.id = conversation_id and (c.buyer_id = auth.uid()::text or c.seller_id = auth.uid()::text)
  )
);

create or replace function public.handle_new_bookswap_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, campus, phone, bio, color)
  values (
    new.id::text,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'campus', 'Universitas Muhammadiyah Cirebon'),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    'Mahasiswa pencinta buku di SwapBook.',
    '#d2c1a6'
  ) on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_bookswap on auth.users;
create trigger on_auth_user_created_bookswap after insert on auth.users
for each row execute procedure public.handle_new_bookswap_user();

-- This SECURITY DEFINER function is invoked only by the trigger above. It
-- must not be callable as a public RPC endpoint.
revoke execute on function public.handle_new_bookswap_user() from public, anon, authenticated;
