import { isSupabaseConfigured, supabase } from './supabase'
import { createUUID } from './uuid'

export type BookView = {
  id: string; title: string; author: string; category: string; condition: string
  price: number; original: number; description: string; campus: string; swap: boolean
  seller: string; initials: string; color: string; cover: string
  photoURL: string | null; photoAlt: string
}

export const defaultBooks: BookView[] = []

export async function fetchBooks(): Promise<BookView[]> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.from('books').select('*').eq('status', 'active').order('created_at', { ascending: false })
  if (error) {
    console.error('Supabase fetchBooks error:', error)
    return []
  }
  return (data || []).map((book) => ({
    id: String(book.id), title: book.title, author: book.author, category: book.category,
    condition: book.condition, price: book.price, original: book.original_price || book.price,
    description: book.description, campus: book.campus, swap: Boolean(book.swap),
    seller: book.seller_name || 'Teman kampus', initials: book.seller_initials || 'TK',
    color: book.seller_color || '#d6bc9b', cover: book.cover || 'creative',
    photoURL: book.photo_url || null, photoAlt: book.photo_alt || `Sampul ${book.title}`,
  }))
}

export function getBooks(): BookView[] { return [] }

export async function insertBook(
  bookData: Omit<BookView, 'id'>,
  photoFile?: File,
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Koneksi Supabase belum dikonfigurasi.' }

  let uploadedPath: string | null = null
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    const user = authData.user
    if (authError || !user) return { success: false, error: 'Sesi Supabase tidak aktif. Silakan keluar lalu masuk kembali dengan akun BookSwap yang sama.' }

    let photoURL: string | null = null
    if (photoFile) {
      const extension = photoFile.type === 'image/png' ? 'png' : photoFile.type === 'image/webp' ? 'webp' : 'jpg'
      uploadedPath = `${user.id}/${createUUID()}.${extension}`
      const { error: uploadError } = await supabase.storage.from('book-covers').upload(uploadedPath, photoFile, {
        cacheControl: '3600', upsert: false, contentType: photoFile.type,
      })
      if (uploadError) return { success: false, error: `Foto gagal diunggah: ${uploadError.message}` }
      photoURL = supabase.storage.from('book-covers').getPublicUrl(uploadedPath).data.publicUrl
    }

    const { data, error } = await supabase.from('books').insert({
      title: bookData.title, author: bookData.author, category: bookData.category,
      condition: bookData.condition, price: bookData.price, original_price: bookData.original,
      description: bookData.description, campus: bookData.campus, swap: bookData.swap,
      photo_url: photoURL, photo_alt: bookData.photoAlt,
      seller_id: user.id,
      seller_name: user.user_metadata?.name || bookData.seller || user.email?.split('@')[0] || 'Pengguna BookSwap',
      seller_initials: bookData.initials, seller_color: bookData.color,
      cover: bookData.cover, status: 'active',
    }).select('id').single()

    if (error) {
      if (uploadedPath) await supabase.storage.from('book-covers').remove([uploadedPath])
      return { success: false, error: `Buku gagal disimpan: ${error.message}` }
    }
    return { success: true, id: String(data.id) }
  } catch (error: any) {
    if (uploadedPath) await supabase.storage.from('book-covers').remove([uploadedPath]).catch(() => {})
    return { success: false, error: error?.message || 'Terjadi kesalahan saat menyimpan buku.' }
  }
}

export function getCampusPhoto() {
  return { url: '/tentang-kami.jpeg', alt: 'Komunitas BookSwap — suasana kampus' }
}
