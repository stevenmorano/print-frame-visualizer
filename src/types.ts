export type Dimensions = { width: number; height: number }

export type ArtworkSettings = {
  dataUrl: string | null
  fileName: string
  zoom: number
  offsetX: number
  offsetY: number
  rotation: number
}

export type FramePreset = Dimensions & { id: string; name: string; custom?: boolean }

export type Project = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  print: Dimensions
  frame: Dimensions
  frameFace: number
  matHorizontal: number
  matVertical: number
  frameColor: string
  matColor: string
  artwork: ArtworkSettings
}

export type Geometry = {
  outer: Dimensions
  opening: Dimensions
  matWindow: Dimensions
  cropPerSide: Dimensions
  gapPerSide: Dimensions
  visibleArtwork: Dimensions
  scalePercent: number
  warnings: string[]
}
