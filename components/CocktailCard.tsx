'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import type { Cocktail } from '@/types'

interface CocktailCardProps {
  cocktail: Cocktail
  onClick: () => void
}

const strengthColors = {
  1: 'bg-green-500',
  2: 'bg-yellow-500',
  3: 'bg-red-500',
}

export default function CocktailCard({ cocktail, onClick }: CocktailCardProps) {
  const imageUrl = cocktail.photoUrl?.startsWith('/api/uploads/')
    ? cocktail.photoUrl
    : cocktail.photoUrl?.startsWith('/uploads/')
      ? `/api${cocktail.photoUrl}`
      : cocktail.photoUrl

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl active:scale-95 cursor-pointer transition-all touch-manipulation"
    >
      {imageUrl && (
        <div className="relative w-full h-48 sm:h-56 overflow-hidden">
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
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">{cocktail.name}</h3>
          <div
            className={`w-3 h-3 rounded-full flex-shrink-0 ${strengthColors[cocktail.strength]}`}
            title={`Крепость: ${cocktail.strength}/3`}
          />
        </div>
      </div>
    </motion.div>
  )
}
