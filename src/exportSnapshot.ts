import { calculateGeometry, formatInches } from './geometry'
import type { Project } from './types'

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image()
  image.onload = () => resolve(image)
  image.onerror = reject
  image.src = src
})

function drawDummy(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height)
  gradient.addColorStop(0, '#d66b43')
  gradient.addColorStop(0.48, '#ead7b0')
  gradient.addColorStop(1, '#58706c')
  ctx.fillStyle = gradient
  ctx.fillRect(x, y, width, height)
  ctx.fillStyle = 'rgba(28, 29, 25, .76)'
  ctx.beginPath()
  ctx.arc(x + width * 0.7, y + height * 0.36, Math.min(width, height) * 0.18, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(247, 241, 226, .78)'
  ctx.font = `italic ${Math.max(18, width * 0.055)}px Georgia`
  ctx.fillText('YOUR PRINT', x + width * 0.09, y + height * 0.84)
}

function drawPreparedImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, project: Project, x: number, y: number, width: number, height: number) {
  const { zoom, offsetX, offsetY, rotation } = project.artwork
  const cover = Math.max(width / image.naturalWidth, height / image.naturalHeight) * zoom
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.clip()
  ctx.translate(x + width / 2 + width * offsetX / 100, y + height / 2 + height * offsetY / 100)
  ctx.rotate(rotation * Math.PI / 180)
  ctx.scale(cover, cover)
  ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)
  ctx.restore()
}

export async function exportSnapshot(project: Project) {
  const geometry = calculateGeometry(project)
  const canvas = document.createElement('canvas')
  const artArea = 1420
  const specsHeight = 300
  const scale = Math.min(artArea / geometry.outer.width, 980 / geometry.outer.height)
  const drawingWidth = geometry.outer.width * scale
  const drawingHeight = geometry.outer.height * scale
  canvas.width = 1600
  canvas.height = Math.ceil(drawingHeight + specsHeight + 140)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#eee9df'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const outerX = (canvas.width - drawingWidth) / 2
  const outerY = 70
  const face = project.frameFace * scale
  const openingX = outerX + face
  const openingY = outerY + face
  const openingW = project.frame.width * scale
  const openingH = project.frame.height * scale
  const printX = openingX + (project.frame.width - project.print.width) * scale / 2
  const printY = openingY + (project.frame.height - project.print.height) * scale / 2
  const printW = project.print.width * scale
  const printH = project.print.height * scale

  ctx.fillStyle = project.frameColor
  ctx.fillRect(outerX, outerY, drawingWidth, drawingHeight)
  ctx.save()
  ctx.beginPath()
  ctx.rect(openingX, openingY, openingW, openingH)
  ctx.clip()
  ctx.fillStyle = '#c9c1b3'
  ctx.fillRect(openingX, openingY, openingW, openingH)
  if (project.artwork.dataUrl) {
    const image = await loadImage(project.artwork.dataUrl)
    drawPreparedImage(ctx, image, project, printX, printY, printW, printH)
  } else {
    drawDummy(ctx, printX, printY, printW, printH)
  }
  ctx.fillStyle = project.matColor
  const matX = project.matHorizontal * scale
  const matY = project.matVertical * scale
  ctx.fillRect(openingX, openingY, openingW, matY)
  ctx.fillRect(openingX, openingY + openingH - matY, openingW, matY)
  ctx.fillRect(openingX, openingY + matY, matX, openingH - matY * 2)
  ctx.fillRect(openingX + openingW - matX, openingY + matY, matX, openingH - matY * 2)
  ctx.restore()

  const specsY = outerY + drawingHeight + 70
  ctx.fillStyle = '#171714'
  ctx.font = '700 34px Georgia'
  ctx.fillText(project.name, 90, specsY)
  ctx.fillStyle = '#b7472f'
  ctx.font = '700 17px "Courier New"'
  ctx.fillText("STEVE'S TOOLS / PRINT & FRAME VISUALIZER", 90, specsY + 42)
  ctx.fillStyle = '#171714'
  ctx.font = '21px "Courier New"'
  const specs = [
    `PRINT  ${formatInches(project.print.width)} × ${formatInches(project.print.height)}`,
    `LISTED FRAME  ${formatInches(project.frame.width)} × ${formatInches(project.frame.height)}`,
    `OVERALL OUTSIDE  ${formatInches(geometry.outer.width)} × ${formatInches(geometry.outer.height)}`,
    `FRAME FACE  ${formatInches(project.frameFace)}`,
    `MAT L/R  ${formatInches(project.matHorizontal)}   MAT T/B  ${formatInches(project.matVertical)}`,
    `VISIBLE ART  ${formatInches(geometry.visibleArtwork.width)} × ${formatInches(geometry.visibleArtwork.height)}`,
  ]
  specs.forEach((line, index) => ctx.fillText(line, 90 + (index % 2) * 720, specsY + 92 + Math.floor(index / 2) * 54))

  const link = document.createElement('a')
  link.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'frame-study'}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}
