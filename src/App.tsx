import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { exportSnapshot } from './exportSnapshot'
import { calculateGeometry, formatInches } from './geometry'
import { FRAME_PRESETS } from './presets'
import { createProject } from './project'
import { storage } from './storage'
import type { FramePreset, Project } from './types'

type DimensionControlProps = {
  label: string
  value: number
  min?: number
  max: number
  step?: number
  unit?: string
  mobileInchPicker?: boolean
  onChange: (value: number) => void
}

const INCH_FRACTIONS = ['0', '⅛', '¼', '⅜', '½', '⅝', '¾', '⅞']

type FrameOrientation = 'portrait' | 'landscape'

const sizeKey = ({ width, height }: { width: number; height: number }) => `${Math.min(width, height)}x${Math.max(width, height)}`

function orientPreset(preset: FramePreset, orientation: FrameOrientation): FramePreset {
  const shortSide = Math.min(preset.width, preset.height)
  const longSide = Math.max(preset.width, preset.height)
  const width = shortSide === longSide || orientation === 'portrait' ? shortSide : longSide
  const height = shortSide === longSide || orientation === 'portrait' ? longSide : shortSide
  return {
    ...preset,
    id: `${preset.custom ? 'custom' : 'common'}-${shortSide}x${longSide}`,
    name: `${width} × ${height} in${preset.custom ? ' — saved' : ''}`,
    width,
    height,
  }
}

const DimensionControl = memo(function DimensionControl({
  label,
  value,
  min = 0,
  max,
  step = 0.125,
  unit = 'in',
  mobileInchPicker = true,
  onChange,
}: DimensionControlProps) {
  const sliderMax = Math.max(max, Math.ceil(value * 1.25))
  const roundedEighths = Math.round(value * 8)
  const selectedWhole = Math.floor(roundedEighths / 8)
  const selectedFraction = ((roundedEighths % 8) + 8) % 8
  const firstWhole = Math.max(0, Math.floor(min))
  const lastWhole = Math.max(firstWhole, Math.ceil(sliderMax))
  const wholeInches = Array.from({ length: lastWhole - firstWhole + 1 }, (_, index) => firstWhole + index)
  const updateInches = (whole: number, fraction: number) => {
    onChange(Math.min(max, Math.max(min, whole + fraction / 8)))
  }

  return (
    <div className="dimension-control">
      <span className="control-label">{label}</span>
      <span className="number-wrap">
        <input aria-label={`${label} exact value`} inputMode="decimal" type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
        <span>{unit}</span>
      </span>
      <input aria-label={`${label} slider`} className="range" type="range" min={min} max={sliderMax} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      {mobileInchPicker && (
        <span className="mobile-inch-picker">
          <span className="mobile-select-field">
            <span>Whole inches</span>
            <select aria-label={`${label} whole inches`} value={selectedWhole} onChange={(event) => updateInches(Number(event.target.value), selectedFraction)}>
              {wholeInches.map((whole) => <option key={whole} value={whole}>{whole}</option>)}
            </select>
          </span>
          <span className="mobile-select-field">
            <span>Fraction</span>
            <select aria-label={`${label} inch fraction`} value={selectedFraction} onChange={(event) => updateInches(selectedWhole, Number(event.target.value))}>
              {INCH_FRACTIONS.map((fraction, index) => <option key={fraction} value={index}>{fraction}</option>)}
            </select>
          </span>
        </span>
      )}
    </div>
  )
})

