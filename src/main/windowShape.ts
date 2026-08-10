import type { Rectangle } from 'electron'

export const WINDOW_CORNER_RADIUS = 18

export const createRoundedRectangleShape = (rawWidth: number, rawHeight: number, rawRadius = WINDOW_CORNER_RADIUS): Rectangle[] => {
  const width = Math.max(1, Math.floor(rawWidth))
  const height = Math.max(1, Math.floor(rawHeight))
  const radius = Math.max(0, Math.min(Math.floor(rawRadius), Math.floor(width / 2), Math.floor(height / 2)))
  if (radius === 0) return [{ x: 0, y: 0, width, height }]

  const rows: Rectangle[] = []
  for (let row = 0; row < radius; row += 1) {
    const distanceFromCenter = radius - row - 0.5
    const inset = Math.ceil(radius - Math.sqrt((radius * radius) - (distanceFromCenter * distanceFromCenter)))
    rows.push({ x: inset, y: row, width: Math.max(1, width - (inset * 2)), height: 1 })
  }

  const middleHeight = height - (radius * 2)
  if (middleHeight > 0) rows.push({ x: 0, y: radius, width, height: middleHeight })

  for (let row = 0; row < radius; row += 1) {
    const topRow = rows[radius - row - 1]
    rows.push({ ...topRow, y: height - radius + row })
  }

  return rows
}
