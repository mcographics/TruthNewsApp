import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import electronPath from 'electron'
import { _electron as electron } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packagedExecutable = process.env.TRUTHNEWS_EXECUTABLE
const screenshotPath = resolve(root, 'artifacts', packagedExecutable ? 'truthnews-packaged.png' : 'truthnews-e2e.png')
await mkdir(dirname(screenshotPath), { recursive: true })

const launchEnv = { ...process.env }
delete launchEnv.ELECTRON_RUN_AS_NODE

const electronApp = await electron.launch({
  executablePath: packagedExecutable || electronPath,
  args: packagedExecutable ? [`--user-data-dir=${resolve(root, 'artifacts', 'packaged-profile')}`] : ['.'],
  cwd: root,
  env: launchEnv
})

try {
  const page = await electronApp.firstWindow()
  await page.waitForSelector('.dashboard-grid', { timeout: 45_000 })
  assert.match(await page.locator('.hero-copy h1').innerText(), /TRUTH\s+STANDS\s+FOREVER/)

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
  await page.locator('.bible-toolbar select').nth(0).selectOption('JOH')
  await page.locator('.bible-toolbar select').nth(1).selectOption('3')
  await page.waitForFunction(() => document.querySelectorAll('.chapter-text button').length >= 30)
  const verseCount = await page.locator('.chapter-text button').count()
  assert.ok(verseCount >= 30, `Expected John 3 verses; found ${verseCount}`)
  await page.locator('.chapter-text button').nth(15).click()
  await page.getByRole('dialog').waitFor()
  assert.match(await page.getByRole('dialog').locator('h2').innerText(), /John 3:16/)
  await page.getByRole('button', { name: 'Close details' }).click()

  const search = page.getByRole('textbox', { name: 'Global search' })
  await search.fill('Babylon')
  await page.locator('.search-results > button').first().waitFor({ timeout: 10_000 })
  assert.ok(await page.locator('.search-results > button').count() > 0)
  await search.fill('')
  await page.keyboard.press('Escape')

  await page.getByRole('link', { name: 'Settings', exact: true }).click()
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
  console.log(JSON.stringify({ ok: true, verseCount, security, screenshotPath }, null, 2))
} finally {
  await electronApp.close()
}
