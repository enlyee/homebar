'use client'

import { motion } from 'framer-motion'
import type { Order } from '@/types'

interface OrdersListProps {
  orders: Order[]
  onCancelOrder: (orderId: string) => void
}

const statusColors = {
  'В очереди': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'В процессе': 'bg-blue-100 text-blue-800 border-blue-300',
  'Готов': 'bg-green-100 text-green-800 border-green-300',
  'Отменен': 'bg-gray-100 text-gray-800 border-gray-300',
}

export default function OrdersList({ orders, onCancelOrder }: OrdersListProps) {
  if (orders.length === 0) return null

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full bg-white border-b border-gray-200 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
          Мои заказы ({orders.length})
        </h3>
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-3 sm:-mx-4 px-3 sm:px-4">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex-shrink-0 bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 min-w-[260px] sm:min-w-[280px]"
            >
              <div className="flex items-start justify-between mb-2 gap-2">
                <h4 className="font-medium text-sm sm:text-base text-gray-900 flex-1 line-clamp-2">{order.cocktail.name}</h4>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full border whitespace-nowrap flex-shrink-0 ${statusColors[order.status]}`}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                {new Date(order.createdAt).toLocaleString('ru-RU')}
              </p>
              {order.status === 'В очереди' && (
                <button
                  onClick={() => onCancelOrder(order.id)}
                  className="w-full px-3 py-2.5 sm:py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors touch-manipulation min-h-[44px]"
                >
                  Отменить заказ
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
