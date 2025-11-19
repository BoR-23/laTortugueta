'use client'

import Image, { type ImageProps } from 'next/image'
import { useEffect, useMemo, useState } from 'react'

import { getProductImageVariant, type ProductImageVariant } from '@/lib/images'

const swapImageExtension = (path?: string | null) => {
  if (!path) {
    return null
  }
  const lower = path.toLowerCase()
  if (lower.endsWith('.jpeg')) {
    return path.slice(0, -5) + '.jpg'
  }
  if (lower.endsWith('.jpg')) {
    return path.slice(0, -4) + '.jpeg'
  }
  return null
}

type ProductImageProps = Omit<ImageProps, 'src'> & {
  imagePath?: string | null
  variant?: ProductImageVariant
}

export function ProductImage({
  imagePath,
  variant = 'original',
  onError,
  alt,
  ...props
}: ProductImageProps) {
  const [useAlternateExtension, setUseAlternateExtension] = useState(false)

  useEffect(() => {
    setUseAlternateExtension(false)
  }, [imagePath, variant])

  const resolvedPath = useMemo(() => {
    if (!imagePath) {
      return ''
    }
    if (!useAlternateExtension) {
      return imagePath
    }
    const alternate = swapImageExtension(imagePath)
    return alternate ?? imagePath
  }, [imagePath, useAlternateExtension])

  if (!imagePath) {
    return null
  }

  const src = getProductImageVariant(resolvedPath, variant)

  return (
    <Image
      {...props}
      alt={alt ?? ''}
      src={src || resolvedPath}
      onError={event => {
        onError?.(event)
        if (!useAlternateExtension) {
          const alternate = swapImageExtension(imagePath)
          if (alternate) {
            setUseAlternateExtension(true)
            return
          }
        }
      }}
    />
  )
}
