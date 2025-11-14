import type { Metric } from 'web-vitals'
import { logWebVital } from '@/lib/webVitals'

const reportWebVitals = (metric: Metric) => {
  logWebVital({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    label: metric.label
  })
}

export default reportWebVitals
