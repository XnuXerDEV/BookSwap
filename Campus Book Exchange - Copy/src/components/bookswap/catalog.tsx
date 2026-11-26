import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Icon, Cover } from './artwork'
import { Modal } from './modal'
import { useBookshelf } from './shell'
import type { BookView } from '@/lib/books'
import { rupiah, MAX_BOOK_PRICE, bookCategories } from '@/lib/book-options'
import { createOrGetSupabaseConversation } from '@/lib/chat-db'
import { getCurrentUser } from '@/lib/auth'

function BookImage({ book }: { book: BookView }) {
  return book.photoURL ? (
    <img
      src={book.photoURL}
      alt={book.photoAlt || `Sampul ${book.title}`}
      className="h-full w-full object-contain"
      loading="lazy"
    />
  ) : (
    <Cover book={book} />
  )
}

export default function Catalog({ books }: { books: BookView[] }) {
  const navigate = useNavigate()
  const { saved, toggleSave } = useBookshelf()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Semua buku')
  const [mode, setMode] = useState('Semua iklan')
  const [sort, setSort] = useState('Terbaru')
  const [condition, setCondition] = useState('Semua kondisi')
  const [savedOnly, setSavedOnly] = useState(false)
  const [visible, setVisible] = useState(8)
  const [selected, setSelected] = useState<BookView | null>(null)
  const [campus, setCampus] = useState('Semua kampus')
  const [campusOpen, setCampusOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [maxPrice, setMaxPrice] = useState(MAX_BOOK_PRICE)
  const searchRef = useRef<HTMLInputElement>(null)
  const categories = ['Semua buku', ...bookCategories]

  useEffect(() => {
    setSavedOnly(searchParams.get('tersimpan') === '1')
    setCampusOpen(searchParams.get('kampus') === '1')
  }, [searchParams])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(
    () =>
      books
        .filter(
          (b) =>
            (!savedOnly || saved.includes(b.id)) &&
            (category === 'Semua buku' || b.category === category) &&
            (campus === 'Semua kampus' || b.campus === campus) &&
            (mode !== 'Bisa ditukar' || b.swap) &&
            (condition === 'Semua kondisi' || b.condition === condition) &&
            b.price <= maxPrice &&
            `${b.title} ${b.author} ${b.category}`.toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === 'Harga terendah'
            ? a.price - b.price
            : sort === 'Harga tertinggi'
              ? b.price - a.price
              : 0,
        ),
    [books, savedOnly, saved, category, campus, mode, condition, maxPrice, query, sort],
  )

  const closeModal = () => {
    setSelected(null)
  }

  const handleOpenChat = async (book: BookView) => {
    const user = getCurrentUser()
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent('/etalase')}`)
      return
    }
    const result = await createOrGetSupabaseConversation(book)
    if (!result.success) {
      window.alert(result.error)
      return
    }
    navigate(`/pesan/${result.data.id}`)
  }

  return (
    <>
      <section className="marketplace" id="marketplace">
        <div className="section-heading">
          <div>
            <div className="eyebrow section-eyebrow">RAK BUKU KAMPUS</div>
            <h1 className="catalog-heading">
              {savedOnly ? 'Koleksi pilihanmu.' : 'Temukan cerita barumu.'}
              <span className="heading-dot">✳</span>
            </h1>
          </div>
          <div className="campus-control">
            <Icon name="pin" size={17} />
            <span>Jelajahi di</span>
            <button onClick={() => setCampusOpen(!campusOpen)}>
              {campus}
              <Icon name="chevron" size={15} />
            </button>
          </div>
        </div>
        {campusOpen && (
          <div className="campus-picker">
            <label htmlFor="campus">Pilih kampusmu</label>
            <select
              id="campus"
              value={campus}
              onChange={(e) => {
                setCampus(e.target.value)
                setCampusOpen(false)
              }}
            >
              <option>Semua kampus</option>
              <option>Universitas Muhammadiyah Cirebon</option>
              <option>Universitas Swadaya Gunung Jati</option>
              <option>UIN Siber Syekh Nurjati Cirebon</option>
              <option>Institut Prima Bangsa</option>
            </select>
            <button
              className="icon-button"
              aria-label="Tutup pilihan kampus"
              onClick={() => setCampusOpen(false)}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
        <div className="search-row">
          <label className="search-field">
            <Icon name="search" size={21} />
            <input
              ref={searchRef}
              aria-label="Cari buku"
              placeholder="Cari judul, penulis, atau topik favoritmu..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setVisible(8)
              }}
            />
            {query && (
              <button
                className="icon-button"
                aria-label="Hapus pencarian"
                onClick={() => setQuery('')}
              >
                <Icon name="close" size={16} />
              </button>
            )}
            <kbd>⌘ K</kbd>
          </label>
          <button
            className={`filter-button ${filtersOpen ? 'active' : ''}`}
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <Icon name="filter" size={18} /> Filter
            {maxPrice < MAX_BOOK_PRICE && <span className="tiny-dot" />}
          </button>
        </div>
        {filtersOpen && (
          <div className="expanded-filters">
            <label>
              Harga maksimal: <strong>{rupiah(maxPrice)}</strong>
              <input
                aria-label="Harga maksimal"
                type="range"
                min="1000"
                max={MAX_BOOK_PRICE}
                step="1000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
              />
            </label>
            <button
              className="text-button"
              onClick={() => {
                setMaxPrice(MAX_BOOK_PRICE)
                setCondition('Semua kondisi')
                setMode('Semua iklan')
              }}
            >
              Atur ulang filter
            </button>
          </div>
        )}
        <div className="categories">
          {categories.map((c, i) => (
            <button
              key={c}
              onClick={() => {
                setCategory(c)
                setVisible(8)
              }}
              className={category === c ? 'active' : ''}
            >
              {i === 0 && <Icon name="book" size={16} />}
              {c}
            </button>
          ))}
        </div>
        <div className="listing-toolbar">
          <div className="listing-tabs">
            {['Semua iklan', 'Bisa ditukar'].map((m) => (
              <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
                {m === 'Bisa ditukar' && <Icon name="swap" size={15} />}
                {m}
                {m === 'Semua iklan' && <span>{results.length}</span>}
              </button>
            ))}
            {savedOnly && (
              <button onClick={() => setSavedOnly(false)}>
                Hapus filter tersimpan <Icon name="close" size={13} />
              </button>
            )}
          </div>
          <div className="sort-controls">
            <select
              aria-label="Kondisi buku"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              <option>Semua kondisi</option>
              <option>Seperti baru</option>
              <option>Baik</option>
              <option>Cukup terawat</option>
            </select>
            <span />
            <label>
              Urutkan:{' '}
              <select
                aria-label="Urutkan buku"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option>Terbaru</option>
                <option>Harga terendah</option>
                <option>Harga tertinggi</option>
              </select>
            </label>
          </div>
        </div>
        <div className="books-grid">
          {results.slice(0, visible).map((book) => (
            <article className="book-card" key={book.id}>
              <div className={`book-stage stage-${book.cover}`}>
                <button
                  className="cover-button"
                  aria-label={`Lihat ${book.title}`}
                  onClick={() => setSelected(book)}
                >
                  <BookImage book={book} />
                </button>
                <span
                  className={`condition-badge ${book.condition === 'Seperti baru' ? 'like-new' : ''}`}
                >
                  <span />
                  {book.condition}
                </span>
                <button
                  className={`save-button ${saved.includes(book.id) ? 'is-saved' : ''}`}
                  aria-label={`${saved.includes(book.id) ? 'Batal simpan' : 'Simpan'} ${book.title}`}
                  onClick={() => toggleSave(book.id)}
                >
                  <Icon name="heart" size={18} filled={saved.includes(book.id)} />
                </button>
                {book.swap && (
                  <span className="swap-badge">
                    <Icon name="swap" size={13} /> Bisa ditukar
                  </span>
                )}
              </div>
              <div className="book-info">
                <span className="book-category">{book.category}</span>
                <button className="book-title" onClick={() => setSelected(book)}>
                  {book.title}
                </button>
                <p>{book.author}</p>
                <div className="price-row flex-wrap">
                  <strong>{rupiah(book.price)}</strong>
                  {book.original > book.price && <del>{rupiah(book.original)}</del>}
                  {book.original > book.price && (
                    <span>{Math.round((1 - book.price / book.original) * 100)}% lebih hemat</span>
                  )}
                </div>
                <div className="seller-row">
                  <span className="seller-avatar" style={{ background: book.color }}>
                    {book.initials}
                  </span>
                  <span>{book.seller}</span>
                  <span className="seller-verified">
                    <Icon name="check" size={10} />
                  </span>
                  <span className="seller-campus">
                    <Icon name="pin" size={12} /> Di kampus
                  </span>
                </div>

                {/* Tombol Chat Penjual di kartu buku */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[#dedfd5] bg-[#fffefb] py-2 text-[11px] font-semibold text-[#244e3e] shadow-2xs transition hover:border-[#244e3e] hover:bg-[#edf0e5]"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenChat(book)
                    }}
                    aria-label={`Chat Penjual untuk ${book.title}`}
                  >
                    <Icon name="chat" size={14} />
                    <span>Chat Penjual</span>
                  </button>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-[#dedfd5] bg-[#fffefb] text-[#697260] transition hover:border-[#52775c] hover:bg-[#edf0e5]"
                    onClick={() => setSelected(book)}
                    title="Detail buku"
                    aria-label={`Detail ${book.title}`}
                  >
                    <Icon name="search" size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {results.length === 0 && (
          <div className="empty-state">
            <Icon name={savedOnly ? 'heart' : 'search'} size={35} />
            <h3>{savedOnly ? 'Buku favoritmu menanti di sini.' : 'Belum ada buku di rak ini.'}</h3>
            <p>
              {savedOnly
                ? 'Ketuk ikon hati untuk menyimpan buku favoritmu.'
                : 'Coba judul lain atau longgarkan filter pencarianmu.'}
            </p>
            <button
              className="button button-green"
              onClick={() => {
                setQuery('')
                setCategory('Semua buku')
                setMode('Semua iklan')
                setMaxPrice(MAX_BOOK_PRICE)
                setCondition('Semua kondisi')
                setSavedOnly(false)
              }}
            >
              Jelajahi semua buku
            </button>
          </div>
        )}
        {results.length > visible && (
          <div className="load-more">
            <button className="button button-outline" onClick={() => setVisible((v) => v + 4)}>
              Lihat lebih banyak buku <Icon name="arrow" size={17} />
            </button>
            <span>Selalu ada cerita seru untuk ditemukan.</span>
          </div>
        )}
      </section>

      {selected && (
        <Modal label={selected.title} onClose={closeModal} detail>
          {' '}
          <div className={`detail-cover stage-${selected.cover}`}>
            <BookImage book={selected} />
          </div>
          <div className="detail-content">
            <span className="eyebrow">{selected.category}</span>
            <h2>{selected.title}</h2>
            <p>oleh {selected.author}</p>
            <div className="detail-price">
              {rupiah(selected.price)}{' '}
              {selected.original > selected.price && <del>{rupiah(selected.original)}</del>}
            </div>
            <div className="detail-tags">
              <span>{selected.condition}</span>
              {selected.swap && <span>Bisa ditukar</span>}
            </div>
            <p className="detail-description">{selected.description}</p>
            <div className="detail-seller">
              <span className="seller-avatar" style={{ background: selected.color }}>
                {selected.initials}
              </span>
              <div>
                <strong>{selected.seller}</strong>
                <p>Anggota komunitas kampus ({selected.campus})</p>
              </div>
            </div>

            {/* Tombol Chat Penjual di halaman detail buku */}
            <div className="mt-4 flex flex-col gap-2">
              <button
                className="button button-green flex w-full items-center justify-center gap-2"
                onClick={() => {
                  closeModal()
                  handleOpenChat(selected)
                }}
              >
                <Icon name="chat" size={18} />
                <span>Chat Penjual Sekarang</span>
              </button>
            </div>

            <button className="detail-save text-button mt-4" onClick={() => toggleSave(selected.id)}>
              <Icon name="heart" size={17} filled={saved.includes(selected.id)} />
              {saved.includes(selected.id) ? 'Tersimpan di rak bukumu' : 'Simpan untuk nanti'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
