import type { ReportHandler } from 'web-vitals'
import { logWebVital } from '@/lib/webVitals'

const reportWebVitals: ReportHandler = metric => {
  logWebVital({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    label: metric.label
  })
}

export default reportWebVitals
