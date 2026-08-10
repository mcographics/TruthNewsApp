import { app, BrowserWindow, net, shell } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { database } from './database'
import { registerIpcHandlers } from './ipc'
import { refreshNewsFeeds } from './newsService'
import { createRoundedRectangleShape, WINDOW_CORNER_RADIUS } from './windowShape'

let mainWindow: BrowserWindow | null = null
let splashWindow: BrowserWindow | null = null
let newsTimer: NodeJS.Timeout | null = null
let windowShapeTimer: NodeJS.Timeout | null = null
let startupReleaseTimer: NodeJS.Timeout | null = null
let splashShownAt = 0

const SPLASH_WIDTH = 768
const SPLASH_HEIGHT = 512
const MINIMUM_SPLASH_DURATION_MS = 5_000
const MINIMUM_MAIN_LOADING_DURATION_MS = 1_250
const windowsBuild = Number.parseInt(release().split('.')[2] ?? '', 10)
const needsLegacyRoundedShape = process.platform === 'win32' && Number.isFinite(windowsBuild) && windowsBuild < 22_000

const synchronizeWindowAppearance = (): void => {
  if (!mainWindow || mainWindow.isDestroyed()) return
  const maximized = mainWindow.isMaximized() || mainWindow.isFullScreen()

  if (!mainWindow.webContents.isDestroyed()) mainWindow.webContents.send('truth:window-state', { maximized })
  if (!needsLegacyRoundedShape) return

  if (maximized) {
    mainWindow.setShape([])
    return
  }

  const [width, height] = mainWindow.getSize()
  mainWindow.setShape(createRoundedRectangleShape(width, height, WINDOW_CORNER_RADIUS))
}

const scheduleWindowAppearance = (): void => {
  if (windowShapeTimer) clearTimeout(windowShapeTimer)
  windowShapeTimer = setTimeout(synchronizeWindowAppearance, 16)
}

const createSplashWindow = (): Promise<void> => {
  const splashDocumentPath = is.dev
    ? join(process.cwd(), 'src', 'renderer', 'src', 'assets', 'splash.html')
    : join(process.resourcesPath, 'splash.html')

  splashWindow = new BrowserWindow({
    width: SPLASH_WIDTH,
    height: SPLASH_HEIGHT,
    show: false,
    frame: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: true,
    roundedCorners: true,
    backgroundColor: '#05090c',
    title: 'TruthNewsApp — Loading',
    icon: is.dev ? join(process.cwd(), 'build', 'icon.png') : join(process.resourcesPath, 'icon.png'),
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  splashWindow.on('closed', () => { splashWindow = null })
  splashWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  splashWindow.webContents.on('will-navigate', (event) => event.preventDefault())

  return new Promise((resolve, reject) => {
    splashWindow?.once('ready-to-show', () => {
      if (!splashWindow || splashWindow.isDestroyed()) return
      if (needsLegacyRoundedShape) splashWindow.setShape(createRoundedRectangleShape(SPLASH_WIDTH, SPLASH_HEIGHT, 24))
      splashWindow.show()
      splashShownAt = Date.now()
      resolve()
    })
    void splashWindow?.loadFile(splashDocumentPath).catch(reject)
  })
}

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
    roundedCorners: true,
    thickFrame: true,
    hasShadow: true,
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

  mainWindow.once('ready-to-show', () => {
    synchronizeWindowAppearance()
    mainWindow?.show()
    splashWindow?.close()
    if (startupReleaseTimer) clearTimeout(startupReleaseTimer)
    startupReleaseTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
        mainWindow.webContents.send('truth:startup-release')
      }
      startupReleaseTimer = null
    }, MINIMUM_MAIN_LOADING_DURATION_MS)
  })
  mainWindow.on('resize', scheduleWindowAppearance)
  mainWindow.on('maximize', synchronizeWindowAppearance)
  mainWindow.on('unmaximize', synchronizeWindowAppearance)
  mainWindow.on('enter-full-screen', synchronizeWindowAppearance)
  mainWindow.on('leave-full-screen', synchronizeWindowAppearance)
  mainWindow.on('closed', () => {
    if (windowShapeTimer) clearTimeout(windowShapeTimer)
    if (startupReleaseTimer) clearTimeout(startupReleaseTimer)
    windowShapeTimer = null
    startupReleaseTimer = null
    mainWindow = null
  })
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
  await createSplashWindow()
  await database.initialize()
  const elapsedSplashTime = splashShownAt ? Date.now() - splashShownAt : 0
  const remainingSplashTime = Math.max(0, MINIMUM_SPLASH_DURATION_MS - elapsedSplashTime)
  if (remainingSplashTime) await new Promise((resolve) => setTimeout(resolve, remainingSplashTime))
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
