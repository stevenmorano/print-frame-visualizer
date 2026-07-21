import type { FramePreset } from './types'

const sizes: Array<[number, number]> = [
  [3.5, 5], [4, 6], [5, 5], [5, 7], [6, 8], [8, 8], [8, 10], [8.5, 11],
  [9, 12], [10, 10], [10, 13], [11, 14], [11, 17], [12, 12], [12, 16],
  [12, 18], [13, 19], [14, 18], [16, 16], [16, 20], [18, 18], [18, 24],
  [20, 20], [20, 24], [20, 28], [20, 30], [22, 28], [24, 24], [24, 30],
  [24, 32], [24, 36], [27, 40], [28, 40], [30, 30], [30, 40], [32, 40],
  [36, 36], [36, 48], [40, 40], [40, 50], [40, 60], [48, 60],
]

export const FRAME_PRESETS: FramePreset[] = sizes.flatMap(([width, height]) => {
  const base = { id: `${width}x${height}`, name: `${width} × ${height} in`, width, height }
  if (width === height) return [base]
  return [base, { ...base, id: `${height}x${width}`, name: `${height} × ${width} in`, width: height, height: width }]
})
