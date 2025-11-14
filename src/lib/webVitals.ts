export type WebVitalReport = {
  name: string
  value: number
  id: string
  label: 'web-vital' | 'custom'
}

export const logWebVital = (metric: WebVitalReport) => {
  if (typeof window === 'undefined') return
  if (process.env.NODE_ENV === 'development') {
    console.debug('[web-vital]', metric.name, metric.value, metric.id)
  }

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  if (!gaId || !(window as any).gtag) {
    return
  }

  ;(window as any).gtag('event', metric.name, {
    value: metric.value,
    event_category: metric.label,
    event_label: metric.id,
    non_interaction: true
  })
}
