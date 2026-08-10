import { app } from 'electron'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'
import type {
  AppSettings,
  BibleBook,
  BibleVerse,
  BookmarkInput,
  BookmarkRecord,
  BootstrapData,
  DispensationRecord,
  NewsArticle,
  NoteInput,
  NoteRecord,
  ProphecyRecord,
  SearchResult,
  SourceRecord,
  SyncStatus,
  TimelineEvent
} from '../shared/types'
import { DEFAULT_SETTINGS, SEED_DISPENSATIONS, SEED_EVENTS, SEED_PROPHECIES, SEED_SOURCES } from './seedData'

const BIBLE_BOOKS: BibleBook[] = [
  ['GEN', 'Genesis', 50], ['EXO', 'Exodus', 40], ['LEV', 'Leviticus', 27], ['NUM', 'Numbers', 36], ['DEU', 'Deuteronomy', 34],
  ['JOS', 'Joshua', 24], ['JDG', 'Judges', 21], ['RUT', 'Ruth', 4], ['1SA', '1 Samuel', 31], ['2SA', '2 Samuel', 24],
  ['1KI', '1 Kings', 22], ['2KI', '2 Kings', 25], ['1CH', '1 Chronicles', 29], ['2CH', '2 Chronicles', 36], ['EZR', 'Ezra', 10],
  ['NEH', 'Nehemiah', 13], ['EST', 'Esther', 10], ['JOB', 'Job', 42], ['PSA', 'Psalms', 150], ['PRO', 'Proverbs', 31],
  ['ECC', 'Ecclesiastes', 12], ['SOL', 'Song of Solomon', 8], ['ISA', 'Isaiah', 66], ['JER', 'Jeremiah', 52], ['LAM', 'Lamentations', 5],
  ['EZE', 'Ezekiel', 48], ['DAN', 'Daniel', 12], ['HOS', 'Hosea', 14], ['JOE', 'Joel', 3], ['AMO', 'Amos', 9],
  ['OBA', 'Obadiah', 1], ['JON', 'Jonah', 4], ['MIC', 'Micah', 7], ['NAH', 'Nahum', 3], ['HAB', 'Habakkuk', 3],
  ['ZEP', 'Zephaniah', 3], ['HAG', 'Haggai', 2], ['ZEC', 'Zechariah', 14], ['MAL', 'Malachi', 4], ['MAT', 'Matthew', 28],
  ['MAR', 'Mark', 16], ['LUK', 'Luke', 24], ['JOH', 'John', 21], ['ACT', 'Acts', 28], ['ROM', 'Romans', 16],
  ['1CO', '1 Corinthians', 16], ['2CO', '2 Corinthians', 13], ['GAL', 'Galatians', 6], ['EPH', 'Ephesians', 6], ['PHI', 'Philippians', 4],
  ['COL', 'Colossians', 4], ['1TH', '1 Thessalonians', 5], ['2TH', '2 Thessalonians', 3], ['1TI', '1 Timothy', 6], ['2TI', '2 Timothy', 4],
  ['TIT', 'Titus', 3], ['PHM', 'Philemon', 1], ['HEB', 'Hebrews', 13], ['JAM', 'James', 5], ['1PE', '1 Peter', 5],
  ['2PE', '2 Peter', 3], ['1JO', '1 John', 5], ['2JO', '2 John', 1], ['3JO', '3 John', 1], ['JUD', 'Jude', 1], ['REV', 'Revelation', 22]
].map(([code, name, chapters], index) => ({ code: String(code), name: String(name), chapters: Number(chapters), order: index + 1 }))

interface SqlRow {
  [key: string]: string | number | null
}

const toJson = (value: unknown): string => JSON.stringify(value)
const fromJson = <T>(value: string | number | null): T => JSON.parse(String(value)) as T

export class TruthDatabase {
  private SQL: SqlJsStatic | null = null
  private db: Database | null = null
  private dbPath = ''

