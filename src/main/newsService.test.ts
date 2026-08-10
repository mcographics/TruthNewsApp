import { describe, expect, it } from 'vitest'
import { normalizeFeedCategoryValues } from './newsService'

describe('RSS category normalization', () => {
  it('converts rss-parser category objects into safe labels', () => {
    const category = Object.create(null) as { _: string; $: { domain: string } }
    category._ = 'Politics'
    category.$ = { domain: 'https://example.com/category' }

    expect(normalizeFeedCategoryValues(['World', category, null, { _: 2026 }])).toEqual(['World', 'Politics', '2026'])
  })

  it('ignores category values without readable text', () => {
    expect(normalizeFeedCategoryValues([{ domain: 'example' }, undefined, '', '  Faith  '])).toEqual(['Faith'])
  })
})
