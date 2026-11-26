import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { GoogleIcon, Icon } from '@/components/bookswap/artwork'
import { GoogleAuthModal } from '@/components/bookswap/google-auth-modal'
import { signUp } from '@/lib/auth'
import { campuses } from '@/lib/book-options'

export default function SignUpPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [campus, setCampus] = useState(campuses[0])
  const [phone, setPhone] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isGoogleOpen, setIsGoogleOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok dengan password yang dimasukkan.')
      return
    }

    setLoading(true)
    const res = await signUp({
      name,
      email,
      password,
      campus,
      phone,
    })
    setLoading(false)

    if (res.success) {
      navigate(redirect)
    } else {
      setError(res.error || 'Gagal mendaftarkan akun.')
    }
  }

  const handleGoogleSuccess = () => {
    setIsGoogleOpen(false)
    navigate(redirect)
  }

  return (
    <div className="mx-auto max-w-lg py-10 md:py-16">
      <div className="rounded-2xl border border-[#e7e7de] bg-[#fffef9] p-6 shadow-sm md:p-8">
        <div className="mb-6 text-center">
          <span className="eyebrow mx-auto justify-center">BERGABUNG DENGAN KOMUNITAS</span>
          <h1 className="page-heading mt-2 text-2xl font-bold md:text-3xl">
            Buat Akun SwapBook.
          </h1>
          <p className="mt-2 text-xs text-[#7e817a]">
            Jual buku kuliahmu, temukan bacaan hemat, dan mulai mengobrol langsung dengan sesama mahasiswa.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-[#f3c5b8] bg-[#f9eae2] p-3 text-xs leading-relaxed text-[#a54935]">
            {error}
          </div>
        )}

        {/* Tombol Google OAuth */}
        <button
          type="button"
          onClick={() => setIsGoogleOpen(true)}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#dedfd5] bg-white py-2.5 text-xs font-semibold text-[#242c27] shadow-2xs transition hover:border-[#244e3e] hover:bg-[#edf0e5]"
        >
          <GoogleIcon size={18} />
          <span>Daftar Cepat dengan Google</span>
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#e7e7de]" />
          <span className="text-[11px] font-medium text-[#9a9d90]">atau daftar manual</span>
          <div className="h-px flex-1 bg-[#e7e7de]" />
        </div>

        {/* Form Pendaftaran Manual */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#242c27]">Nama Lengkap</label>
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3 text-[#8a8f80]">
                <Icon name="user" size={16} />
              </span>
              <input
                type="text"
                required
                placeholder="Contoh: Rian Pratama"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#dedfd5] bg-[#fffefb] py-2.5 pr-3 pl-9 text-xs text-[#242c27] placeholder-[#9a9c92] outline-none transition focus:border-[#244e3e]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#242c27]">Email</label>
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3 text-[#8a8f80]">
                <Icon name="mail" size={16} />
              </span>
              <input
                type="email"
                required
                placeholder="nama@kampus.ac.id atau email pribadimu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#dedfd5] bg-[#fffefb] py-2.5 pr-3 pl-9 text-xs text-[#242c27] placeholder-[#9a9c92] outline-none transition focus:border-[#244e3e]"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#242c27]">Kampus</label>
              <select
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className="w-full rounded-xl border border-[#dedfd5] bg-[#fffefb] p-2.5 text-xs text-[#242c27] outline-none transition focus:border-[#244e3e]"
              >
                {campuses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#242c27]">No. WhatsApp (Opsional)</label>
              <input
                type="tel"
                placeholder="0812xxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-[#dedfd5] bg-[#fffefb] p-2.5 text-xs text-[#242c27] placeholder-[#9a9c92] outline-none transition focus:border-[#244e3e]"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#242c27]">Password</label>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-3 text-[#8a8f80]">
                  <Icon name="lock" size={16} />
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Min. 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#dedfd5] bg-[#fffefb] py-2.5 pr-3 pl-9 text-xs text-[#242c27] placeholder-[#9a9c92] outline-none transition focus:border-[#244e3e]"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#242c27]">Ulangi Password</label>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-3 text-[#8a8f80]">
                  <Icon name="lock" size={16} />
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Konfirmasi password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#dedfd5] bg-[#fffefb] py-2.5 pr-3 pl-9 text-xs text-[#242c27] placeholder-[#9a9c92] outline-none transition focus:border-[#244e3e]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="button button-green mt-3 flex w-full items-center justify-center gap-2 py-3 text-xs font-semibold disabled:opacity-50"
          >
            <span>{loading ? 'Mendaftarkan Akun...' : 'Daftar Akun Baru'}</span>
            <Icon name="arrow" size={16} />
          </button>
        </form>

        <div className="mt-6 border-t border-[#f0f0e7] pt-4 text-center">
          <p className="text-xs text-[#7e817a]">
            Sudah memiliki akun?{' '}
            <Link
              to={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="font-semibold text-[#244e3e] underline hover:text-[#36654f]"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>

      <GoogleAuthModal
        isOpen={isGoogleOpen}
        onClose={() => setIsGoogleOpen(false)}
        onSuccess={handleGoogleSuccess}
      />
    </div>
  )
}
