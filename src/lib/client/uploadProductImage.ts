export type UploadedProductImage = {
  path: string
  placeholder: string
}

export const uploadProductImage = async (
  productId: string,
  file: File,
  targetFilename?: string
): Promise<UploadedProductImage> => {
  const formData = new FormData()
  formData.append('productId', productId)
  formData.append('file', file)
  if (targetFilename) {
    formData.append('targetFilename', targetFilename)
  }

  const response = await fetch('/api/uploads/product-image', {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.error ?? 'No se pudo subir la imagen.')
  }

  return response.json()
}
