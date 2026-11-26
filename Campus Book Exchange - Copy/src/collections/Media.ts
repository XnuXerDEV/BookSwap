import type { CollectionConfig } from 'payload'

import { createFolderField, createTagField } from 'payload'
import { invalidateBooks } from '../lib/book-cache'
import { MAX_PHOTO_BYTES, photoTypes } from '../lib/book-options'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: ({ req }) => req.user?.collection === 'admins' || req.context.bookSubmission === true,
    update: ({ req }) => req.user?.collection === 'admins',
    delete: ({ req, id }) =>
      req.user?.collection === 'admins' ||
      (typeof id === 'string' && req.context.cleanupMediaId === id),
  },
  hooks: {
    beforeChange: [
      ({ req, data }) => {
        if (
          req.context.bookSubmission === true &&
          req.file &&
          (!photoTypes.includes(req.file.mimetype) || req.file.size > MAX_PHOTO_BYTES)
        ) {
          throw new Error('Gunakan foto JPG, PNG, atau WebP maksimal 5 MB.')
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
      name: 'alt',
      type: 'text',
      required: true,
    },
    createFolderField({ relationTo: 'folders' }),
    createTagField({ relationTo: 'tags' }),
  ],
  upload: {
    modifyResponseHeaders: ({ headers }) => {
      headers.set('Cache-Control', 'public, max-age=60, s-maxage=60')
      return headers
    },
  },
}
