import { contextBridge, ipcRenderer } from 'electron'
import type { TruthNewsApi, WindowState } from '../shared/types'

const api: TruthNewsApi = {
  getBootstrap: () => ipcRenderer.invoke('truth:get-bootstrap'),
  refreshNews: () => ipcRenderer.invoke('truth:refresh-news'),
  search: (query) => ipcRenderer.invoke('truth:search', query),
  getBibleBooks: () => ipcRenderer.invoke('truth:get-bible-books'),
  getBibleTranslations: () => ipcRenderer.invoke('truth:get-bible-translations'),
  getBibleChapter: (translationCode, bookCode, chapter) => ipcRenderer.invoke('truth:get-bible-chapter', translationCode, bookCode, chapter),
  searchBible: (translationCode, query) => ipcRenderer.invoke('truth:search-bible', translationCode, query),
  openBibleResource: (translationCode) => ipcRenderer.invoke('truth:open-bible-resource', translationCode),
  toggleBookmark: (input) => ipcRenderer.invoke('truth:toggle-bookmark', input),
  saveNote: (input) => ipcRenderer.invoke('truth:save-note', input),
  updateSettings: (patch) => ipcRenderer.invoke('truth:update-settings', patch),
  updateSource: (sourceId, enabled) => ipcRenderer.invoke('truth:update-source', sourceId, enabled),
  clearNewsCache: () => ipcRenderer.invoke('truth:clear-news'),
  clearActivity: () => ipcRenderer.invoke('truth:clear-activity'),
  resetLocalData: () => ipcRenderer.invoke('truth:reset-local-data'),
  openExternal: (url) => ipcRenderer.invoke('truth:open-external', url),
  copyText: (text) => ipcRenderer.invoke('truth:copy-text', text),
  getTime: () => ipcRenderer.invoke('truth:get-time'),
  getWindowState: () => ipcRenderer.invoke('truth:get-window-state'),
  onNewsUpdated: (callback) => {
    const listener = (): void => callback()
    ipcRenderer.on('truth:news-updated', listener)
    return () => ipcRenderer.removeListener('truth:news-updated', listener)
  },
  onStartupRelease: (callback) => {
    const listener = (): void => callback()
    ipcRenderer.on('truth:startup-release', listener)
    return () => ipcRenderer.removeListener('truth:startup-release', listener)
  },
  onWindowState: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, state: WindowState): void => callback({ maximized: Boolean(state?.maximized) })
    ipcRenderer.on('truth:window-state', listener)
    return () => ipcRenderer.removeListener('truth:window-state', listener)
  }
}

contextBridge.exposeInMainWorld('truthNews', api)
