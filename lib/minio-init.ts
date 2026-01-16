import { ensureBucketExists } from './minio'

let initialized = false

export async function initializeMinIO() {
  if (initialized) {
    return
  }

  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return
  }

  try {
    console.log('Initializing MinIO...')
    await ensureBucketExists()
    initialized = true
    console.log('MinIO initialized successfully')
  } catch (error: any) {
    console.error('Failed to initialize MinIO:', error.message)
  }
}
