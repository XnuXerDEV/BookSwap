import { useState } from 'react'
import { GoogleIcon, Icon } from './artwork'
import { loginWithGoogle } from '@/lib/auth'

export function GoogleAuthModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const result = await loginWithGoogle()
    if (!result.success) {
      setLoading(false)
      setError(result.error || 'Tidak dapat memulai login Google.')
    }
    // OAuth yang berhasil akan mengarahkan browser ke Google dan kembali ke aplikasi.
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-[#dedfd5] bg-[#fffefb] p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#8a8c82] hover:text-[#242c27]" aria-label="Tutup">
          <Icon name="close" size={18} />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f2e9] shadow-xs"><GoogleIcon size={26} /></div>
          <h3 className="text-lg font-bold text-[#242c27]">Masuk dengan Google</h3>
          <p className="mt-1 text-xs text-[#7e817a]">Gunakan autentikasi Google resmi melalui Supabase untuk masuk ke <strong>BookSwap</strong>.</p>
        </div>
        {error && <div role="alert" className="mt-5 rounded-lg border border-[#f3c5b8] bg-[#f9eae2] p-3 text-xs leading-relaxed text-[#a54935]">{error}</div>}
        <button type="button" disabled={loading} onClick={handleGoogleLogin} className="button button-green mt-6 flex w-full items-center justify-center gap-2 py-3 text-xs disabled:opacity-50">
          <GoogleIcon size={17} /> {loading ? 'Menghubungkan ke Google...' : 'Lanjutkan dengan Google'}
        </button>
        <p className="mt-4 text-center text-[10px] leading-5 text-[#9a9d90]">Jika login Google belum diaktifkan pada pengaturan Authentication Supabase, gunakan login email dan password.</p>
      </div>
    </div>
  )
}
