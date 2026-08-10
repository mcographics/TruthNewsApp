import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'

interface ManifestTranslation {
  code: string
  format: 'text' | 'facsimile'
  scope: string
  packFile: string | null
  verseCount: number
  bookCodes: string[]
}

interface TranslationPack {
  schemaVersion: number
  code: string
  verseCount: number
  bookCodes: string[]
  verses: Array<{ bookCode: string; chapter: number; verse: number; text: string }>
}

const dataDirectory = join(process.cwd(), 'src', 'main', 'data', 'translations')
const manifest = JSON.parse(readFileSync(join(dataDirectory, 'manifest.json'), 'utf8')) as { schemaVersion: number; translations: ManifestTranslation[] }
const textPacks = manifest.translations.filter((translation) => translation.packFile)
const readPack = (translation: ManifestTranslation): TranslationPack => JSON.parse(
  gunzipSync(readFileSync(join(dataDirectory, String(translation.packFile)))).toString('utf8')
) as TranslationPack

describe('offline Bible translation library', () => {
  it('advertises thirteen searchable editions and the Geneva facsimile', () => {
    expect(manifest.schemaVersion).toBe(1)
    expect(manifest.translations.filter((translation) => translation.format === 'text')).toHaveLength(13)
    expect(manifest.translations.find((translation) => translation.code === 'GNV1560')).toMatchObject({ format: 'facsimile', verseCount: 0 })
  })

  it.each(textPacks)('$code pack matches its manifest and has unique verse addresses', (translation) => {
    const pack = readPack(translation)
    const addresses = new Set(pack.verses.map((verse) => `${verse.bookCode}-${verse.chapter}-${verse.verse}`))
    expect(pack.schemaVersion).toBe(1)
    expect(pack.code).toBe(translation.code)
    expect(pack.verseCount).toBe(translation.verseCount)
    expect(pack.verses).toHaveLength(translation.verseCount)
    expect(addresses.size).toBe(pack.verses.length)
    expect(pack.bookCodes).toEqual(translation.bookCodes)
    expect(pack.verses.every((verse) => verse.chapter > 0 && verse.verse > 0 && verse.text.trim().length > 0)).toBe(true)
  })

  it('keeps complete and New Testament-only scopes explicit', () => {
    const complete = manifest.translations.filter((translation) => translation.packFile && translation.scope === 'Complete Bible')
    const newTestament = manifest.translations.filter((translation) => translation.packFile && translation.scope === 'New Testament')
    expect(complete).toHaveLength(10)
    expect(complete.every((translation) => translation.bookCodes.length === 66)).toBe(true)
    expect(newTestament.map((translation) => translation.code).sort()).toEqual(['BIB', 'BLB'])
    expect(newTestament.every((translation) => translation.bookCodes.length === 27 && translation.bookCodes[0] === 'MAT')).toBe(true)
  })

  it('preserves representative John 3:16 wording and interlinear Greek', () => {
    const kjv = readPack(manifest.translations.find((translation) => translation.code === 'KJV')!)
    const bib = readPack(manifest.translations.find((translation) => translation.code === 'BIB')!)
    const kjvVerse = kjv.verses.find((verse) => verse.bookCode === 'JOH' && verse.chapter === 3 && verse.verse === 16)
    const bibVerse = bib.verses.find((verse) => verse.bookCode === 'JOH' && verse.chapter === 3 && verse.verse === 16)
    expect(kjvVerse?.text).toBe('For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.')
    expect(bibVerse?.text).toContain('Οὕτως (Thus)')
    expect(bibVerse?.text).toContain('κόσμον (world)')
  })
})
