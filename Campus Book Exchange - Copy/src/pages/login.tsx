import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { GoogleIcon, Icon } from '@/components/bookswap/artwork'
import { GoogleAuthModal } from '@/components/bookswap/google-auth-modal'
import { login } from '@/lib/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isGoogleOpen, setIsGoogleOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await login(email, password)
    setLoading(false)
    if (res.success) {
      navigate(redirect)
    } else {
      setError(res.error || 'Terjadi kesalahan saat masuk.')
    }
  }

  const handleGoogleSuccess = () => {
    setIsGoogleOpen(false)
    navigate(redirect)
  }

  return (
    <div className="mx-auto max-w-md py-10 md:py-16">
      <div className="rounded-2xl border border-[#e7e7de] bg-[#fffef9] p-6 shadow-sm md:p-8">
        <div className="mb-6 text-center">
          <span className="eyebrow mx-auto justify-center">AKUN PENGGUNA SWAPBOOK</span>
          <h1 className="page-heading mt-2 text-2xl font-bold md:text-3xl">
            Selamat Datang Kembali.
          </h1>
          <p className="mt-2 text-xs text-[#7e817a]">
            Masuk ke akunmu untuk mengobrol dengan penjual, mengunggah buku, dan melihat penawaran kampus.
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
          <span>Lanjutkan dengan Google</span>
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#e7e7de]" />
          <span className="text-[11px] font-medium text-[#9a9d90]">atau dengan email</span>
          <div className="h-px flex-1 bg-[#e7e7de]" />
        </div>

        {/* Form Login Email & Password */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#242c27]">Email</label>
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3 text-[#8a8f80]">
                <Icon name="mail" size={16} />
              </span>
              <input
                type="email"
                required
                placeholder="nama@kampus.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#dedfd5] bg-[#fffefb] py-2.5 pr-3 pl-9 text-xs text-[#242c27] placeholder-[#9a9c92] outline-none transition focus:border-[#244e3e]"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-[#242c27]">Password</label>
              <Link
                to="/lupa-password"
                className="text-[11px] font-medium text-[#52775c] hover:underline"
              >
                Lupa Password?
              </Link>
            </div>
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3 text-[#8a8f80]">
                <Icon name="lock" size={16} />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#dedfd5] bg-[#fffefb] py-2.5 pr-3 pl-9 text-xs text-[#242c27] placeholder-[#9a9c92] outline-none transition focus:border-[#244e3e]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="button button-green mt-2 flex w-full items-center justify-center gap-2 py-3 text-xs font-semibold disabled:opacity-50"
          >
            <span>{loading ? 'Sedang Masuk...' : 'Masuk ke Akun'}</span>
            <Icon name="arrow" size={16} />
          </button>
        </form>

        <div className="mt-6 border-t border-[#f0f0e7] pt-4 text-center">
          <p className="text-xs text-[#7e817a]">
            Belum punya akun?{' '}
            <Link
              to={`/signup${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="font-semibold text-[#244e3e] underline hover:text-[#36654f]"
            >
              Daftar Sekarang
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
