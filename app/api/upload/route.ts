import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { uploadFile } from '@/lib/minio'

const CARD_WIDTH = 800
const CARD_HEIGHT = 600

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const url = formData.get('url') as string | null

    if (!file && !url) {
      return NextResponse.json(
        { error: 'File or URL required' },
        { status: 400 }
      )
    }

    let imageBuffer: Buffer

    if (file) {
      const bytes = await file.arrayBuffer()
      imageBuffer = Buffer.from(bytes)
    } else if (url) {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        imageBuffer = Buffer.from(arrayBuffer)
      } catch (error: any) {
        return NextResponse.json(
          { error: `Failed to fetch image from URL: ${error.message}` },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'File or URL required' },
        { status: 400 }
      )
    }

    try {
      await sharp(imageBuffer).metadata()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid image file' },
        { status: 400 }
      )
    }

    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const filename = `cocktail-${timestamp}-${randomString}.webp`
    const key = `cocktails/${filename}`

    const processedImage = await sharp(imageBuffer)
      .resize(CARD_WIDTH, CARD_HEIGHT, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toBuffer()

    console.log('Uploading to MinIO:', key)
    await uploadFile(key, processedImage, 'image/webp')
    console.log('✅ File uploaded successfully to MinIO:', key)

    const imageUrl = `/api/uploads/${key}`

    return NextResponse.json({
      success: true,
      url: imageUrl,
      filename: key,
    })
  } catch (error: any) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image', details: error.message },
      { status: 500 }
    )
  }
}
