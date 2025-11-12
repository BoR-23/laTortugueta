type AnalyticsPayload = Record<string, unknown>

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
  }
}

const STORAGE_KEY = 'tortugueta:events'
const VIEW_GRAPH_KEY = 'tortugueta:coViews'
const LAST_VIEW_KEY = 'tortugueta:lastView'

const safeWindow = () => (typeof window === 'undefined' ? null : window)

const persistEvent = (event: { name: string; properties?: AnalyticsPayload }) => {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    existing.push({ ...event, timestamp: Date.now() })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(-200)))
  } catch {
    // ignore storage errors
  }
}

export const trackEvent = (name: string, properties?: AnalyticsPayload) => {
  const win = safeWindow()
  if (!win) return

  win.dataLayer = win.dataLayer || []
  win.dataLayer.push({ event: name, ...properties })
  persistEvent({ name, properties })
}

export const registerProductView = (productId: string) => {
  const win = safeWindow()
  if (!win) return

  trackEvent('product_view', { productId })

  try {
    const graph = JSON.parse(localStorage.getItem(VIEW_GRAPH_KEY) ?? '{}') as Record<
      string,
      Record<string, number>
    >
    const lastView = localStorage.getItem(LAST_VIEW_KEY)

    if (lastView && lastView !== productId) {
      graph[lastView] = graph[lastView] || {}
      graph[lastView][productId] = (graph[lastView][productId] || 0) + 1
    }

    localStorage.setItem(VIEW_GRAPH_KEY, JSON.stringify(graph))
    localStorage.setItem(LAST_VIEW_KEY, productId)
  } catch {
    // ignore
  }
}

export const registerFilterUsage = (filterId: string, action: 'select' | 'clear') => {
  trackEvent('filter_interaction', { filterId, action })
}

export const getLocalCoViewGraph = (): Record<string, Record<string, number>> => {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(VIEW_GRAPH_KEY) ?? '{}')
  } catch {
    return {}
  }
}
