import { Link, useLocation, useNavigate } from 'react-router-dom'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { BookView } from '@/lib/books'
import { Icon } from './artwork'
import { getTotalUnreadCount, subscribeToChat, subscribeToChatRealtime } from '@/lib/chat-db'
import { getCurrentUser, logout, subscribeAuth, syncCurrentUserFromSupabase, watchSupabaseAuth, type UserAccount } from '@/lib/auth'

type Bookshelf = { saved: BookView['id'][]; toggleSave: (id: BookView['id']) => void }
const BookshelfContext = createContext<Bookshelf>({ saved: [], toggleSave: () => {} })
export const useBookshelf = () => useContext(BookshelfContext)

const navigation = [
  { href: '/', label: 'Beranda' },
  { href: '/etalase', label: 'Etalase Buku' },
  { href: '/jual-buku', label: 'Jual Buku' },
  { href: '/pesan', label: 'Pesan' },
  { href: '/tentang-kami', label: 'Tentang Kami' },
]

export function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [saved, setSaved] = useState<BookView['id'][]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userDropdown, setUserDropdown] = useState(false)
  const [user, setUser] = useState<UserAccount | null>(getCurrentUser())
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleChatUpdate = () => {
      void getTotalUnreadCount().then(setUnreadCount)
    }
    const handleAuthUpdate = () => {
      setUser(getCurrentUser())
    }

    handleChatUpdate()
    handleAuthUpdate()

    const stopSupabaseAuth = watchSupabaseAuth()
    void syncCurrentUserFromSupabase()
    const unsubChat = subscribeToChat(handleChatUpdate)
    const stopRealtime = subscribeToChatRealtime()
    const unsubAuth = subscribeAuth(handleAuthUpdate)

    return () => {
      stopSupabaseAuth()
      unsubChat()
      stopRealtime()
      unsubAuth()
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleSave = (id: BookView['id']) =>
    setSaved((old) => (old.includes(id) ? old.filter((x) => x !== id) : [...old, id]))

  const openCatalog = (query: string) => {
    navigate(`/etalase?${query}=1`)
  }

  const handleLogout = () => {
    setUserDropdown(false)
    logout()
    navigate('/')
  }

  return (
    <BookshelfContext.Provider value={{ saved, toggleSave }}>
      <div className="app-shell flex min-h-screen flex-col">
        <header className="site-header shrink-0">
          <Link
            className="brand"
            to="/"
            aria-label="Beranda BookSwap"
            onClick={() => setMenuOpen(false)}
          >
            <span className="brand-symbol">
              <Icon name="book" size={25} />
            </span>
            BookSwap<span className="brand-period">.</span>
          </Link>
          <nav className="desktop-nav" aria-label="Navigasi utama">
            {navigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/') ? 'nav-active' : ''}
                aria-current={pathname === item.href ? 'page' : undefined}
              >
                {item.label}
                {item.href === '/pesan' && unreadCount > 0 && (
                  <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c0543f] px-1 text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="icon-button"
              aria-label="Lihat buku tersimpan"
              onClick={() => openCatalog('tersimpan')}
            >
              <Icon name="heart" />
              {saved.length > 0 && <span className="count-dot">{saved.length}</span>}
            </button>
            <button
              className="icon-button messages-button relative"
              aria-label="Pesan"
              onClick={() => navigate('/pesan')}
            >
              <Icon name="mail" />
              {unreadCount > 0 && <span className="count-dot">{unreadCount}</span>}
            </button>
            <span className="header-divider" />
            <Link className="button button-green sell-button" to="/jual-buku">
              <Icon name="plus" size={17} /> Jual buku
            </Link>

            {/* Profile Avatar / Login Button */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  className="profile-avatar flex items-center justify-center overflow-hidden transition hover:scale-105"
                  aria-label="Menu akun pengguna"
                  style={{ background: user.avatarURL ? 'transparent' : user.color }}
                  onClick={() => setUserDropdown(!userDropdown)}
                >
                  {user.avatarURL ? (
                    <img src={user.avatarURL} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{user.initials}</span>
                  )}
                </button>

                {userDropdown && (
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-[#dedfd5] bg-[#fffefb] p-2 shadow-xl animate-in fade-in zoom-in-95">
                    <div className="border-b border-[#f0f0e7] px-3 py-2.5">
                      <p className="truncate text-xs font-bold text-[#242c27]">{user.name}</p>
                      <p className="truncate text-[11px] text-[#7e817a]">{user.email}</p>
                      <span className="mt-1 block truncate text-[10px] text-[#52775c] font-medium">
                        📍 {user.campus}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profil"
                        onClick={() => setUserDropdown(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#242c27] transition hover:bg-[#edf0e5]"
                      >
                        <Icon name="user" size={15} />
                        <span>Profil Saya</span>
                      </Link>

                      <Link
                        to="/pesan"
                        onClick={() => setUserDropdown(false)}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-[#242c27] transition hover:bg-[#edf0e5]"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon name="mail" size={15} />
                          <span>Kotak Pesan</span>
                        </div>
                        {unreadCount > 0 && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c0543f] px-1 text-[9px] font-bold text-white">
                            {unreadCount}
                          </span>
                        )}
                      </Link>

                      <Link
                        to="/etalase?tersimpan=1"
                        onClick={() => setUserDropdown(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#242c27] transition hover:bg-[#edf0e5]"
                      >
                        <Icon name="heart" size={15} />
                        <span>Buku Disimpan</span>
                      </Link>
                    </div>

                    <div className="border-t border-[#f0f0e7] pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-[#a54935] transition hover:bg-[#f9eae2]"
                      >
                        <Icon name="logout" size={15} />
                        <span>Keluar (Logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#244e3e] transition hover:bg-[#edf0e5]"
                >
                  Masuk
                </Link>
                <Link
                  to="/signup"
                  className="rounded-lg bg-[#244e3e] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#36654f]"
                >
                  Daftar
                </Link>
              </div>
            )}

            <button
              className="icon-button mobile-menu-button"
              aria-label={menuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} />
            </button>
          </div>
        </header>

        {menuOpen && (
          <nav id="mobile-navigation" className="mobile-navigation" aria-label="Navigasi seluler">
            {navigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/') ? 'nav-active' : ''}
                aria-current={pathname === item.href ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <span>{item.label}</span>
                  {item.href === '/pesan' && unreadCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c0543f] px-1 text-[9px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <Icon name="arrow" size={16} />
              </Link>
            ))}

            <div className="mt-3 border-t border-[#e7e7de] pt-3">
              {user ? (
                <>
                  <Link
                    to="/profil"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between p-3 text-xs font-semibold text-[#244e3e]"
                  >
                    <span>Profil Saya ({user.name})</span>
                    <Icon name="arrow" size={16} />
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      handleLogout()
                    }}
                    className="flex w-full items-center justify-between p-3 text-xs font-semibold text-[#a54935]"
                  >
                    <span>Keluar (Logout)</span>
                    <Icon name="logout" size={16} />
                  </button>
                </>
              ) : (
                <div className="flex gap-2 p-2">
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="button button-outline flex-1 justify-center py-2 text-xs"
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMenuOpen(false)}
                    className="button button-green flex-1 justify-center py-2 text-xs"
                  >
                    Daftar Akun
                  </Link>
                </div>
              )}
            </div>
          </nav>
        )}
        <main id="main-content" className="w-full flex-1">
          {children}
        </main>
        <div className="mx-[5%]">
          <footer>
            <Link to="/" className="brand">
              <Icon name="book" size={22} />
              BookSwap.
            </Link>
            <p>Lebih banyak cerita. Lebih dekat dengan kampus.</p>
            <span>Untuk cerita berikutnya.</span>
          </footer>
        </div>
      </div>
    </BookshelfContext.Provider>
  )
}
