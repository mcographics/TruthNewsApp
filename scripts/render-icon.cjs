const { app, BrowserWindow } = require('electron')
const { writeFile } = require('node:fs/promises')
const { resolve } = require('node:path')

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    width: 512,
    height: 512,
    useContentSize: true,
    show: false,
    frame: false,
    transparent: true,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
  })
  await window.loadFile(resolve(__dirname, '..', 'build', 'icon.svg'))
  const image = await window.webContents.capturePage({ x: 0, y: 0, width: 512, height: 512 })
  await writeFile(resolve(__dirname, '..', 'build', 'icon.png'), image.toPNG())
  window.destroy()
  app.quit()
})
