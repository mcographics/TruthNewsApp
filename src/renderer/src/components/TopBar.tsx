import { Bell, ChevronRight, CircleUserRound, Clock3, Search, Settings, Wifi, WifiOff, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SearchResult } from '../../../shared/types'
import { useApp } from '../context/AppContext'

export const TopBar = (): React.JSX.Element => {
  const { sync, news } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [clock, setClock] = useState(new Date())
  const requestId = useRef(0)

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return }
    const currentRequest = ++requestId.current
    const timer = window.setTimeout(() => {
      void window.truthNews.search(query).then((value) => {
        if (currentRequest === requestId.current) setResults(value)
      })
    }, 180)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!searchOpen) return
    const dismissOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', dismissOnEscape)
    return () => window.removeEventListener('keydown', dismissOnEscape)
  }, [searchOpen])

  const chooseResult = (result: SearchResult): void => {
    navigate(result.route)
    setQuery('')
    setResults([])
    setSearchOpen(false)
  }

  return (
    <header className="topbar">
      <div className={`global-search ${searchOpen ? 'open' : ''}`}>
        <Search size={18} />
        <input value={query} onChange={(event) => { setQuery(event.target.value); setSearchOpen(true) }} onFocus={() => setSearchOpen(true)} placeholder="Search news, Scripture, history, prophecy, people, places, events…" aria-label="Global search" />
        {query && <button className="clear-search" onClick={() => { setQuery(''); setResults([]); setSearchOpen(false) }} aria-label="Clear search"><X size={16} /></button>}
        {searchOpen && query.trim().length >= 2 && (
          <div className="search-results">
            <div className="search-results-title"><span>Search results</span><button onClick={() => setSearchOpen(false)}>Close</button></div>
            {results.length === 0 ? <p className="search-wait">Searching local Scripture, history, prophecy, sources, and synchronized news…</p> : results.map((result) => (
              <button key={result.id} onClick={() => chooseResult(result)}><span className={`result-type type-${result.type}`}>{result.type}</span><span><strong>{result.title}</strong><small>{result.subtitle}</small></span><ChevronRight size={15} /></button>
            ))}
          </div>
        )}
      </div>
      <div className="topbar-actions">
        <div className={`live-status ${sync.online ? 'online' : 'offline'}`} title={sync.message}>{sync.online ? <Wifi size={16} /> : <WifiOff size={16} />}<span><strong>{sync.online ? 'Live Updates' : 'Offline'}</strong><small>{sync.online ? 'Connected' : 'Local data'}</small></span></div>
        <div className="clock-compact"><Clock3 size={16} /><span>{new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(clock)}</span></div>
        <div className="popover-anchor">
          <button className="icon-button top-icon" onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false) }} aria-label="Notifications"><Bell /></button>
          {notificationsOpen && <div className="popover notifications"><header><strong>Latest updates</strong><span>{news.length} cached</span></header><p className="sync-note">{sync.message}</p>{news.slice(0, 4).map((article) => <button key={article.id} onClick={() => { navigate('/news'); setNotificationsOpen(false) }}><strong>{article.headline}</strong><small>{article.publisher}</small></button>)}{news.length === 0 && <p>No synchronized headlines yet. Open News Feed and choose Refresh Now.</p>}</div>}
        </div>
        <button className="icon-button top-icon" onClick={() => navigate('/settings')} aria-label="Open settings"><Settings /></button>
        <div className="popover-anchor">
          <button className="profile-button" onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false) }} aria-label="Application profile"><CircleUserRound /></button>
          {profileOpen && <div className="popover profile-popover"><strong>TruthNewsApp</strong><span>Local desktop profile</span><p>No account or sign-in is required. Bookmarks, notes, and preferences stay on this device.</p></div>}
        </div>
      </div>
      {searchOpen && <button className="search-dismiss" aria-label="Dismiss search" onClick={() => setSearchOpen(false)} />}
    </header>
  )
}
