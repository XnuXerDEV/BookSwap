import type { Metadata } from 'next'
import SellBook from '@/components/bookswap/sell-book'
export const metadata: Metadata = { title: 'Jual Buku | BookSwap' }
export default function SellPage() {
  return <SellBook />
}
