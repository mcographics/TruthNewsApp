import { Bookmark, BookmarkCheck, ChevronRight, CircleAlert, FileQuestion, LoaderCircle, X } from 'lucide-react'
import type { BookmarkInput, HistoricalConfidence, ProphecyClassification } from '../../../shared/types'
import { useApp } from '../context/AppContext'
import type { ReactNode } from 'react'

export const Panel = ({ title, action, children, className = '' }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }): React.JSX.Element => (
  <section className={`panel ${className}`}>
    {(title || action) && <header className="panel-heading">{title && <h2>{title}</h2>}{action}</header>}
    {children}
  </section>
)

export const ConfidenceBadge = ({ value }: { value: HistoricalConfidence }): React.JSX.Element => (
  <span className={`badge confidence badge-${value.toLowerCase().replaceAll(' ', '-')}`}>{value}</span>
)

export const ProphecyBadge = ({ value }: { value: ProphecyClassification }): React.JSX.Element => (
  <span className={`badge prophecy badge-${value.toLowerCase().replaceAll(' ', '-')}`}>{value}</span>
)

export const BookmarkButton = ({ input, compact = false }: { input: BookmarkInput; compact?: boolean }): React.JSX.Element => {
  const { isBookmarked, toggleBookmark } = useApp()
  const active = isBookmarked(input.entityType, input.entityId)
  const Icon = active ? BookmarkCheck : Bookmark
  return (
    <button className={`icon-button bookmark-button ${active ? 'active' : ''}`} onClick={(event) => { event.stopPropagation(); void toggleBookmark(input) }} title={active ? 'Remove bookmark' : 'Save bookmark'} aria-label={active ? 'Remove bookmark' : 'Save bookmark'}>
      <Icon size={compact ? 15 : 18} />{!compact && <span>{active ? 'Saved' : 'Save'}</span>}
    </button>
  )
}

export const EmptyState = ({ title, detail, action }: { title: string; detail: string; action?: ReactNode }): React.JSX.Element => (
  <div className="empty-state"><FileQuestion size={36} /><h3>{title}</h3><p>{detail}</p>{action}</div>
)

export const ErrorState = ({ message, retry }: { message: string; retry?: () => void }): React.JSX.Element => (
  <div className="error-state"><CircleAlert size={30} /><div><strong>Something needs attention</strong><p>{message}</p></div>{retry && <button className="gold-button" onClick={retry}>Retry</button>}</div>
)

export const LoadingScreen = (): React.JSX.Element => (
  <div className="loading-screen"><div className="brand-loader"><span className="initial-letter">T</span></div><LoaderCircle className="spin" size={26} /><p>Preparing Scripture, history, and local data…</p></div>
)

export const DetailDrawer = ({ title, subtitle, children, onClose }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void }): React.JSX.Element => (
  <div className="drawer-backdrop" role="presentation" onMouseDown={onClose}>
    <aside className="detail-drawer" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
      <header><div><span className="eyebrow">Evidence & context</span><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Close details"><X /></button></header>
      <div className="drawer-content">{children}</div>
    </aside>
  </div>
)

export const LinkRow = ({ label, detail, onClick }: { label: string; detail?: string; onClick: () => void }): React.JSX.Element => (
  <button className="link-row" onClick={onClick}><span><strong>{label}</strong>{detail && <small>{detail}</small>}</span><ChevronRight size={16} /></button>
)
