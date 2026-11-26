-- Chat hardening migration: additive only. It preserves existing books,
-- conversations, and messages. Legacy self/mismatched conversations are not
-- deleted; list_chat_conversations excludes them from normal chat use.

alter table public.conversations
  add column if not exists seller_avatar_url text,
  add column if not exists buyer_avatar_url text;

alter table public.messages
  add column if not exists read_by_buyer boolean not null default false,
  add column if not exists read_by_seller boolean not null default false;

create unique index if not exists conversations_book_buyer_seller_unique
  on public.conversations (book_id, buyer_id, seller_id);
create index if not exists idx_messages_conversation_unread_buyer
  on public.messages (conversation_id, read_by_buyer);
create index if not exists idx_messages_conversation_unread_seller
  on public.messages (conversation_id, read_by_seller);

-- Direct client writes could forge participant IDs or sender names. Chat
-- writes now go through the narrowly scoped functions below.
drop policy if exists "Buyers create conversations" on public.conversations;
drop policy if exists "Participants update conversations" on public.conversations;
drop policy if exists "Conversation participants send messages" on public.messages;

create or replace function public.create_or_get_chat_conversation(p_book_id text)
returns public.conversations
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id text := auth.uid()::text;
  v_book public.books%rowtype;
  v_buyer public.profiles%rowtype;
  v_seller public.profiles%rowtype;
  v_conversation public.conversations%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select * into v_book
  from public.books
  where id = p_book_id and status = 'active';
  if not found then
    raise exception 'Book is unavailable.';
  end if;
  if v_book.seller_id = v_user_id then
    raise exception 'You cannot start a conversation about your own book.';
  end if;

  select * into v_buyer from public.profiles where id = v_user_id;
  if not found then
    raise exception 'A valid BookSwap profile is required.';
  end if;
  select * into v_seller from public.profiles where id = v_book.seller_id;
  if not found then
    raise exception 'The seller profile is unavailable.';
  end if;

  insert into public.conversations (
    id, book_id, book_title, book_price, book_author, book_cover, book_photo_url,
    book_photo_alt, book_category, seller_id, seller_name, seller_initials,
    seller_color, seller_campus, seller_avatar_url, buyer_id, buyer_name,
    buyer_avatar_url, last_message, last_message_timestamp, unread_count
  ) values (
    gen_random_uuid()::text, v_book.id, v_book.title, v_book.price, v_book.author,
    v_book.cover, v_book.photo_url, v_book.photo_alt, v_book.category,
    v_seller.id, v_seller.name, upper(left(v_seller.name, 1) || coalesce(left(split_part(v_seller.name, ' ', 2), 1), '')),
    coalesce(v_seller.color, '#d6bc9b'), v_seller.campus, v_seller.avatar_url,
    v_buyer.id, v_buyer.name, v_buyer.avatar_url, 'Mulai obrolan baru',
    floor(extract(epoch from clock_timestamp()) * 1000)::bigint, 0
  )
  on conflict (book_id, buyer_id, seller_id) do update set
    seller_name = excluded.seller_name,
    seller_initials = excluded.seller_initials,
    seller_color = excluded.seller_color,
    seller_campus = excluded.seller_campus,
    seller_avatar_url = excluded.seller_avatar_url,
    buyer_name = excluded.buyer_name,
    buyer_avatar_url = excluded.buyer_avatar_url
  returning * into v_conversation;

  return v_conversation;
end;
$$;

create or replace function public.send_chat_message(p_conversation_id text, p_text text)
returns public.messages
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id text := auth.uid()::text;
  v_conversation public.conversations%rowtype;
  v_sender public.profiles%rowtype;
  v_message public.messages%rowtype;
  v_now bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_text text := btrim(p_text);
begin
  if v_user_id is null then
    raise exception 'Authentication is required.';
  end if;
  if length(v_text) < 1 or length(v_text) > 2000 then
    raise exception 'Message must contain 1 to 2000 characters.';
  end if;

  select * into v_conversation
  from public.conversations
  where id = p_conversation_id
    and (buyer_id = v_user_id or seller_id = v_user_id)
  for update;
  if not found then
    raise exception 'Conversation not found.';
  end if;

  select * into v_sender from public.profiles where id = v_user_id;
  if not found then
    raise exception 'A valid BookSwap profile is required.';
  end if;

  insert into public.messages (
    id, conversation_id, sender_id, sender_name, text, timestamp, read,
    read_by_buyer, read_by_seller
  ) values (
    gen_random_uuid()::text, v_conversation.id, v_user_id, v_sender.name,
    v_text, v_now, false,
    v_conversation.buyer_id = v_user_id,
    v_conversation.seller_id = v_user_id
  ) returning * into v_message;

  update public.conversations
  set last_message = v_text, last_message_timestamp = v_now
  where id = v_conversation.id;

  return v_message;
