import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  return NextResponse.json({
    message: 'Webhook endpoint is not used. Bot is using polling mode.',
  })
}
