import { useEffect, useState } from 'react'
import Catalog from '@/components/bookswap/catalog'
import { fetchBooks, type BookView } from '@/lib/books'
import { isSupabaseConfigured } from '@/lib/supabase'

export default function CatalogPage() {
  const [books, setBooks] = useState<BookView[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBooks().then((res) => {
      setBooks(res)
      setLoading(false)
    })
  }, [])

  return (
    <div>
      {!isSupabaseConfigured && (
        <div className="mt-4 rounded-xl border border-[#d2d2b6] bg-[#f9f7ee] p-4 text-xs leading-relaxed text-[#5c5c46]">
          <strong className="text-[#244e3e]">ℹ️ Konfigurasi Cloud Database (Supabase):</strong>
          <p className="mt-1">
            Database saat ini berjalan murni tanpa data dummy. Untuk menghubungkan ke proyek Supabase Anda, buka file <code>.env</code> di root folder dan masukkan <code>VITE_SUPABASE_URL</code> serta <code>VITE_SUPABASE_ANON_KEY</code> Anda. Skema tabel SQL siap pakai tersedia di file <code>supabase-schema.sql</code>.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#244e3e] border-t-transparent" />
          <p className="text-xs font-medium text-[#52775c]">Memuat etalase dari database...</p>
        </div>
      ) : (
        <Catalog books={books} />
      )}
    </div>
  )
}
