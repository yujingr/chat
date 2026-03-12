import { DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { MultiPartData } from 'h3'

type StorageConfig = {
  endpoint: string
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
}

function getStorageConfig(): StorageConfig {
  const config = useRuntimeConfig()
  const storageConfig = config.s3

  if (!storageConfig?.endpoint || !storageConfig.bucket || !storageConfig.accessKeyId || !storageConfig.secretAccessKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'S3 storage is not configured'
    })
  }

  return {
    endpoint: storageConfig.endpoint,
    region: storageConfig.region || 'auto',
    bucket: storageConfig.bucket,
    accessKeyId: storageConfig.accessKeyId,
    secretAccessKey: storageConfig.secretAccessKey
  }
}

let cachedClient: S3Client | null = null
let cachedClientKey = ''

function getS3Client(config: StorageConfig): S3Client {
  const clientKey = `${config.endpoint}|${config.region}|${config.accessKeyId}`

  if (cachedClient && cachedClientKey === clientKey) {
    return cachedClient
  }

  cachedClient = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  })
  cachedClientKey = clientKey

  return cachedClient
}

function encodePath(pathname: string): string {
  return pathname
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/')
}

function sanitizeFilename(filename: string): string {
  return filename
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
}

export function getChatStoragePrefix(ownerId: string, chatId: string): string {
  return `${ownerId}/${chatId}`
}

export function buildPublicObjectUrl(pathname: string): string {
  const { endpoint, bucket } = getStorageConfig()
  const endpointWithoutSlash = endpoint.replace(/\/+$/, '')

  return `${endpointWithoutSlash}/${bucket}/${encodePath(pathname)}`
}

export async function uploadChatFile(ownerId: string, chatId: string, file: MultiPartData): Promise<{
  pathname: string
  url: string
  contentType: string
  size: number
}> {
  const config = getStorageConfig()
  const client = getS3Client(config)
  const chatPrefix = getChatStoragePrefix(ownerId, chatId)
  const filename = sanitizeFilename(file.filename || `upload-${Date.now()}`)
  const pathname = `${chatPrefix}/${crypto.randomUUID()}-${filename}`
  const contentType = file.type || 'application/octet-stream'
  const size = file.data.length

  await client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: pathname,
    Body: file.data,
    ContentType: contentType
  }))

  return {
    pathname,
    url: buildPublicObjectUrl(pathname),
    contentType,
    size
  }
}

export async function deleteStoredObject(pathname: string): Promise<void> {
  const config = getStorageConfig()
  const client = getS3Client(config)

  await client.send(new DeleteObjectCommand({
    Bucket: config.bucket,
    Key: pathname
  }))
}

export async function deleteObjectsByPrefix(prefix: string): Promise<void> {
  const config = getStorageConfig()
  const client = getS3Client(config)
  let continuationToken: string | undefined

  do {
    const listResult = await client.send(new ListObjectsV2Command({
      Bucket: config.bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken
    }))

    const objects = listResult.Contents
      ?.map(item => item.Key)
      .filter((key): key is string => Boolean(key)) || []

    if (objects.length > 0) {
      await client.send(new DeleteObjectsCommand({
        Bucket: config.bucket,
        Delete: {
          Objects: objects.map(Key => ({ Key })),
          Quiet: true
        }
      }))
    }

    continuationToken = listResult.IsTruncated ? listResult.NextContinuationToken : undefined
  } while (continuationToken)
}
