import type { BookView } from '@/lib/books'
type IconName =
  | 'search'
  | 'arrow'
  | 'heart'
  | 'bag'
  | 'pin'
  | 'chevron'
  | 'close'
  | 'plus'
  | 'swap'
  | 'check'
  | 'book'
  | 'filter'
  | 'mail'
  | 'menu'
  | 'send'
  | 'chat'
  | 'back'
  | 'user'
  | 'lock'
  | 'logout'
  | 'camera'
export function Icon({
  name,
  size = 20,
  filled = false,
}: {
  name: IconName
  size?: number
  filled?: boolean
}) {
  const paths: Record<IconName, React.ReactNode> = {
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    arrow: (
      <>
        <path d="M4 12h15M13 5l7 7-7 7" />
      </>
    ),
    heart: (
      <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    bag: (
      <>
        <path d="M5 7h14l1 14H4L5 7Z" />
        <path d="M8 8V6a4 4 0 0 1 8 0v2" />
      </>
    ),
    pin: (
      <>
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    chevron: <path d="m8 10 4 4 4-4" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    swap: (
      <>
        <path d="M3 7h17l-4-4M21 17H4l4 4M20 7l-4 4M4 17l4-4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    book: (
      <>
        <path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1ZM12 5v15" />
      </>
    ),
    filter: (
      <>
        <path d="M4 7h16M4 17h16" />
        <circle cx="9" cy="7" r="2" fill="currentColor" />
        <circle cx="15" cy="17" r="2" fill="currentColor" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m3 6 9 7 9-7" />
      </>
    ),
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    chat: (
      <>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </>
    ),
    back: (
      <>
        <path d="m15 18-6-6 6-6" />
      </>
    ),
    user: (
      <>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    lock: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
    camera: (
      <>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

export function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

export function Cover({
  book,
  hero = false,
}: {
  book: Pick<BookView, 'cover' | 'title' | 'author'>
  hero?: boolean
}) {
  return (
    <div className={`book-cover cover-${book.cover} ${hero ? 'hero-cover' : ''}`}>
      {book.cover === 'atomic' ? (
        <>
          <span className="cover-eyebrow">THE #1 NEW YORK TIMES BESTSELLER</span>
          <span className="atomic-dots">
            ••••••••••
            <br />
            ••••••••••
            <br />
            ••••••••••
          </span>
          <strong>
            Atomic
            <br />
            Habits
          </strong>
          <span className="cover-subtitle">
            Tiny Changes,
            <br />
            Remarkable Results
          </span>
          <b>James Clear</b>
        </>
      ) : book.cover === 'money' ? (
        <>
          <span className="cover-eyebrow">OVER 4 MILLION COPIES SOLD</span>
          <strong>
            <small>THE</small> PSYCHOLOGY <small>OF</small> MONEY
          </strong>
          <div className="money-tree">♠</div>
          <span className="cover-subtitle">
            Timeless lessons on wealth,
            <br />
            greed, and happiness
          </span>
          <b>MORGAN HOUSEL</b>
        </>
      ) : book.cover === 'design' ? (
        <>
          <span className="cover-eyebrow">REVISED & EXPANDED EDITION</span>
          <strong>
            THE DESIGN
            <br />
            OF EVERYDAY
            <br />
            THINGS
          </strong>
          <div className="design-object">
            <i />
          </div>
          <b>DON NORMAN</b>
        </>
      ) : book.cover === 'calculus' ? (
        <>
          <b>JAMES STEWART</b>
          <strong>CALCULUS</strong>
          <span className="cover-subtitle">EARLY TRANSCENDENTALS</span>
          <div className="calculus-art" />
          <span className="edition">EIGHTH EDITION</span>
        </>
      ) : (
        <>
          <span className="cover-eyebrow">BUKU YANG LAYAK DIBAGIKAN</span>
          <strong>{book.title}</strong>
          <div className="abstract-art" />
          <b>{book.author}</b>
        </>
      )}
    </div>
  )
}
