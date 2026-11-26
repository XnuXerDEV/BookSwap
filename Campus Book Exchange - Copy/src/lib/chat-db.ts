import { type AuthUser } from './auth'
import type { BookView } from './books'
import { isSupabaseConfigured, supabase } from './supabase'

export type ChatMessage = {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  text: string
  timestamp: number
  read: boolean
}

export type ChatConversation = {
  id: string; bookId: string; bookTitle: string; bookPrice: number; bookAuthor: string
  bookCover: string; bookPhotoURL: string | null; bookPhotoAlt: string; bookCategory: string
  sellerId: string; sellerName: string; sellerInitials: string; sellerColor: string; sellerCampus: string; sellerAvatarURL: string | null
  buyerId: string; buyerName: string; buyerAvatarURL: string | null
  counterpartId: string; counterpartName: string; counterpartInitials: string; counterpartColor: string; counterpartCampus: string; counterpartAvatarURL: string | null
  lastMessage: string; lastMessageTimestamp: number; unreadCount: number; createdAt: number
}

type ChatResult<T> = { success: true; data: T } | { success: false; error: string }
const listeners = new Set<() => void>()

export function notifyListeners() {
  listeners.forEach((listener) => {
    try { listener() } catch (error) { console.error('BookSwap chat listener error:', error) }
  })
}

export function subscribeToChat(callback: () => void): () => void {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

export function subscribeToChatRealtime(): () => void {
  if (!isSupabaseConfigured) return () => {}
  const channel = supabase
    .channel('bookswap-chat-notifications')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, notifyListeners)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, notifyListeners)
    .subscribe()
  return () => { void supabase.removeChannel(channel) }
}

function mapConversation(row: any): ChatConversation {
  return {
    id: row.id, bookId: row.book_id, bookTitle: row.book_title, bookPrice: row.book_price,
    bookAuthor: row.book_author || '', bookCover: row.book_cover || 'creative',
    bookPhotoURL: row.book_photo_url || null, bookPhotoAlt: row.book_photo_alt || `Sampul ${row.book_title}`,
    bookCategory: row.book_category || 'Buku kuliah', sellerId: row.seller_id,
    sellerName: row.seller_name, sellerInitials: row.seller_initials || 'TK',
    sellerColor: row.seller_color || '#d6bc9b', sellerCampus: row.seller_campus || 'Kampus',
    sellerAvatarURL: row.seller_avatar_url || null, buyerId: row.buyer_id,
    buyerName: row.buyer_name, buyerAvatarURL: row.buyer_avatar_url || null,
    counterpartId: row.counterpart_id, counterpartName: row.counterpart_name,
    counterpartInitials: row.counterpart_initials || 'TK', counterpartColor: row.counterpart_color || '#d6bc9b',
    counterpartCampus: row.counterpart_campus || 'Kampus', counterpartAvatarURL: row.counterpart_avatar_url || null,
    lastMessage: row.last_message || '', lastMessageTimestamp: Number(row.last_message_timestamp || 0),
    unreadCount: Number(row.unread_count || 0), createdAt: new Date(row.created_at).getTime(),
  }
}

async function getAuthenticatedUser(): Promise<ChatResult<AuthUser>> {
  if (!isSupabaseConfigured) return { success: false, error: 'Koneksi Supabase belum dikonfigurasi.' }
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return { success: false, error: 'Sesi login tidak aktif. Silakan masuk kembali.' }
  return { success: true, data: {
    id: data.user.id, name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Pengguna BookSwap',
    initials: '', campus: data.user.user_metadata?.campus || '', email: data.user.email || '', color: '', avatarURL: null,
  } }
}

export async function fetchConversationsFromSupabase(): Promise<ChatConversation[]> {
  const user = await getAuthenticatedUser()
  if (!user.success) return []
  const { data, error } = await supabase.rpc('list_chat_conversations')
  if (error) { console.error('Supabase fetch conversations error:', error); return [] }
  return (data || []).map(mapConversation)
}

export async function fetchMessagesFromSupabase(conversationId: string): Promise<ChatMessage[]> {
  const user = await getAuthenticatedUser()
  if (!user.success) return []
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, sender_name, text, timestamp, read_by_buyer, read_by_seller')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true })
  if (error) { console.error('Supabase fetch messages error:', error); return [] }
  const conversation = (await fetchConversationsFromSupabase()).find((item) => item.id === conversationId)
  if (!conversation) return []
  const isBuyer = conversation.buyerId === user.data.id
  return (data || []).map((message: any) => ({
    id: message.id, conversationId: message.conversation_id, senderId: message.sender_id,
    senderName: message.sender_name, text: message.text, timestamp: Number(message.timestamp),
    read: isBuyer ? Boolean(message.read_by_buyer) : Boolean(message.read_by_seller),
  }))
}

export async function createOrGetSupabaseConversation(book: Pick<BookView, 'id'>): Promise<ChatResult<ChatConversation>> {
  const user = await getAuthenticatedUser()
  if (!user.success) return user
  const { data, error } = await supabase.rpc('create_or_get_chat_conversation', { p_book_id: String(book.id) })
  if (error || !data) return { success: false, error: error?.message || 'Percakapan tidak dapat dibuat.' }
  const conversation = (await fetchConversationsFromSupabase()).find((item) => item.id === data.id)
  if (!conversation) return { success: false, error: 'Percakapan dibuat, tetapi tidak dapat dibaca dari akun ini.' }
  notifyListeners()
  return { success: true, data: conversation }
}

export async function sendSupabaseMessage(conversationId: string, text: string): Promise<ChatResult<ChatMessage>> {
  const user = await getAuthenticatedUser()
  if (!user.success) return user
  const { data, error } = await supabase.rpc('send_chat_message', { p_conversation_id: conversationId, p_text: text })
  if (error || !data) return { success: false, error: error?.message || 'Pesan gagal disimpan.' }
  const conversation = (await fetchConversationsFromSupabase()).find((item) => item.id === conversationId)
  if (!conversation) return { success: false, error: 'Pesan tersimpan, tetapi percakapan tidak dapat dimuat.' }
  notifyListeners()
  return { success: true, data: {
    id: data.id, conversationId: data.conversation_id, senderId: data.sender_id,
    senderName: data.sender_name, text: data.text, timestamp: Number(data.timestamp),
    read: conversation.buyerId === user.data.id ? Boolean(data.read_by_buyer) : Boolean(data.read_by_seller),
  } }
}

export async function markConversationAsRead(conversationId: string): Promise<void> {
  const user = await getAuthenticatedUser()
  if (!user.success) return
  const { error } = await supabase.rpc('mark_chat_conversation_read', { p_conversation_id: conversationId })
  if (error) console.error('Supabase mark conversation read error:', error)
  else notifyListeners()
}

export async function getTotalUnreadCount(): Promise<number> {
  return (await fetchConversationsFromSupabase()).reduce((total, conversation) => total + conversation.unreadCount, 0)
}
