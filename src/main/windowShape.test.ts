import { describe, expect, it } from 'vitest'
import { createRoundedRectangleShape, WINDOW_CORNER_RADIUS } from './windowShape'

describe('rounded desktop window shape', () => {
  it('keeps the center full-width and clips each outer corner', () => {
    const shape = createRoundedRectangleShape(1600, 1000)
    const center = shape.find((rect) => rect.height > 1)

    expect(shape).toHaveLength((WINDOW_CORNER_RADIUS * 2) + 1)
    expect(shape[0].x).toBeGreaterThan(0)
    expect(shape[0].width).toBeLessThan(1600)
    expect(center).toEqual({ x: 0, y: WINDOW_CORNER_RADIUS, width: 1600, height: 1000 - (WINDOW_CORNER_RADIUS * 2) })
    expect(shape[WINDOW_CORNER_RADIUS + 1].x).toBe(shape[WINDOW_CORNER_RADIUS - 1].x)
    expect(shape.at(-1)?.x).toBe(shape[0].x)
  })

  it('clamps the radius for very small windows and supports square fallback shapes', () => {
    const rounded = createRoundedRectangleShape(12, 8, 40)
    const square = createRoundedRectangleShape(12, 8, 0)

    expect(rounded.every((rect) => rect.width > 0 && rect.height > 0)).toBe(true)
    expect(square).toEqual([{ x: 0, y: 0, width: 12, height: 8 }])
  })
})
