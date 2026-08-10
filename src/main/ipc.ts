import { clipboard, ipcMain, net, shell } from 'electron'
import type { AppSettings, BookmarkInput, NoteInput, ThemeMode } from '../shared/types'
import { database } from './database'
import { refreshNewsFeeds } from './newsService'

const validTheme = (value: unknown): value is ThemeMode => ['dark-gold', 'white-gold', 'system'].includes(String(value))
const stringValue = (value: unknown, maxLength: number): string => {
  if (typeof value !== 'string') throw new Error('Expected a string')
  return value.trim().slice(0, maxLength)
}

const validateSettingsPatch = (value: unknown): Partial<AppSettings> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid settings update')
  const input = value as Record<string, unknown>
  const patch: Partial<AppSettings> = {}
  if ('theme' in input) {
    if (!validTheme(input.theme)) throw new Error('Invalid theme')
    patch.theme = input.theme
  }
  if ('refreshMinutes' in input) patch.refreshMinutes = Math.min(240, Math.max(5, Math.round(Number(input.refreshMinutes) || 30)))
  if ('timezone' in input) patch.timezone = stringValue(input.timezone, 100)
  if ('country' in input) patch.country = stringValue(input.country, 80)
  if ('language' in input) patch.language = stringValue(input.language, 80)
  if ('defaultBible' in input) {
    const code = stringValue(input.defaultBible, 12).toUpperCase()
    if (!database.getBibleTranslations().some((translation) => translation.code === code && translation.format === 'text')) throw new Error('Invalid default Bible translation')
    patch.defaultBible = code
  }
  if ('dateFormat' in input) patch.dateFormat = input.dateFormat === 'short' ? 'short' : 'long'
  if ('reducedMotion' in input) patch.reducedMotion = Boolean(input.reducedMotion)
  if ('sidebarCollapsed' in input) patch.sidebarCollapsed = Boolean(input.sidebarCollapsed)
  return patch
}

export const registerIpcHandlers = (onSettingsUpdated: () => void = () => undefined): void => {
  ipcMain.handle('truth:get-bootstrap', () => database.getBootstrap(net.isOnline()))
  ipcMain.handle('truth:refresh-news', () => refreshNewsFeeds(net.isOnline()))
  ipcMain.handle('truth:search', (_event, query: unknown) => database.search(stringValue(query, 160)))
  ipcMain.handle('truth:get-bible-books', () => database.getBibleBooks())
  ipcMain.handle('truth:get-bible-translations', () => database.getBibleTranslations())
  ipcMain.handle('truth:get-bible-chapter', (_event, translationCode: unknown, bookCode: unknown, chapter: unknown) => {
    const translation = stringValue(translationCode, 12).toUpperCase()
    const code = stringValue(bookCode, 4).toUpperCase()
    const chapterNumber = Math.min(150, Math.max(1, Math.round(Number(chapter) || 1)))
    return database.getBibleChapter(translation, code, chapterNumber)
  })
  ipcMain.handle('truth:search-bible', (_event, translationCode: unknown, query: unknown) => database.searchBible(stringValue(translationCode, 12).toUpperCase(), stringValue(query, 160)))
  ipcMain.handle('truth:open-bible-resource', async (_event, translationCode: unknown) => {
    const resourcePath = database.getBibleResourcePath(stringValue(translationCode, 12).toUpperCase())
    const error = await shell.openPath(resourcePath)
    if (error) throw new Error(error)
    return true
  })
  ipcMain.handle('truth:toggle-bookmark', (_event, input: unknown) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid bookmark')
    const value = input as Record<string, unknown>
    const entityType = stringValue(value.entityType, 20)
    if (!['news', 'event', 'prophecy', 'verse', 'source'].includes(entityType)) throw new Error('Invalid bookmark type')
    const bookmark: BookmarkInput = {
      entityType: entityType as BookmarkInput['entityType'],
      entityId: stringValue(value.entityId, 160),
      title: stringValue(value.title, 300),
      subtitle: stringValue(value.subtitle, 500),
      folder: value.folder ? stringValue(value.folder, 80) : 'Saved'
    }
    return database.toggleBookmark(bookmark)
  })
  ipcMain.handle('truth:save-note', (_event, input: unknown) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid note')
    const value = input as Record<string, unknown>
    const note: NoteInput = { entityType: stringValue(value.entityType, 30), entityId: stringValue(value.entityId, 160), body: stringValue(value.body, 20_000) }
    return database.saveNote(note)
  })
  ipcMain.handle('truth:update-settings', (_event, patch: unknown) => {
    const settings = database.updateSettings(validateSettingsPatch(patch))
    onSettingsUpdated()
    return settings
  })
  ipcMain.handle('truth:update-source', (_event, sourceId: unknown, enabled: unknown) => database.setSourceEnabled(stringValue(sourceId, 160), Boolean(enabled)))
  ipcMain.handle('truth:clear-news', () => database.clearNews())
  ipcMain.handle('truth:clear-activity', () => database.clearActivity())
  ipcMain.handle('truth:reset-local-data', async () => {
    await database.reset()
    return true
  })
  ipcMain.handle('truth:open-external', async (_event, rawUrl: unknown) => {
    const value = stringValue(rawUrl, 2_000)
    const url = new URL(value)
    if (url.protocol !== 'https:') throw new Error('Only HTTPS links are allowed')
    await shell.openExternal(url.toString())
    return true
  })
  ipcMain.handle('truth:copy-text', (_event, rawText: unknown) => {
    clipboard.writeText(stringValue(rawText, 20_000))
    return true
  })
  ipcMain.handle('truth:get-time', () => {
    const timezone = database.getSettings().timezone
    return {
    local: new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'medium', timeZone: timezone }).format(new Date()),
    utc: new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeStyle: 'long', timeZone: 'UTC' }).format(new Date()),
    timezone,
    iso: new Date().toISOString()
  }})
}
