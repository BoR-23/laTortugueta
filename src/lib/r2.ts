export { CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { S3Client, PutObjectCommand, CopyObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'

const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY
const endpoint = process.env.R2_ENDPOINT ?? process.env.NEXT_PUBLIC_R2_ENDPOINT
const bucket = process.env.R2_BUCKET_NAME ?? process.env.NEXT_PUBLIC_R2_BUCKET_NAME

if (!accessKeyId || !secretAccessKey || !endpoint || !bucket) {
  console.warn('[r2] Falta configuración de R2: define R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT y R2_BUCKET_NAME')
}

export const r2Client = accessKeyId && secretAccessKey && endpoint
  ? new S3Client({
    region: 'auto',
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  })
  : null

export const R2_BUCKET = bucket

export const uploadToR2 = async (buffer: Buffer | Uint8Array, key: string, contentType: string): Promise<string> => {
  if (!r2Client || !R2_BUCKET) {
    throw new Error('R2 no está configurado correctamente. Define las variables de entorno necesarias.')
  }

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType
    })
  )

  // Return public URL
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''
  return `${publicUrl}/${key}`
}

export const listR2Objects = async (prefix: string) => {
  if (!r2Client || !R2_BUCKET) {
    throw new Error('R2 no está configurado correctamente.')
  }

  const command = new ListObjectsV2Command({
    Bucket: R2_BUCKET,
    Prefix: prefix
  })

  const response = await r2Client.send(command)

  return (response.Contents || []).map(obj => ({
    key: obj.Key || '',
    size: obj.Size || 0,
    uploaded: obj.LastModified?.toISOString() || ''
  }))
}

export const deleteFromR2 = async (key: string) => {
  if (!r2Client || !R2_BUCKET) {
    throw new Error('R2 no está configurado correctamente.')
  }

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key
    })
  )
}
