import { CalendarRange, Check, ChevronLeft, ChevronRight, Filter, Layers3, Minus, Plus, ScrollText } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import type { ProphecyRecord, TimelineEvent } from '../../../shared/types'
import { EventDrawer, ProphecyDrawer } from '../components/EntityDrawers'
import { ConfidenceBadge, EmptyState, Panel, ProphecyBadge } from '../components/ui'
import { useApp } from '../context/AppContext'

type TimelineMode = 'master' | 'bible' | 'history' | 'prophecy' | 'jesus'

const MODE_CONFIG: Record<TimelineMode, { title: string; eyebrow: string; detail: string; categories: string[] }> = {
  master: { title: 'Global Master Timeline', eyebrow: 'Everything connects through time', detail: 'Compare biblical events, Jesus Christ, Israel, Church history, world history, and reviewed prophecy relationships on one evidence-aware chronology.', categories: [] },
  bible: { title: 'Bible Timeline', eyebrow: 'Genesis to Revelation', detail: 'A chronological guide to the biblical narrative. Ancient dates remain approximate, disputed, or unknown wherever the evidence requires it.', categories: ['Bible', 'Jesus Christ', 'Church History'] },
  history: { title: 'History Timeline', eyebrow: 'The biblical world in historical context', detail: 'View biblical, Jewish, Church, and world history together without treating interpretive chronology as manufactured certainty.', categories: ['World History', 'Israel', 'Church History'] },
  prophecy: { title: 'Prophetic Timeline', eyebrow: 'Prophecy and proposed fulfillment remain separate records', detail: 'Study prophecy, its original setting, evidence chain, proposed fulfillments, and confidence classification.', categories: [] },
  jesus: { title: 'Jesus Christ: Life & Ministry', eyebrow: 'The Gospel witness in historical context', detail: 'Follow major events in the life, ministry, death, and resurrection of Jesus while preserving disputed chronology.', categories: ['Jesus Christ'] }
}

const ZOOM_LABELS = ['Millennia', 'Centuries', 'Decades', 'Years']

export const TimelinePage = ({ mode }: { mode: TimelineMode }): React.JSX.Element => {
  const { events, prophecies } = useApp()
  const config = MODE_CONFIG[mode]
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [selectedProphecy, setSelectedProphecy] = useState<ProphecyRecord | null>(null)
  const [zoom, setZoom] = useState(mode === 'jesus' ? 3 : 1)
  const [query, setQuery] = useState('')
  const allCategories = useMemo(() => [...new Set(events.map((event) => event.category))], [events])
  const initialCategories = config.categories.length ? config.categories : allCategories
  const [activeCategories, setActiveCategories] = useState<string[]>(initialCategories)

  const filteredEvents = useMemo(() => events.filter((event) => {
    if (mode === 'prophecy') return false
    if (!activeCategories.includes(event.category)) return false
    return !query.trim() || `${event.title} ${event.summary} ${event.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())
  }), [events, activeCategories, query, mode])

  const filteredProphecies = useMemo(() => prophecies.filter((record) => !query.trim() || `${record.title} ${record.reference} ${record.context}`.toLowerCase().includes(query.toLowerCase())), [prophecies, query])
  const toggleCategory = (category: string): void => setActiveCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category])
  const scroll = (direction: -1 | 1): void => scrollRef.current?.scrollBy({ left: direction * 520, behavior: 'smooth' })

  return (
    <div className="page timeline-page">
      <header className="page-header"><div><span className="eyebrow">{config.eyebrow}</span><h1>{config.title}</h1><p>{config.detail}</p></div><div className="date-engine-note"><CalendarRange /><span><strong>Historical Date Engine</strong><small>Exact · approximate · range · disputed · unknown · future</small></span></div></header>
      <Panel className="timeline-toolbar">
        <label className="timeline-search"><Filter size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter this timeline…" /></label>
        {mode !== 'prophecy' && <div className="overlay-filters"><Layers3 size={16} /><span>Overlays</span>{allCategories.map((category) => <button key={category} className={activeCategories.includes(category) ? 'active' : ''} onClick={() => toggleCategory(category)}><i>{activeCategories.includes(category) && <Check size={11} />}</i>{category}</button>)}</div>}
        <div className="zoom-control"><button onClick={() => setZoom(Math.max(0, zoom - 1))} aria-label="Zoom out"><Minus /></button><span>{ZOOM_LABELS[zoom]}</span><button onClick={() => setZoom(Math.min(ZOOM_LABELS.length - 1, zoom + 1))} aria-label="Zoom in"><Plus /></button></div>
      </Panel>

      {mode === 'prophecy' ? (
        <div className={`prophecy-timeline zoom-${zoom}`} ref={scrollRef}>{filteredProphecies.map((record, index) => <button className="prophecy-timeline-card" key={record.id} onClick={() => setSelectedProphecy(record)}><span className="timeline-index">{String(index + 1).padStart(2, '0')}</span><small>{record.spokenDate}</small><h2>{record.title}</h2><strong>{record.reference}</strong><p>{record.context}</p><ProphecyBadge value={record.classification} /><i className="timeline-dot" /></button>)}</div>
      ) : filteredEvents.length ? (
        <div className="timeline-viewport">
          <button className="timeline-arrow left" onClick={() => scroll(-1)} aria-label="Scroll timeline left"><ChevronLeft /></button>
          <div className={`master-timeline zoom-${zoom}`} ref={scrollRef}>
            <div className="timeline-axis" />
            {filteredEvents.map((event, index) => <button className={`timeline-event event-${index % 2 ? 'below' : 'above'}`} key={event.id} onClick={() => setSelectedEvent(event)}><i className="timeline-dot" /><div><span className="event-category">{event.category}</span><h2>{event.title}</h2><strong>{event.date.displayDate}</strong><p>{event.summary}</p><ConfidenceBadge value={event.date.confidence} />{event.scripture && <small className="scripture-line"><ScrollText size={13} />{event.scripture}</small>}</div></button>)}
          </div>
          <button className="timeline-arrow right" onClick={() => scroll(1)} aria-label="Scroll timeline right"><ChevronRight /></button>
        </div>
      ) : <EmptyState title="No events match this view" detail="Enable another timeline overlay or clear the filter phrase." />}

      <section className="timeline-legend"><div><i className="dot exact" /><span><strong>Exact / certain</strong><small>Specific date supported by the record</small></span></div><div><i className="dot approximate" /><span><strong>Approximate</strong><small>Best-supported range or reconstruction</small></span></div><div><i className="dot disputed" /><span><strong>Disputed</strong><small>Major proposed chronologies are preserved</small></span></div><div><i className="dot unknown" /><span><strong>Unknown / future</strong><small>No manufactured date is assigned</small></span></div></section>
      {selectedEvent && <EventDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      {selectedProphecy && <ProphecyDrawer prophecy={selectedProphecy} onClose={() => setSelectedProphecy(null)} />}
    </div>
  )
}
