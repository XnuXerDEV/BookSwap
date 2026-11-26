import { Link } from 'react-router-dom'
import { Icon, Cover } from './artwork'
export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>
            Tukar buku
            <br />
            Sebarkan cerita
            <br />
            <svg className="title-underline" viewBox="0 0 430 15" fill="none">
              <path
                d="M3 11C113 1 295 1 426 9"
                stroke="#eb9c77"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </svg>
          </h1>
          <p>
            Bacaan favoritmu berikutnya ada di dekatmu. Beli, jual,
            <br className="desktop-break" /> dan tukar buku dengan teman sekampus.
          </p>
          <div className="hero-buttons">
            <Link className="button button-green" to="/etalase">
              Cari bacaanmu <Icon name="arrow" size={18} />
            </Link>
            <Link className="text-button" to="/jual-buku">
              Carikan rumah baru <span>↗</span>
            </Link>
          </div>
          <div className="social-proof">

          </div>
        </div>
        <div className="hero-art" aria-label="Tumpukan buku yang siap memulai cerita baru">
          <div className="art-grid" />
          <div className="art-orbit" />
          <div className="art-orbit orbit-two" />
          <div className="hero-book back-book">
            <div className="hero-spine" />
            <Cover
              book={{ cover: 'money', title: 'The Psychology of Money', author: 'Morgan Housel' }}
              hero
            />
          </div>
          <div className="hero-book front-book">
            <div className="hero-spine" />
            <Cover book={{ cover: 'atomic', title: 'Atomic Habits', author: 'James Clear' }} hero />
          </div>
          <span className="art-caption">CERITA BARUMU DIMULAI DI SINI ↗</span>
        </div>
      </section>

      <section className="benefits-strip">
        <div>
          <Icon name="pin" size={19} />
          <span>
            <strong>Di kampusmu.</strong> Tak perlu jauh-jauh.
          </span>
        </div>
        <div>
          <Icon name="bag" size={19} />
          <span>
            <strong>Harga ramah mahasiswa.</strong> Insyaallah.
          </span>
        </div>
        <div>
          <Icon name="swap" size={19} />
          <span>
            <strong>Teruskan bukunya.</strong> Biarkan ceritanya berlanjut.
          </span>
        </div>
      </section>

      <section className="sell-banner">
        <div className="banner-illustration">
          <Icon name="book" size={53} />
          <span>↗</span>
        </div>
        <div>
          <span className="eyebrow">BERI RUANG BARU DI RAK BUKUMU.</span>
          <h2>Sudah selesai? Teruskan ceritanya.</h2>
          <p>Jadikan bacaan semester lalumu favorit baru bagi teman kampus.</p>
        </div>
        <Link className="button button-green" to="/jual-buku">
          Pasang buku pertamamu <Icon name="arrow" size={18} />
        </Link>
      </section>
    </>
  )
}
