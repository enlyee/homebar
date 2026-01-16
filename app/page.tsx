'use client'

import { useState, useEffect, useCallback } from 'react'
import UserNameInput from '@/components/UserNameInput'
import OrdersList from '@/components/OrdersList'
import CocktailCard from '@/components/CocktailCard'
import CocktailModal from '@/components/CocktailModal'
import { getUserName } from '@/lib/storage'
import type { Cocktail, Order } from '@/types'

export default function Home() {
  const [userName, setUserName] = useState<string | null>(null)
  const [cocktails, setCocktails] = useState<Cocktail[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isOrdering, setIsOrdering] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadCocktails = async () => {
    try {
      const response = await fetch('/api/cocktails')
      const data = await response.json()
      setCocktails(data)
    } catch (error) {
      console.error('Error loading cocktails:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadOrders = useCallback(async () => {
    if (!userName) return
    try {
      const response = await fetch(`/api/orders?userId=${encodeURIComponent(userName)}`)
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }, [userName])

  useEffect(() => {
    const savedName = getUserName()
    if (savedName) {
      setUserName(savedName)
    }
    loadCocktails()
  }, [])

  useEffect(() => {
    if (userName) {
      loadOrders()
      const interval = setInterval(loadOrders, 5000)
      return () => clearInterval(interval)
    }
  }, [userName, loadOrders])

  const handleNameSet = (name: string) => {
    setUserName(name)
  }

  const handleCocktailClick = (cocktail: Cocktail) => {
    setSelectedCocktail(cocktail)
    setIsModalOpen(true)
  }

  const handleOrder = async (cocktailId: string) => {
    if (!userName) return

    setIsOrdering(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userName,
          cocktailId,
        }),
      })

      if (response.ok) {
        await loadOrders()
        setIsModalOpen(false)
        setSelectedCocktail(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Error creating order')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Error creating order')
    } finally {
      setIsOrdering(false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadOrders()
      } else {
        const error = await response.json()
        alert(error.error || 'Error cancelling order')
      }
    } catch (error) {
      console.error('Error cancelling order:', error)
      alert('Error cancelling order')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNameInput onNameSet={handleNameSet} />
      
      {userName && (
        <>
          <OrdersList orders={orders} onCancelOrder={handleCancelOrder} />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Домашний Бар 🍹
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Привет, {userName}! Выберите коктейль из меню
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Загрузка...</div>
              </div>
            ) : cocktails.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">
                  Коктейли пока не добавлены. Добавьте их в админке.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {cocktails.map((cocktail) => (
                  <CocktailCard
                    key={cocktail.id}
                    cocktail={cocktail}
                    onClick={() => handleCocktailClick(cocktail)}
                  />
                ))}
              </div>
            )}
          </div>

          <CocktailModal
            cocktail={selectedCocktail}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false)
              setSelectedCocktail(null)
            }}
            onOrder={handleOrder}
            isOrdering={isOrdering}
          />
        </>
      )}
    </div>
  )
}
