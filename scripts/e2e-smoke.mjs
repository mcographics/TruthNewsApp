import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import electronPath from 'electron'
import { _electron as electron } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packagedExecutable = process.env.TRUTHNEWS_EXECUTABLE
const splashScreenshotPath = resolve(root, 'artifacts', packagedExecutable ? 'truthnews-splash-packaged.png' : 'truthnews-splash-e2e.png')
const loadingScreenshotPath = resolve(root, 'artifacts', packagedExecutable ? 'truthnews-cross-loading-packaged.png' : 'truthnews-cross-loading-e2e.png')
const screenshotPath = resolve(root, 'artifacts', packagedExecutable ? 'truthnews-packaged.png' : 'truthnews-e2e.png')
const bibleScreenshotPath = resolve(root, 'artifacts', packagedExecutable ? 'truthnews-bible-packaged.png' : 'truthnews-bible-e2e.png')
const facsimileScreenshotPath = resolve(root, 'artifacts', packagedExecutable ? 'truthnews-geneva-packaged.png' : 'truthnews-geneva-e2e.png')
await mkdir(dirname(screenshotPath), { recursive: true })

const launchEnv = { ...process.env }
delete launchEnv.ELECTRON_RUN_AS_NODE

const electronApp = await electron.launch({
  executablePath: packagedExecutable || electronPath,
  args: packagedExecutable ? [`--user-data-dir=${resolve(root, 'artifacts', 'packaged-profile-0.2.0')}`] : ['.'],
  cwd: root,
  env: launchEnv
})

