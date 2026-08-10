import { createHash } from 'node:crypto'
import Parser from 'rss-parser'
import type { NewsArticle, SourceRecord, SyncStatus } from '../shared/types'
import { database } from './database'

interface FeedItem {
  title?: string
  link?: string
  guid?: string
  isoDate?: string
  pubDate?: string
  creator?: string
  author?: string
  contentSnippet?: string
  content?: string
  categories?: string[]
  enclosure?: { url?: string }
}

const parser = new Parser({
  timeout: 15_000,
  headers: {
    'User-Agent': 'TruthNewsApp/0.1 (+desktop RSS reader; publisher attribution preserved)',
    Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml'
  }
})

const stripMarkup = (value = ''): string => value
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim()

const safeHttpsUrl = (value?: string): string | undefined => {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

const classifyArticle = (item: FeedItem, source: SourceRecord): Pick<NewsArticle, 'category' | 'region' | 'country' | 'isOpinion' | 'tags'> => {
  const text = `${item.title ?? ''} ${(item.categories ?? []).join(' ')}`.toLowerCase()
  const isOpinion = /\b(opinion|commentary|editorial|analysis)\b/.test(text)
  let category = isOpinion ? 'Commentary' : 'World'
  let region = 'Global'
  let country = ''
  if (/israel|jerusalem|gaza|west bank/.test(text) || source.id.includes('jpost')) { category = 'Israel'; region = 'Middle East'; country = 'Israel' }
  else if (/politic|election|congress|senate|white house|government/.test(text)) { category = 'Politics'; region = 'United States'; country = 'United States' }
  else if (/church|christian|pastor|religious liberty|persecution/.test(text) || source.id.includes('christian-post')) { category = 'Christianity' }
  else if (/archaeolog|ancient|excavat/.test(text)) { category = 'Archaeology' }
  else if (/science|technology|artificial intelligence|space/.test(text)) { category = 'Science & Technology' }
  else if (/war|military|missile|conflict|ceasefire/.test(text)) { category = 'War & Military' }
  return { category, region, country, isOpinion, tags: [...new Set([category, region, ...(item.categories ?? []).slice(0, 4)])] }
}

const normalizeItem = (item: FeedItem, source: SourceRecord, retrievedAt: string): NewsArticle | null => {
  const headline = stripMarkup(item.title).slice(0, 400)
  const originalUrl = safeHttpsUrl(item.link)
  if (!headline || !originalUrl) return null
  const published = new Date(item.isoDate || item.pubDate || retrievedAt)
  const publishedAt = Number.isNaN(published.getTime()) ? retrievedAt : published.toISOString()
  const classification = classifyArticle(item, source)
  const stableId = createHash('sha256').update(originalUrl).digest('hex').slice(0, 24)
  return {
    id: `news-${stableId}`,
    headline,
    publisher: source.name.replace(/ — .+$/, ''),
    author: stripMarkup(item.creator || item.author || 'Publisher staff').slice(0, 160),
    originalUrl,
    publishedAt,
    updatedAt: publishedAt,
    retrievedAt,
    category: classification.category,
    region: classification.region,
    country: classification.country,
    summary: stripMarkup(item.contentSnippet || item.content || 'Open the publisher’s article for the complete report.').slice(0, 1_500),
    sourceId: source.id,
    imageUrl: safeHttpsUrl(item.enclosure?.url),
    isOpinion: classification.isOpinion,
    tags: classification.tags
  }
}

export const refreshNewsFeeds = async (online: boolean): Promise<{ news: NewsArticle[]; sources: SourceRecord[]; sync: SyncStatus }> => {
  if (!online) {
    database.logNewsSync(false, 'Offline — displaying previously synchronized news', 0, 0)
    return { news: database.getNews(), sources: database.getSources(), sync: database.getSyncStatus(false) }
  }

  const sources = database.getEnabledNewsSources()
  const retrievedAt = new Date().toISOString()
  let successfulSources = 0
  let failedSources = 0
  const collected: NewsArticle[] = []

  await Promise.all(sources.map(async (source) => {
    if (!source.feedUrl) return
    try {
      const feed = await parser.parseURL(source.feedUrl)
      const normalized = (feed.items as FeedItem[])
        .map((item) => normalizeItem(item, source, retrievedAt))
        .filter((item): item is NewsArticle => item !== null)
      collected.push(...normalized)
      successfulSources += 1
      database.updateSourceStatus(source.id, { lastSuccess: retrievedAt, lastError: undefined })
    } catch (error) {
      failedSources += 1
      const message = error instanceof Error ? error.message.slice(0, 300) : 'Unknown feed error'
      database.updateSourceStatus(source.id, { lastError: message })
    }
  }))

  const uniqueByUrl = [...new Map(collected.map((article) => [article.originalUrl, article])).values()]
  if (uniqueByUrl.length > 0) database.upsertNews(uniqueByUrl)
  const succeeded = successfulSources > 0
  const message = succeeded
    ? `Connected — synchronized ${uniqueByUrl.length} articles from ${successfulSources} source${successfulSources === 1 ? '' : 's'}${failedSources ? `; ${failedSources} failed` : ''}`
    : 'Unable to retrieve live news — displaying local data'
  database.logNewsSync(succeeded, message, successfulSources, failedSources)
  return { news: database.getNews(), sources: database.getSources(), sync: database.getSyncStatus(online) }
}
