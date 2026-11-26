import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/bookswap/artwork'
import { resetPassword } from '@/lib/auth'

export default function LupaPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await resetPassword(email)
    setLoading(false)

    if (res.success) {
      setSuccess(true)
    } else {
      setError(res.error || 'Gagal mengirim instruksi pemulihan password.')
    }
  }

  return (
    <div className="mx-auto max-w-md py-10 md:py-16">
      <div className="rounded-2xl border border-[#e7e7de] bg-[#fffef9] p-6 shadow-sm md:p-8">
        <div className="mb-6 text-center">
          <span className="eyebrow mx-auto justify-center">PEMULIHAN AKUN</span>
          <h1 className="page-heading mt-2 text-2xl font-bold md:text-3xl">
            Lupa Password?
          </h1>
          <p className="mt-2 text-xs text-[#7e817a]">
            {success
              ? 'Tautan pemulihan telah dikirim.'
              : 'Masukkan email akun SwapBook terdaftarmu untuk mengatur ulang kata sandi.'}
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-[#f3c5b8] bg-[#f9eae2] p-3 text-xs leading-relaxed text-[#a54935]">
            {error}
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#edf0e5] text-[#244e3e]">
              <Icon name="check" size={32} />
            </span>
            <h3 className="text-base font-bold text-[#242c27]">Instruksi Terkirim</h3>
            <p className="mt-2 text-xs text-[#7e817a]">
              Jika email <strong>{email}</strong> terdaftar di sistem, tautan pemulihan kata sandi telah dikirim ke kotak masuk email Anda.
            </p>
            <Link to="/login" className="button button-green mt-6 flex w-full justify-center py-2.5 text-xs font-semibold">
              Kembali ke Masuk <Icon name="arrow" size={16} />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#242c27]">Email Akun Terdaftar</label>
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

            <button
              type="submit"
              disabled={loading}
              className="button button-green mt-2 flex w-full items-center justify-center gap-2 py-3 text-xs font-semibold disabled:opacity-50"
            >
              <span>{loading ? 'Memproses...' : 'Kirim Tautan Pemulihan'}</span>
              <Icon name="arrow" size={16} />
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-[#f0f0e7] pt-4 text-center">
          <Link to="/login" className="text-xs font-semibold text-[#244e3e] underline hover:text-[#36654f]">
            ← Kembali ke Halaman Masuk
          </Link>
        </div>
      </div>
    </div>
  )
}
