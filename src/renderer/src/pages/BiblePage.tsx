import { BookOpen, Bookmark, Check, ChevronLeft, ChevronRight, Clock3, Copy, Link2, NotebookPen, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { BibleVerse } from '../../../shared/types'
import { BookmarkButton, DetailDrawer, EmptyState, Panel } from '../components/ui'
import { useApp } from '../context/AppContext'

export const BiblePage = (): React.JSX.Element => {
  const { bibleBooks, events, notes, saveNote } = useApp()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const initialBook = params.get('book') || 'JOH'
  const initialChapter = Math.max(1, Number(params.get('chapter') || 1))
  const [bookCode, setBookCode] = useState(initialBook)
  const [chapter, setChapter] = useState(initialChapter)
  const [verses, setVerses] = useState<BibleVerse[]>([])
  const [selected, setSelected] = useState<BibleVerse | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BibleVerse[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [copied, setCopied] = useState(false)
  const [note, setNote] = useState('')
  const currentBook = bibleBooks.find((book) => book.code === bookCode)

  useEffect(() => {
    void window.truthNews.getBibleChapter(bookCode, chapter).then(setVerses)
    setParams({ book: bookCode, chapter: String(chapter) }, { replace: true })
  }, [bookCode, chapter, setParams])

  useEffect(() => {
    if (!selected) return
    setNote(notes.find((item) => item.entityType === 'verse' && item.entityId === selected.id)?.body ?? '')
  }, [selected, notes])

  const relatedEvents = useMemo(() => selected ? events.filter((event) => {
    const referenceText = `${event.scripture ?? ''} ${event.summary} ${event.tags.join(' ')}`.toLowerCase()
    return referenceText.includes(selected.bookName.toLowerCase()) || referenceText.includes(selected.bookCode.toLowerCase())
  }).slice(0, 6) : [], [selected, events])

  const runSearch = async (): Promise<void> => {
    if (query.trim().length < 2) return
    setSearching(true)
    try { setResults(await window.truthNews.searchBible(query)) } finally { setSearching(false) }
  }

  const chooseVerse = (verse: BibleVerse): void => {
    setBookCode(verse.bookCode)
    setChapter(verse.chapter)
    setResults(null)
    setSelected(verse)
  }

  const copyVerse = async (verse: BibleVerse): Promise<void> => {
    await window.truthNews.copyText(`${verse.reference} — ${verse.text} (WEB)`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1_500)
  }

  return (
    <div className="page bible-page">
      <header className="page-header"><div><span className="eyebrow">Public-domain offline Scripture</span><h1>Bible Reader</h1><p>The complete World English Bible is stored locally. Translation text is unaltered; personal notes and bookmarks remain on this device.</p></div><div className="translation-chip"><BookOpen /><span><strong>World English Bible</strong><small>Public domain · eBible.org</small></span></div></header>
      <Panel className="bible-toolbar">
        <label><span>Book</span><select value={bookCode} onChange={(event) => { setBookCode(event.target.value); setChapter(1); setResults(null) }}>{bibleBooks.map((book) => <option value={book.code} key={book.code}>{book.name}</option>)}</select></label>
        <label><span>Chapter</span><select value={chapter} onChange={(event) => { setChapter(Number(event.target.value)); setResults(null) }}>{Array.from({ length: currentBook?.chapters || 1 }, (_, index) => index + 1).map((value) => <option key={value}>{value}</option>)}</select></label>
        <div className="bible-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void runSearch() }} placeholder="Search a phrase or reference, e.g. John 3:16" /><button className="gold-button" onClick={() => void runSearch()} disabled={searching}>{searching ? 'Searching…' : 'Search'}</button></div>
      </Panel>
      {results ? (
        <section className="bible-results"><header><div><span className="eyebrow">Local Bible search</span><h2>{results.length} result{results.length === 1 ? '' : 's'} for “{query}”</h2></div><button className="text-button" onClick={() => setResults(null)}>Return to {currentBook?.name} {chapter}</button></header>{results.length ? results.map((verse) => <button key={verse.id} onClick={() => chooseVerse(verse)}><strong>{verse.reference}</strong><p>{verse.text}</p><ChevronRight /></button>) : <EmptyState title="No Scripture results" detail="Try another word, phrase, or a complete reference such as Romans 8:28." />}</section>
      ) : (
        <section className="bible-reader">
          <header><button disabled={chapter <= 1} onClick={() => setChapter(chapter - 1)}><ChevronLeft />Previous</button><div><span>World English Bible</span><h2>{currentBook?.name} {chapter}</h2></div><button disabled={chapter >= (currentBook?.chapters || 1)} onClick={() => setChapter(chapter + 1)}>Next<ChevronRight /></button></header>
          <div className="chapter-text">{verses.map((verse) => <button key={verse.id} className={params.get('verse') === String(verse.verse) ? 'highlighted' : ''} onClick={() => setSelected(verse)}><sup>{verse.verse}{verse.endVerse !== verse.verse ? `–${verse.endVerse}` : ''}</sup>{verse.text}</button>)}</div>
        </section>
      )}
      <footer className="bible-license"><Clock3 /><p><strong>Offline and local-first.</strong> The World English Bible text is public domain. “World English Bible” is a trademark of eBible.org. The translation text has not been modified.</p></footer>
      {selected && <DetailDrawer title={selected.reference} subtitle="World English Bible · Public domain" onClose={() => setSelected(null)}>
        <blockquote className="verse-focus">“{selected.text}”</blockquote>
        <div className="drawer-actions"><button className="gold-button" onClick={() => void copyVerse(selected)}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy verse'}</button><BookmarkButton input={{ entityType: 'verse', entityId: selected.id, title: selected.reference, subtitle: `${selected.text.slice(0, 140)} · WEB` }} /></div>
        <div className="evidence-block"><h3><Link2 size={17} />Timeline connections</h3>{relatedEvents.length ? relatedEvents.map((event) => <button className="source-link" key={event.id} onClick={() => navigate('/timeline/bible')}><span><strong>{event.title}</strong><small>{event.date.displayDate} · {event.category}</small></span><ChevronRight size={15} /></button>) : <p>No reviewed timeline relationship is attached to this verse yet.</p>}</div>
        <div className="note-editor"><label htmlFor={`verse-note-${selected.id}`}><NotebookPen size={17} />Private local note</label><textarea id={`verse-note-${selected.id}`} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Write a personal study note…" /><button className="gold-button" onClick={() => void saveNote({ entityType: 'verse', entityId: selected.id, body: note })}>Save note</button></div>
      </DetailDrawer>}
    </div>
  )
}
