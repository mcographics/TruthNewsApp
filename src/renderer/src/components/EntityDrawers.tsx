import { BookOpen, CalendarDays, ExternalLink, Link2, MapPin, NotebookPen } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ProphecyRecord, TimelineEvent } from '../../../shared/types'
import { useApp } from '../context/AppContext'
import { ConfidenceBadge, DetailDrawer, ProphecyBadge } from './ui'

export const EventDrawer = ({ event, onClose }: { event: TimelineEvent; onClose: () => void }): React.JSX.Element => {
  const { sources, events, notes, saveNote } = useApp()
  const saved = notes.find((note) => note.entityType === 'event' && note.entityId === event.id)?.body ?? ''
  const [note, setNote] = useState(saved)
  useEffect(() => setNote(saved), [saved, event.id])
  const related = events.filter((candidate) => event.relationshipIds.includes(candidate.id))
  return (
    <DetailDrawer title={event.title} subtitle={`${event.category} · ${event.region}`} onClose={onClose}>
      <div className="drawer-badges"><ConfidenceBadge value={event.date.confidence} /><span className="date-chip"><CalendarDays size={14} />{event.date.displayDate}</span></div>
      <p className="drawer-summary">{event.summary}</p>
      {event.scripture && <div className="evidence-block"><h3><BookOpen size={17} />Scripture</h3><p>{event.scripture}</p></div>}
      {(event.latitude || event.longitude) && <div className="evidence-block"><h3><MapPin size={17} />Location data</h3><p>{event.latitude?.toFixed(4)}, {event.longitude?.toFixed(4)} · Prepared for a future map module.</p></div>}
      {related.length > 0 && <div className="evidence-block"><h3><Link2 size={17} />Related events</h3>{related.map((item) => <p key={item.id}><strong>{item.title}</strong> — {item.date.displayDate}</p>)}</div>}
      <div className="evidence-block"><h3>Supporting sources</h3>{event.sourceIds.map((sourceId) => { const source = sources.find((item) => item.id === sourceId); return source ? <button key={source.id} className="source-link" onClick={() => void window.truthNews.openExternal(source.url)}><span><strong>{source.name}</strong><small>{source.category} · {source.reliability}</small></span><ExternalLink size={15} /></button> : null })}</div>
      <div className="note-editor"><label htmlFor={`note-${event.id}`}><NotebookPen size={17} />Private local note</label><textarea id={`note-${event.id}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add your research note. It stays on this device." /><button className="gold-button" onClick={() => void saveNote({ entityType: 'event', entityId: event.id, body: note })}>Save note</button></div>
    </DetailDrawer>
  )
}

export const ProphecyDrawer = ({ prophecy, onClose }: { prophecy: ProphecyRecord; onClose: () => void }): React.JSX.Element => {
  const { events, notes, saveNote } = useApp()
  const saved = notes.find((note) => note.entityType === 'prophecy' && note.entityId === prophecy.id)?.body ?? ''
  const [note, setNote] = useState(saved)
  useEffect(() => setNote(saved), [saved, prophecy.id])
  const related = useMemo(() => events.filter((event) => prophecy.relatedEventIds.includes(event.id)), [events, prophecy.relatedEventIds])
  return (
    <DetailDrawer title={prophecy.title} subtitle={`${prophecy.speaker} · ${prophecy.reference}`} onClose={onClose}>
      <div className="drawer-badges"><ProphecyBadge value={prophecy.classification} /><ConfidenceBadge value={prophecy.confidence} /></div>
      <div className="evidence-chain">
        <div><span>1</span><section><small>Prophecy spoken</small><strong>{prophecy.spokenDate}</strong><p>{prophecy.historicalSetting}</p></section></div>
        <div><span>2</span><section><small>Original context</small><strong>{prophecy.originalAudience}</strong><p>{prophecy.context}</p></section></div>
        <div><span>3</span><section><small>Proposed fulfillment</small><strong>{prophecy.proposedFulfillment}</strong><p>{prophecy.fulfillmentDate}</p></section></div>
        <div><span>4</span><section><small>Interpretive classification</small><strong>{prophecy.classification}</strong><p>{prophecy.interpretation}</p></section></div>
      </div>
      <div className="evidence-block"><h3>Evidence cited</h3>{prophecy.evidence.map((item) => <p key={item}>{item}</p>)}</div>
      <div className="evidence-block"><h3>Related events</h3>{related.length ? related.map((event) => <p key={event.id}><strong>{event.title}</strong> — {event.date.displayDate}</p>) : <p>No dated event relationship has been assigned.</p>}</div>
      <div className="evidence-block caution-block"><h3>Current relevance</h3><p>{prophecy.currentRelevance}</p></div>
      <div className="note-editor"><label htmlFor={`note-${prophecy.id}`}><NotebookPen size={17} />Private local note</label><textarea id={`note-${prophecy.id}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Record questions, comparisons, or source notes." /><button className="gold-button" onClick={() => void saveNote({ entityType: 'prophecy', entityId: prophecy.id, body: note })}>Save note</button></div>
    </DetailDrawer>
  )
}
