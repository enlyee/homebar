'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getUserName, setUserName } from '@/lib/storage'

interface UserNameInputProps {
  onNameSet: (name: string) => void
}

export default function UserNameInput({ onNameSet }: UserNameInputProps) {
  const [name, setName] = useState('')
  const [isOpen, setIsOpen] = useState(() => {
    // Инициализация состояния при первом рендере
    if (typeof window !== 'undefined') {
      const savedName = getUserName()
      if (savedName) {
        onNameSet(savedName)
        return false
      }
      return true
    }
    return false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      setUserName(name.trim())
      onNameSet(name.trim())
      setIsOpen(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => {
            if (name.trim()) {
              handleSubmit({ preventDefault: () => {} } as React.FormEvent)
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl max-w-md w-full mx-4"
          >
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-gray-900">
              Добро пожаловать! 🍹
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Введите ваше имя, чтобы начать заказывать коктейли
            </p>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                className="w-full px-4 py-3 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-base text-gray-900 min-h-[48px]"
                autoFocus
                autoComplete="name"
              />
              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full mt-4 px-6 py-3.5 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px] text-base"
              >
                Продолжить
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
