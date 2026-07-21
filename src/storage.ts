import type { FramePreset, Project } from './types'

const DB_NAME = 'steves-frame-visualizer'
const DB_VERSION = 1

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('presets')) db.createObjectStore('presets', { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function storeRequest<T>(storeName: 'projects' | 'presets', mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDatabase()
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(storeName, mode)
    const request = action(transaction.objectStore(storeName))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
  })
}

export const storage = {
  saveProject: (project: Project) => storeRequest('projects', 'readwrite', (store) => store.put(project)),
  getProjects: () => storeRequest<Project[]>('projects', 'readonly', (store) => store.getAll()),
  deleteProject: (id: string) => storeRequest('projects', 'readwrite', (store) => store.delete(id)),
  savePreset: (preset: FramePreset) => storeRequest('presets', 'readwrite', (store) => store.put(preset)),
  getPresets: () => storeRequest<FramePreset[]>('presets', 'readonly', (store) => store.getAll()),
}
