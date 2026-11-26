import type { Metadata } from 'next'
import Catalog from '@/components/bookswap/catalog'
import { getBooks } from '@/lib/books'

export const metadata: Metadata = { title: 'Etalase Buku | BookSwap' }
export default async function CatalogPage() {
  return <Catalog books={await getBooks()} />
}
