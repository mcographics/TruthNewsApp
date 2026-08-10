import {
  BookOpenText, CalendarDays, ChevronRight, CircleCheck, Clock3, Cross, Crown, Flame, Globe2,
  History, Hourglass, Landmark, Newspaper, RefreshCw, ScrollText, ShieldCheck, Sparkles, Sun, UsersRound
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TimelineEvent } from '../../../shared/types'
import heroCross from '../assets/hero-cross.png'
import { newestArticles, useApp } from '../context/AppContext'
import { EventDrawer, ProphecyDrawer } from '../components/EntityDrawers'
import { EmptyState, Panel, ProphecyBadge } from '../components/ui'

const FEATURE_CARDS = [
  { title: 'History Timeline', detail: 'Explore evidence-aware history beside biblical chronology.', to: '/timeline/history', icon: Landmark, action: 'Explore' },
  { title: 'Prophetic Timeline', detail: 'Study prophecy without turning resemblance into certainty.', to: '/timeline/prophecy', icon: Flame, action: 'Explore' },
  { title: 'Bible Timeline', detail: 'Move through Scripture from Genesis to Revelation.', to: '/timeline/bible', icon: BookOpenText, action: 'Explore' },
  { title: 'News Feed', detail: 'Christian and conservative sources with visible attribution.', to: '/news', icon: Newspaper, action: 'View News' }
]

const OVERVIEW_NODES = [
  { id: 'event-creation', label: 'Creation', date: 'Date disputed', icon: Globe2 },
  { id: 'event-abraham', label: 'Abrahamic Covenant', date: 'c. 2000 BC', icon: Sparkles },
  { id: 'event-david', label: 'Davidic Kingdom', date: 'c. 1000 BC', icon: Crown },
  { id: 'event-birth-jesus', label: 'First Coming of Christ', date: 'c. 6–4 BC', icon: Cross },
  { id: 'event-pentecost', label: 'Church Age', date: 'c. AD 30–Present', icon: UsersRound },
  { id: 'future-tribulation', label: 'Tribulation', date: 'Future', icon: Hourglass },
  { id: 'future-coming', label: 'Second Coming', date: 'Future', icon: Crown },
  { id: 'future-millennium', label: 'Millennium', date: 'Future', icon: Sun }
]

