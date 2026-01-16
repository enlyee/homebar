'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import type { Cocktail } from '@/types'

interface CocktailModalProps {
  cocktail: Cocktail | null
  isOpen: boolean
  onClose: () => void
  onOrder: (cocktailId: string) => Promise<void>
  isOrdering: boolean
}

const strengthColors = {
  1: 'bg-green-500',
  2: 'bg-yellow-500',
  3: 'bg-red-500',
}

const strengthLabels = {
  1: 'Слабоалкогольный',
  2: 'Среднеалкогольный',
  3: 'Крепкий',
}

export default function CocktailModal({
  cocktail,
  isOpen,
  onClose,
  onOrder,
  isOrdering,
}: CocktailModalProps) {
  if (!cocktail) return null

  const handleOrder = async () => {
    await onOrder(cocktail.id)
  }

  const imageUrl = cocktail.photoUrl?.startsWith('/api/uploads/') 
    ? cocktail.photoUrl 
    : cocktail.photoUrl?.startsWith('/uploads/')
    ? `/api${cocktail.photoUrl}`
    : cocktail.photoUrl

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={onClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl touch-manipulation"
            >
              {imageUrl && (
                <div className="relative w-full h-64 sm:h-80 overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={cocktail.name}
                    fill
                    className="object-cover"
                    unoptimized={true}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
              )}
              <div className="relative p-4 sm:p-6">
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white active:bg-white/80 transition-colors touch-manipulation text-lg sm:text-xl shadow-md"
                  aria-label="Закрыть"
                >
                  ✕
                </button>
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className={`px-3 py-1 rounded-full text-white text-sm font-medium ${strengthColors[cocktail.strength]}`}
                  >
                    {strengthLabels[cocktail.strength]}
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                  {cocktail.name}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                  {cocktail.description}
                </p>
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                    Состав:
                  </h3>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {cocktail.ingredients.map((ingredient, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm sm:text-base text-gray-700"
                      >
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        <span>
                          {ingredient.name} - {ingredient.amount}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={handleOrder}
                  disabled={isOrdering}
                  className="w-full px-6 py-4 sm:py-4 bg-blue-600 text-white rounded-lg font-semibold text-base sm:text-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]"
                >
                  {isOrdering ? 'Заказываю...' : 'Заказать'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
