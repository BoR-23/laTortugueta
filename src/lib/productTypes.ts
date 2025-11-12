export type ProductTypeFieldInput = 'text' | 'textarea' | 'number' | 'select'

export type ProductTypeField = {
  id: string
  label: string
  type: ProductTypeFieldInput
  placeholder?: string
  description?: string
  options?: Array<{ value: string; label: string }>
  defaultValue?: string | number | boolean
}

export type ProductTypeConfig = {
  id: string
  label: string
  description?: string
  formFields: ProductTypeField[]
}

export const DEFAULT_PRODUCT_TYPE = 'calcetin'

const productTypes: ProductTypeConfig[] = [
  {
    id: 'calcetin',
    label: 'Calcetín tradicional',
    description: 'Campos estándar. Sin metadatos adicionales.',
    formFields: []
  },
  {
    id: 'gorro',
    label: 'Gorro artesanal',
    description: 'Incluye medidas clave para pedidos personalizados.',
    formFields: [
      {
        id: 'circumference',
        label: 'Circunferencia (cm)',
        type: 'number',
        placeholder: '54',
        description: 'Medida interior en centímetros.',
        defaultValue: ''
      },
      {
        id: 'height',
        label: 'Altura (cm)',
        type: 'number',
        placeholder: '18',
        defaultValue: ''
      },
      {
        id: 'lining',
        label: 'Forro / interior',
        type: 'text',
        placeholder: 'Algodón orgánico',
        defaultValue: ''
      }
    ]
  },
  {
    id: 'bufanda',
    label: 'Bufanda / fular',
    description: 'Permite capturar medidas y acabado.',
    formFields: [
      {
        id: 'length',
        label: 'Largo (cm)',
        type: 'number',
        placeholder: '160',
        defaultValue: ''
      },
      {
        id: 'width',
        label: 'Ancho (cm)',
        type: 'number',
        placeholder: '25',
        defaultValue: ''
      },
      {
        id: 'finish',
        label: 'Acabado',
        type: 'select',
        options: [
          { value: 'flecos', label: 'Flecos' },
          { value: 'dobladillo', label: 'Dobladillo clásico' },
          { value: 'sin-remate', label: 'Sin remate' }
        ],
        defaultValue: 'flecos'
      }
    ]
  }
]

export const listProductTypes = () => [...productTypes]

export const getProductTypeConfig = (type?: string): ProductTypeConfig => {
  const fallback = productTypes.find(config => config.id === (type || DEFAULT_PRODUCT_TYPE))
  return fallback ?? productTypes[0]
}

export const mergeTypeMetadata = (
  type: string,
  metadata: Record<string, unknown> | undefined
) => {
  const config = getProductTypeConfig(type)
  const base: Record<string, unknown> = {}
  config.formFields.forEach(field => {
    const initial =
      metadata && Object.prototype.hasOwnProperty.call(metadata, field.id)
        ? metadata[field.id]
        : field.defaultValue ?? ''
    base[field.id] = initial ?? ''
  })
  Object.keys(metadata ?? {}).forEach(key => {
    if (!Object.prototype.hasOwnProperty.call(base, key) && metadata) {
      base[key] = metadata[key]
    }
  })
  return base
}

export const sanitizeTypeMetadata = (type: string, metadata: Record<string, unknown> = {}) => {
  const config = getProductTypeConfig(type)
  const cleaned: Record<string, unknown> = {}
  config.formFields.forEach(field => {
    const value = metadata[field.id]
    if (field.type === 'number') {
      const numeric =
        typeof value === 'number'
          ? value
          : Number(typeof value === 'string' ? value.replace(',', '.').trim() : value)
      cleaned[field.id] = Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : ''
    } else if (field.type === 'select') {
      const optionValues = field.options?.map(option => option.value) ?? []
      const stringValue = String(value ?? field.defaultValue ?? '')
      cleaned[field.id] = optionValues.includes(stringValue) ? stringValue : optionValues[0] ?? ''
    } else {
      cleaned[field.id] = typeof value === 'string' ? value : ''
    }
  })

  Object.keys(metadata).forEach(key => {
    if (!Object.prototype.hasOwnProperty.call(cleaned, key)) {
      cleaned[key] = metadata[key]
    }
  })

  return cleaned
}

export const getTypeFieldById = (type: string, fieldId: string): ProductTypeField | null => {
  const config = getProductTypeConfig(type)
  return config.formFields.find(field => field.id === fieldId) ?? null
}

export const formatMetadataValue = (
  type: string,
  fieldId: string,
  value: unknown
): string => {
  const field = getTypeFieldById(type, fieldId)
  if (!field) {
    return String(value ?? '')
  }
  if (field.type === 'number') {
    const numeric =
      typeof value === 'number'
        ? value
        : Number(typeof value === 'string' ? value.replace(',', '.').trim() : value)
    return Number.isFinite(numeric) ? numeric.toString() : ''
  }
  return String(value ?? '')
}
