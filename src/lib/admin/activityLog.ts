import fs from 'fs'
import path from 'path'

export type AdminActivityEntry = {
  action: string
  productId?: string
  entity?: string
  actor?: {
    email?: string | null
    name?: string | null
  }
  metadata?: Record<string, unknown>
  timestamp?: string
}

const LOG_PATH = path.join(process.cwd(), 'data', 'admin-activity-log.json')
const MAX_ENTRIES = 200

const readExistingLog = (): AdminActivityEntry[] => {
  try {
    const contents = fs.readFileSync(LOG_PATH, 'utf8')
    const parsed = JSON.parse(contents)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeLog = (entries: AdminActivityEntry[]) => {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true })
  fs.writeFileSync(LOG_PATH, JSON.stringify(entries.slice(-MAX_ENTRIES), null, 2), 'utf8')
}

export const recordAdminActivity = async (entry: AdminActivityEntry) => {
  const payload: AdminActivityEntry = {
    ...entry,
    timestamp: entry.timestamp ?? new Date().toISOString()
  }

  try {
    const entries = readExistingLog()
    entries.push(payload)
    writeLog(entries)
  } catch (error) {
    console.warn('[activity-log] No se pudo registrar la actividad del panel.', error)
  }
}