const FramePreview = memo(function FramePreview({ project }: { project: Project }) {
  const geometry = useMemo(() => calculateGeometry(project), [project])
  const outer = geometry.outer
  const faceLeft = project.frameFace / outer.width * 100
  const faceTop = project.frameFace / outer.height * 100
  const openingWidth = project.frame.width / outer.width * 100
  const openingHeight = project.frame.height / outer.height * 100
  const printLeft = (project.frame.width - project.print.width) / 2 / project.frame.width * 100
  const printTop = (project.frame.height - project.print.height) / 2 / project.frame.height * 100
  const printWidth = project.print.width / project.frame.width * 100
  const printHeight = project.print.height / project.frame.height * 100
  const matX = Math.min(50, project.matHorizontal / project.frame.width * 100)
  const matY = Math.min(50, project.matVertical / project.frame.height * 100)
  const imageTransform = `translate(${project.artwork.offsetX}%, ${project.artwork.offsetY}%) scale(${project.artwork.zoom}) rotate(${project.artwork.rotation}deg)`

  const previewStyle = { '--frame-ratio': outer.width / outer.height } as CSSProperties

  return (
    <div className="preview-stage" style={previewStyle}>
      <div className="measurement measurement-x"><span>{formatInches(outer.width)} overall</span></div>
      <div className="measurement measurement-y"><span>{formatInches(outer.height)} overall</span></div>
      <div className="frame-object" style={{ aspectRatio: `${outer.width} / ${outer.height}`, backgroundColor: project.frameColor }}>
        <div className="opening" style={{ left: `${faceLeft}%`, top: `${faceTop}%`, width: `${openingWidth}%`, height: `${openingHeight}%` }}>
          <div className="print" style={{ left: `${printLeft}%`, top: `${printTop}%`, width: `${printWidth}%`, height: `${printHeight}%` }}>
            {project.artwork.dataUrl ? (
              <img src={project.artwork.dataUrl} alt="Uploaded print" style={{ transform: imageTransform }} />
            ) : (
              <div className="dummy-art"><span>YOUR</span><strong>PRINT</strong><i /></div>
            )}
          </div>
          {project.matVertical > 0 && <><div className="mat mat-top" style={{ height: `${matY}%`, background: project.matColor }} /><div className="mat mat-bottom" style={{ height: `${matY}%`, background: project.matColor }} /></>}
          {project.matHorizontal > 0 && <><div className="mat mat-left" style={{ left: 0, top: `${matY}%`, width: `${matX}%`, height: `${100 - matY * 2}%`, background: project.matColor }} /><div className="mat mat-right" style={{ right: 0, top: `${matY}%`, width: `${matX}%`, height: `${100 - matY * 2}%`, background: project.matColor }} /></>}
        </div>
      </div>
      <div className="preview-caption">
        <span>Listed frame {project.frame.width} × {project.frame.height}</span>
        <span>Visible art {geometry.visibleArtwork.width.toFixed(2)} × {geometry.visibleArtwork.height.toFixed(2)}</span>
      </div>
    </div>
  )
})

