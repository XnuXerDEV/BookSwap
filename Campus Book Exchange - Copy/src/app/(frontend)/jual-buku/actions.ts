'use server'

import { headers } from 'next/headers'
import sharp from 'sharp'
import { getPayloadClient } from '@/lib/payload'
import { createUUID } from '@/lib/uuid'
import {
  bookCategories,
  bookConditions,
  campuses,
  MAX_BOOK_PRICE,
  MAX_PHOTO_BYTES,
  photoTypes,
} from '@/lib/book-options'

export type ListingResult = {
  success: boolean
  id?: string
  errors?: Record<string, string>
  message: string
}

export async function submitBook(form: FormData): Promise<ListingResult> {
  const errors: Record<string, string> = {}
  const text = (name: string) =>
    typeof form.get(name) === 'string' ? String(form.get(name)).trim() : ''
  const title = text('title'),
    author = text('author'),
    description = text('description')
  const category = text('category'),
    condition = text('condition'),
    campus = text('campus')
  const price = Number(text('price')),
    listingType = text('listingType')
  if (title.length < 2 || title.length > 100) errors.title = 'Judul harus berisi 2–100 karakter.'
  if (author.length < 2 || author.length > 80)
    errors.author = 'Nama penulis harus berisi 2–80 karakter.'
  if (description.length < 20 || description.length > 2000)
    errors.description = 'Deskripsi harus berisi 20–2.000 karakter.'
  if (!bookCategories.some((value) => value === category))
    errors.category = 'Pilih kategori yang tersedia.'
  if (!bookConditions.some((value) => value === condition)) errors.condition = 'Pilih kondisi buku.'
  if (!campuses.some((value) => value === campus)) errors.campus = 'Pilih kampus yang tersedia.'
  if (!Number.isInteger(price) || price < 1000 || price > MAX_BOOK_PRICE)
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
  if (text('website')) return { success: false, message: 'Pengiriman tidak dapat diproses.' }
  if (Object.keys(errors).length || !(file instanceof File))
    return { success: false, message: 'Periksa kembali isian formulirmu.', errors }
  let data: Buffer
  try {
    // Decode and re-encode actual image bytes; MIME and filenames alone are untrusted.
    data = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40000000 })
      .rotate()
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()
  } catch {
    return {
      success: false,
      message: 'Foto tidak dapat dibaca.',
      errors: { photo: 'Pilih berkas gambar JPG, PNG, atau WebP yang valid.' },
    }
  }
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  let uploadedId: string | undefined
  try {
    const photo = await payload.create({
      collection: 'media',
      overrideAccess: false,
      user,
      context: { bookSubmission: true },
      data: { alt: `Foto buku ${title}` },
      file: { data, mimetype: 'image/webp', name: `buku-${createUUID()}.webp`, size: data.length },
    })
    uploadedId = photo.id
    const book = await payload.create({
      collection: 'books',
      overrideAccess: false,
      user,
      depth: 0,
      context: { bookSubmission: true, uploadedMediaId: photo.id },
      data: {
        title,
        author,
        description,
        category: category as (typeof bookCategories)[number],
        condition: condition as (typeof bookConditions)[number],
        campus: campus as (typeof campuses)[number],
        price,
        photo: photo.id,
        swap: listingType === 'Jual atau tukar',
        status: 'active',
      },
    })
    return {
      success: true,
      id: book.id,
      message: 'Bukumu berhasil disimpan dan kini tampil di etalase.',
    }
  } catch {
    if (uploadedId) {
      try {
        await payload.delete({
          collection: 'media',
          id: uploadedId,
          overrideAccess: false,
          user,
          context: { cleanupMediaId: uploadedId },
        })
      } catch {
        console.error('BookSwap: gagal membersihkan unggahan yang belum terhubung.')
      }
    }
    return {
      success: false,
      message: 'Buku belum berhasil disimpan. Silakan coba lagi; isianmu tetap ada.',
    }
  }
}
