'use client'

import { useState } from 'react'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

interface R2ImageUploaderProps {
  productId: string
  onUploadComplete: (url: string) => void
}

const getR2Client = () =>
  new S3Client({
    region: 'auto',
    endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY!
    }
  })

export const uploadFileToR2 = async (file: File, productId: string) => {
  // Generar nombre de archivo seguro
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const key = `images/products/${productId}/${timestamp}_${safeName}`

  // Subir archivo
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_R2_BUCKET_NAME!,
      Key: key,
      Body: file,
      ContentType: file.type
    })
  )

  // Construir URL pública
  return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`
}

export function R2ImageUploader({ productId, onUploadComplete }: R2ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }

    setUploading(true)
    setError(null)

    uploadFileToR2(file, productId)
      .then(url => {
        onUploadComplete(url)
      })
      .catch(err => {
        console.error('Error uploading to R2:', err)
        setError('Error al subir la imagen. Verifica las credenciales de R2.')
      })
      .finally(() => {
        setUploading(false)
      })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Subir imagen a R2</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50"
        />
      </div>

      {uploading && <p className="text-sm text-blue-600">Subiendo imagen a R2...</p>}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
