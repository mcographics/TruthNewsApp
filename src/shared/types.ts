export type ThemeMode = 'dark-gold' | 'white-gold' | 'system'
export type DateType = 'exact' | 'approximate' | 'range' | 'disputed' | 'unknown' | 'future'
export type Era = 'BC' | 'AD' | 'Present' | 'Future'
export type HistoricalConfidence =
  | 'CERTAIN'
  | 'HIGH CONFIDENCE'
  | 'PROBABLE'
  | 'APPROXIMATE'
  | 'DISPUTED'
  | 'SPECULATIVE'
  | 'UNKNOWN'

export type ProphecyClassification =
  | 'EXPLICITLY FULFILLED'
  | 'HISTORICALLY ASSOCIATED'
  | 'POSSIBLE CONNECTION'
  | 'WATCHING'
  | 'FUTURE'
  | 'DISPUTED'
  | 'UNKNOWN'

export interface HistoricalDate {
  dateType: DateType
  era: Era
  startYear?: number
  endYear?: number
  month?: number
  day?: number
  displayDate: string
  confidence: HistoricalConfidence
}

export interface TimelineEvent {
  id: string
  title: string
  summary: string
  category: string
  region: string
  date: HistoricalDate
  scripture?: string
  sourceIds: string[]
  relationshipIds: string[]
  latitude?: number
  longitude?: number
  tags: string[]
}

export interface ProphecyRecord {
  id: string
  title: string
  speaker: string
  reference: string
  originalAudience: string
  historicalSetting: string
  spokenDate: string
  context: string
  proposedFulfillment: string
  fulfillmentDate: string
  evidence: string[]
  relatedScripture: string[]
  interpretation: string
  currentRelevance: string
  classification: ProphecyClassification
  confidence: HistoricalConfidence
  relatedEventIds: string[]
}

export interface DispensationRecord {
  id: string
  name: string
  beginning: string
  end: string
  governingPrinciple: string
  responsibility: string
  figures: string[]
  covenants: string[]
  events: string[]
  scripture: string[]
  transition: string
  significance: string
  status: 'past' | 'current' | 'future'
}

export interface NewsArticle {
  id: string
  headline: string
  publisher: string
  author: string
  originalUrl: string
  publishedAt: string
  updatedAt: string
  retrievedAt: string
  category: string
  region: string
  country: string
  summary: string
  sourceId: string
  imageUrl?: string
  isOpinion: boolean
  tags: string[]
}

export interface SourceRecord {
  id: string
  name: string
  category: 'news' | 'biblical' | 'historical' | 'archaeological' | 'government'
  url: string
  feedUrl?: string
  description: string
  reliability: string
  enabled: boolean
  lastSuccess?: string
  lastError?: string
  termsNote: string
}

export interface BibleBook {
  code: string
  name: string
  order: number
  chapters: number
}

export interface BibleVerse {
  id: string
  bookCode: string
  bookName: string
  chapter: number
  verse: number
  endVerse: number
  text: string
  reference: string
}

export interface BookmarkRecord {
  id: string
  entityType: 'news' | 'event' | 'prophecy' | 'verse' | 'source'
  entityId: string
  title: string
  subtitle: string
  createdAt: string
  folder: string
}

export interface NoteRecord {
  id: string
  entityType: string
  entityId: string
  body: string
  updatedAt: string
}

export interface AppSettings {
  theme: ThemeMode
  refreshMinutes: number
  timezone: string
  country: string
  language: string
  defaultBible: string
  dateFormat: 'long' | 'short'
  reducedMotion: boolean
  sidebarCollapsed: boolean
}

export interface SyncStatus {
  online: boolean
  lastNewsSync?: string
  lastTimelineSync?: string
  lastAttempt?: string
  successfulSources: number
  failedSources: number
  message: string
}

export interface BootstrapData {
  events: TimelineEvent[]
  prophecies: ProphecyRecord[]
  dispensations: DispensationRecord[]
  news: NewsArticle[]
  sources: SourceRecord[]
  bookmarks: BookmarkRecord[]
  notes: NoteRecord[]
  settings: AppSettings
  sync: SyncStatus
}

export interface SearchResult {
  id: string
  type: 'news' | 'event' | 'prophecy' | 'verse' | 'source' | 'dispensation'
  title: string
  subtitle: string
  route: string
  entityId: string
}

export interface BookmarkInput {
  entityType: BookmarkRecord['entityType']
  entityId: string
  title: string
  subtitle: string
  folder?: string
}

export interface NoteInput {
  entityType: string
  entityId: string
  body: string
}

export interface TruthNewsApi {
  getBootstrap: () => Promise<BootstrapData>
  refreshNews: () => Promise<{ news: NewsArticle[]; sources: SourceRecord[]; sync: SyncStatus }>
  search: (query: string) => Promise<SearchResult[]>
  getBibleBooks: () => Promise<BibleBook[]>
  getBibleChapter: (bookCode: string, chapter: number) => Promise<BibleVerse[]>
  searchBible: (query: string) => Promise<BibleVerse[]>
  toggleBookmark: (input: BookmarkInput) => Promise<BookmarkRecord[]>
  saveNote: (input: NoteInput) => Promise<NoteRecord[]>
  updateSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>
  updateSource: (sourceId: string, enabled: boolean) => Promise<SourceRecord[]>
  clearNewsCache: () => Promise<NewsArticle[]>
  clearActivity: () => Promise<{ bookmarks: BookmarkRecord[]; notes: NoteRecord[] }>
  resetLocalData: () => Promise<boolean>
  openExternal: (url: string) => Promise<boolean>
  copyText: (text: string) => Promise<boolean>
  getTime: () => Promise<{ local: string; utc: string; timezone: string; iso: string }>
  onNewsUpdated: (callback: () => void) => () => void
}
