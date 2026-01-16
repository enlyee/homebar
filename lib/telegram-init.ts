// Инициализация Telegram bot polling
// Этот файл должен быть импортирован при старте сервера

import { initializeTelegramPolling } from './telegram'

// Инициализируем polling только на сервере
if (typeof window === 'undefined') {
  // Небольшая задержка для инициализации после загрузки всех модулей
  setTimeout(() => {
    try {
      initializeTelegramPolling()
    } catch (error) {
      console.error('Failed to initialize Telegram polling:', error)
    }
  }, 3000)
}