export const DashboardPage = (): React.JSX.Element => {
  const { events, prophecies, dispensations, news, sources, sync, syncing, refreshNews } = useApp()
  const navigate = useNavigate()
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [selectedProphecyId, setSelectedProphecyId] = useState<string | null>(null)
  const headlines = newestArticles(news, 3)
  const jesusEvents = useMemo(() => events.filter((event) => ['event-birth-jesus', 'event-ministry-jesus', 'event-crucifixion', 'event-resurrection'].includes(event.id)), [events])
  const currentDispensation = dispensations.find((record) => record.status === 'current')
  const selectedProphecy = prophecies.find((record) => record.id === selectedProphecyId)

  const selectNode = (id: string): void => {
    const event = events.find((candidate) => candidate.id === id)
    if (event) setSelectedEvent(event)
    else if (id.includes('tribulation') || id.includes('coming') || id.includes('millennium')) navigate('/dispensations')
  }

  return (
    <div className="dashboard-grid">
      <section className="hero-panel" style={{ backgroundImage: `url(${heroCross})` }}>
        <div className="hero-copy"><span className="hero-kicker">Scripture · History · Current Events</span><h1>TRUTH<br />STANDS<br />FOREVER</h1><p>Accurate history.<br />Biblical truth.<br />Prophecy examined with care.</p><div className="hero-actions"><button className="gold-button filled" onClick={() => navigate('/timeline/master')}>Explore the master timeline <ChevronRight size={16} /></button><button className="text-button" onClick={() => navigate('/bible')}>Open Scripture</button></div></div>
      </section>

      <Panel title="Top Headlines" className="headlines-panel" action={<button className="text-button" onClick={() => navigate('/news')}>View all</button>}>
        {headlines.length ? headlines.map((article, index) => (
          <button className="headline-row" key={article.id} onClick={() => void window.truthNews.openExternal(article.originalUrl)}>
            <div className={`headline-thumb thumb-${index + 1}`}><Newspaper size={24} /><span>{article.publisher.slice(0, 2).toUpperCase()}</span></div>
            <div>{index === 0 && <span className="breaking-label">LATEST</span>}<strong>{article.headline}</strong><small>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(article.publishedAt))} · {article.category}</small></div>
          </button>
        )) : <EmptyState title="No synchronized headlines" detail={sync.online ? 'Connect to the approved publisher feeds now.' : 'You are offline. Previously retrieved headlines will appear here.'} action={<button className="gold-button" disabled={syncing} onClick={() => void refreshNews()}><RefreshCw className={syncing ? 'spin' : ''} size={16} />Refresh now</button>} />}
      </Panel>

      <section className="feature-row">
        {FEATURE_CARDS.map(({ title, detail, to, icon: Icon, action }) => <article className="feature-card" key={title}><Icon /><div><h2>{title}</h2><p>{detail}</p></div><button onClick={() => navigate(to)}>{action}</button></article>)}
      </section>

      <Panel title="Prophetic Timeline Overview" className="overview-panel" action={<button className="text-button" onClick={() => navigate('/timeline/prophecy')}>View timeline</button>}>
        <div className="overview-line">{OVERVIEW_NODES.map(({ id, label, date, icon: Icon }) => <button key={id} onClick={() => selectNode(id)}><span className="node-label">{label}</span><small>{date}</small><i><Icon size={18} /></i></button>)}</div>
      </Panel>

      <Panel title="Verified Prophecy Fulfillment" className="verified-panel" action={<button className="text-button" onClick={() => navigate('/prophecies')}>View all</button>}>
        <div className="verified-list">{prophecies.filter((record) => ['EXPLICITLY FULFILLED', 'HISTORICALLY ASSOCIATED'].includes(record.classification)).slice(0, 5).map((record) => <button key={record.id} onClick={() => setSelectedProphecyId(record.id)}><CircleCheck /><span><strong>{record.title}</strong><small>{record.reference} · {record.fulfillmentDate}</small></span><ChevronRight size={15} /></button>)}</div>
      </Panel>

      <Panel title="Jesus Christ: Life Timeline" className="jesus-panel" action={<button className="text-button" onClick={() => navigate('/jesus')}>View full timeline</button>}>
        <div className="jesus-cards">{jesusEvents.map((event, index) => <button key={event.id} className={`jesus-card jesus-card-${index + 1}`} onClick={() => setSelectedEvent(event)}><div className="jesus-card-art">{index === 0 ? <Sparkles /> : index === 1 ? <ScrollText /> : index === 2 ? <Cross /> : <Sun />}</div><strong>{event.title}</strong><span>{event.date.displayDate}</span><small>{event.region}</small></button>)}</div>
      </Panel>

      <Panel title="Current Dispensation" className="current-dispensation" action={<button className="text-button" onClick={() => navigate('/dispensations')}>View framework</button>}>
        {currentDispensation && <div><div className="disp-current-icon"><Flame /></div><section><span className="eyebrow">Chosen theological framework</span><h3>{currentDispensation.name}</h3><p>{currentDispensation.beginning} — {currentDispensation.end}</p><small>{currentDispensation.significance}</small></section></div>}
      </Panel>

      <Panel title="All Dispensations" className="dispensations-strip" action={<span className="framework-note">Classic dispensational framework</span>}>
        <div>{dispensations.map((record, index) => <button key={record.id} className={record.status} onClick={() => navigate('/dispensations')}><i>{index === 0 ? <Sparkles /> : index === 1 ? <ShieldCheck /> : index === 2 ? <Landmark /> : index === 3 ? <ScrollText /> : index === 4 ? <Cross /> : index === 5 ? <Flame /> : index === 6 ? <Hourglass /> : <Crown />}</i><strong>{record.name.replace(' / Church Age', '')}</strong><small>{record.status === 'current' ? 'Present interpretation' : record.status}</small></button>)}</div>
      </Panel>

      <section className="dashboard-meta">
        <div><CalendarDays /><span><strong>Real-world time</strong><small>{new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' }).format(new Date())}</small></span></div>
        <div><Clock3 /><span><strong>Historical dates</strong><small>Ancient chronology never relies on JavaScript Date alone.</small></span></div>
        <div><ShieldCheck /><span><strong>Source transparency</strong><small>{sources.length} source records show where claims came from.</small></span></div>
      </section>

      {selectedEvent && <EventDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      {selectedProphecy && <ProphecyDrawer prophecy={selectedProphecy} onClose={() => setSelectedProphecyId(null)} />}
    </div>
  )
}
