import { describe, expect, it } from 'vitest'
import { SEED_DISPENSATIONS, SEED_EVENTS, SEED_PROPHECIES, SEED_SOURCES } from './seedData'

describe('evidence-aware seed data', () => {
  it('assigns an explicit date type and confidence to every timeline event', () => {
    expect(SEED_EVENTS.length).toBeGreaterThan(10)
    for (const event of SEED_EVENTS) {
      expect(event.date.dateType).toBeTruthy()
      expect(event.date.displayDate).toBeTruthy()
      expect(event.date.confidence).toBeTruthy()
      if (event.date.dateType === 'unknown') expect(event.date.displayDate.toLowerCase()).toContain('unknown')
      if (event.date.dateType === 'disputed') expect(['DISPUTED', 'HIGH CONFIDENCE']).toContain(event.date.confidence)
    }
  })

  it('classifies every prophecy connection instead of silently claiming fulfillment', () => {
    const allowed = ['EXPLICITLY FULFILLED', 'HISTORICALLY ASSOCIATED', 'POSSIBLE CONNECTION', 'WATCHING', 'FUTURE', 'DISPUTED', 'UNKNOWN']
    expect(SEED_PROPHECIES.length).toBeGreaterThan(4)
    for (const prophecy of SEED_PROPHECIES) {
      expect(allowed).toContain(prophecy.classification)
      expect(prophecy.interpretation.length).toBeGreaterThan(20)
      expect(prophecy.evidence.length).toBeGreaterThan(0)
    }
  })

  it('labels the chosen dispensational framework and includes a current era', () => {
    expect(SEED_DISPENSATIONS).toHaveLength(8)
    expect(SEED_DISPENSATIONS.filter((record) => record.status === 'current')).toHaveLength(1)
  })

  it('preserves source rights and reliability notes', () => {
    expect(SEED_SOURCES.some((source) => source.id === 'source-web' && source.termsNote.includes('Public domain'))).toBe(true)
    for (const source of SEED_SOURCES) {
      expect(source.reliability.length).toBeGreaterThan(10)
      expect(source.termsNote.length).toBeGreaterThan(5)
      expect(source.url.startsWith('https://')).toBe(true)
    }
  })
})
