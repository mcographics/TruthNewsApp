import { BookOpen, Check, ChevronLeft, ChevronRight, Clock3, Copy, ExternalLink, FileText, Link2, LoaderCircle, NotebookPen, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { BibleVerse } from '../../../shared/types'
import { BookmarkButton, DetailDrawer, EmptyState, Panel } from '../components/ui'
import { useApp } from '../context/AppContext'

export const BiblePage = (): React.JSX.Element => {
  const { bibleBooks, bibleTranslations, events, notes, saveNote, settings } = useApp()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [translationCode, setTranslationCode] = useState(params.get('translation') || settings.defaultBible || 'WEB')
  const [bookCode, setBookCode] = useState(params.get('book') || 'JOH')
  const [chapter, setChapter] = useState(Math.max(1, Number(params.get('chapter') || 1)))
  const [verses, setVerses] = useState<BibleVerse[]>([])
  const [selected, setSelected] = useState<BibleVerse | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BibleVerse[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [loadingTranslation, setLoadingTranslation] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [openingFacsimile, setOpeningFacsimile] = useState(false)
  const [copied, setCopied] = useState(false)
  const [note, setNote] = useState('')

  const currentTranslation = bibleTranslations.find((translation) => translation.code === translationCode)
  const availableBooks = useMemo(() => {
    if (!currentTranslation || currentTranslation.format === 'facsimile') return []
    const available = new Set(currentTranslation.bookCodes)
    return bibleBooks.filter((book) => available.has(book.code))
  }, [bibleBooks, currentTranslation])
  const currentBook = availableBooks.find((book) => book.code === bookCode)

  useEffect(() => {
    if (!bibleTranslations.length) return
    if (!bibleTranslations.some((translation) => translation.code === translationCode)) setTranslationCode(settings.defaultBible || 'WEB')
  }, [bibleTranslations, settings.defaultBible, translationCode])

  useEffect(() => {
    if (!currentTranslation) return
    setSelected(null)
    setResults(null)
    setLoadError(null)
    if (currentTranslation.format === 'facsimile') {
      setVerses([])
      setParams({ translation: currentTranslation.code }, { replace: true })
      return
    }
    const resolvedBook = currentBook ?? availableBooks[0]
    if (!resolvedBook) return
    if (resolvedBook.code !== bookCode) {
      setBookCode(resolvedBook.code)
      setChapter(1)
      return
    }
    let active = true
    setLoadingTranslation(true)
    void window.truthNews.getBibleChapter(currentTranslation.code, resolvedBook.code, chapter)
      .then((value) => { if (active) setVerses(value) })
      .catch((reason: unknown) => { if (active) setLoadError(reason instanceof Error ? reason.message : 'The translation could not be loaded.') })
      .finally(() => { if (active) setLoadingTranslation(false) })
    setParams({ translation: currentTranslation.code, book: resolvedBook.code, chapter: String(chapter) }, { replace: true })
    return () => { active = false }
  }, [availableBooks, bookCode, chapter, currentBook, currentTranslation, setParams])

  useEffect(() => {
    if (!selected) return
    setNote(notes.find((item) => item.entityType === 'verse' && item.entityId === selected.id)?.body ?? '')
  }, [selected, notes])

  const relatedEvents = useMemo(() => selected ? events.filter((event) => {
    const referenceText = `${event.scripture ?? ''} ${event.summary} ${event.tags.join(' ')}`.toLowerCase()
    return referenceText.includes(selected.bookName.toLowerCase()) || referenceText.includes(selected.bookCode.toLowerCase())
  }).slice(0, 6) : [], [selected, events])

  const chooseTranslation = (code: string): void => {
    const translation = bibleTranslations.find((item) => item.code === code)
    setTranslationCode(code)
    setQuery('')
    setResults(null)
    if (translation?.bookCodes.length && !translation.bookCodes.includes(bookCode)) {
      setBookCode(translation.bookCodes.includes('JOH') ? 'JOH' : translation.bookCodes[0])
      setChapter(1)
    }
  }

  const runSearch = async (): Promise<void> => {
    if (query.trim().length < 2 || !currentTranslation || currentTranslation.format !== 'text') return
    setSearching(true)
    setLoadError(null)
    try { setResults(await window.truthNews.searchBible(currentTranslation.code, query)) }
    catch (reason) { setLoadError(reason instanceof Error ? reason.message : 'The Bible search failed.') }
    finally { setSearching(false) }
  }

  const chooseVerse = (verse: BibleVerse): void => {
    setTranslationCode(verse.translationCode)
    setBookCode(verse.bookCode)
    setChapter(verse.chapter)
    setResults(null)
    setSelected(verse)
  }

  const copyVerse = async (verse: BibleVerse): Promise<void> => {
    await window.truthNews.copyText(`${verse.reference} — ${verse.text} (${verse.translationAbbreviation})`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1_500)
  }

  const openFacsimile = async (): Promise<void> => {
    if (!currentTranslation || currentTranslation.format !== 'facsimile') return
    setOpeningFacsimile(true)
    setLoadError(null)
    try { await window.truthNews.openBibleResource(currentTranslation.code) }
    catch (reason) { setLoadError(reason instanceof Error ? reason.message : 'The facsimile could not be opened.') }
    finally { setOpeningFacsimile(false) }
  }

  return (
    <div className="page bible-page">
      <header className="page-header"><div><span className="eyebrow">Offline Scripture library</span><h1>Bible Reader</h1><p>Choose among complete public-domain and freely distributable editions. Text packs load into the local database only when selected; notes and bookmarks remain on this device.</p></div><div className="translation-chip"><BookOpen /><span><strong>{currentTranslation?.name ?? 'Loading translations…'}</strong><small>{currentTranslation ? `${currentTranslation.scope} · ${currentTranslation.abbreviation}` : 'Local library'}</small></span></div></header>
      <Panel className="bible-toolbar">
        <label><span>Translation</span><select aria-label="Bible translation" value={translationCode} onChange={(event) => chooseTranslation(event.target.value)}>{bibleTranslations.map((translation) => <option value={translation.code} key={translation.code}>{translation.abbreviation} — {translation.name}</option>)}</select></label>
        {currentTranslation?.format === 'text' && <><label><span>Book</span><select aria-label="Bible book" value={bookCode} onChange={(event) => { setBookCode(event.target.value); setChapter(1); setResults(null) }}>{availableBooks.map((book) => <option value={book.code} key={book.code}>{book.name}</option>)}</select></label>
        <label><span>Chapter</span><select aria-label="Bible chapter" value={chapter} onChange={(event) => { setChapter(Number(event.target.value)); setResults(null) }}>{Array.from({ length: currentBook?.chapters || 1 }, (_, index) => index + 1).map((value) => <option key={value}>{value}</option>)}</select></label>
        <div className="bible-search"><Search /><input aria-label="Search selected Bible translation" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void runSearch() }} placeholder={`Search ${currentTranslation.abbreviation} or enter John 3:16`} /><button className="gold-button" onClick={() => void runSearch()} disabled={searching || loadingTranslation}>{searching ? 'Searching…' : 'Search'}</button></div></>}
      </Panel>
      {loadError && <div className="inline-error" role="alert">{loadError}</div>}
      {currentTranslation?.format === 'facsimile' ? (
        <Panel className="facsimile-panel"><FileText /><div><span className="eyebrow">Geneva Bible 1560 · Historical facsimile</span><h2>Original 1,224-page scanned edition</h2><p>This supplied PDF is an image facsimile, not reliable searchable text. Open it locally in your default PDF reader to preserve the original typography, marginal notes, and page structure.</p><p className="rights-note">{currentTranslation.rights}</p><button className="gold-button" onClick={() => void openFacsimile()} disabled={openingFacsimile}><ExternalLink size={16} />{openingFacsimile ? 'Opening…' : 'Open Geneva 1560 facsimile'}</button></div></Panel>
      ) : results ? (
        <section className="bible-results"><header><div><span className="eyebrow">Local {currentTranslation?.abbreviation} search</span><h2>{results.length} result{results.length === 1 ? '' : 's'} for “{query}”</h2></div><button className="text-button" onClick={() => setResults(null)}>Return to {currentBook?.name} {chapter}</button></header>{results.length ? results.map((verse) => <button key={verse.id} onClick={() => chooseVerse(verse)}><strong>{verse.reference} · {verse.translationAbbreviation}</strong><p>{verse.text}</p><ChevronRight /></button>) : <EmptyState title="No Scripture results" detail="Try another word, phrase, or a complete reference such as Romans 8:28." />}</section>
      ) : loadingTranslation ? (
        <div className="translation-loading"><LoaderCircle /><strong>Loading {currentTranslation?.name}…</strong><span>The first selection imports this edition into your private local database.</span></div>
      ) : (
        <section className="bible-reader">
          <header><button disabled={chapter <= 1} onClick={() => setChapter(chapter - 1)}><ChevronLeft />Previous</button><div><span>{currentTranslation?.name}</span><h2>{currentBook?.name} {chapter}</h2></div><button disabled={chapter >= (currentBook?.chapters || 1)} onClick={() => setChapter(chapter + 1)}>Next<ChevronRight /></button></header>
          <div className="chapter-text">{verses.map((verse) => <button key={verse.id} className={params.get('verse') === String(verse.verse) ? 'highlighted' : ''} onClick={() => setSelected(verse)}><sup>{verse.verse}{verse.endVerse !== verse.verse ? `–${verse.endVerse}` : ''}</sup>{verse.text}</button>)}</div>
        </section>
      )}
      {currentTranslation && <footer className="bible-license"><Clock3 /><p><strong>{currentTranslation.name}.</strong> {currentTranslation.rights} {currentTranslation.format === 'facsimile' ? 'The scan is opened unchanged and is not presented as OCR-derived Scripture text.' : 'The supplied translation wording is imported without editorial rewriting.'}</p><button className="text-button" onClick={() => void window.truthNews.openExternal(currentTranslation.sourceUrl)}>Source details<ExternalLink size={14} /></button></footer>}
      {selected && <DetailDrawer title={selected.reference} subtitle={`${selected.translationName} · ${selected.translationAbbreviation}`} onClose={() => setSelected(null)}>
        <blockquote className="verse-focus">“{selected.text}”</blockquote>
        <div className="drawer-actions"><button className="gold-button" onClick={() => void copyVerse(selected)}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy verse'}</button><BookmarkButton input={{ entityType: 'verse', entityId: selected.id, title: `${selected.reference} · ${selected.translationAbbreviation}`, subtitle: selected.text.slice(0, 180) }} /></div>
        <div className="evidence-block"><h3><Link2 size={17} />Timeline connections</h3>{relatedEvents.length ? relatedEvents.map((event) => <button className="source-link" key={event.id} onClick={() => navigate('/timeline/bible')}><span><strong>{event.title}</strong><small>{event.date.displayDate} · {event.category}</small></span><ChevronRight size={15} /></button>) : <p>No reviewed timeline relationship is attached to this verse yet.</p>}</div>
        <div className="note-editor"><label htmlFor={`verse-note-${selected.id}`}><NotebookPen size={17} />Private local note</label><textarea id={`verse-note-${selected.id}`} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Write a personal study note…" /><button className="gold-button" onClick={() => void saveNote({ entityType: 'verse', entityId: selected.id, body: note })}>Save note</button></div>
      </DetailDrawer>}
    </div>
  )
}
