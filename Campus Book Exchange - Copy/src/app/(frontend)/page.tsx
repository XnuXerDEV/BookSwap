import type { Metadata } from 'next'
import Home from '@/components/bookswap/home'
export const metadata: Metadata = { title: 'BookSwap — Jual Beli & Tukar Buku Kampus' }
export default function HomePage() {
  return <Home />
}
