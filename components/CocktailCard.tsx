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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl active:scale-95 cursor-pointer transition-all touch-manipulation"
    >
      <div className="relative h-48 sm:h-64 w-full">
        <Image
          src={cocktail.photoUrl}
          alt={cocktail.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized={true}
          onError={(e) => {
            console.error('Image load error:', cocktail.photoUrl)
            e.currentTarget.src = '/placeholder.svg'
          }}
        />
        <div className="absolute top-3 right-3">
          <div
            className={`w-3 h-3 rounded-full ${strengthColors[cocktail.strength]}`}
            title={`Крепость: ${cocktail.strength}/3`}
          />
        </div>
      </div>
      <div className="p-3 sm:p-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">{cocktail.name}</h3>
      </div>
    </motion.div>
  )
}
