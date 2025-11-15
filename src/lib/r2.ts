import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

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
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    })
  : null

export const R2_BUCKET = bucket

export const uploadToR2 = async (key: string, body: Buffer | Uint8Array, contentType: string) => {
  if (!r2Client || !R2_BUCKET) {
    throw new Error('R2 no está configurado correctamente. Define las variables de entorno necesarias.')
  }

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType
    })
  )
}
