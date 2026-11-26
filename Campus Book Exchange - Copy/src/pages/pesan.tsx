import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '@/components/bookswap/artwork'
import { getCurrentUser, subscribeAuth, type UserAccount } from '@/lib/auth'
import {
  fetchConversationsFromSupabase,
  fetchMessagesFromSupabase,
  markConversationAsRead,
  sendSupabaseMessage,
  subscribeToChat,
  type ChatConversation,
  type ChatMessage,
} from '@/lib/chat-db'
import {
  formatConversationTime,
  formatDateGroupHeader,
  formatMessageTime,
} from '@/lib/chat-utils'
import { rupiah } from '@/lib/book-options'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export default function PesanPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(getCurrentUser())
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleAuth = () => {
      setCurrentUser(getCurrentUser())
    }
    const unsub = subscribeAuth(handleAuth)
    return () => unsub()
  }, [])

  // Load conversations from Supabase
  const loadConversations = () => {
    fetchConversationsFromSupabase().then((data) => {
      setConversations(data)
      setLoading(false)
    })
  }

  // Load messages for active conversation
  const loadMessages = (convId: string) => {
    fetchMessagesFromSupabase(convId).then((data) => {
      setMessages(data)
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    })
  }

  useEffect(() => {
    loadConversations()
    const unsub = subscribeToChat(loadConversations)
    return () => unsub()
  }, [])

  useEffect(() => {
    if (id) {
      loadMessages(id)
      void markConversationAsRead(id).then(loadConversations)

      // Supabase real-time message subscription if configured
      if (isSupabaseConfigured) {
        const channel = supabase
          .channel(`messages:${id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
            (payload) => {
              const newMsg: ChatMessage = {
                id: payload.new.id,
                conversationId: payload.new.conversation_id,
                senderId: payload.new.sender_id,
                senderName: payload.new.sender_name,
                text: payload.new.text,
                timestamp: Number(payload.new.timestamp),
                read: Boolean(payload.new.read),
              }
              setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]))
              void markConversationAsRead(id).then(loadConversations)
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
              }, 50)
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      }
    }
  }, [id])

  const activeConv = id ? conversations.find((c) => c.id === id) : undefined

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase()
    return (
      c.counterpartName.toLowerCase().includes(q) ||
      c.bookTitle.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q) ||
      c.counterpartCampus.toLowerCase().includes(q)
    )
  })

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim()
    if (!content || !id || !currentUser) return

    setSendError(null)
    const result = await sendSupabaseMessage(id, content)
    if (!result.success) {
      setSendError(result.error)
      return
    }
    setMessages((prev) => (prev.some((message) => message.id === result.data.id) ? prev : [...prev, result.data]))
    setInputText('')
    loadConversations()

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickReplies = [
    'Halo, apakah bukunya masih ada?',
    'Bisa nego harganya kak?',
    'Bisa COD di kampus hari ini?',
    'Apakah bisa tukar dengan buku lain?',
  ]

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="rounded-2xl border border-[#e7e7de] bg-[#fffef9] p-8 shadow-sm">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#edf0e5] text-[#244e3e]">
            <Icon name="lock" size={32} />
          </span>
          <span className="eyebrow mx-auto justify-center">FITUR KHUSUS PENGGUNA TERDAFTAR</span>
          <h2 className="mt-2 text-2xl font-bold text-[#242c27]">Masuk untuk Membuka Obrolan</h2>
          <p className="mt-3 text-xs leading-relaxed text-[#7e817a]">
            Fitur Chat Penjual dan Kotak Pesan terhubung langsung ke Cloud Database Supabase dan hanya dapat diakses setelah login.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Link
              to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
              className="button button-green flex items-center justify-center gap-2 py-2.5 px-6 text-xs font-semibold"
            >
              <span>Masuk Sekarang</span>
              <Icon name="arrow" size={15} />
            </Link>
            <Link
              to={`/signup?redirect=${encodeURIComponent(location.pathname)}`}
              className="button button-outline flex items-center justify-center py-2.5 px-6 text-xs font-semibold"
            >
              Daftar Akun Baru
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6 md:py-10">
      {/* Page Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow section-eyebrow">OBROLAN &amp; TRANSAKSI KAMPUS</div>
          <h1 className="catalog-heading text-2xl md:text-3xl font-semibold">
            Kotak Pesan Penjual
            <span className="heading-dot">✳</span>
          </h1>
          <p className="mt-1 text-xs text-[#8a8f80]">
            Database Cloud Supabase aktif (bebas data dummy).
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[#edf0e5] px-3.5 py-1.5 text-xs text-[#4c604d]">
          <span className="h-2 w-2 rounded-full bg-[#52775c]" />
          <span>Sebagai: <strong>{currentUser.name}</strong> ({currentUser.campus})</span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="grid h-[720px] max-h-[82vh] overflow-hidden rounded-xl border border-[#e7e7de] bg-[#fffef9] shadow-xs md:grid-cols-[340px_1fr] lg:grid-cols-[380px_1fr]">
        
        {/* Left Pane: Inbox / Conversation List */}
        <aside
          className={`flex h-full flex-col border-r border-[#e7e7de] bg-[#fdfcf8] ${
            id ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Inbox Search Bar */}
          <div className="border-b border-[#e7e7de] p-3.5">
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3 text-[#87917e]">
                <Icon name="search" size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari percakapan..."
                className="w-full rounded-lg border border-[#e2e3d9] bg-[#fffefb] py-2 pr-3 pl-9 text-xs text-[#344b3b] placeholder-[#9a9c92] outline-none transition focus:border-[#52775c]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-[#9a9c92] hover:text-[#344b3b]"
                >
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex h-40 items-center justify-center text-xs text-[#8e907b]">
                Memuat percakapan...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center p-6 text-center text-[#8e907b]">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0eee3] text-[#63805a]">
                  <Icon name="mail" size={24} />
                </span>
                <p className="text-xs font-semibold">Belum ada obrolan</p>
                <p className="mt-1 text-[11px] text-[#9a9d90]">
                  {searchQuery
                    ? 'Tidak ditemukan percakapan yang cocok dengan pencarian.'
                    : 'Pilih buku di etalase dan klik "Chat Penjual" untuk memulai percakapan.'}
                </p>
                <Link
                  to="/etalase"
                  className="button button-green mt-4 px-3 py-1.5 text-xs"
                >
                  Buka Etalase <Icon name="arrow" size={14} />
                </Link>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === id
                return (
                  <button
                    key={conv.id}
                    onClick={() => navigate(`/pesan/${conv.id}`)}
                    className={`flex w-full items-start gap-3 border-b border-[#f0f0e7] p-3.5 text-left transition ${
                      isActive
                        ? 'bg-[#edf0e5]'
                        : 'hover:bg-[#f6f5ed]'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <span
                        className="flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold text-[#504b40] shadow-xs"
                        style={{ background: conv.counterpartColor }}
                      >
                        {conv.counterpartAvatarURL ? <img src={conv.counterpartAvatarURL} alt={conv.counterpartName} className="h-full w-full object-cover" /> : conv.counterpartInitials}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-xs font-semibold text-[#242c27]">
                          {conv.counterpartName}
                        </span>
                        <span className="shrink-0 text-[10px] text-[#929788]">
                          {formatConversationTime(conv.lastMessageTimestamp)}
                        </span>
                      </div>

                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#52775c]">
                        <Icon name="book" size={12} />
                        <span className="truncate font-medium">{conv.bookTitle}</span>
                        <span className="shrink-0 text-[10px] font-semibold text-[#c0543f]">
                          · {rupiah(conv.bookPrice)}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-1 text-[11px] text-[#858b7d]">
                        {conv.lastMessage || 'Obrolan baru'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="mt-1 inline-flex min-w-4 items-center justify-center rounded-full bg-[#c0543f] px-1 text-[9px] font-bold text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* Right Pane: Active Chat Room or Empty State */}
        <section
          className={`flex h-full flex-col bg-[#fcfbf7] ${
            !id ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConv ? (
            <>
              {/* Chat Room Top Bar */}
              <div className="flex items-center justify-between border-b border-[#e7e7de] bg-[#fffef9] px-4 py-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/pesan')}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e7e7de] bg-[#f8f6ec] text-[#244e3e] transition hover:bg-[#edf0e5] md:hidden"
                    aria-label="Kembali ke inbox"
                  >
                    <Icon name="back" size={16} />
                  </button>

                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[#504b40]"
                    style={{ background: activeConv.counterpartColor }}
                  >
                    {activeConv.counterpartAvatarURL ? <img src={activeConv.counterpartAvatarURL} alt={activeConv.counterpartName} className="h-full w-full object-cover" /> : activeConv.counterpartInitials}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-[#242c27]">
                        {activeConv.counterpartName}
                      </h2>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[#858b7d]">
                      <Icon name="pin" size={11} />
                      <span>{activeConv.counterpartCampus}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/etalase"
                    className="hidden items-center gap-1.5 rounded-md border border-[#dedfd5] px-2.5 py-1 text-xs font-medium text-[#4f6047] transition hover:bg-[#edf0e5] sm:flex"
                  >
                    <Icon name="search" size={13} /> Etalase
                  </Link>
                </div>
              </div>

              {/* Book Context Banner */}
              <div className="flex items-center justify-between gap-3 border-b border-[#e7e7de] bg-[#f6f5ec] px-4 py-2.5 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden rounded bg-[#ebe6d8] shadow-xs">
                    {activeConv.bookPhotoURL ? (
                      <img
                        src={activeConv.bookPhotoURL}
                        alt={activeConv.bookPhotoAlt || activeConv.bookTitle}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-0.5 text-[#244e3e]">
                        <Icon name="book" size={16} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate font-semibold text-[#244e3e]">
                      {activeConv.bookTitle}
                    </span>
                    <span className="text-[10px] text-[#878d7e]">
                      Penulis: {activeConv.bookAuthor} ·{' '}
                      <strong className="text-[#a54935]">{rupiah(activeConv.bookPrice)}</strong>
                    </span>
                  </div>
                </div>

                <Link
                  to="/etalase"
                  className="shrink-0 text-[11px] font-semibold text-[#244e3e] underline hover:text-[#36654f]"
                >
                  Lihat Buku ↗
                </Link>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
                <div className="mx-auto my-2 max-w-md rounded-lg border border-[#e4e7db] bg-[#edf2e6] p-2.5 text-center text-[10px] leading-relaxed text-[#51654e]">
                  🛡️ <strong>Tips Transaksi Aman:</strong> Janjian COD di tempat umum kampus. Periksa kondisi buku sebelum pembayaran.
                </div>

                {messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#8c9182]">
                    Belum ada pesan dalam percakapan ini. Kirim pesan pertamamu di bawah.
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.senderId === currentUser.id
                    const prevMsg = messages[index - 1]
                    const showDateHeader =
                      !prevMsg ||
                      new Date(prevMsg.timestamp).toDateString() !==
                        new Date(msg.timestamp).toDateString()

                    return (
                      <div key={msg.id}>
                        {showDateHeader && (
                          <div className="my-3 flex items-center justify-center">
                            <span className="rounded-full bg-[#eeeadd] px-3 py-1 text-[10px] font-medium text-[#7a8172]">
                              {formatDateGroupHeader(msg.timestamp)}
                            </span>
                          </div>
                        )}

                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {!isMe && (
                            <span className="mb-1 text-[10px] font-medium text-[#798070]">
                              {msg.senderName}
                            </span>
                          )}

                          <div
                            className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                              isMe
                                ? 'rounded-br-xs bg-[#244e3e] text-white'
                                : 'rounded-bl-xs border border-[#e2e4d8] bg-[#ffffff] text-[#242c27]'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                            <div
                              className={`mt-1.5 flex items-center justify-end gap-1 text-[9px] ${
                                isMe ? 'text-[#c6d7ce]' : 'text-[#969b8b]'
                              }`}
                            >
                              <span>{formatMessageTime(msg.timestamp)}</span>
                              {isMe && <span>✓✓</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Chips */}
              <div className="border-t border-[#f0f0e7] bg-[#fbfaf5] px-3 py-2 overflow-x-auto">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-[10px] font-semibold text-[#828877]">Pilihan Cepat:</span>
                  {quickReplies.map((qr) => (
                    <button
                      key={qr}
                      onClick={() => handleSendMessage(qr)}
                      className="rounded-full border border-[#d8dccf] bg-white px-2.5 py-1 text-[11px] text-[#425946] transition hover:border-[#244e3e] hover:bg-[#edf0e5]"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Box */}
              <div className="border-t border-[#e7e7de] bg-[#fffef9] p-3 sm:p-4">
                {sendError && <p role="alert" className="mb-2 text-xs text-[#a54935]">{sendError}</p>}
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Kirim pesan ke ${activeConv.counterpartName}...`}
                    className="flex-1 rounded-xl border border-[#dedfd5] bg-[#fffefb] px-4 py-2.5 text-xs text-[#242c27] placeholder-[#9a9d90] outline-none transition focus:border-[#244e3e]"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim()}
                    className="button button-green flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-40"
                  >
                    <span>Kirim</span>
                    <Icon name="send" size={15} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-[#8e907b]">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#f0eee3] text-[#244e3e]">
                <Icon name="chat" size={40} />
              </div>
              <h2 className="text-xl font-semibold text-[#242c27]">Pilih Percakapan</h2>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-[#858b7d]">
                Pilih obrolan dari daftar sebelah kiri atau temukan buku di etalase lalu klik
                <strong> "Chat Penjual"</strong> untuk bertransaksi.
              </p>
              <Link
                to="/etalase"
                className="button button-green mt-6 px-4 py-2 text-xs"
              >
                Jelajahi Etalase Buku <Icon name="arrow" size={16} />
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
