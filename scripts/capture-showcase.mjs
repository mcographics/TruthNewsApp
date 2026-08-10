import assert from 'node:assert/strict'
import { mkdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import electronPath from 'electron'
import { _electron as electron } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputDirectory = resolve(root, 'docs', 'screenshots')
const profileDirectory = resolve(root, 'artifacts', 'showcase-profile')
const packagedExecutable = process.env.TRUTHNEWS_EXECUTABLE
const executablePath = packagedExecutable || electronPath

await rm(outputDirectory, { recursive: true, force: true })
await rm(profileDirectory, { recursive: true, force: true })
await mkdir(outputDirectory, { recursive: true })
await mkdir(profileDirectory, { recursive: true })

const launchEnvironment = { ...process.env }
delete launchEnvironment.ELECTRON_RUN_AS_NODE

const electronApp = await electron.launch({
  executablePath,
  args: packagedExecutable ? [`--user-data-dir=${profileDirectory}`] : ['.', `--user-data-dir=${profileDirectory}`],
  cwd: root,
  env: launchEnvironment
})

const captures = []

const record = (file, title, description) => captures.push({ file, title, description })

try {
  const splash = await electronApp.firstWindow()
  assert.match(await splash.title(), /TruthNewsApp — Loading/)
  await splash.locator('.splash-screen img[alt="TruthNewsApp"]').waitFor({ timeout: 10_000 })
  await splash.waitForFunction(() => {
    const image = document.querySelector('.splash-screen img')
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
  })
  await splash.screenshot({ path: resolve(outputDirectory, '00-startup-splash.png') })
  record('00-startup-splash.png', 'Startup splash', 'Rounded five-second startup splash shown before the main application window is created.')

  const existingMainWindow = electronApp.windows().find((candidate) => candidate !== splash && !candidate.isClosed())
  const page = existingMainWindow || await electronApp.waitForEvent('window', { timeout: 45_000 })
  await page.locator('.loading-cross[alt="Illuminated cross"]').waitFor({ timeout: 15_000 })
  await page.waitForFunction(() => {
    const image = document.querySelector('.loading-cross')
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
  })
  await page.screenshot({ path: resolve(outputDirectory, '01-loading-cross.png') })
  record('01-loading-cross.png', 'Main-window loading screen', 'The cross screen remains visible during the handoff from the dedicated splash to the local application data.')

  await page.waitForSelector('.dashboard-grid', { timeout: 45_000 })

  const darkTheme = await page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement)
    const backgroundImages = ['.app-shell', '.sidebar', '.panel', '.nav-item.active'].map((selector) => getComputedStyle(document.querySelector(selector)).backgroundImage)
    return { background: rootStyle.getPropertyValue('--bg').trim(), panel: rootStyle.getPropertyValue('--panel').trim(), backgroundImages }
  })
  assert.deepEqual(darkTheme, { background: '#080808', panel: '#111111', backgroundImages: ['none', 'none', 'none', 'none'] })

  const setContentScroll = async (position) => {
    await page.locator('.app-content').evaluate((element, top) => element.scrollTo({ top, behavior: 'instant' }), position)
    await page.waitForTimeout(250)
  }

  const capture = async (file, title, description) => {
    await page.waitForTimeout(300)
    await page.screenshot({
      path: resolve(outputDirectory, file),
      type: 'jpeg',
      quality: 88,
      animations: 'disabled'
    })
    record(file, title, description)
  }

  const navigate = async (linkName, heading) => {
    await page.getByRole('link', { name: linkName, exact: true }).click()
    await page.getByRole('heading', { name: heading, exact: true }).waitFor({ timeout: 15_000 })
    await setContentScroll(0)
  }

  const assertTimelineCategories = async (allowed, label) => {
    const categories = await page.locator('.timeline-event .event-category').allInnerTexts()
    assert.ok(categories.length > 0, `Expected visible ${label} timeline events`)
    assert.ok(categories.every((category) => allowed.includes(category.toLowerCase())), `Unexpected ${label} timeline categories: ${categories.join(', ')}`)
  }

  const closeDrawer = async () => {
    await page.getByRole('button', { name: 'Close details' }).click()
    await page.locator('[role="dialog"]').waitFor({ state: 'detached' })
  }

  await capture('02-dashboard.jpg', 'Dashboard', 'The main overview combines current headlines, the hero entry point, timelines, prophecy classifications, and the current dispensational framework.')
  await page.locator('.app-content').evaluate((element) => element.scrollTo({ top: element.scrollHeight, behavior: 'instant' }))
  await capture('03-dashboard-lower.jpg', 'Dashboard research panels', 'Lower dashboard panels show Jesus Christ timeline cards, the current dispensation, and the complete framework strip.')
  await setContentScroll(0)

  const globalSearch = page.getByRole('textbox', { name: 'Global search' })
  await globalSearch.fill('John 3:16')
  await page.locator('.search-results .result-type').first().waitFor({ timeout: 15_000 })
  await capture('04-global-search.jpg', 'Global search', 'Account-free local search spans Scripture, history, prophecy, sources, dispensations, and synchronized news.')
  await page.getByRole('button', { name: 'Clear search' }).click()

  await page.getByRole('button', { name: 'Notifications' }).click()
  await page.locator('.popover.notifications').waitFor()
  await capture('05-notifications.jpg', 'Latest updates', 'The notification popover reports local cache and synchronization state without requiring an account.')
  await page.getByRole('button', { name: 'Notifications' }).click()

  await page.getByRole('button', { name: 'Application profile' }).click()
  await page.locator('.profile-popover').waitFor()
  await capture('06-local-profile.jpg', 'Local application profile', 'The profile control explains that bookmarks, notes, and preferences stay on the device.')
  await page.getByRole('button', { name: 'Application profile' }).click()

  await navigate('News Feed', 'News Feed')
  const firstNewsCard = page.locator('.news-card').first()
  try {
    await firstNewsCard.waitFor({ timeout: 30_000 })
  } catch {
    const refreshButton = page.getByRole('button', { name: 'Refresh Now' })
    await refreshButton.waitFor({ state: 'visible', timeout: 15_000 })
    await refreshButton.click()
    await firstNewsCard.waitFor({ timeout: 45_000 })
  }
  await capture('07-news-feed.jpg', 'News Feed', 'Publisher-attributed RSS records remain visually separate from interpretation, with source, category, and retrieval metadata.')
  const newsBookmark = firstNewsCard.getByRole('button', { name: 'Save bookmark' })
  if (await newsBookmark.count()) await newsBookmark.click()
  await firstNewsCard.click()
  await page.locator('[role="dialog"]').waitFor()
  await capture('08-news-evidence.jpg', 'News evidence drawer', 'Article details distinguish publisher metadata, unavailable editorial analysis, and unassigned prophecy relevance.')
  await closeDrawer()

  await navigate('Master Timeline', 'Global Master Timeline')
  await capture('09-master-timeline.jpg', 'Global Master Timeline', 'The combined chronology exposes overlays, filters, zoom controls, confidence states, and historical date qualifications.')
  await page.locator('.timeline-event').first().click()
  await page.locator('[role="dialog"]').waitFor()
  await capture('10-event-evidence.jpg', 'Historical event evidence', 'Event details include date confidence, Scripture, location data, related events, supporting sources, and a private local note editor.')
  await closeDrawer()

  await navigate('Prophetic Timeline', 'Prophetic Timeline')
  await capture('11-prophetic-timeline.jpg', 'Prophetic Timeline', 'Prophecy records remain separate from proposed fulfillment and retain an explicit interpretive classification.')
  await page.locator('.prophecy-timeline-card').first().click()
  await page.locator('[role="dialog"]').waitFor()
  await capture('12-prophecy-evidence-chain.jpg', 'Prophecy evidence chain', 'The drawer walks from the spoken prophecy through context, proposed fulfillment, classification, evidence, and current relevance.')
  await closeDrawer()

  await navigate('Bible Timeline', 'Bible Timeline')
  await assertTimelineCategories(['bible', 'jesus christ', 'church history'], 'Bible')
  await capture('13-bible-timeline.jpg', 'Bible Timeline', 'The biblical chronology presents Genesis-to-Revelation events with visible approximation and disputed-date labeling.')

  await navigate('History Timeline', 'History Timeline')
  await assertTimelineCategories(['world history', 'israel', 'church history'], 'history')
  await capture('14-history-timeline.jpg', 'History Timeline', 'Biblical, Jewish, Church, and world history can be compared without erasing uncertainty.')

  await navigate('Jesus Christ', 'Jesus Christ: Life & Ministry')
  await assertTimelineCategories(['jesus christ'], 'Jesus Christ')
  await capture('15-jesus-timeline.jpg', 'Jesus Christ: Life & Ministry', 'A focused Gospel timeline follows major events in the life, ministry, death, resurrection, and ascension of Jesus Christ.')

  await navigate('Dispensations', 'Dispensations')
  await capture('16-dispensations.jpg', 'Dispensational framework', 'The app labels its chosen classic premillennial dispensational framework instead of presenting it as universal Christian agreement.')
  await page.locator('.dispensation-section > button').first().click()
  await page.locator('.dispensation-section.open').waitFor()
  await capture('17-dispensation-details.jpg', 'Dispensation details', 'Expanded records show governing principle, responsibility, figures, covenants, events, Scripture, transition, and prophetic significance.')

  await navigate('Bible', 'Bible Reader')
  await page.getByRole('combobox', { name: 'Bible translation' }).selectOption('WEB')
  await page.getByRole('combobox', { name: 'Bible book' }).selectOption('JOH')
  await page.getByRole('combobox', { name: 'Bible chapter' }).selectOption('3')
  await page.waitForFunction(() => document.querySelector('.bible-reader h2')?.textContent?.trim() === 'John 3' && document.querySelectorAll('.chapter-text button').length >= 30)
  await capture('18-bible-reader.jpg', 'Offline Bible Reader', 'The reader provides translation, book, and chapter navigation across locally stored Scripture editions.')
  await page.locator('.chapter-text button').nth(15).click()
  await page.locator('[role="dialog"]').waitFor()
  const verseBookmark = page.locator('[role="dialog"]').getByRole('button', { name: 'Save bookmark' })
  if (await verseBookmark.count()) await verseBookmark.click()
  await capture('19-verse-study.jpg', 'Verse study drawer', 'Verse study includes copy, bookmark, reviewed timeline connections, and device-local personal notes.')
  await closeDrawer()
  const scriptureSearch = page.getByRole('textbox', { name: 'Search selected Bible translation' })
  await scriptureSearch.fill('John 3:16')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await page.locator('.bible-results').waitFor({ timeout: 15_000 })
  await capture('20-bible-search.jpg', 'Translation-aware Bible search', 'Search runs against the selected local translation and keeps the edition visible beside each result.')
  await page.getByRole('combobox', { name: 'Bible translation' }).selectOption('GNV1560')
  await page.locator('.facsimile-panel').waitFor({ timeout: 15_000 })
  await capture('21-geneva-facsimile.jpg', 'Geneva Bible 1560 facsimile', 'The historical scan is clearly labeled as an image facsimile and is not represented as searchable OCR Scripture text.')

  await navigate('Verified Prophecies', 'Verified Prophecies')
  await capture('22-verified-prophecies.jpg', 'Verified Prophecies', 'Classification filters and evidence-aware cards keep fulfillment claims inspectable and qualified.')
  const prophecyBookmark = page.locator('.prophecy-card').first().getByRole('button', { name: 'Save bookmark' })
  if (await prophecyBookmark.count()) await prophecyBookmark.click()
  await page.locator('.prophecy-card').first().click()
  await page.locator('[role="dialog"]').waitFor()
  await capture('23-prophecy-record.jpg', 'Prophecy record detail', 'A full record exposes the evidence chain, related events, interpretation, classification, and personal note area.')
  await closeDrawer()

  await navigate('Watch & Learn', 'Watch & Learn')
  await capture('24-watch-and-learn.jpg', 'Watch & Learn', 'Curated external study resources and watch topics are presented with an explicit review-required boundary.')

  await navigate('Sources', 'Sources')
  assert.equal(await page.locator('.source-error').filter({ hasText: 'Cannot convert object to primitive value' }).count(), 0, 'A source feed still contains the RSS category conversion error')
  await capture('25-sources.jpg', 'Source registry', 'The registry exposes publisher, biblical, historical, and government source descriptions, reliability notes, terms notes, and feed controls.')
  const sourceBookmark = page.locator('.source-card').first().getByRole('button', { name: 'Save bookmark' })
  if (await sourceBookmark.count()) await sourceBookmark.click()
  await page.locator('.app-content').evaluate((element) => element.scrollTo({ top: element.scrollHeight, behavior: 'instant' }))
  await capture('26-sources-lower.jpg', 'Source registry details', 'Additional source cards remain inspectable with retrieval status and links to the original source.')

  await navigate('Bookmarks', 'Bookmarks')
  await page.locator('.bookmark-list').waitFor({ timeout: 15_000 })
  await capture('27-local-bookmarks.jpg', 'Local bookmarks', 'Saved news, Scripture, prophecy, and source records form an account-free research collection on this PC.')

  await navigate('Settings', 'Settings')
  const aboutGeometry = await page.locator('.about-content').evaluate((element) => {
    const mark = element.querySelector('.about-mark')?.getBoundingClientRect()
    const copy = element.querySelector('.about-copy')?.getBoundingClientRect()
    return mark && copy ? { markRight: mark.right, copyLeft: copy.left, copyWidth: copy.width } : null
  })
  assert.ok(aboutGeometry && aboutGeometry.copyLeft > aboutGeometry.markRight && aboutGeometry.copyWidth > 250, `About card layout is compressed: ${JSON.stringify(aboutGeometry)}`)
  await capture('28-settings.jpg', 'Settings', 'Appearance, synchronization, Bible, date, region, accessibility, and privacy controls are device-local.')
  await page.locator('.app-content').evaluate((element) => element.scrollTo({ top: element.scrollHeight, behavior: 'instant' }))
  await capture('29-settings-privacy.jpg', 'Privacy, data, and application information', 'The lower settings area exposes local cache controls, destructive-action safeguards, version information, and data-model details.')
  await page.locator('.privacy-actions button.danger').click()
  await page.locator('[role="dialog"]').waitFor()
  await capture('30-reset-confirmation.jpg', 'Protected reset confirmation', 'Destructive local actions require a clear confirmation and explain exactly what would be removed.')
  await page.getByRole('button', { name: 'Cancel' }).click()
  await page.locator('[role="dialog"]').waitFor({ state: 'detached' })
  await setContentScroll(0)
  await page.getByRole('button', { name: /^White Gold/ }).click()
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'white-gold')
  await navigate('Dashboard', 'TRUTH STANDS FOREVER')
  await capture('31-white-gold-theme.jpg', 'White Gold theme', 'The complete interface can switch to a warm ivory and charcoal presentation while preserving the gold identity.')
  await navigate('Settings', 'Settings')
  await page.getByRole('button', { name: /^Dark Gold/ }).click()
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark-gold')
  await navigate('Dashboard', 'TRUTH STANDS FOREVER')
  await page.getByRole('button', { name: 'Collapse sidebar' }).click()
  await page.locator('.sidebar.collapsed').waitFor()
  const collapsedInitial = await page.locator('.brand-symbol .initial-letter').evaluate((element) => {
    const brand = element.closest('.brand')?.getBoundingClientRect()
    const initial = element.getBoundingClientRect()
    return brand ? { brandTop: brand.top, brandBottom: brand.bottom, initialTop: initial.top, initialBottom: initial.bottom, width: initial.width, height: initial.height } : null
  })
  assert.ok(collapsedInitial && collapsedInitial.width > 20 && collapsedInitial.height > 20 && collapsedInitial.initialBottom > collapsedInitial.brandTop && collapsedInitial.initialTop < collapsedInitial.brandBottom, `Collapsed brand initial is clipped: ${JSON.stringify(collapsedInitial)}`)
  await capture('32-collapsed-sidebar.jpg', 'Collapsed navigation', 'The sidebar can collapse to icon-only navigation while preserving accessible labels and the main workspace.')

  console.log(JSON.stringify({ ok: true, executablePath, outputDirectory, captures }, null, 2))
} finally {
  await electronApp.close()
}
