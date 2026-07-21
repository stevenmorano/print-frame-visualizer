import { describe, expect, it } from 'vitest'
import { calculateGeometry } from './geometry'
import { createProject } from './project'

describe('calculateGeometry', () => {
  it('calculates outside size from the listed cavity plus frame face', () => {
    const project = createProject({ frame: { width: 40, height: 28 }, frameFace: 2 })
    expect(calculateGeometry(project).outer).toEqual({ width: 44, height: 32 })
  })

  it('reports accurate mat crop for a 36 × 27 print', () => {
    const project = createProject({
      print: { width: 36, height: 27 },
      frame: { width: 40, height: 28 },
      matHorizontal: 3,
      matVertical: 1,
    })
    const result = calculateGeometry(project)
    expect(result.matWindow).toEqual({ width: 34, height: 26 })
    expect(result.cropPerSide).toEqual({ width: 1, height: 0.5 })
    expect(result.visibleArtwork).toEqual({ width: 34, height: 26 })
  })

  it('warns when the mat removes the opening', () => {
    const project = createProject({ frame: { width: 8, height: 10 }, matHorizontal: 4 })
    expect(calculateGeometry(project).warnings).toContain('The selected mat leaves no visible opening.')
  })
})
