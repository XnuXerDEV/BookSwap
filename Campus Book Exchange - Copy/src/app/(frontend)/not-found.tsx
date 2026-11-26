import Link from 'next/link'

/**
 * Custom not-found page for the frontend.
 * This renders when `notFound()` is called from any page in the (frontend) route group.
 *
 * Customize this component to match your app's design and provide helpful navigation.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center px-8 py-16 text-center">
      <h1 className="page-heading">Halaman tidak ditemukan.</h1>
      <p className="mt-4 text-[#7e817a]">
        Halaman yang kamu cari tidak ada atau sudah dipindahkan.
      </p>
      <Link className="button button-green mt-6" href="/">
        &larr; Kembali ke Beranda
      </Link>
    </div>
  )
}
