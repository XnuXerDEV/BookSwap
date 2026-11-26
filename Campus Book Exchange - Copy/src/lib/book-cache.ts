import { revalidateTag } from 'next/cache'

export const BOOKS_TAG = 'bookswap-books'
export function invalidateBooks() {
  try {
    revalidateTag(BOOKS_TAG, { expire: 0 })
  } catch (error) {
    // CLI content operations have no Next.js cache context; web writes do.
    if (
      error instanceof Error &&
      /static generation store|incrementalCache|incremental cache|work store/i.test(error.message)
    )
      return
    throw error
  }
}