  async initialize(): Promise<void> {
    const wasmPath = app.isPackaged
      ? join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
      : join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')

    const wasm = readFileSync(wasmPath)
    const wasmBinary = wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength) as ArrayBuffer
    this.SQL = await initSqlJs({ wasmBinary })
    this.dbPath = join(app.getPath('userData'), 'truthnews.sqlite')
    mkdirSync(dirname(this.dbPath), { recursive: true })
    this.db = existsSync(this.dbPath) ? new this.SQL.Database(readFileSync(this.dbPath)) : new this.SQL.Database()
    this.createSchema()
    this.seedKnowledgeData()
    this.seedBible()
    this.save()
  }

  private get connection(): Database {
    if (!this.db) throw new Error('Database has not been initialized')
    return this.db
  }

  private createSchema(): void {
    this.connection.run(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, title TEXT NOT NULL, summary TEXT NOT NULL, category TEXT NOT NULL, region TEXT NOT NULL, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS prophecies (id TEXT PRIMARY KEY, title TEXT NOT NULL, reference TEXT NOT NULL, classification TEXT NOT NULL, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS dispensations (id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sources (id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS news_articles (
        id TEXT PRIMARY KEY,
        headline TEXT NOT NULL,
        publisher TEXT NOT NULL,
        author TEXT NOT NULL,
        original_url TEXT NOT NULL UNIQUE,
        published_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        retrieved_at TEXT NOT NULL,
        category TEXT NOT NULL,
        region TEXT NOT NULL,
        country TEXT NOT NULL,
        summary TEXT NOT NULL,
        source_id TEXT NOT NULL,
        image_url TEXT,
        is_opinion INTEGER NOT NULL DEFAULT 0,
        tags TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published_at DESC);
      CREATE TABLE IF NOT EXISTS bible_books (code TEXT PRIMARY KEY, name TEXT NOT NULL, book_order INTEGER NOT NULL, chapters INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS bible_verses (id TEXT PRIMARY KEY, book_code TEXT NOT NULL, chapter INTEGER NOT NULL, verse INTEGER NOT NULL, end_verse INTEGER NOT NULL, text TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS idx_bible_reference ON bible_verses(book_code, chapter, verse);
      CREATE TABLE IF NOT EXISTS bookmarks (id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, title TEXT NOT NULL, subtitle TEXT NOT NULL, created_at TEXT NOT NULL, folder TEXT NOT NULL DEFAULT 'Saved', UNIQUE(entity_type, entity_id));
      CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, body TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(entity_type, entity_id));
      CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sync_logs (id TEXT PRIMARY KEY, service TEXT NOT NULL, attempted_at TEXT NOT NULL, succeeded INTEGER NOT NULL, message TEXT NOT NULL, successful_sources INTEGER NOT NULL, failed_sources INTEGER NOT NULL);
    `)
  }

  private seedKnowledgeData(): void {
    const eventCount = this.scalar('SELECT COUNT(*) AS count FROM events')
    if (eventCount === 0) {
      const statement = this.connection.prepare('INSERT INTO events (id, title, summary, category, region, payload) VALUES (?, ?, ?, ?, ?, ?)')
      SEED_EVENTS.forEach((event) => statement.run([event.id, event.title, event.summary, event.category, event.region, toJson(event)]))
      statement.free()
    }

    const prophecyCount = this.scalar('SELECT COUNT(*) AS count FROM prophecies')
    if (prophecyCount === 0) {
      const statement = this.connection.prepare('INSERT INTO prophecies (id, title, reference, classification, payload) VALUES (?, ?, ?, ?, ?)')
      SEED_PROPHECIES.forEach((record) => statement.run([record.id, record.title, record.reference, record.classification, toJson(record)]))
      statement.free()
    }

    const dispensationCount = this.scalar('SELECT COUNT(*) AS count FROM dispensations')
    if (dispensationCount === 0) {
      const statement = this.connection.prepare('INSERT INTO dispensations (id, name, status, payload) VALUES (?, ?, ?, ?)')
      SEED_DISPENSATIONS.forEach((record) => statement.run([record.id, record.name, record.status, toJson(record)]))
      statement.free()
    }

    const sourceCount = this.scalar('SELECT COUNT(*) AS count FROM sources')
    if (sourceCount === 0) {
      const statement = this.connection.prepare('INSERT INTO sources (id, name, category, enabled, payload) VALUES (?, ?, ?, ?, ?)')
      SEED_SOURCES.forEach((source) => statement.run([source.id, source.name, source.category, source.enabled ? 1 : 0, toJson(source)]))
      statement.free()
    }

    if (this.scalar('SELECT COUNT(*) AS count FROM settings') === 0) {
      this.connection.run('INSERT INTO settings (id, payload) VALUES (1, ?)', [toJson(DEFAULT_SETTINGS)])
    }
  }

  private bibleDataPath(): string {
    return app.isPackaged
      ? join(process.resourcesPath, 'data', 'engwebp_vpl.txt')
      : join(process.cwd(), 'src', 'main', 'data', 'engwebp_vpl.txt')
  }

  private seedBible(): void {
    this.connection.run('DELETE FROM bible_books')
    BIBLE_BOOKS.forEach((book) => {
      this.connection.run('INSERT OR REPLACE INTO bible_books (code, name, book_order, chapters) VALUES (?, ?, ?, ?)', [book.code, book.name, book.order, book.chapters])
    })
    if (this.scalar('SELECT COUNT(*) AS count FROM bible_verses') > 0) return

    const sourcePath = this.bibleDataPath()
    if (!existsSync(sourcePath)) throw new Error(`World English Bible data not found: ${sourcePath}`)
    const lines = readFileSync(sourcePath, 'utf8').split(/\r?\n/)
    const insert = this.connection.prepare('INSERT OR REPLACE INTO bible_verses (id, book_code, chapter, verse, end_verse, text) VALUES (?, ?, ?, ?, ?, ?)')
    this.connection.run('BEGIN TRANSACTION')
    try {
      for (const line of lines) {
        const match = /^([1-3]?[A-Z]{2,3})\s+(\d+):(\d+)(?:-(\d+))?\s+(.+)$/.exec(line)
        if (!match) continue
        const [, bookCode, chapterText, verseText, endVerseText, verseContent] = match
        const chapter = Number(chapterText)
        const verse = Number(verseText)
        const endVerse = endVerseText ? Number(endVerseText) : verse
        insert.run([`${bookCode}-${chapter}-${verse}`, bookCode, chapter, verse, endVerse, verseContent.trim()])
      }
      this.connection.run('COMMIT')
    } catch (error) {
      this.connection.run('ROLLBACK')
      throw error
    } finally {
      insert.free()
    }
  }

  private scalar(sql: string, parameters: Array<string | number> = []): number {
    const row = this.getRow(sql, parameters)
    return Number(row?.count ?? 0)
  }

  private rows(sql: string, parameters: Array<string | number> = []): SqlRow[] {
    const statement = this.connection.prepare(sql)
    try {
      statement.bind(parameters)
      const result: SqlRow[] = []
      while (statement.step()) result.push(statement.getAsObject() as SqlRow)
      return result
    } finally {
      statement.free()
    }
  }

  private getRow(sql: string, parameters: Array<string | number> = []): SqlRow | undefined {
    return this.rows(sql, parameters)[0]
  }

  private save(): void {
    writeFileSync(this.dbPath, Buffer.from(this.connection.export()))
  }

  getEvents(): TimelineEvent[] {
    return this.rows('SELECT payload FROM events ORDER BY id').map((row) => fromJson<TimelineEvent>(row.payload))
  }

  getProphecies(): ProphecyRecord[] {
    return this.rows('SELECT payload FROM prophecies ORDER BY id').map((row) => fromJson<ProphecyRecord>(row.payload))
  }

  getDispensations(): DispensationRecord[] {
    return this.rows("SELECT payload FROM dispensations ORDER BY CASE status WHEN 'past' THEN 1 WHEN 'current' THEN 2 ELSE 3 END, id").map((row) => fromJson<DispensationRecord>(row.payload))
  }

  getSources(): SourceRecord[] {
    return this.rows("SELECT payload FROM sources ORDER BY CASE category WHEN 'news' THEN 1 WHEN 'biblical' THEN 2 ELSE 3 END, name").map((row) => fromJson<SourceRecord>(row.payload))
  }

  getEnabledNewsSources(): SourceRecord[] {
    return this.getSources().filter((source) => source.category === 'news' && source.enabled && source.feedUrl)
  }

  updateSourceStatus(sourceId: string, patch: Partial<SourceRecord>): SourceRecord[] {
    const row = this.getRow('SELECT payload FROM sources WHERE id = ?', [sourceId])
    if (!row) return this.getSources()
    const current = fromJson<SourceRecord>(row.payload)
    const updated = { ...current, ...patch }
    this.connection.run('UPDATE sources SET name = ?, category = ?, enabled = ?, payload = ? WHERE id = ?', [updated.name, updated.category, updated.enabled ? 1 : 0, toJson(updated), sourceId])
    this.save()
    return this.getSources()
  }

  setSourceEnabled(sourceId: string, enabled: boolean): SourceRecord[] {
    return this.updateSourceStatus(sourceId, { enabled })
  }

  getNews(limit = 120): NewsArticle[] {
    return this.rows('SELECT * FROM news_articles ORDER BY published_at DESC LIMIT ?', [limit]).map((row) => ({
      id: String(row.id),
      headline: String(row.headline),
      publisher: String(row.publisher),
      author: String(row.author),
      originalUrl: String(row.original_url),
      publishedAt: String(row.published_at),
      updatedAt: String(row.updated_at),
      retrievedAt: String(row.retrieved_at),
      category: String(row.category),
      region: String(row.region),
      country: String(row.country),
      summary: String(row.summary),
      sourceId: String(row.source_id),
      imageUrl: row.image_url ? String(row.image_url) : undefined,
      isOpinion: Number(row.is_opinion) === 1,
      tags: fromJson<string[]>(row.tags)
    }))
  }

  upsertNews(articles: NewsArticle[]): void {
    const statement = this.connection.prepare(`
      INSERT INTO news_articles (id, headline, publisher, author, original_url, published_at, updated_at, retrieved_at, category, region, country, summary, source_id, image_url, is_opinion, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(original_url) DO UPDATE SET headline = excluded.headline, author = excluded.author, updated_at = excluded.updated_at, retrieved_at = excluded.retrieved_at, summary = excluded.summary, image_url = excluded.image_url, tags = excluded.tags
    `)
    this.connection.run('BEGIN TRANSACTION')
    try {
      articles.forEach((article) => statement.run([
        article.id, article.headline, article.publisher, article.author, article.originalUrl, article.publishedAt, article.updatedAt,
        article.retrievedAt, article.category, article.region, article.country, article.summary, article.sourceId, article.imageUrl ?? null,
        article.isOpinion ? 1 : 0, toJson(article.tags)
      ]))
      this.connection.run('COMMIT')
    } catch (error) {
      this.connection.run('ROLLBACK')
      throw error
    } finally {
      statement.free()
    }
    this.connection.run("DELETE FROM news_articles WHERE id NOT IN (SELECT id FROM news_articles ORDER BY published_at DESC LIMIT 500)")
    this.save()
  }

  clearNews(): NewsArticle[] {
    this.connection.run('DELETE FROM news_articles')
    this.save()
    return []
  }

  getBookmarks(): BookmarkRecord[] {
    return this.rows('SELECT * FROM bookmarks ORDER BY created_at DESC').map((row) => ({
      id: String(row.id), entityType: String(row.entity_type) as BookmarkRecord['entityType'], entityId: String(row.entity_id),
      title: String(row.title), subtitle: String(row.subtitle), createdAt: String(row.created_at), folder: String(row.folder)
    }))
  }

  toggleBookmark(input: BookmarkInput): BookmarkRecord[] {
    const existing = this.getRow('SELECT id FROM bookmarks WHERE entity_type = ? AND entity_id = ?', [input.entityType, input.entityId])
    if (existing) {
      this.connection.run('DELETE FROM bookmarks WHERE id = ?', [String(existing.id)])
    } else {
      this.connection.run('INSERT INTO bookmarks (id, entity_type, entity_id, title, subtitle, created_at, folder) VALUES (?, ?, ?, ?, ?, ?, ?)', [
        randomUUID(), input.entityType, input.entityId, input.title.slice(0, 300), input.subtitle.slice(0, 500), new Date().toISOString(), (input.folder || 'Saved').slice(0, 80)
      ])
    }
    this.save()
    return this.getBookmarks()
  }

  getNotes(): NoteRecord[] {
    return this.rows('SELECT * FROM notes ORDER BY updated_at DESC').map((row) => ({ id: String(row.id), entityType: String(row.entity_type), entityId: String(row.entity_id), body: String(row.body), updatedAt: String(row.updated_at) }))
  }

  saveNote(input: NoteInput): NoteRecord[] {
    const body = input.body.trim().slice(0, 20_000)
    if (!body) {
      this.connection.run('DELETE FROM notes WHERE entity_type = ? AND entity_id = ?', [input.entityType, input.entityId])
    } else {
      this.connection.run(`INSERT INTO notes (id, entity_type, entity_id, body, updated_at) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(entity_type, entity_id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`, [randomUUID(), input.entityType, input.entityId, body, new Date().toISOString()])
    }
    this.save()
    return this.getNotes()
  }

  getSettings(): AppSettings {
    const row = this.getRow('SELECT payload FROM settings WHERE id = 1')
    return row ? { ...DEFAULT_SETTINGS, ...fromJson<AppSettings>(row.payload) } : DEFAULT_SETTINGS
  }

  updateSettings(patch: Partial<AppSettings>): AppSettings {
    const settings = { ...this.getSettings(), ...patch }
    this.connection.run('UPDATE settings SET payload = ? WHERE id = 1', [toJson(settings)])
    this.save()
    return settings
  }

  getBibleBooks(): BibleBook[] {
    return this.rows('SELECT code, name, book_order, chapters FROM bible_books ORDER BY book_order').map((row) => ({ code: String(row.code), name: String(row.name), order: Number(row.book_order), chapters: Number(row.chapters) }))
  }

  getBibleChapter(bookCode: string, chapter: number): BibleVerse[] {
    return this.rows(`SELECT v.*, b.name AS book_name FROM bible_verses v JOIN bible_books b ON b.code = v.book_code WHERE v.book_code = ? AND v.chapter = ? ORDER BY v.verse`, [bookCode, chapter]).map(this.mapVerse)
  }

  searchBible(query: string, limit = 100): BibleVerse[] {
    const cleaned = query.trim()
    const reference = /^(.+?)\s+(\d+)(?::(\d+))?$/i.exec(cleaned)
    if (reference) {
      const [, bookName, chapterText, verseText] = reference
      const book = BIBLE_BOOKS.find((candidate) => candidate.name.toLowerCase() === bookName.toLowerCase() || candidate.code.toLowerCase() === bookName.toLowerCase())
      if (book) {
        const chapter = Number(chapterText)
        const rows = this.getBibleChapter(book.code, chapter)
        return verseText ? rows.filter((verse) => verse.verse === Number(verseText) || (verse.verse <= Number(verseText) && verse.endVerse >= Number(verseText))) : rows
      }
    }
    if (cleaned.length < 2) return []
    return this.rows(`SELECT v.*, b.name AS book_name FROM bible_verses v JOIN bible_books b ON b.code = v.book_code WHERE v.text LIKE ? ORDER BY b.book_order, v.chapter, v.verse LIMIT ?`, [`%${cleaned}%`, limit]).map(this.mapVerse)
  }

  private mapVerse = (row: SqlRow): BibleVerse => ({
    id: String(row.id), bookCode: String(row.book_code), bookName: String(row.book_name), chapter: Number(row.chapter), verse: Number(row.verse), endVerse: Number(row.end_verse), text: String(row.text),
    reference: `${String(row.book_name)} ${Number(row.chapter)}:${Number(row.verse)}${Number(row.end_verse) !== Number(row.verse) ? `–${Number(row.end_verse)}` : ''}`
  })

  getSyncStatus(online: boolean): SyncStatus {
    const row = this.getRow("SELECT * FROM sync_logs WHERE service = 'news' ORDER BY attempted_at DESC LIMIT 1")
    if (!row) return { online, successfulSources: 0, failedSources: 0, message: online ? 'Connected — news has not synchronized yet' : 'Offline — using local data' }
    return {
      online,
      lastNewsSync: Number(row.succeeded) === 1 ? String(row.attempted_at) : undefined,
      lastTimelineSync: undefined,
      lastAttempt: String(row.attempted_at),
      successfulSources: Number(row.successful_sources),
      failedSources: Number(row.failed_sources),
      message: String(row.message)
    }
  }

  logNewsSync(succeeded: boolean, message: string, successfulSources: number, failedSources: number): void {
    this.connection.run('INSERT INTO sync_logs (id, service, attempted_at, succeeded, message, successful_sources, failed_sources) VALUES (?, ?, ?, ?, ?, ?, ?)', [randomUUID(), 'news', new Date().toISOString(), succeeded ? 1 : 0, message, successfulSources, failedSources])
    this.connection.run("DELETE FROM sync_logs WHERE id NOT IN (SELECT id FROM sync_logs ORDER BY attempted_at DESC LIMIT 100)")
    this.save()
  }

  getBootstrap(online: boolean): BootstrapData {
    return { events: this.getEvents(), prophecies: this.getProphecies(), dispensations: this.getDispensations(), news: this.getNews(), sources: this.getSources(), bookmarks: this.getBookmarks(), notes: this.getNotes(), settings: this.getSettings(), sync: this.getSyncStatus(online) }
  }

  search(query: string): SearchResult[] {
    const cleaned = query.trim()
    if (cleaned.length < 2) return []
    const needle = `%${cleaned}%`
    const results: SearchResult[] = []
    this.rows('SELECT id, title, summary FROM events WHERE title LIKE ? OR summary LIKE ? LIMIT 12', [needle, needle]).forEach((row) => results.push({ id: `event-${row.id}`, type: 'event', title: String(row.title), subtitle: String(row.summary), route: '/timeline/master', entityId: String(row.id) }))
    this.rows('SELECT id, title, reference, classification FROM prophecies WHERE title LIKE ? OR reference LIKE ? OR payload LIKE ? LIMIT 12', [needle, needle, needle]).forEach((row) => results.push({ id: `prophecy-${row.id}`, type: 'prophecy', title: String(row.title), subtitle: `${row.reference} · ${row.classification}`, route: '/prophecies', entityId: String(row.id) }))
    this.rows('SELECT id, headline, publisher, published_at FROM news_articles WHERE headline LIKE ? OR summary LIKE ? LIMIT 12', [needle, needle]).forEach((row) => results.push({ id: `news-${row.id}`, type: 'news', title: String(row.headline), subtitle: `${row.publisher} · ${row.published_at}`, route: '/news', entityId: String(row.id) }))
    this.rows('SELECT id, name, status FROM dispensations WHERE name LIKE ? OR payload LIKE ? LIMIT 8', [needle, needle]).forEach((row) => results.push({ id: `disp-${row.id}`, type: 'dispensation', title: String(row.name), subtitle: `${row.status} · Chosen theological framework`, route: '/dispensations', entityId: String(row.id) }))
    this.searchBible(cleaned, 12).forEach((verse) => results.push({ id: `verse-${verse.id}`, type: 'verse', title: verse.reference, subtitle: verse.text, route: `/bible?book=${verse.bookCode}&chapter=${verse.chapter}&verse=${verse.verse}`, entityId: verse.id }))
    return results.slice(0, 40)
  }

  clearActivity(): { bookmarks: BookmarkRecord[]; notes: NoteRecord[] } {
    this.connection.run('DELETE FROM bookmarks; DELETE FROM notes;')
    this.save()
    return { bookmarks: [], notes: [] }
  }

  async reset(): Promise<void> {
    this.connection.close()
    this.db = null
    if (existsSync(this.dbPath)) unlinkSync(this.dbPath)
    await this.initialize()
  }
}

export const database = new TruthDatabase()
