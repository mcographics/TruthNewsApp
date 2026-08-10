import assert from 'node:assert/strict'
import { mkdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import electronPath from 'electron'
import { _electron as electron } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packagedExecutable = process.env.TRUTHNEWS_EXECUTABLE
const profilePath = resolve(root, 'artifacts', packagedExecutable ? 'packaged-profile-0.2.0' : 'e2e-profile')
const splashScreenshotPath = resolve(root, 'artifacts', packagedExecutable ? 'truthnews-splash-packaged.png' : 'truthnews-splash-e2e.png')
const loadingScreenshotPath = resolve(root, 'artifacts', packagedExecutable ? 'truthnews-cross-loading-packaged.png' : 'truthnews-cross-loading-e2e.png')
const screenshotPath = resolve(root, 'artifacts', packagedExecutable ? 'truthnews-packaged.png' : 'truthnews-e2e.png')
const bibleScreenshotPath = resolve(root, 'artifacts', packagedExecutable ? 'truthnews-bible-packaged.png' : 'truthnews-bible-e2e.png')
const facsimileScreenshotPath = resolve(root, 'artifacts', packagedExecutable ? 'truthnews-geneva-packaged.png' : 'truthnews-geneva-e2e.png')
await mkdir(dirname(screenshotPath), { recursive: true })
await rm(profilePath, { recursive: true, force: true })
await mkdir(profilePath, { recursive: true })

const launchEnv = { ...process.env }
delete launchEnv.ELECTRON_RUN_AS_NODE

const electronApp = await electron.launch({
  executablePath: packagedExecutable || electronPath,
  args: packagedExecutable ? [`--user-data-dir=${profilePath}`] : ['.', `--user-data-dir=${profilePath}`],
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

  const darkTheme = await page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement)
    const backgroundImages = ['.app-shell', '.sidebar', '.panel', '.nav-item.active'].map((selector) => getComputedStyle(document.querySelector(selector)).backgroundImage)
    return { background: rootStyle.getPropertyValue('--bg').trim(), panel: rootStyle.getPropertyValue('--panel').trim(), backgroundImages }
  })
  assert.deepEqual(darkTheme, { background: '#080808', panel: '#111111', backgroundImages: ['none', 'none', 'none', 'none'] })

  const brandBounds = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar')?.getBoundingClientRect()
    const titleElement = document.querySelector('.brand strong')
    const subtitleElement = document.querySelector('.brand-copy > span')
    const title = titleElement?.getBoundingClientRect()
    const subtitle = subtitleElement?.getBoundingClientRect()
    const textColumn = document.querySelector('.brand-copy')
    return sidebar && title && subtitle && textColumn && titleElement && subtitleElement ? {
      sidebarRight: sidebar.right,
      titleRight: title.right,
      subtitleRight: subtitle.right,
      textClientWidth: textColumn.clientWidth,
      textScrollWidth: textColumn.scrollWidth,
      titleScrollWidth: titleElement.scrollWidth,
      subtitleScrollWidth: subtitleElement.scrollWidth
    } : null
  })
  assert.ok(brandBounds, 'Expected the expanded sidebar brand to be visible')
  assert.ok(brandBounds.titleRight < brandBounds.sidebarRight, `Brand title overlaps sidebar divider: ${JSON.stringify(brandBounds)}`)
  assert.ok(brandBounds.subtitleRight < brandBounds.sidebarRight, `Brand subtitle overlaps sidebar divider: ${JSON.stringify(brandBounds)}`)
  assert.ok(brandBounds.textScrollWidth <= brandBounds.textClientWidth, `Brand text is clipped: ${JSON.stringify(brandBounds)}`)
  assert.ok(brandBounds.titleScrollWidth <= brandBounds.textClientWidth, `Brand title is clipped: ${JSON.stringify(brandBounds)}`)
  assert.ok(brandBounds.subtitleScrollWidth <= brandBounds.textClientWidth, `Brand subtitle is clipped: ${JSON.stringify(brandBounds)}`)

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
    if (linkName === 'Bible Timeline') {
      const categories = await page.locator('.timeline-event .event-category').allInnerTexts()
      assert.ok(categories.length > 0 && categories.every((category) => ['bible', 'jesus christ', 'church history'].includes(category.toLowerCase())), `Unexpected Bible timeline categories: ${categories.join(', ')}`)
    }
    if (linkName === 'History Timeline') {
      const categories = await page.locator('.timeline-event .event-category').allInnerTexts()
      assert.ok(categories.length > 0 && categories.every((category) => ['world history', 'israel', 'church history'].includes(category.toLowerCase())), `Unexpected history timeline categories: ${categories.join(', ')}`)
    }
    if (linkName === 'Jesus Christ') {
      const categories = await page.locator('.timeline-event .event-category').allInnerTexts()
      assert.ok(categories.length > 0 && categories.every((category) => category.toLowerCase() === 'jesus christ'), `Unexpected Jesus timeline categories: ${categories.join(', ')}`)
    }
  }

  await page.getByRole('link', { name: 'Bible', exact: true }).click()
  await page.getByRole('heading', { name: 'Bible Reader', exact: true }).waitFor()
  await page.getByRole('combobox', { name: 'Bible translation' }).selectOption('WEB')
  await page.getByRole('combobox', { name: 'Bible book' }).selectOption('JOH')
  await page.getByRole('combobox', { name: 'Bible chapter' }).selectOption('3')
  await page.waitForFunction(() => document.querySelector('.bible-reader h2')?.textContent?.trim() === 'John 3' && document.querySelectorAll('.chapter-text button').length >= 30)
  const verseCount = await page.locator('.chapter-text button').count()
  assert.ok(verseCount >= 30, `Expected John 3 verses; found ${verseCount}`)
  await page.locator('.chapter-text button').nth(15).click()
  await page.getByRole('dialog').waitFor()
  assert.match(await page.getByRole('dialog').locator('h2').innerText(), /John 3:16/)
  await page.getByRole('button', { name: 'Close details' }).click()

  await page.getByRole('combobox', { name: 'Bible translation' }).selectOption('KJV')
  await page.waitForFunction(() => document.querySelector('.bible-reader > header span')?.textContent?.includes('King James Version') && document.querySelectorAll('.chapter-text button').length === 36)
  await page.locator('.chapter-text button').nth(15).click()
  assert.match(await page.getByRole('dialog').locator('.verse-focus').innerText(), /only begotten Son/)
  assert.match(await page.getByRole('dialog').locator('header p').innerText(), /King James Version/)
  await page.getByRole('button', { name: 'Close details' }).click()
  await page.locator('.app-content').evaluate((element) => { element.scrollTop = 0 })
  await page.screenshot({ path: bibleScreenshotPath, fullPage: true })

  await page.getByRole('combobox', { name: 'Bible translation' }).selectOption('BIB')
  await page.waitForFunction(() => document.querySelector('.bible-reader > header span')?.textContent?.includes('Berean Interlinear Bible') && document.querySelectorAll('.chapter-text button').length === 36)
  assert.equal(await page.getByRole('combobox', { name: 'Bible book' }).locator('option').count(), 27)
  assert.match(await page.locator('.chapter-text button').nth(15).innerText(), /Οὕτως/)

  await page.getByRole('combobox', { name: 'Bible translation' }).selectOption('GNV1560')
  await page.getByRole('heading', { name: 'Original 1,224-page scanned edition' }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Open Geneva 1560 facsimile' }).isEnabled(), true)
  await page.screenshot({ path: facsimileScreenshotPath, fullPage: true })

  await page.getByRole('combobox', { name: 'Bible translation' }).selectOption('WEB')
  await page.waitForFunction(() => document.querySelector('.bible-reader > header span')?.textContent?.includes('World English Bible') && document.querySelectorAll('.chapter-text button').length > 0)

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

  await page.getByRole('button', { name: 'Collapse sidebar' }).click()
  await page.locator('.sidebar.collapsed').waitFor()
  const collapsedBrandBounds = await page.locator('.brand-symbol .initial-letter').evaluate((element) => {
    const brand = element.closest('.brand')?.getBoundingClientRect()
    const initial = element.getBoundingClientRect()
    return brand ? { brandTop: brand.top, brandBottom: brand.bottom, initialTop: initial.top, initialBottom: initial.bottom, width: initial.width, height: initial.height } : null
  })
  assert.ok(collapsedBrandBounds, 'Expected the collapsed sidebar initial to be visible')
  assert.ok(collapsedBrandBounds.width > 20 && collapsedBrandBounds.height > 20, `Collapsed brand initial is clipped: ${JSON.stringify(collapsedBrandBounds)}`)
  assert.ok(collapsedBrandBounds.initialBottom > collapsedBrandBounds.brandTop && collapsedBrandBounds.initialTop < collapsedBrandBounds.brandBottom, `Collapsed brand initial is outside its container: ${JSON.stringify(collapsedBrandBounds)}`)

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
