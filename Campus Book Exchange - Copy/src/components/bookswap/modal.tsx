'use client'
import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './artwork'

export function Modal({
  children,
  label,
  onClose,
  detail = false,
}: {
  children: ReactNode
  label: string
  onClose: () => void
  detail?: boolean
}) {
  const ref = useRef<HTMLElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose }, [onClose])
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusable = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>('button, input, select, a[href], textarea') ||
          [],
      )
    focusable()[0]?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
      if (e.key !== 'Tab') return
      const elements = focusable()
      const first = elements[0],
        last = elements[elements.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      }
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', handler)
      previous?.focus()
    }
  }, [])
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={ref}
        className={`modal ${detail ? 'detail-modal' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close icon-button" aria-label="Tutup dialog" onClick={onClose}>
          <Icon name="close" />
        </button>
        {children}
      </section>
    </div>
  )
}
