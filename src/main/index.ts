import { app, BrowserWindow, net, shell } from 'electron'
import { join } from 'node:path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { database } from './database'
import { registerIpcHandlers } from './ipc'
import { refreshNewsFeeds } from './newsService'

let mainWindow: BrowserWindow | null = null
let newsTimer: NodeJS.Timeout | null = null

const notifyNewsUpdated = (): void => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('truth:news-updated')
}

const synchronizeNews = (): void => {
  void refreshNewsFeeds(net.isOnline()).then(notifyNewsUpdated)
}

const scheduleNewsUpdates = (): void => {
  if (newsTimer) clearInterval(newsTimer)
  const intervalMs = database.getSettings().refreshMinutes * 60_000
  newsTimer = setInterval(synchronizeNews, intervalMs)
}

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1120,
    minHeight: 720,
    show: false,
    backgroundColor: '#05090c',
    title: 'TruthNewsApp',
    icon: is.dev ? join(process.cwd(), 'build', 'icon.png') : join(process.resourcesPath, 'icon.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#05090c',
      symbolColor: '#d8d6cf',
      height: 34
    },
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url)
      if (parsed.protocol === 'https:') void shell.openExternal(parsed.toString())
    } catch {
      // Invalid URLs are denied below.
    }
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const current = mainWindow?.webContents.getURL()
    if (url !== current) event.preventDefault()
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.mcographics.truthnewsapp')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))
  await database.initialize()
  registerIpcHandlers(scheduleNewsUpdates)
  createWindow()
  scheduleNewsUpdates()
  setTimeout(synchronizeNews, 1_500)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
