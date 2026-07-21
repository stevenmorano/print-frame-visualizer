import type { Geometry, Project } from './types'

const safe = (value: number) => (Number.isFinite(value) ? Math.max(0, value) : 0)

export function calculateGeometry(project: Project): Geometry {
  const printWidth = safe(project.print.width)
  const printHeight = safe(project.print.height)
  const frameWidth = safe(project.frame.width)
  const frameHeight = safe(project.frame.height)
  const face = safe(project.frameFace)
  const horizontalMat = safe(project.matHorizontal)
  const verticalMat = safe(project.matVertical)
  const matWindow = {
    width: Math.max(0, frameWidth - horizontalMat * 2),
    height: Math.max(0, frameHeight - verticalMat * 2),
  }
  const cropPerSide = {
    width: Math.max(0, (printWidth - matWindow.width) / 2),
    height: Math.max(0, (printHeight - matWindow.height) / 2),
  }
  const gapPerSide = {
    width: Math.max(0, (matWindow.width - printWidth) / 2),
    height: Math.max(0, (matWindow.height - printHeight) / 2),
  }
  const visibleArtwork = {
    width: Math.max(0, Math.min(printWidth, matWindow.width)),
    height: Math.max(0, Math.min(printHeight, matWindow.height)),
  }
  const scalePercent = Math.min(1, frameWidth / Math.max(printWidth, 0.001), frameHeight / Math.max(printHeight, 0.001)) * 100
  const warnings: string[] = []

  if (!printWidth || !printHeight || !frameWidth || !frameHeight) warnings.push('Enter positive print and frame dimensions.')
  if (!matWindow.width || !matWindow.height) warnings.push('The selected mat leaves no visible opening.')
  if (printWidth > frameWidth || printHeight > frameHeight) warnings.push(`The print is larger than the listed frame cavity and would need trimming or scaling to ${scalePercent.toFixed(1)}%.`)
  if (gapPerSide.width > 0 || gapPerSide.height > 0) warnings.push('Part of the mat opening extends beyond the print; backing may be visible.')

  return {
    outer: { width: frameWidth + face * 2, height: frameHeight + face * 2 },
    opening: { width: frameWidth, height: frameHeight },
    matWindow,
    cropPerSide,
    gapPerSide,
    visibleArtwork,
    scalePercent,
    warnings,
  }
}

export function formatInches(value: number) {
  return `${Number(value.toFixed(2))} in`
}
