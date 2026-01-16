import { NextResponse } from 'next/server'
import { writeFile, mkdir, access } from 'fs/promises'
import { join } from 'path'
import { existsSync, constants } from 'fs'
import sharp from 'sharp'

async function checkWritable(dir: string): Promise<boolean> {
  try {
    await access(dir, constants.W_OK)
    return true
  } catch {
    return false
  }
}

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

    const cwd = process.cwd()
    const possibleUploadDirs = [
      '/app/public/uploads',
      join(cwd, 'public', 'uploads'),
    ]

    let uploadsDir = possibleUploadDirs[0]
    for (const dir of possibleUploadDirs) {
      if (existsSync(dir)) {
        uploadsDir = dir
        break
      }
    }

    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    console.log('Using uploads directory:', uploadsDir)
    console.log('Current working directory:', cwd)
    console.log('Directory exists:', existsSync(uploadsDir))

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
    const filepath = join(uploadsDir, filename)

    const processedImage = await sharp(imageBuffer)
      .resize(CARD_WIDTH, CARD_HEIGHT, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toBuffer()

    console.log('Attempting to save file to:', filepath)
    console.log('Uploads directory exists:', existsSync(uploadsDir))
    console.log('Uploads directory is writable:', await checkWritable(uploadsDir))
    
    await writeFile(filepath, processedImage)

    if (!existsSync(filepath)) {
      console.error('File was not created:', filepath)
      console.error('Uploads directory:', uploadsDir)
      console.error('Directory exists:', existsSync(uploadsDir))
      return NextResponse.json(
        { error: 'Failed to save file' },
        { status: 500 }
      )
    }

    const { stat } = await import('fs/promises')
    const stats = await stat(filepath)
    console.log('File saved successfully:', filepath)
    console.log('File exists:', existsSync(filepath))
    console.log('File size:', stats.size, 'bytes')

    const imageUrl = `/api/uploads/${filename}`

    return NextResponse.json({
      success: true,
      url: imageUrl,
      filename,
    })
  } catch (error: any) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image', details: error.message },
      { status: 500 }
    )
  }
}
