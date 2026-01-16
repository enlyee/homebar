import TelegramBot from 'node-telegram-bot-api'
import type { Cocktail, Ingredient } from '@/types'

const token = process.env.TELEGRAM_BOT_TOKEN
const chatId = process.env.TELEGRAM_CHAT_ID

let bot: TelegramBot | null = null
let isPolling = false

if (token && chatId) {
  try {
    bot = new TelegramBot(token, { polling: false })
    
    if (typeof window === 'undefined') {
      setTimeout(() => {
        initializeTelegramPolling()
      }, 3000)
    }
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error)
  }
}

export function initializeTelegramPolling() {
  if (!token || !chatId || isPolling || !bot) {
    return
  }

  try {
    bot.startPolling({
      polling: {
        interval: 1000,
        autoStart: true,
      },
    })

    bot.on('callback_query', async (callbackQuery) => {
      const { data, message } = callbackQuery
      
      if (!data || !message) {
        return
      }

      try {
        await bot!.answerCallbackQuery(callbackQuery.id)

        const [action, orderId] = data.split('_')

        if (!orderId) {
          await bot!.sendMessage(
            message.chat.id,
            '❌ Invalid callback data'
          )
          return
        }

        const { getDataSource } = await import('@/src/data-source')
        const { Order } = await import('@/src/entities/Order')
        
        const dataSource = await getDataSource()
        const orderRepository = dataSource.getRepository(Order)

        const order = await orderRepository.findOne({
          where: { id: orderId },
          relations: ['cocktail'],
        })

        if (!order) {
          await bot!.sendMessage(
            message.chat.id,
            `❌ Order with ID ${orderId} not found`
          )
          return
        }

        let newStatus: string | null = null

        if (action === 'take' && order.status === 'В очереди') {
          newStatus = 'В процессе'
        } else if (action === 'ready' && order.status === 'В процессе') {
          newStatus = 'Готов'
        } else if (action === 'cancel' && (order.status === 'В очереди' || order.status === 'В процессе')) {
          newStatus = 'Отменен'
        } else {
          await bot!.sendMessage(
            message.chat.id,
            `⚠️ Cannot perform action. Current status: ${order.status}`
          )
          return
        }

        if (newStatus) {
          order.status = newStatus as any
          await orderRepository.save(order)

          if ((newStatus === 'Готов' || newStatus === 'Отменен') && order.telegramMessageId) {
            await deleteOrderMessage(order.telegramMessageId)
            
            await sendOrderCompletionNotification(
              order.userId,
              order.cocktail.name,
              newStatus as 'Готов' | 'Отменен'
            )

            order.telegramMessageId = null
            await orderRepository.save(order)
          } else if (order.telegramMessageId) {
            await updateOrderMessage(
              order.id,
              order.telegramMessageId,
              order.userId,
              {
                ...order.cocktail,
                ingredients: order.cocktail.ingredients as any,
                strength: order.cocktail.strength as 1 | 2 | 3,
              },
              newStatus
            )
          }
        }
      } catch (error) {
        console.error('Error processing callback query:', error)
        await bot!.sendMessage(
          message.chat.id,
          '❌ Error processing request'
        )
      }
    })

    isPolling = true
    console.log('✅ Telegram bot polling started')
  } catch (error) {
    console.error('Failed to start Telegram bot polling:', error)
  }
}

export function getBot(): TelegramBot | null {
  return bot
}

export function getChatId(): string | undefined {
  return chatId
}

export async function sendOrderToTelegram(
  orderId: string,
  userName: string,
  cocktail: Cocktail
) {
  const ingredientsText = cocktail.ingredients
    .map((ing: Ingredient) => `• ${ing.name} - ${ing.amount}`)
    .join('\n')

  const strengthEmoji = {
    1: '🟢',
    2: '🟡',
    3: '🔴',
  }[cocktail.strength]

  const message = `
🍹 *Новый заказ*

👤 *Клиент:* ${userName}
🍸 *Напиток:* ${cocktail.name}
${strengthEmoji} *Крепость:* ${cocktail.strength}/3

📋 *Состав:*
${ingredientsText}

📝 *Рецепт:*
${cocktail.recipe}

⏰ *Время заказа:* ${new Date().toLocaleString('ru-RU')}
🆔 *ID:* \`${orderId}\`
  `.trim()

  if (!bot || !chatId) {
    console.warn('Telegram bot is not configured')
    return { success: false, error: 'Telegram bot not configured', messageId: null }
  }

  try {
    const keyboard = {
      inline_keyboard: [
        [
          { text: '❌ Отменить', callback_data: `cancel_${orderId}` },
          { text: '✅ Взять в работу', callback_data: `take_${orderId}` },
        ],
      ],
    }

    const sentMessage = await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    })

    return { success: true, messageId: sentMessage.message_id }
  } catch (error) {
    console.error('Error sending message to Telegram:', error)
    return { success: false, error, messageId: null }
  }
}

