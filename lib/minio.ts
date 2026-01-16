import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  endpoint: `http://${process.env.MINIO_ENDPOINT || 'minio'}:${process.env.MINIO_PORT || 9000}`,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
  },
  forcePathStyle: true,
})

const BUCKET_NAME = process.env.MINIO_BUCKET || 'uploads'

export async function ensureBucketExists() {
  try {
    const { CreateBucketCommand, HeadBucketCommand } = await import('@aws-sdk/client-s3')
    
    try {
      await s3Client.send(
        new HeadBucketCommand({
          Bucket: BUCKET_NAME,
        })
      )
      console.log('MinIO bucket already exists:', BUCKET_NAME)
    } catch (headError: any) {
      if (headError.name === 'NotFound' || headError.$metadata?.httpStatusCode === 404) {
        console.log('Creating MinIO bucket:', BUCKET_NAME)
        await s3Client.send(
          new CreateBucketCommand({
            Bucket: BUCKET_NAME,
          })
        )
        console.log('MinIO bucket created successfully:', BUCKET_NAME)
      } else {
        throw headError
      }
    }
  } catch (error: any) {
    if (error.name !== 'BucketAlreadyOwnedByYou' && error.name !== 'BucketAlreadyExists') {
      console.error('Error ensuring bucket exists:', error)
      throw error
    }
  }
}

export async function uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
  await ensureBucketExists()

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  })

  await s3Client.send(command)
  return key
}

export async function getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  return await getSignedUrl(s3Client, command, { expiresIn })
}

export async function getFileStream(key: string): Promise<ReadableStream | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const response = await s3Client.send(command)
    
    if (!response.Body) {
      return null
    }

    if (response.Body instanceof ReadableStream) {
      return response.Body
    }

    if ('transformToWebStream' in response.Body && typeof response.Body.transformToWebStream === 'function') {
      return response.Body.transformToWebStream()
    }

    const chunks: Uint8Array[] = []
    const stream = response.Body as any
    
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            controller.enqueue(chunk)
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })
  } catch (error) {
    console.error('Error getting file stream:', error)
    return null
  }
}
