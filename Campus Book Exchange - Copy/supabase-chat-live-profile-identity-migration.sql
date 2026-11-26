-- Always present chat participant identity from the current profile record,
-- while retaining conversation snapshots as a fallback for older records.
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
    coalesce(seller_profile.name, c.seller_name),
    upper(left(coalesce(seller_profile.name, c.seller_name), 1) || coalesce(left(split_part(coalesce(seller_profile.name, c.seller_name), ' ', 2), 1), '')),
    coalesce(seller_profile.color, c.seller_color, '#d6bc9b'),
    coalesce(seller_profile.campus, c.seller_campus),
    coalesce(seller_profile.avatar_url, c.seller_avatar_url),
    c.buyer_id, coalesce(buyer_profile.name, c.buyer_name),
    coalesce(buyer_profile.avatar_url, c.buyer_avatar_url),
    c.last_message, c.last_message_timestamp, c.created_at,
    case when c.buyer_id = auth.uid()::text then c.seller_id else c.buyer_id end,
    case when c.buyer_id = auth.uid()::text then coalesce(seller_profile.name, c.seller_name) else coalesce(buyer_profile.name, c.buyer_name) end,
    case when c.buyer_id = auth.uid()::text then upper(left(coalesce(seller_profile.name, c.seller_name), 1) || coalesce(left(split_part(coalesce(seller_profile.name, c.seller_name), ' ', 2), 1), '')) else upper(left(coalesce(buyer_profile.name, c.buyer_name), 1) || coalesce(left(split_part(coalesce(buyer_profile.name, c.buyer_name), ' ', 2), 1), '')) end,
    case when c.buyer_id = auth.uid()::text then coalesce(seller_profile.color, c.seller_color, '#d6bc9b') else coalesce(buyer_profile.color, '#d6bc9b') end,
    case when c.buyer_id = auth.uid()::text then coalesce(seller_profile.campus, c.seller_campus) else buyer_profile.campus end,
    case when c.buyer_id = auth.uid()::text then coalesce(seller_profile.avatar_url, c.seller_avatar_url) else coalesce(buyer_profile.avatar_url, c.buyer_avatar_url) end,
    coalesce(sum(case
      when c.buyer_id = auth.uid()::text and not m.read_by_buyer and m.sender_id <> auth.uid()::text then 1
      when c.seller_id = auth.uid()::text and not m.read_by_seller and m.sender_id <> auth.uid()::text then 1
      else 0 end), 0)::integer
  from public.conversations c
  join public.books b on b.id = c.book_id and b.seller_id = c.seller_id
  left join public.profiles seller_profile on seller_profile.id = c.seller_id
  left join public.profiles buyer_profile on buyer_profile.id = c.buyer_id
  left join public.messages m on m.conversation_id = c.id
  where (c.buyer_id = auth.uid()::text or c.seller_id = auth.uid()::text)
    and c.buyer_id <> c.seller_id
  group by c.id, seller_profile.name, seller_profile.color, seller_profile.campus,
    seller_profile.avatar_url, buyer_profile.name, buyer_profile.color,
    buyer_profile.campus, buyer_profile.avatar_url
  order by c.last_message_timestamp desc nulls last;
$$;