export async function updateOrderMessage(
  orderId: string,
  messageId: number,
  userName: string,
  cocktail: Cocktail,
  status: string
) {
  const ingredientsText = cocktail.ingredients
    .map((ing: Ingredient) => `• ${ing.name} - ${ing.amount}`)
    .join('\n')

  const strengthEmoji = {
    1: '🟢',
    2: '🟡',
    3: '🔴',
  }[cocktail.strength]

  const statusEmoji = {
    'В очереди': '⏳',
    'В процессе': '🔄',
    'Готов': '✅',
    'Отменен': '❌',
  }[status] || '📦'

  const message = `
🍹 *Заказ*

👤 *Клиент:* ${userName}
🍸 *Напиток:* ${cocktail.name}
${strengthEmoji} *Крепость:* ${cocktail.strength}/3
${statusEmoji} *Статус:* ${status}

📋 *Состав:*
${ingredientsText}

📝 *Рецепт:*
${cocktail.recipe}

⏰ *Время заказа:* ${new Date().toLocaleString('ru-RU')}
🆔 *ID:* \`${orderId}\`
  `.trim()

  if (!bot || !chatId) {
    console.warn('Telegram bot is not configured')
    return { success: false, error: 'Telegram bot not configured' }
  }

  try {
    let keyboard

    if (status === 'В очереди') {
      keyboard = {
        inline_keyboard: [
          [
            { text: '❌ Отменить', callback_data: `cancel_${orderId}` },
            { text: '✅ Взять в работу', callback_data: `take_${orderId}` },
          ],
        ],
      }
    } else if (status === 'В процессе') {
      keyboard = {
        inline_keyboard: [
          [
            { text: '❌ Отменить', callback_data: `cancel_${orderId}` },
            { text: '✅ Готово', callback_data: `ready_${orderId}` },
          ],
        ],
      }
    } else {
      keyboard = undefined
    }

    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    })

    return { success: true }
  } catch (error) {
    console.error('Error updating message in Telegram:', error)
    return { success: false, error }
  }
}

export async function deleteOrderMessage(messageId: number) {
  if (!bot || !chatId) {
    console.warn('Telegram bot is not configured')
    return { success: false, error: 'Telegram bot not configured' }
  }

  try {
    await bot.deleteMessage(chatId, messageId)
    return { success: true }
  } catch (error) {
    console.error('Error deleting message from Telegram:', error)
    return { success: false, error }
  }
}

export async function sendOrderCompletionNotification(
  userName: string,
  cocktailName: string,
  status: 'Готов' | 'Отменен'
) {
  const emoji = status === 'Готов' ? '✅' : '❌'
  const text = status === 'Готов' ? 'готов' : 'отменен'

  const message = `${emoji} Заказ ${text}: ${cocktailName} для ${userName}`

  if (!bot || !chatId) {
    console.warn('Telegram bot is not configured')
    return { success: false, error: 'Telegram bot not configured' }
  }

  try {
    await bot.sendMessage(chatId, message)
    return { success: true }
  } catch (error) {
    console.error('Error sending completion notification to Telegram:', error)
    return { success: false, error }
  }
}

// Старые функции для обратной совместимости (можно удалить позже)
export async function sendOrderStatusUpdate(
  orderId: string,
  userName: string,
  cocktailName: string,
  status: string
) {
  // Эта функция больше не используется, но оставлена для обратной совместимости
  console.log('sendOrderStatusUpdate is deprecated, use updateOrderMessage instead')
  return { success: true }
}

export async function sendOrderCancellation(
  orderId: string,
  userName: string,
  cocktailName: string
) {
  // Эта функция больше не используется, но оставлена для обратной совместимости
  console.log('sendOrderCancellation is deprecated, use deleteOrderMessage + sendOrderCompletionNotification instead')
  return { success: true }
}
