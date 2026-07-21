import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  onChange: (value: number) => void
}

const DimensionControl = memo(function DimensionControl({ label, value, min = 0, max, step = 0.125, onChange }: DimensionControlProps) {
  const sliderMax = Math.max(max, Math.ceil(value * 1.25))
  return (
    <label className="dimension-control">
      <span className="control-label">{label}</span>
      <span className="number-wrap">
        <input type="number" min={min} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
        <span>in</span>
      </span>
      <input className="range" type="range" min={min} max={sliderMax} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
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

  return (
    <div className="preview-stage">
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
  const loaded = useRef(false)
  const geometry = useMemo(() => calculateGeometry(project), [project])

  useEffect(() => {
    Promise.all([storage.getProjects(), storage.getPresets()]).then(([savedProjects, savedPresets]) => {
      const sorted = [...savedProjects].sort((a, b) => b.updatedAt - a.updatedAt)
      if (sorted[0]) setProject(sorted[0])
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
    const preset = [...customPresets, ...FRAME_PRESETS].find((item) => item.id === id)
    if (preset) patchProject({ frame: { width: preset.width, height: preset.height } })
  }

  const saveCustomPreset = async () => {
    const preset: FramePreset = {
      id: `custom-${project.frame.width}-${project.frame.height}`,
      name: `${project.frame.width} × ${project.frame.height} in — saved`,
      width: project.frame.width,
      height: project.frame.height,
      custom: true,
    }
    await storage.savePreset(preset)
    setCustomPresets((current) => [preset, ...current.filter((item) => item.id !== preset.id)])
  }

  const newProject = () => setProject(createProject({ name: `Frame study ${projects.length + 1}` }))
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
            if (selected) setProject(selected)
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
                <select className="preset-select" defaultValue="" onChange={(event) => selectPreset(event.target.value)}><option value="" disabled>Choose a common or saved size…</option>{customPresets.length > 0 && <optgroup label="Your saved sizes">{customPresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</optgroup>}<optgroup label="Common sizes — small to large">{FRAME_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</optgroup></select>
                <div className="control-grid"><DimensionControl label="Width" value={project.frame.width} max={60} onChange={(value) => patchFrame('width', value)} /><DimensionControl label="Height" value={project.frame.height} max={60} onChange={(value) => patchFrame('height', value)} /></div>
                <button className="save-preset" onClick={() => void saveCustomPreset()}>+ Save this custom frame size</button>
              </section>
              <section className="control-section">
                <div className="section-title"><span>FRAME FACE</span><small>visible moulding</small></div>
                <DimensionControl label="Border width" value={project.frameFace} max={5} onChange={(value) => patchProject({ frameFace: value })} />
                <div className="color-row"><label>Frame color <input type="color" value={project.frameColor} onChange={(event) => patchProject({ frameColor: event.target.value })} /></label><output>{geometry.outer.width.toFixed(2)} × {geometry.outer.height.toFixed(2)} overall</output></div>
              </section>
              <section className="control-section">
                <div className="section-title"><span>MAT</span><small>overlays the print</small></div>
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
                <p className="crop-note">Zoom in and align the print edges with the crop boundary. The image always keeps its proportions.</p>
              </div>
              <section className="control-section">
                <DimensionControl label="Magnification" value={project.artwork.zoom} min={1} max={5} step={0.01} onChange={(value) => patchArtwork('zoom', value)} />
                <DimensionControl label="Move horizontally" value={project.artwork.offsetX} min={-50} max={50} step={1} onChange={(value) => patchArtwork('offsetX', value)} />
                <DimensionControl label="Move vertically" value={project.artwork.offsetY} min={-50} max={50} step={1} onChange={(value) => patchArtwork('offsetY', value)} />
                <DimensionControl label="Straighten / rotate" value={project.artwork.rotation} min={-180} max={180} step={0.25} onChange={(value) => patchArtwork('rotation', value)} />
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