end;
$$;

create or replace function public.mark_chat_conversation_read(p_conversation_id text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id text := auth.uid()::text;
  v_conversation public.conversations%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.';
  end if;
  select * into v_conversation
  from public.conversations
  where id = p_conversation_id
    and (buyer_id = v_user_id or seller_id = v_user_id);
  if not found then
    raise exception 'Conversation not found.';
  end if;

  if v_conversation.buyer_id = v_user_id then
    update public.messages
    set read_by_buyer = true
    where conversation_id = v_conversation.id
      and sender_id <> v_user_id
      and read_by_buyer = false;
  else
    update public.messages
    set read_by_seller = true
    where conversation_id = v_conversation.id
      and sender_id <> v_user_id
      and read_by_seller = false;
  end if;
end;
$$;

create or replace function public.list_chat_conversations()
returns table (
  id text, book_id text, book_title text, book_price integer, book_author text,
  book_cover text, book_photo_url text, book_photo_alt text, book_category text,
  seller_id text, seller_name text, seller_initials text, seller_color text,
  seller_campus text, seller_avatar_url text, buyer_id text, buyer_name text,
  buyer_avatar_url text, last_message text, last_message_timestamp bigint,
  created_at timestamptz, counterpart_id text, counterpart_name text,
  counterpart_initials text, counterpart_color text, counterpart_campus text,
  counterpart_avatar_url text, unread_count integer
)
language sql
security definer
set search_path = public, auth
as $$
  select
    c.id, c.book_id, c.book_title, c.book_price, c.book_author, c.book_cover,
    c.book_photo_url, c.book_photo_alt, c.book_category, c.seller_id,
    c.seller_name, c.seller_initials, c.seller_color, c.seller_campus,
    c.seller_avatar_url, c.buyer_id, c.buyer_name, c.buyer_avatar_url,
    c.last_message, c.last_message_timestamp, c.created_at,
    case when c.buyer_id = auth.uid()::text then c.seller_id else c.buyer_id end,
    case when c.buyer_id = auth.uid()::text then c.seller_name else c.buyer_name end,
    case when c.buyer_id = auth.uid()::text then c.seller_initials
      else upper(left(c.buyer_name, 1) || coalesce(left(split_part(c.buyer_name, ' ', 2), 1), '')) end,
    case when c.buyer_id = auth.uid()::text then c.seller_color else coalesce(buyer_profile.color, '#d6bc9b') end,
    case when c.buyer_id = auth.uid()::text then c.seller_campus else buyer_profile.campus end,
    case when c.buyer_id = auth.uid()::text then c.seller_avatar_url else c.buyer_avatar_url end,
    coalesce(sum(case
      when c.buyer_id = auth.uid()::text and not m.read_by_buyer and m.sender_id <> auth.uid()::text then 1
      when c.seller_id = auth.uid()::text and not m.read_by_seller and m.sender_id <> auth.uid()::text then 1
      else 0 end), 0)::integer
  from public.conversations c
  join public.books b on b.id = c.book_id and b.seller_id = c.seller_id
  left join public.profiles buyer_profile on buyer_profile.id = c.buyer_id
  left join public.messages m on m.conversation_id = c.id
  where (c.buyer_id = auth.uid()::text or c.seller_id = auth.uid()::text)
    and c.buyer_id <> c.seller_id
  group by c.id, buyer_profile.color, buyer_profile.campus
  order by c.last_message_timestamp desc nulls last;
$$;

revoke all on function public.create_or_get_chat_conversation(text) from public, anon;
revoke all on function public.send_chat_message(text, text) from public, anon;
revoke all on function public.mark_chat_conversation_read(text) from public, anon;
revoke all on function public.list_chat_conversations() from public, anon;
grant execute on function public.create_or_get_chat_conversation(text) to authenticated;
grant execute on function public.send_chat_message(text, text) to authenticated;
grant execute on function public.mark_chat_conversation_read(text) to authenticated;
grant execute on function public.list_chat_conversations() to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
end;
$$;
