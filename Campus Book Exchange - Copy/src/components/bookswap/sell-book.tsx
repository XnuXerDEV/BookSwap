import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import {
  bookCategories,
  bookConditions,
  campuses,
  MAX_BOOK_PRICE,
  MAX_PHOTO_BYTES,
  photoTypes,
  rupiah,
} from '@/lib/book-options'
import { Icon } from './artwork'
import { getCurrentUser } from '@/lib/auth'
import { insertBook } from '@/lib/books'

type ListingResult = {
  success: boolean
  id?: string
  errors?: Record<string, string>
  message: string
}

export default function SellBook() {
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<ListingResult | null>(null)
  const [preview, setPreview] = useState('')
  const [fileName, setFileName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )
  useEffect(() => {
    if (result) resultRef.current?.focus()
  }, [result])
  const fieldError = (field: string) =>
    result?.errors?.[field] ? (
      <span id={`error-${field}`} className="text-[11px] text-[#a54935]">
        {result.errors[field]}
      </span>
    ) : null
  const invalidProps = (field: string) => ({
    'aria-invalid': Boolean(result?.errors?.[field]),
    'aria-describedby': result?.errors?.[field] ? `error-${field}` : undefined,
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const errors: Record<string, string> = {}

    const text = (name: string) => {
      const val = form.get(name)
      return typeof val === 'string' ? val.trim() : ''
    }

    const title = text('title'),
      author = text('author'),
      desc = text('description')
    const category = text('category'),
      condition = text('condition'),
      campus = text('campus')
    const priceVal = Number(text('price')),
      listingType = text('listingType')

    if (title.length < 2 || title.length > 100) errors.title = 'Judul harus berisi 2–100 karakter.'
    if (author.length < 2 || author.length > 80)
      errors.author = 'Nama penulis harus berisi 2–80 karakter.'
    if (desc.length < 20 || desc.length > 2000)
      errors.description = 'Deskripsi harus berisi 20–2.000 karakter.'
    if (!bookCategories.some((value) => value === category))
      errors.category = 'Pilih kategori yang tersedia.'
    if (!bookConditions.some((value) => value === condition))
      errors.condition = 'Pilih kondisi buku.'
    if (!campuses.some((value) => value === campus)) errors.campus = 'Pilih kampus yang tersedia.'
    if (!Number.isInteger(priceVal) || priceVal < 1000 || priceVal > MAX_BOOK_PRICE)
      errors.price = 'Masukkan harga Rp1.000–Rp2.000.000 tanpa titik atau koma.'
    if (!['Jual atau tukar', 'Jual saja'].includes(listingType))
      errors.listingType = 'Pilih jenis iklan.'

    const file = form.get('photo')
    if (
      !(file instanceof File) ||
      !file.size ||
      file.size > MAX_PHOTO_BYTES ||
      !photoTypes.includes(file.type)
    )
      errors.photo = 'Unggah foto JPG, PNG, atau WebP maksimal 5 MB.'

    if (text('website')) {
      setResult({ success: false, message: 'Pengiriman tidak dapat diproses.' })
      return
    }

    if (Object.keys(errors).length) {
      setResult({ success: false, message: 'Periksa kembali isian formulirmu.', errors })
      return
    }

    setPending(true)
    const currentUser = getCurrentUser()
    const initials = title
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase() || '')
      .join('')

    const bookPayload = {
      title,
      author,
      category,
      condition,
      price: priceVal,
      original: priceVal,
      description: desc,
      campus,
      swap: listingType === 'Jual atau tukar',
      seller: currentUser ? currentUser.name : 'Pengguna BookSwap',
      initials: currentUser ? currentUser.initials : initials || 'KM',
      color: currentUser ? currentUser.color : '#d6bc9b',
      cover: 'creative',
      // URL blob hanya untuk pratinjau lokal; foto asli diunggah ke Supabase Storage.
      photoURL: null,
      photoAlt: `Sampul ${title}`,
    }

    try {
      const saveResult = await insertBook(bookPayload, file as File)
      setPending(false)
      if (saveResult.success) {
        setResult({
          success: true,
          id: saveResult.id,
          message: 'Bukumu berhasil disimpan ke Supabase dan kini tampil di etalase.',
        })
      } else {
        setResult({
          success: false,
          message: saveResult.error || 'Gagal menyimpan buku. Periksa sesi login dan koneksi internetmu.',
        })
      }
    } catch (error: any) {
      setPending(false)
      setResult({
        success: false,
        message: error?.message || 'Terjadi kesalahan saat mengunggah buku. Silakan coba lagi.',
      })
    }
  }

  if (result?.success)
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <div ref={resultRef} tabIndex={-1} role="status" className="flex flex-col items-center">
          <span className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#e8eddf] text-[#244e3e]">
            <Icon name="check" size={36} />
          </span>
          <span className="eyebrow">CERITA BARU SUDAH DIMULAI</span>
          <h1 className="page-heading mt-5">Bukumu siap berkelana.</h1>
          <p className="mt-5 text-sm leading-7 text-[#7e817a]">{result.message}</p>
          <p className="mt-2 text-xs text-[#939688]">
            Foto sampul, deskripsi, dan harga rupiah sudah tersimpan di database.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link className="button button-green" to="/etalase">
            Lihat etalase <Icon name="arrow" size={17} />
          </Link>
          <button
            className="button button-outline"
            onClick={() => {
              setResult(null)
              setPreview('')
              setFileName('')
              setPrice('')
              setDescription('')
            }}
          >
            Jual buku lainnya <Icon name="plus" size={17} />
          </button>
        </div>
      </div>
    )
  return (
    <div className="py-10 md:py-14">
      <span className="eyebrow">CERITA BARU DIMULAI DARIMU</span>
      <h1 className="page-heading mt-4">
        Beri ruang untuk
        <br />
        <span>cerita baru.</span>
      </h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-[#7e817a]">
        Buku yang selesai kamu baca bisa jadi awal cerita orang lain. Tawarkan ke teman sekampus
        dalam beberapa langkah.
      </p>
      <div className="mt-9 grid items-start gap-8 lg:grid-cols-[1.6fr_1fr] lg:gap-12">
        <form
          className="rounded-lg border border-[#e7e7de] bg-[#fffef9] p-6 md:p-8"
          onSubmit={handleSubmit}
        >
          <div className="mb-6 flex items-center gap-3 border-b border-[#e7e7de] pb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e9eddf] text-[#244e3e]">
              <Icon name="book" size={18} />
            </span>
            <div>
              <h2 className="text-lg">Detail bukumu</h2>
              <p className="mt-1 text-[10px] text-[#8b9081]">
                Semua kolom wajib diisi agar calon pembaca mengenal bukumu.
              </p>
            </div>
          </div>
          {result && !result.success && (
            <div
              ref={resultRef}
              tabIndex={-1}
              role="alert"
              className="mb-5 rounded-md bg-[#f9eae2] p-4 text-xs leading-6 text-[#a54935]"
            >
              {result.message}
            </div>
          )}
          <fieldset disabled={pending} className="flex flex-col gap-5 disabled:opacity-60">
            <div>
              <label htmlFor="book-photo" className="mb-2 block text-xs font-medium">
                Foto buku
              </label>
              <div className="relative rounded-lg border border-dashed border-[#c6cdb9] bg-[#f5f5ec] p-5 text-center">
                {preview ? (
                  <div className="relative mx-auto mb-4 h-52 w-40">
                    <img
                      src={preview}
                      alt="Pratinjau foto buku yang akan dijual"
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#e7ebdc] text-[#607853]">
                    <Icon name="plus" size={23} />
                  </span>
                )}
                <p className="mb-3 text-[11px] text-[#7b8570]">
                  Foto sampul yang jelas bikin bukumu lebih mudah ditemukan.
                </p>
                <input
                  ref={fileRef}
                  id="book-photo"
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                  {...invalidProps('photo')}
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    setPreview('')
                    setFileName('')
                    if (!file) return
                    if (!photoTypes.includes(file.type) || file.size > MAX_PHOTO_BYTES) {
                      e.target.value = ''
                      setResult({
                        success: false,
                        message: 'Periksa foto bukumu.',
                        errors: { photo: 'Gunakan foto JPG, PNG, atau WebP maksimal 5 MB.' },
                      })
                      return
                    }
                    setPreview(URL.createObjectURL(file))
                    setFileName(file.name)
                    setResult(null)
                  }}
                />
                <button className="button button-green px-4! py-2! text-xs!" type="button" onClick={() => fileRef.current?.click()}>{preview ? 'Ganti foto' : 'Pilih foto'}</button>
                <span className="mt-3 block truncate text-[10px] text-[#7b8570]">{fileName || 'Belum ada foto dipilih'}</span>
                <p className="mt-3 text-[10px] text-[#9a9d90]">
                  JPG, PNG, atau WebP · Maksimal 5 MB · Foto akan terlihat publik
                </p>
              </div>
              {fieldError('photo')}
            </div>
            <label className="flex flex-col gap-2 text-xs font-medium">
              Judul buku
              <input
                className="book-input"
                name="title"
                required
                minLength={2}
                maxLength={100}
                placeholder="Contoh: Atomic Habits"
                {...invalidProps('title')}
              />
              {fieldError('title')}
            </label>
            <label className="flex flex-col gap-2 text-xs font-medium">
              Penulis
              <input
                className="book-input"
                name="author"
                required
                minLength={2}
                maxLength={80}
                placeholder="Siapa penulisnya?"
                {...invalidProps('author')}
              />
              {fieldError('author')}
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-medium">
                Kategori
                <select
                  className="book-input"
                  name="category"
                  required
                  {...invalidProps('category')}
                >
                  <option value="">Pilih kategori</option>
                  {bookCategories.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                {fieldError('category')}
              </label>
              <label className="flex flex-col gap-2 text-xs font-medium">
                Kondisi
                <select
                  className="book-input"
                  name="condition"
                  required
                  {...invalidProps('condition')}
                >
                  <option value="">Pilih kondisi</option>
                  {bookConditions.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                {fieldError('condition')}
              </label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-medium">
                Harga (Rp)
                <input
                  className="book-input"
                  name="price"
                  type="number"
                  min={1000}
                  max={MAX_BOOK_PRICE}
                  step={1}
                  required
                  placeholder="Contoh: 60000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  {...invalidProps('price')}
                />
                <span className="text-[10px] font-normal text-[#88917c]">
                  {price ? rupiah(Number(price)) : 'Rp1.000–Rp2.000.000, tanpa titik atau koma'}
                </span>
                {fieldError('price')}
              </label>
              <label className="flex flex-col gap-2 text-xs font-medium">
                Jenis iklan
                <select className="book-input" name="listingType" {...invalidProps('listingType')}>
                  <option>Jual atau tukar</option>
                  <option>Jual saja</option>
                </select>
                {fieldError('listingType')}
              </label>
            </div>
            <label className="flex flex-col gap-2 text-xs font-medium">
              Kampus
              <select className="book-input" name="campus" {...invalidProps('campus')}>
                {campuses.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              {fieldError('campus')}
            </label>
            <label className="flex flex-col gap-2 text-xs font-medium">
              Deskripsi
              <textarea
                className="book-input min-h-32 resize-y"
                name="description"
                required
                minLength={20}
                maxLength={2000}
                placeholder="Ceritakan kondisi halaman, coretan, tahun terbit, dan informasi lain yang perlu diketahui pembeli."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                {...invalidProps('description')}
              />
              <span className="text-right text-[10px] font-normal text-[#969b8b]">
                {description.length}/2.000 karakter · minimal 20
              </span>
              {fieldError('description')}
            </label>
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
            <div className="border-t border-[#e7e7de] pt-5">
              <p className="mb-4 text-[10px] leading-5 text-[#8b9081]">
                Dengan memasang iklan, kamu menyatakan foto dan informasi buku sesuai kondisi
                sebenarnya. Hindari mencantumkan data pribadi dalam deskripsi publik.
              </p>
              <button className="button button-green w-full" type="submit" disabled={pending}>
                {pending ? 'Menyimpan bukumu...' : 'Pasang iklan buku'}
                <Icon name="arrow" size={17} />
              </button>
            </div>
          </fieldset>
        </form>
        <aside className="rounded-lg border border-[#e8e6d8] bg-[#f1efe3] p-7 lg:sticky lg:top-8">
          <span className="eyebrow">SEDIKIT TIPS, BANYAK PEMINAT</span>
          <h2 className="mt-4 text-2xl">
            Buku lama
            <br />
            Kesan pertama
          </h2>
          <div className="mt-7 flex flex-col gap-6">
            {[
              [
                '01',
                'Tunjukkan sisi terbaiknya',
                'Gunakan cahaya alami dan tampilkan kondisi buku secara jujur.',
              ],
              [
                '02',
                'Pasang harga yang bersahabat',
                'Pertimbangkan kondisi buku dan harga barunya. Semua harga dalam rupiah.',
              ],
              [
                '03',
                'Ceritakan detail kecilnya',
                'Ada catatan atau halaman terlipat? Sampaikan agar calon pembeli tahu.',
              ],
            ].map(([num, title, copy]) => (
              <div className="flex gap-3" key={num}>
                <span className="font-serif text-xl text-[#c28e6c]">{num}</span>
                <div>
                  <h3 className="text-xs font-semibold">{title}</h3>
                  <p className="mt-1 text-[11px] leading-6 text-[#858b77]">{copy}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-7 border-t border-[#dddfcf] pt-5">
            <span className="flex items-center gap-2 text-xs font-medium text-[#52694a]">
              <Icon name="pin" size={16} /> Bertemu aman di kampus
            </span>
            <p className="mt-2 text-[10px] leading-6 text-[#8b9081]">
              Pilih tempat umum yang ramai dan periksa buku sebelum membayar. Pesan langsung dan
              pembayaran belum tersedia di BookSwap.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
