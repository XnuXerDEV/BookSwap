import { Link } from 'react-router-dom'
import { Icon } from '@/components/bookswap/artwork'
import { getCampusPhoto } from '@/lib/books'

export default function AboutPage() {
  const photo = getCampusPhoto()
  return (
    <div className="py-10 md:py-14">
      <div className="eyebrow">TENTANG BOOKSWAP</div>
      <section className="mt-5 grid items-center gap-9 md:grid-cols-2 md:gap-14">
        <div>
          <h1 className="page-heading">
            Buku mempertemukan
            <br />
            <span>kita.</span>
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-8 text-[#7e817a]">
            Dari buku kuliah tahun pertama hingga novel yang sulit dilepas, kami percaya buku seru
            layak dibaca lebih dari satu orang.
          </p>
          <p className="mt-3 max-w-lg text-sm leading-8 text-[#7e817a]">
            BookSwap adalah ruang jual, beli, dan tukar buku untuk lingkungan kampus. Kami membantu
            bacaan menemukan pembaca berikutnya—lebih dekat, lebih hemat, dan lebih bermakna.
          </p>
          <Link className="button button-green mt-7" to="/etalase">
            Temukan cerita barumu <Icon name="arrow" size={18} />
          </Link>
        </div>
        <div className="relative min-h-72 overflow-hidden rounded-lg bg-[#f0e9d9] md:h-96">
          {photo ? (
            <img
              src={photo.url}
              alt={photo.alt}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-80 items-center justify-center text-[#244e3e]">
              <Icon name="book" size={100} />
            </div>
          )}
          <span className="absolute bottom-5 left-5 rounded-md bg-[#fffef6] px-4 py-3 text-xs text-[#244e3e]">
            Satu kampus. Banyak cerita.
          </span>
        </div>
      </section>
      <section className="mt-14 grid gap-5 md:grid-cols-3">
        {[
          {
            icon: 'pin' as const,
            title: 'Dekat dengan kampus',
            copy: 'Temukan buku dari lingkungan belajarmu. Bertemu di tempat umum yang aman, tanpa perjalanan jauh.',
          },
          {
            icon: 'bag' as const,
            title: 'Ramah di kantong',
            copy: 'Bacaan bagus tak harus mahal. Pilih buku sesuai kebutuhan dan anggaran mahasiswamu.',
          },
          {
            icon: 'swap' as const,
            title: 'Cerita terus berputar',
            copy: 'Beri buku kesempatan kedua. Tukar bacaan dan kurangi buku yang terlupakan di rak.',
          },
        ].map((item) => (
          <article className="rounded-lg border border-[#e7e7de] bg-[#fffef9] p-7" key={item.title}>
            <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#e9eddf] text-[#244e3e]">
              <Icon name={item.icon} />
            </span>
            <h2 className="text-lg">{item.title}</h2>
            <p className="mt-3 text-xs leading-7 text-[#7e817a]">{item.copy}</p>
          </article>
        ))}
      </section>
      <section className="mt-14 grid gap-10 border-t border-[#e7e7de] pt-10 md:grid-cols-[.8fr_1.2fr]">
        <div>
          <span className="eyebrow">CARA KERJA</span>
          <h2 className="mt-4">
            Sesederhana
            <br />
            bertukar cerita.
          </h2>
          <p className="mt-4 text-xs leading-7 text-[#7e817a]">
            Dibuat untuk mahasiswa, pencinta buku, dan siapa pun yang ingin menjaga cerita tetap
            hidup.
          </p>
        </div>
        <div>
          {[
            [
              '01',
              'Temukan bacaan favoritmu.',
              'Jelajahi etalase berdasarkan judul, kategori, harga, atau kondisi. Ketuk hati untuk menyimpan favoritmu selama kunjungan ini.',
            ],
            [
              '02',
              'Beli bukunya. Atau tukar cerita.',
              'Cari label “Bisa ditukar” untuk menemukan pilihan bertukar buku. Periksa deskripsi dan kondisi buku terlebih dahulu.',
            ],
            [
              '03',
              'Bertemu dekat. Jelajah jauh.',
              'Selalu pilih tempat umum yang ramai. Periksa buku secara langsung sebelum membayar. Fitur pesan dan pembayaran belum tersedia di BookSwap.',
            ],
          ].map(([number, title, copy]) => (
            <div className="how-step" key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
