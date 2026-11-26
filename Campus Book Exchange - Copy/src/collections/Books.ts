import type { CollectionConfig } from 'payload'
import { bookCategories, bookConditions, campuses, MAX_BOOK_PRICE } from '../lib/book-options'
import { invalidateBooks } from '../lib/book-cache'

export const Books: CollectionConfig = {
  slug: 'books',
  labels: { singular: 'Buku', plural: 'Buku' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'price', 'status'],
    group: 'BookSwap',
  },
  access: {
    read: ({ req }) =>
      req.user?.collection === 'admins' ? true : { status: { equals: 'active' } },
    create: ({ req }) => req.user?.collection === 'admins' || req.context.bookSubmission === true,
    update: ({ req }) => req.user?.collection === 'admins',
    delete: ({ req }) => req.user?.collection === 'admins',
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data) {
          for (const key of ['title', 'author', 'description', 'seller']) {
            if (typeof data[key] === 'string') data[key] = data[key].trim()
          }
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        const price = data.price ?? originalDoc?.price
        const original = data.original ?? originalDoc?.original
        if (!Number.isInteger(price) || price < 1000 || price > MAX_BOOK_PRICE)
          throw new Error('Harga harus berupa rupiah bulat antara Rp1.000 dan Rp2.000.000.')
        if (original != null && original < price)
          throw new Error('Harga awal tidak boleh lebih kecil dari harga jual.')
        if (
          operation === 'create' &&
          req.context.bookSubmission === true &&
          req.user?.collection !== 'admins'
        ) {
          if (!data.photo || data.photo !== req.context.uploadedMediaId)
            throw new Error('Gunakan foto yang diunggah bersama formulir ini.')
          data.seller = 'Teman kampus'
          data.initials = 'TK'
          data.cover = 'creative'
          data.status = 'active'
          data.original = data.price
        }
        if (data.photo) {
          const media = await req.payload.findByID({
            collection: 'media',
            id: data.photo,
            overrideAccess: false,
            user: req.user,
            req,
          })
          if (!media.mimeType?.startsWith('image/'))
            throw new Error('Foto buku harus berupa gambar.')
        }
        return data
      },
    ],
    afterChange: [
      ({ doc }) => {
        invalidateBooks()
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        invalidateBooks()
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'title',
      label: 'Judul buku',
      type: 'text',
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    { name: 'author', label: 'Penulis', type: 'text', required: true, minLength: 2, maxLength: 80 },
    {
      name: 'category',
      label: 'Kategori',
      type: 'select',
      required: true,
      options: [...bookCategories],
    },
    {
      name: 'condition',
      label: 'Kondisi',
      type: 'select',
      required: true,
      options: [...bookConditions],
    },
    {
      name: 'price',
      label: 'Harga (Rp)',
      type: 'number',
      required: true,
      min: 1000,
      max: MAX_BOOK_PRICE,
    },
    { name: 'original', label: 'Harga awal (Rp)', type: 'number', min: 1000 },
    {
      name: 'description',
      label: 'Deskripsi',
      type: 'textarea',
      required: true,
      minLength: 20,
      maxLength: 2000,
    },
    { name: 'photo', label: 'Foto buku', type: 'upload', relationTo: 'media' },
    { name: 'campus', label: 'Kampus', type: 'select', required: true, options: [...campuses] },
    { name: 'swap', label: 'Bisa ditukar', type: 'checkbox', defaultValue: false },
    {
      name: 'seller',
      label: 'Nama penjual',
      type: 'text',
      defaultValue: 'Teman kampus',
      maxLength: 80,
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
    {
      name: 'initials',
      type: 'text',
      defaultValue: 'TK',
      maxLength: 3,
      admin: { hidden: true },
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
    {
      name: 'cover',
      label: 'Gaya sampul ilustrasi',
      type: 'select',
      defaultValue: 'creative',
      options: [
        'atomic',
        'money',
        'design',
        'calculus',
        'fiction',
        'creative',
        'thinking',
        'history',
      ],
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      required: true,
      options: [
        { label: 'Tersedia', value: 'active' },
        { label: 'Diarsipkan', value: 'archived' },
      ],
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
      admin: { position: 'sidebar' },
    },
  ],
}
