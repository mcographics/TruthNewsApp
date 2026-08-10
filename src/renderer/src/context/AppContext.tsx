import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  AppSettings,
  BibleBook,
  BookmarkInput,
  BootstrapData,
  NewsArticle,
  NoteInput,
  SourceRecord
} from '../../../shared/types'

interface AppContextValue extends BootstrapData {
  loading: boolean
  syncing: boolean
  error: string | null
  bibleBooks: BibleBook[]
  refreshNews: () => Promise<void>
  toggleBookmark: (input: BookmarkInput) => Promise<void>
  saveNote: (input: NoteInput) => Promise<void>
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>
  updateSource: (sourceId: string, enabled: boolean) => Promise<void>
  clearNews: () => Promise<void>
  clearActivity: () => Promise<void>
  resetLocalData: () => Promise<void>
  reload: () => Promise<void>
  isBookmarked: (entityType: BookmarkInput['entityType'], entityId: string) => boolean
}

const EMPTY_DATA: BootstrapData = {
  events: [], prophecies: [], dispensations: [], news: [], sources: [], bookmarks: [], notes: [],
  settings: {
    theme: 'dark-gold', refreshMinutes: 30, timezone: 'America/Toronto', country: 'Canada', language: 'English',
    defaultBible: 'WEB', dateFormat: 'long', reducedMotion: false, sidebarCollapsed: false
  },
  sync: { online: false, successfulSources: 0, failedSources: 0, message: 'Loading local data…' }
}

const AppContext = createContext<AppContextValue | null>(null)

const errorMessage = (error: unknown): string => error instanceof Error ? error.message : 'An unexpected error occurred.'

export const AppProvider = ({ children }: { children: ReactNode }): React.JSX.Element => {
  const [data, setData] = useState<BootstrapData>(EMPTY_DATA)
  const [bibleBooks, setBibleBooks] = useState<BibleBook[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const [bootstrap, books] = await Promise.all([window.truthNews.getBootstrap(), window.truthNews.getBibleBooks()])
      setData(bootstrap)
      setBibleBooks(books)
      setError(null)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
    return window.truthNews.onNewsUpdated(() => void reload())
  }, [reload])

  useEffect(() => {
    const applyTheme = (): void => {
      const systemLight = window.matchMedia('(prefers-color-scheme: light)').matches
      const resolved = data.settings.theme === 'system' ? (systemLight ? 'white-gold' : 'dark-gold') : data.settings.theme
      document.documentElement.dataset.theme = resolved
      document.documentElement.dataset.motion = data.settings.reducedMotion ? 'reduced' : 'full'
    }
    applyTheme()
    const media = window.matchMedia('(prefers-color-scheme: light)')
    media.addEventListener('change', applyTheme)
    return () => media.removeEventListener('change', applyTheme)
  }, [data.settings.theme, data.settings.reducedMotion])

  const refreshNews = useCallback(async () => {
    setSyncing(true)
    setError(null)
    try {
      const result = await window.truthNews.refreshNews()
      setData((current) => ({ ...current, news: result.news, sources: result.sources, sync: result.sync }))
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setSyncing(false)
    }
  }, [])

  const toggleBookmark = useCallback(async (input: BookmarkInput) => {
    try {
      const bookmarks = await window.truthNews.toggleBookmark(input)
      setData((current) => ({ ...current, bookmarks }))
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }, [])

  const saveNote = useCallback(async (input: NoteInput) => {
    try {
      const notes = await window.truthNews.saveNote(input)
      setData((current) => ({ ...current, notes }))
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }, [])

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    try {
      const settings = await window.truthNews.updateSettings(patch)
      setData((current) => ({ ...current, settings }))
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }, [])

  const updateSource = useCallback(async (sourceId: string, enabled: boolean) => {
    try {
      const sources = await window.truthNews.updateSource(sourceId, enabled)
      setData((current) => ({ ...current, sources }))
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }, [])

  const clearNews = useCallback(async () => {
    const news = await window.truthNews.clearNewsCache()
    setData((current) => ({ ...current, news }))
  }, [])

  const clearActivity = useCallback(async () => {
    const activity = await window.truthNews.clearActivity()
    setData((current) => ({ ...current, ...activity }))
  }, [])

  const resetLocalData = useCallback(async () => {
    await window.truthNews.resetLocalData()
    setLoading(true)
    await reload()
  }, [reload])

  const isBookmarked = useCallback((entityType: BookmarkInput['entityType'], entityId: string) => (
    data.bookmarks.some((bookmark) => bookmark.entityType === entityType && bookmark.entityId === entityId)
  ), [data.bookmarks])

  const value = useMemo<AppContextValue>(() => ({
    ...data, loading, syncing, error, bibleBooks, refreshNews, toggleBookmark, saveNote, updateSettings, updateSource,
    clearNews, clearActivity, resetLocalData, reload, isBookmarked
  }), [data, loading, syncing, error, bibleBooks, refreshNews, toggleBookmark, saveNote, updateSettings, updateSource, clearNews, clearActivity, resetLocalData, reload, isBookmarked])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}

export const newestArticles = (articles: NewsArticle[], limit = 4): NewsArticle[] => [...articles]
  .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
  .slice(0, limit)

export const newsSources = (sources: SourceRecord[]): SourceRecord[] => sources.filter((source) => source.category === 'news')