function App() {
  const [project, setProject] = useState<Project>(() => createProject())
  const [projects, setProjects] = useState<Project[]>([])
  const [customPresets, setCustomPresets] = useState<FramePreset[]>([])
  const [saveState, setSaveState] = useState<'loading' | 'saving' | 'saved' | 'error'>('loading')
  const [activePanel, setActivePanel] = useState<'artwork' | 'dimensions'>('dimensions')
  const [frameOrientation, setFrameOrientationState] = useState<FrameOrientation>('landscape')
  const [frameSearch, setFrameSearch] = useState('')
  const loaded = useRef(false)
  const geometry = useMemo(() => calculateGeometry(project), [project])
  const customPresetExists = useMemo(() => customPresets.some((preset) => sizeKey(preset) === sizeKey(project.frame)), [customPresets, project.frame])
  const displayedPresets = useMemo(() => {
    const seen = new Set<string>()
    const oriented: FramePreset[] = []
    for (const preset of [...customPresets, ...FRAME_PRESETS]) {
      const key = sizeKey(preset)
      if (seen.has(key)) continue
      seen.add(key)
      oriented.push(orientPreset(preset, frameOrientation))
    }
    const query = frameSearch.toLowerCase().replace(/[×\s]/g, '').replace('in', '')
    if (!query) return oriented
    return oriented.filter((preset) => `${preset.width}x${preset.height}`.includes(query) || sizeKey(preset).includes(query) || preset.name.toLowerCase().includes(frameSearch.toLowerCase()))
  }, [customPresets, frameOrientation, frameSearch])

  useEffect(() => {
    Promise.all([storage.getProjects(), storage.getPresets()]).then(([savedProjects, savedPresets]) => {
      const sorted = [...savedProjects].sort((a, b) => b.updatedAt - a.updatedAt)
      if (sorted[0]) {
        setProject(sorted[0])
        if (sorted[0].frame.width !== sorted[0].frame.height) setFrameOrientationState(sorted[0].frame.width > sorted[0].frame.height ? 'landscape' : 'portrait')
      }
      setProjects(sorted)
      setCustomPresets(savedPresets)
      setSaveState('saved')
      loaded.current = true
    }).catch(() => {
      setSaveState('error')
      loaded.current = true
    })
  }, [])

  useEffect(() => {
    if (!loaded.current) return
    setSaveState('saving')
    const timer = window.setTimeout(() => {
      const saved = { ...project, updatedAt: Date.now() }
      storage.saveProject(saved).then(() => {
        setProjects((current) => [saved, ...current.filter((item) => item.id !== saved.id)].sort((a, b) => b.updatedAt - a.updatedAt))
        setSaveState('saved')
      }).catch(() => setSaveState('error'))
    }, 500)
    return () => window.clearTimeout(timer)
  }, [project])

  const patchProject = useCallback((patch: Partial<Project>) => {
    setProject((current) => ({ ...current, ...patch }))
  }, [])

  const patchPrint = useCallback((key: 'width' | 'height', value: number) => {
    setProject((current) => ({ ...current, print: { ...current.print, [key]: value } }))
  }, [])

  const patchFrame = useCallback((key: 'width' | 'height', value: number) => {
    setProject((current) => ({ ...current, frame: { ...current.frame, [key]: value } }))
  }, [])

  useEffect(() => {
    if (project.frame.width === project.frame.height) return
    setFrameOrientationState(project.frame.width > project.frame.height ? 'landscape' : 'portrait')
  }, [project.frame.height, project.frame.width])

  const patchArtwork = useCallback((key: keyof Project['artwork'], value: string | number | null) => {
    setProject((current) => ({ ...current, artwork: { ...current.artwork, [key]: value } }))
  }, [])

  const handleFile = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setProject((current) => ({
      ...current,
      artwork: { ...current.artwork, dataUrl: String(reader.result), fileName: file.name, zoom: 1, offsetX: 0, offsetY: 0, rotation: 0 },
    }))
    reader.readAsDataURL(file)
  }

  const selectPreset = (id: string) => {
    const preset = displayedPresets.find((item) => item.id === id)
    if (preset) patchProject({ frame: { width: preset.width, height: preset.height } })
  }

  const setFrameOrientation = (orientation: FrameOrientation) => {
    setFrameOrientationState(orientation)
    setProject((current) => {
      const currentOrientation = current.frame.width > current.frame.height ? 'landscape' : 'portrait'
      if (current.frame.width === current.frame.height || currentOrientation === orientation) return current
      return { ...current, frame: { width: current.frame.height, height: current.frame.width } }
    })
  }

  const setMatOpening = (key: 'width' | 'height', value: number) => {
    setProject((current) => {
      if (key === 'width') {
        const opening = Math.min(current.frame.width, Math.max(0, value))
        return { ...current, matHorizontal: (current.frame.width - opening) / 2 }
      }
      const opening = Math.min(current.frame.height, Math.max(0, value))
      return { ...current, matVertical: (current.frame.height - opening) / 2 }
    })
  }

  const saveCustomPreset = async () => {
    if (customPresetExists) return
    const preset: FramePreset = {
      id: `custom-${sizeKey(project.frame)}`,
      name: `${project.frame.width} × ${project.frame.height} in — saved`,
      width: project.frame.width,
      height: project.frame.height,
      custom: true,
    }
    await storage.savePreset(preset)
    setCustomPresets((current) => [preset, ...current.filter((item) => sizeKey(item) !== sizeKey(preset))])
  }

  const newProject = () => {
    const next = createProject({ name: `Frame study ${projects.length + 1}` })
    if (frameOrientation === 'portrait') {
      next.frame = { width: next.frame.height, height: next.frame.width }
      next.print = { width: next.print.height, height: next.print.width }
    }
    setProject(next)
  }
  const duplicateProject = () => setProject(createProject({ ...project, id: crypto.randomUUID(), name: `${project.name} copy`, createdAt: Date.now(), updatedAt: Date.now() }))
  const deleteCurrentProject = async () => {
    if (!window.confirm(`Delete “${project.name}” from this browser?`)) return
    await storage.deleteProject(project.id)
    const remaining = projects.filter((item) => item.id !== project.id)
    setProjects(remaining)
    setProject(remaining[0] ?? createProject())
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span>STEVE'S TOOLS / 01</span><h1>Print &amp; Frame<br />Visualizer</h1></div>
        <div className="project-actions">
          <label className="project-name"><span>Project</span><input value={project.name} onChange={(event) => patchProject({ name: event.target.value })} /></label>
          <select aria-label="Open saved project" value={project.id} onChange={(event) => {
            const selected = projects.find((item) => item.id === event.target.value)
            if (selected) {
              setProject(selected)
              if (selected.frame.width !== selected.frame.height) setFrameOrientationState(selected.frame.width > selected.frame.height ? 'landscape' : 'portrait')
            }
          }}>
            <option value={project.id}>Current project</option>
            {projects.filter((item) => item.id !== project.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <button className="quiet-button" onClick={newProject}>New</button>
          <button className="quiet-button" onClick={duplicateProject}>Duplicate</button>
          <button className="quiet-button danger" onClick={deleteCurrentProject}>Delete</button>
          <span className={`save-state ${saveState}`}>{saveState === 'saved' ? 'Saved locally' : saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Storage error' : 'Loading…'}</span>
        </div>
      </header>

      <main className="workspace">
        <section className="visual-area" aria-label="Frame preview">
          <div className="visual-heading"><span className="eyebrow">LIVE / TRUE PROPORTION</span><button className="export-button" onClick={() => void exportSnapshot(project)}>Save snapshot <span>↓</span></button></div>
          <FramePreview project={project} />
          {geometry.warnings.length > 0 && <div className="warnings" role="status">{geometry.warnings.map((warning) => <p key={warning}>△ {warning}</p>)}</div>}
        </section>

        <aside className="control-panel">
          <div className="panel-tabs" role="tablist">
            <button role="tab" aria-selected={activePanel === 'dimensions'} onClick={() => setActivePanel('dimensions')}>01 Dimensions</button>
            <button role="tab" aria-selected={activePanel === 'artwork'} onClick={() => setActivePanel('artwork')}>02 Artwork</button>
          </div>

          {activePanel === 'dimensions' ? (
            <div className="panel-content">
              <section className="control-section">
                <div className="section-title"><span>PRINT</span><small>actual sheet size</small></div>
                <div className="control-grid"><DimensionControl label="Width" value={project.print.width} max={60} onChange={(value) => patchPrint('width', value)} /><DimensionControl label="Height" value={project.print.height} max={60} onChange={(value) => patchPrint('height', value)} /></div>
              </section>
              <section className="control-section">
                <div className="section-title"><span>FRAME</span><small>listed cavity size</small></div>
                <div className="orientation-control" aria-label="Frame orientation">
                  <button type="button" aria-pressed={frameOrientation === 'portrait'} onClick={() => setFrameOrientation('portrait')}>↕ Portrait</button>
                  <button type="button" aria-pressed={frameOrientation === 'landscape'} onClick={() => setFrameOrientation('landscape')}>↔ Landscape</button>
                </div>
                <label className="preset-search"><span>Find a frame size</span><input type="search" value={frameSearch} placeholder="Try 14 × 20" onChange={(event) => setFrameSearch(event.target.value)} /></label>
                <select className="preset-select" value="" onChange={(event) => selectPreset(event.target.value)}><option value="" disabled>{displayedPresets.length ? `Choose from ${displayedPresets.length} matching sizes…` : 'No matching sizes'}</option>{displayedPresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select>
                <div className="control-grid"><DimensionControl label="Width" value={project.frame.width} max={60} onChange={(value) => patchFrame('width', value)} /><DimensionControl label="Height" value={project.frame.height} max={60} onChange={(value) => patchFrame('height', value)} /></div>
                <button className="save-preset" disabled={customPresetExists} onClick={() => void saveCustomPreset()}>{customPresetExists ? '✓ This custom size is already saved' : '+ Save this custom frame size'}</button>
              </section>
              <section className="control-section">
                <div className="section-title"><span>FRAME FACE</span><small>visible moulding</small></div>
                <DimensionControl label="Border width" value={project.frameFace} max={5} onChange={(value) => patchProject({ frameFace: value })} />
                <div className="color-row"><label>Frame color <input type="color" value={project.frameColor} onChange={(event) => patchProject({ frameColor: event.target.value })} /></label><output>{geometry.outer.width.toFixed(2)} × {geometry.outer.height.toFixed(2)} overall</output></div>
              </section>
              <section className="control-section">
                <div className="section-title"><span>MAT</span><small>overlays the print</small></div>
                <div className="mat-opening-block">
                  <div className="subsection-title"><span>WITH MAT OPENING</span><small>Amazon-style size</small></div>
                  <p>Enter the advertised opening, such as 12 × 18 inside a 14 × 20 frame.</p>
                  <div className="control-grid"><DimensionControl label="Opening width" value={geometry.matWindow.width} max={project.frame.width} onChange={(value) => setMatOpening('width', value)} /><DimensionControl label="Opening height" value={geometry.matWindow.height} max={project.frame.height} onChange={(value) => setMatOpening('height', value)} /></div>
                </div>
                <div className="subsection-title mat-width-title"><span>MAT BORDER WIDTHS</span><small>fine adjustment</small></div>
                <div className="control-grid"><DimensionControl label="Left + right" value={project.matHorizontal} max={10} onChange={(value) => patchProject({ matHorizontal: value })} /><DimensionControl label="Top + bottom" value={project.matVertical} max={10} onChange={(value) => patchProject({ matVertical: value })} /></div>
                <div className="color-row"><label>Mat color <input type="color" value={project.matColor} onChange={(event) => patchProject({ matColor: event.target.value })} /></label><output>{geometry.matWindow.width.toFixed(2)} × {geometry.matWindow.height.toFixed(2)} opening</output></div>
              </section>
            </div>
          ) : (
            <div className="panel-content artwork-panel">
              <section className="upload-zone">
                <span className="upload-number">A/</span><h2>{project.artwork.dataUrl ? project.artwork.fileName : 'Use your own print'}</h2><p>Photos stay in this browser and are never uploaded.</p>
                <label className="upload-button">Choose image<input type="file" accept="image/*" onChange={(event) => handleFile(event.target.files?.[0])} /></label>
                {project.artwork.dataUrl && <button className="remove-image" onClick={() => patchArtwork('dataUrl', null)}>Use dummy artwork</button>}
              </section>
              <div className="crop-workbench">
                <div className="crop-preview" style={{ aspectRatio: `${project.print.width} / ${project.print.height}` }}>
                  {project.artwork.dataUrl ? <img src={project.artwork.dataUrl} alt="Crop preview" style={{ transform: `translate(${project.artwork.offsetX}%, ${project.artwork.offsetY}%) scale(${project.artwork.zoom}) rotate(${project.artwork.rotation}deg)` }} /> : <div className="crop-empty">Upload a photo to crop it precisely.</div>}
                  <span className="crop-corner tl" /><span className="crop-corner tr" /><span className="crop-corner bl" /><span className="crop-corner br" />
                </div>
                <p className="crop-note">At 1× the entire photo fits inside the crop boundary. Zoom in only when you want to remove edges; the image always keeps its proportions.</p>
              </div>
              <section className="control-section">
                <DimensionControl label="Magnification" value={project.artwork.zoom} min={1} max={5} step={0.01} unit="x" mobileInchPicker={false} onChange={(value) => patchArtwork('zoom', value)} />
                <DimensionControl label="Move horizontally" value={project.artwork.offsetX} min={-50} max={50} step={1} unit="%" mobileInchPicker={false} onChange={(value) => patchArtwork('offsetX', value)} />
                <DimensionControl label="Move vertically" value={project.artwork.offsetY} min={-50} max={50} step={1} unit="%" mobileInchPicker={false} onChange={(value) => patchArtwork('offsetY', value)} />
                <DimensionControl label="Straighten / rotate" value={project.artwork.rotation} min={-180} max={180} step={0.25} unit="°" mobileInchPicker={false} onChange={(value) => patchArtwork('rotation', value)} />
                <button className="reset-crop" onClick={() => setProject((current) => ({ ...current, artwork: { ...current.artwork, zoom: 1, offsetX: 0, offsetY: 0, rotation: 0 } }))}>Reset crop</button>
              </section>
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}

export default App
