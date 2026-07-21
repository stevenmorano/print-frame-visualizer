import type { Project } from './types'

export function createProject(overrides: Partial<Project> = {}): Project {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    name: 'Untitled frame study',
    createdAt: now,
    updatedAt: now,
    print: { width: 36, height: 27 },
    frame: { width: 40, height: 28 },
    frameFace: 1.5,
    matHorizontal: 2,
    matVertical: 1,
    frameColor: '#171714',
    matColor: '#f4f0e6',
    artwork: { dataUrl: null, fileName: '', zoom: 1, offsetX: 0, offsetY: 0, rotation: 0 },
    ...overrides,
  }
}