try {
  const firstPage = await electronApp.firstWindow()
  const firstPageIsSplash = /TruthNewsApp — Loading/.test(await firstPage.title())
  assert.equal(firstPageIsSplash, true)
  await firstPage.locator('.splash-screen img[alt="TruthNewsApp"]').waitFor({ timeout: 10_000 })
  await firstPage.waitForFunction(() => {
    const image = document.querySelector('.splash-screen img')
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
  })
  await firstPage.screenshot({ path: splashScreenshotPath })

  const existingMainWindow = electronApp.windows().find((candidate) => candidate !== firstPage && !candidate.isClosed())
  const page = existingMainWindow || await electronApp.waitForEvent('window', { timeout: 45_000 })
  await page.locator('.loading-cross[alt="Illuminated cross"]').waitFor({ timeout: 10_000 })
  await page.waitForFunction(() => {
    const image = document.querySelector('.loading-cross')
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
  })
  await page.screenshot({ path: loadingScreenshotPath })
  await page.waitForSelector('.dashboard-grid', { timeout: 45_000 })
  assert.match(await page.locator('.hero-copy h1').innerText(), /TRUTH\s+STANDS\s+FOREVER/)

  const restoredWindow = await page.evaluate(async () => ({
    state: await window.truthNews.getWindowState(),
    radius: getComputedStyle(document.querySelector('.app-shell')).borderTopLeftRadius
  }))
  assert.deepEqual(restoredWindow.state, { maximized: false })
  assert.equal(restoredWindow.radius, '18px')

  await electronApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].maximize())
  await page.waitForFunction(() => document.querySelector('.app-shell')?.classList.contains('window-is-maximized'))
  assert.equal(await page.locator('.app-shell').evaluate((element) => getComputedStyle(element).borderTopLeftRadius), '0px')
  await electronApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].unmaximize())
  await page.waitForFunction(() => !document.querySelector('.app-shell')?.classList.contains('window-is-maximized'))

  const destinations = [
    ['News Feed', 'News Feed'],
    ['Master Timeline', 'Global Master Timeline'],
    ['Prophetic Timeline', 'Prophetic Timeline'],
    ['Bible Timeline', 'Bible Timeline'],
    ['History Timeline', 'History Timeline'],
    ['Jesus Christ', 'Jesus Christ: Life & Ministry'],
    ['Dispensations', 'Dispensations'],
    ['Verified Prophecies', 'Verified Prophecies'],
    ['Watch & Learn', 'Watch & Learn'],
    ['Bookmarks', 'Bookmarks'],
    ['Sources', 'Sources'],
    ['Settings', 'Settings']
  ]

  for (const [linkName, heading] of destinations) {
    await page.getByRole('link', { name: linkName, exact: true }).click()
    await page.getByRole('heading', { name: heading, exact: true }).waitFor({ timeout: 10_000 })
  }

  await page.getByRole('link', { name: 'Bible', exact: true }).click()
  await page.getByRole('heading', { name: 'Bible Reader', exact: true }).waitFor()
  await page.getByRole('combobox', { name: 'Bible translation' }).selectOption('WEB')
  await page.getByRole('combobox', { name: 'Bible book' }).selectOption('JOH')
  await page.getByRole('combobox', { name: 'Bible chapter' }).selectOption('3')
  await page.waitForFunction(() => document.querySelectorAll('.chapter-text button').length >= 30)
  const verseCount = await page.locator('.chapter-text button').count()
  assert.ok(verseCount >= 30, `Expected John 3 verses; found ${verseCount}`)
  await page.locator('.chapter-text button').nth(15).click()
  await page.getByRole('dialog').waitFor()
  assert.match(await page.getByRole('dialog').locator('h2').innerText(), /John 3:16/)
  await page.getByRole('button', { name: 'Close details' }).click()

  await page.getByRole('combobox', { name: 'Bible translation' }).selectOption('KJV')
  await page.waitForFunction(() => document.querySelectorAll('.chapter-text button').length === 36)
  await page.locator('.chapter-text button').nth(15).click()
  assert.match(await page.getByRole('dialog').locator('.verse-focus').innerText(), /only begotten Son/)
  assert.match(await page.getByRole('dialog').locator('header p').innerText(), /King James Version/)
  await page.getByRole('button', { name: 'Close details' }).click()
  await page.locator('.app-content').evaluate((element) => { element.scrollTop = 0 })
  await page.screenshot({ path: bibleScreenshotPath, fullPage: true })

  await page.getByRole('combobox', { name: 'Bible translation' }).selectOption('BIB')
  await page.waitForFunction(() => document.querySelectorAll('.chapter-text button').length === 36)
  assert.equal(await page.getByRole('combobox', { name: 'Bible book' }).locator('option').count(), 27)
  assert.match(await page.locator('.chapter-text button').nth(15).innerText(), /Οὕτως/)

  await page.getByRole('combobox', { name: 'Bible translation' }).selectOption('GNV1560')
  await page.getByRole('heading', { name: 'Original 1,224-page scanned edition' }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Open Geneva 1560 facsimile' }).isEnabled(), true)
  await page.screenshot({ path: facsimileScreenshotPath, fullPage: true })

  await page.getByRole('combobox', { name: 'Bible translation' }).selectOption('WEB')
  await page.waitForFunction(() => document.querySelectorAll('.chapter-text button').length > 0)

  const search = page.getByRole('textbox', { name: 'Global search' })
  await search.fill('Babylon')
  await page.locator('.search-results > button').first().waitFor({ timeout: 10_000 })
  assert.ok(await page.locator('.search-results > button').count() > 0)
  await search.fill('')
  await page.keyboard.press('Escape')

  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  const defaultBible = page.locator('.settings-card').filter({ hasText: 'Default translation' }).locator('select').first()
  await defaultBible.selectOption('KJV')
  assert.equal(await defaultBible.inputValue(), 'KJV')
  await defaultBible.selectOption('WEB')
  await page.getByRole('button', { name: /White Gold/ }).click()
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'white-gold')
  await page.getByRole('button', { name: /Dark Gold/ }).click()
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark-gold')

  await page.getByRole('link', { name: 'TruthNewsApp dashboard' }).click()
  await page.waitForSelector('.dashboard-grid')
  await page.screenshot({ path: screenshotPath, fullPage: true })

  const security = await electronApp.evaluate(async ({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0]
    return {
      contextIsolation: window.webContents.getLastWebPreferences().contextIsolation,
      nodeIntegration: window.webContents.getLastWebPreferences().nodeIntegration,
      sandbox: window.webContents.getLastWebPreferences().sandbox
    }
  })
  assert.deepEqual(security, { contextIsolation: true, nodeIntegration: false, sandbox: true })
  console.log(JSON.stringify({ ok: true, verseCount, security, splashScreenshotPath, loadingScreenshotPath, screenshotPath, bibleScreenshotPath, facsimileScreenshotPath }, null, 2))
} finally {
  await electronApp.close()
}
