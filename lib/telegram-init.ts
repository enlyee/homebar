import { initializeTelegramPolling } from './telegram'

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'

if (typeof window === 'undefined' && !isBuildTime) {
  setTimeout(async () => {
    try {
      await initializeTelegramPolling()
    } catch (error) {
      console.error('Failed to initialize Telegram polling:', error)
    }
  }, 3000)
}
