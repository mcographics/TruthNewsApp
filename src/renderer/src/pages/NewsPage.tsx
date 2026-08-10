import { Bookmark, CalendarClock, ExternalLink, Filter, Newspaper, RefreshCw, Search, ShieldCheck, WifiOff } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { NewsArticle } from '../../../shared/types'
import { useApp } from '../context/AppContext'
import { BookmarkButton, DetailDrawer, EmptyState, Panel, ProphecyBadge } from '../components/ui'

const formatDateTime = (value: string): string => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

export const NewsPage = (): React.JSX.Element => {
  const { news, sources, sync, syncing, refreshNews } = useApp()
  const [category, setCategory] = useState('All')
  const [sourceId, setSourceId] = useState('All')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<NewsArticle | null>(null)
  const categories = useMemo(() => ['All', ...new Set(news.map((article) => article.category))], [news])
  const filtered = useMemo(() => news.filter((article) => {
    if (category !== 'All' && article.category !== category) return false
    if (sourceId !== 'All' && article.sourceId !== sourceId) return false
    return !query.trim() || `${article.headline} ${article.summary} ${article.publisher}`.toLowerCase().includes(query.toLowerCase())
  }), [news, category, sourceId, query])
  const selectedSource = selected ? sources.find((source) => source.id === selected.sourceId) : undefined

  return (
    <div className="page news-page">
      <header className="page-header"><div><span className="eyebrow">Attributed publisher feeds</span><h1>News Feed</h1><p>Retrieved reporting and editorial interpretation remain visibly distinct. TruthNewsApp never invents a news article or silently declares a modern event prophetic fulfillment.</p></div><button className="gold-button filled" onClick={() => void refreshNews()} disabled={syncing}><RefreshCw size={17} className={syncing ? 'spin' : ''} />{syncing ? 'Synchronizing…' : 'Refresh Now'}</button></header>
      <div className={`connection-banner ${sync.online ? 'online' : 'offline'}`}>{sync.online ? <ShieldCheck /> : <WifiOff />}<div><strong>{sync.online ? 'Connected to approved feeds' : 'Offline — local cache only'}</strong><p>{sync.message}</p></div><span>{sync.lastNewsSync ? `Last successful sync ${formatDateTime(sync.lastNewsSync)}` : 'No successful sync recorded'}</span></div>
      <Panel className="news-controls">
        <div className="inline-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter cached headlines and summaries…" /></div>
        <label><Filter size={16} /><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><Newspaper size={16} /><span>Source</span><select value={sourceId} onChange={(event) => setSourceId(event.target.value)}><option>All</option>{sources.filter((source) => source.category === 'news' && source.enabled).map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}</select></label>
        <span className="result-count">{filtered.length} article{filtered.length === 1 ? '' : 's'}</span>
      </Panel>
      {filtered.length ? <div className="news-list">{filtered.map((article) => (
        <article className="news-card" key={article.id} onClick={() => setSelected(article)}>
          <div className="news-card-source"><span>{article.publisher.split(' ').map((word) => word[0]).join('').slice(0, 3)}</span></div>
          <div className="news-card-body"><div className="news-labels"><span className="category-label">{article.category}</span>{article.isOpinion && <span className="opinion-label">OPINION / COMMENTARY</span>}</div><h2>{article.headline}</h2><p>{article.summary || 'The publisher feed did not provide a summary. Open the original article for details.'}</p><footer><span>{article.publisher}</span><span><CalendarClock size={14} />Published {formatDateTime(article.publishedAt)}</span><span>Retrieved {formatDateTime(article.retrievedAt)}</span></footer></div>
          <BookmarkButton compact input={{ entityType: 'news', entityId: article.id, title: article.headline, subtitle: `${article.publisher} · ${formatDateTime(article.publishedAt)}` }} />
        </article>
      ))}</div> : <EmptyState title={news.length ? 'No articles match these filters' : 'No local news yet'} detail={news.length ? 'Try a different category, source, or search phrase.' : sync.online ? 'Choose Refresh Now to retrieve the latest publisher-supplied RSS metadata.' : 'Reconnect to synchronize. The app will never pretend old data is fresh.'} action={!news.length && <button className="gold-button" onClick={() => void refreshNews()}><RefreshCw size={16} />Retry synchronization</button>} />}
      {selected && <DetailDrawer title={selected.headline} subtitle={`${selected.publisher} · ${formatDateTime(selected.publishedAt)}`} onClose={() => setSelected(null)}>
        <div className="drawer-badges"><span className="badge">{selected.category}</span>{selected.isOpinion && <span className="badge badge-disputed">OPINION / COMMENTARY</span>}</div>
        <section className="article-section"><span>WHAT HAPPENED</span><p>{selected.summary || 'No publisher summary was supplied in the RSS feed. Read the original article for the report.'}</p></section>
        <section className="article-section"><span>VERIFIED METADATA</span><dl><div><dt>Publisher</dt><dd>{selected.publisher}</dd></div><div><dt>Author</dt><dd>{selected.author}</dd></div><div><dt>Published</dt><dd>{formatDateTime(selected.publishedAt)}</dd></div><div><dt>Retrieved</dt><dd>{formatDateTime(selected.retrievedAt)}</dd></div><div><dt>Source status</dt><dd>{selectedSource?.reliability || 'Publisher RSS record'}</dd></div></dl></section>
        <section className="article-section analysis-unavailable"><span>BIBLICAL & CONSERVATIVE ANALYSIS</span><p>No reviewed editorial analysis has been attached. TruthNewsApp does not automatically generate analysis and present it as sourced reporting.</p></section>
        <section className="article-section prophecy-caution"><span>PROPHECY WATCH</span><ProphecyBadge value="UNKNOWN" /><p>No reviewed prophecy relationship has been assigned. Similarity alone is not fulfillment.</p></section>
        <div className="drawer-actions"><button className="gold-button filled" onClick={() => void window.truthNews.openExternal(selected.originalUrl)}>Read original article <ExternalLink size={16} /></button><BookmarkButton input={{ entityType: 'news', entityId: selected.id, title: selected.headline, subtitle: `${selected.publisher} · ${formatDateTime(selected.publishedAt)}` }} /></div>
      </DetailDrawer>}
    </div>
  )
}
