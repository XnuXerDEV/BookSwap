import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '@/components/bookswap/artwork'
import { getCurrentUser, logout, updateProfile, type UserAccount } from '@/lib/auth'
import { campuses } from '@/lib/book-options'
import { fetchConversationsFromSupabase, type ChatConversation } from '@/lib/chat-db'
import { useBookshelf } from '@/components/bookswap/shell'

export default function ProfilPage() {
  const navigate = useNavigate()
  const { saved } = useBookshelf()
  const [user, setUser] = useState<UserAccount | null>(getCurrentUser())
  const [activeConversations, setActiveConversations] = useState<ChatConversation[]>([])

  // Form states
  const [name, setName] = useState('')
  const [campus, setCampus] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [avatarURL, setAvatarURL] = useState('')

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const current = getCurrentUser()
    if (!current) {
      navigate('/login?redirect=/profil')
      return
    }
    setUser(current)
    setName(current.name)
    setCampus(current.campus)
    setPhone(current.phone || '')
    setBio(current.bio || '')
    setAvatarURL(current.avatarURL || '')

    fetchConversationsFromSupabase().then((convs) => {
      setActiveConversations(convs.filter((c) => c.buyerId === current.id || c.sellerId === current.id))
    })
  }, [navigate])

  if (!user) return null

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    const updates: Partial<UserAccount> = {
      name,
      campus,
      phone,
      bio,
      avatarURL: avatarURL || null,
    }

    const res = await updateProfile(updates)
    setLoading(false)

    if (res.success && res.user) {
      setUser(res.user)
      setMessage({ type: 'success', text: 'Profil dan informasi akun berhasil diperbarui di database.' })
    } else {
      setMessage({ type: 'error', text: res.error || 'Gagal memperbarui profil.' })
    }
  }

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setAvatarURL(result)
    }
    reader.readAsDataURL(file)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="py-8 md:py-12">
      {/* Page Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#e7e7de] pb-6">
        <div>
          <div className="eyebrow section-eyebrow">AKUN &amp; PENGATURAN</div>
          <h1 className="catalog-heading text-2xl font-bold md:text-3xl">
            Profil Pengguna
            <span className="heading-dot">✳</span>
          </h1>
          <p className="mt-1 text-xs text-[#8a8f80]">
            Kelola identitas, kontak kampus, dan kredensial akun SwapBook milikmu.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl border border-[#d8ddce] bg-[#fffef9] px-4 py-2 text-xs font-semibold text-[#a54935] transition hover:border-[#a54935] hover:bg-[#f9eae2]"
        >
          <Icon name="logout" size={16} />
          <span>Keluar (Logout)</span>
        </button>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-xl border p-4 text-xs leading-relaxed ${
            message.type === 'success'
              ? 'border-[#c6d7ce] bg-[#edf2e6] text-[#244e3e]'
              : 'border-[#f3c5b8] bg-[#f9eae2] text-[#a54935]'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
        {/* Left Column: Profile Card & Stats */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-[#e7e7de] bg-[#fffef9] p-6 text-center shadow-xs">
            <div className="relative mx-auto mb-4 h-24 w-24">
              {avatarURL ? (
                <img
                  src={avatarURL}
                  alt={user.name}
                  className="h-full w-full rounded-full border-3 border-[#f0eee3] object-cover shadow-sm"
                />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center rounded-full border-3 border-[#f0eee3] text-2xl font-bold text-[#504b40] shadow-sm"
                  style={{ background: user.color }}
                >
                  {user.initials}
                </span>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#244e3e] text-white shadow-md transition hover:scale-105 hover:bg-[#36654f]"
                title="Unggah Foto Profil"
              >
                <Icon name="camera" size={15} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFile}
              />
            </div>

            <h2 className="text-lg font-bold text-[#242c27]">{user.name}</h2>
            <p className="text-xs text-[#7e817a]">{user.email}</p>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#52775c]">
              <Icon name="pin" size={13} />
              <span>{user.campus}</span>
            </div>

            <div className="mt-3 inline-block rounded-full bg-[#edf0e5] px-3 py-1 text-[11px] font-medium text-[#4f6047]">
              {user.authProvider === 'google' ? 'Terhubung dengan Google' : 'Akun Email SwapBook'}
            </div>

            {user.bio && (
              <p className="mt-4 border-t border-[#f0f0e7] pt-4 text-xs leading-relaxed text-[#858b7d]">
                "{user.bio}"
              </p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/pesan"
              className="flex flex-col items-center justify-center rounded-xl border border-[#e7e7de] bg-[#fffef9] p-4 text-center transition hover:border-[#244e3e] hover:bg-[#edf0e5]"
            >
              <span className="text-xl font-bold text-[#244e3e]">{activeConversations.length}</span>
              <span className="mt-1 text-[11px] font-medium text-[#7e817a]">Kotak Pesan</span>
            </Link>

            <Link
              to="/etalase?tersimpan=1"
              className="flex flex-col items-center justify-center rounded-xl border border-[#e7e7de] bg-[#fffef9] p-4 text-center transition hover:border-[#244e3e] hover:bg-[#edf0e5]"
            >
              <span className="text-xl font-bold text-[#244e3e]">{saved.length}</span>
              <span className="mt-1 text-[11px] font-medium text-[#7e817a]">Buku Disimpan</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="rounded-2xl border border-[#e7e7de] bg-[#fffef9] p-6 shadow-xs md:p-8">
          <h3 className="text-base font-bold text-[#242c27]">Informasi Data Diri</h3>
          <p className="mt-1 text-xs text-[#7e817a]">
            Perbarui nama dan kontak yang tersimpan di cloud database Supabase.
          </p>

          <form onSubmit={handleUpdateProfile} className="mt-6 flex flex-col gap-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#242c27]">Nama Lengkap</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#dedfd5] bg-[#fffefb] p-3 text-xs text-[#242c27] outline-none transition focus:border-[#244e3e]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#242c27]">Asal Kampus</label>
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full rounded-xl border border-[#dedfd5] bg-[#fffefb] p-3 text-xs text-[#242c27] outline-none transition focus:border-[#244e3e]"
                >
                  {campuses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#242c27]">
                  No. WhatsApp / Telepon
                </label>
                <input
                  type="tel"
                  placeholder="0812xxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-[#dedfd5] bg-[#fffefb] p-3 text-xs text-[#242c27] outline-none transition focus:border-[#244e3e]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#242c27]">
                Tautan Foto Profil (URL atau gunakan tombol kamera di atas)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={avatarURL}
                onChange={(e) => setAvatarURL(e.target.value)}
                className="w-full rounded-xl border border-[#dedfd5] bg-[#fffefb] p-3 text-xs text-[#242c27] outline-none transition focus:border-[#244e3e]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#242c27]">Bio / Tentang Saya</label>
              <textarea
                rows={3}
                placeholder="Ceritakan sedikit tentang dirimu atau preferensi membaca..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-xl border border-[#dedfd5] bg-[#fffefb] p-3 text-xs text-[#242c27] outline-none transition focus:border-[#244e3e]"
              />
            </div>

            <div className="mt-2 flex items-center justify-end gap-3 border-t border-[#f0f0e7] pt-5">
              <button
                type="submit"
                disabled={loading}
                className="button button-green px-6 py-2.5 text-xs font-semibold disabled:opacity-50"
              >
                {loading ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Profil'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
