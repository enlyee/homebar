'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import ReactCrop, { type Crop, type PixelCrop, makeAspectCrop, centerCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import type { Cocktail, Ingredient } from '@/types'

export default function AdminPage() {
  const [cocktails, setCocktails] = useState<Cocktail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingCocktail, setEditingCocktail] = useState<Cocktail | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    photoUrl: '',
    description: '',
    ingredients: [{ name: '', amount: '' }] as Ingredient[],
    recipe: '',
    strength: 1 as 1 | 2 | 3,
  })
  const [imgSrc, setImgSrc] = useState('')
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [showCrop, setShowCrop] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    loadCocktails()
  }, [])

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

  const openCreateModal = () => {
    setEditingCocktail(null)
    setFormData({
      name: '',
      photoUrl: '',
      description: '',
      ingredients: [{ name: '', amount: '' }],
      recipe: '',
      strength: 1,
    })
    setImgSrc('')
    setCrop(undefined)
    setCompletedCrop(undefined)
    setShowCrop(false)
    setIsModalOpen(true)
  }

  const openEditModal = (cocktail: Cocktail) => {
    setEditingCocktail(cocktail)
    setFormData({
      name: cocktail.name,
      photoUrl: cocktail.photoUrl || '',
      description: cocktail.description,
      ingredients: cocktail.ingredients as Ingredient[],
      recipe: cocktail.recipe,
      strength: cocktail.strength,
    })
    setImgSrc(cocktail.photoUrl || '')
    setCrop(undefined)
    setCompletedCrop(undefined)
    setShowCrop(false)
    setIsModalOpen(true)
  }

  const handleAddIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { name: '', amount: '' }],
    })
  }

  const handleRemoveIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    })
  }

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    const crop = makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      4 / 3,
      width,
      height
    )
    setCrop(crop)
  }

  const canvasPreview = (
    image: HTMLImageElement,
    canvas: HTMLCanvasElement,
    crop: PixelCrop
  ) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    const pixelRatio = window.devicePixelRatio

    canvas.width = Math.floor(crop.width * scaleX * pixelRatio)
    canvas.height = Math.floor(crop.height * scaleY * pixelRatio)

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    ctx.imageSmoothingQuality = 'high'

    const cropX = crop.x * scaleX
    const cropY = crop.y * scaleY

    ctx.drawImage(
      image,
      cropX,
      cropY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    )
  }

  const handleUploadImage = async () => {
    if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
      return
    }

    previewCanvasRef.current.toBlob(async (blob) => {
      if (!blob) return

      const uploadFormData = new FormData()
      uploadFormData.append('file', blob, 'image.webp')

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        const data = await response.json()
        if (data.success && data.url) {
          setFormData((prev) => ({ ...prev, photoUrl: data.url }))
          setShowCrop(false)
          setImgSrc('')
          setCrop(undefined)
          setCompletedCrop(undefined)
        } else {
          alert(data.error || 'Failed to upload image')
        }
      } catch (error) {
        console.error('Error uploading image:', error)
        alert('Error uploading image')
      }
    }, 'image/webp', 0.85)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setImgSrc(reader.result as string)
      setShowCrop(true)
    })
    reader.readAsDataURL(file)
  }

  const handleUrlChange = async (url: string) => {
    if (!url) {
      setImgSrc('')
      setShowCrop(false)
      return
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()
      if (data.success && data.url) {
        setFormData((prev) => ({ ...prev, photoUrl: data.url }))
        setImgSrc('')
        setShowCrop(false)
      } else {
        setImgSrc(url)
        setShowCrop(true)
      }
    } catch (error) {
      setImgSrc(url)
      setShowCrop(true)
    }
  }

  useEffect(() => {
    if (completedCrop && imgRef.current && previewCanvasRef.current) {
      canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop)
    }
  }, [completedCrop])

  const handleIngredientChange = (index: number, field: 'name' | 'amount', value: string) => {
    const newIngredients = [...formData.ingredients]
    newIngredients[index][field] = value
    setFormData({ ...formData, ingredients: newIngredients })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.description || !formData.recipe) {
      alert('Please fill all required fields')
      return
    }

    if (formData.ingredients.some(ing => !ing.name || !ing.amount)) {
      alert('Please fill all ingredients')
      return
    }

    try {
      const url = editingCocktail
        ? `/api/cocktails/${editingCocktail.id}`
        : '/api/cocktails'
      const method = editingCocktail ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await loadCocktails()
        setIsModalOpen(false)
        setEditingCocktail(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Error saving')
      }
    } catch (error) {
      console.error('Error saving cocktail:', error)
      alert('Error saving')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cocktail?')) return

    try {
      const response = await fetch(`/api/cocktails/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadCocktails()
      } else {
        const error = await response.json()
        alert(error.error || 'Error deleting')
      }
    } catch (error) {
      console.error('Error deleting cocktail:', error)
      alert('Error deleting')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Админ-панель</h1>
            <Link href="/" className="text-sm sm:text-base text-blue-600 hover:text-blue-700 active:text-blue-800">
              ← Вернуться на главную
            </Link>
          </div>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation min-h-[48px] text-sm sm:text-base"
          >
            + Добавить коктейль
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Загрузка...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {cocktails.map((cocktail) => (
              <motion.div
                key={cocktail.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                {cocktail.photoUrl && (
                  <div className="relative w-full h-48 overflow-hidden">
                    <Image
                      src={cocktail.photoUrl.startsWith('/api/uploads/') 
                        ? cocktail.photoUrl 
                        : cocktail.photoUrl.startsWith('/uploads/')
                        ? `/api${cocktail.photoUrl}`
                        : cocktail.photoUrl}
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
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                    {cocktail.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        cocktail.strength === 1
                          ? 'bg-green-500'
                          : cocktail.strength === 2
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <span className="text-xs sm:text-sm text-gray-600">
                      Крепость: {cocktail.strength}/3
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => openEditModal(cocktail)}
                      className="flex-1 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation min-h-[44px] text-sm sm:text-base"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDelete(cocktail.id)}
                      className="flex-1 px-4 py-2.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors touch-manipulation min-h-[44px] text-sm sm:text-base"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-t-3xl sm:rounded-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 touch-manipulation"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              {editingCocktail ? 'Редактировать коктейль' : 'Добавить коктейль'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Фото
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                  />
                  <div className="text-sm text-gray-500">или</div>
                  <input
                    type="url"
                    placeholder="URL изображения"
                    value={imgSrc && !showCrop ? imgSrc : ''}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                  />
                  {formData.photoUrl && !showCrop && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300">
                      <Image
                        src={formData.photoUrl.startsWith('/api/uploads/') 
                          ? formData.photoUrl 
                          : formData.photoUrl.startsWith('/uploads/')
                          ? `/api${formData.photoUrl}`
                          : formData.photoUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized={true}
                      />
                    </div>
                  )}
                  {showCrop && imgSrc && (
                    <div className="space-y-2">
                      <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={4 / 3}
                      >
                        <img
                          ref={imgRef}
                          alt="Crop me"
                          src={imgSrc}
                          style={{ maxHeight: '400px', maxWidth: '100%' }}
                          onLoad={onImageLoad}
                        />
                      </ReactCrop>
                      {completedCrop && (
                        <div className="space-y-2">
                          <canvas
                            ref={previewCanvasRef}
                            style={{ display: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={handleUploadImage}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Применить обрезку
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCrop(false)
                              setImgSrc('')
                              setCrop(undefined)
                              setCompletedCrop(undefined)
                            }}
                            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                          >
                            Отмена
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ингредиенты *
                </label>
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Название"
                      value={ingredient.name}
                      onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                    />
                    <input
                      type="text"
                      placeholder="Количество"
                      value={ingredient.amount}
                      onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                    />
                    {formData.ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(index)}
                        className="px-4 py-3 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors touch-manipulation min-h-[48px] sm:min-h-[auto]"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="text-blue-600 hover:text-blue-700 active:text-blue-800 text-sm sm:text-base py-2 touch-manipulation"
                >
                  + Добавить ингредиент
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Рецепт *
                </label>
                <textarea
                  value={formData.recipe}
                  onChange={(e) => setFormData({ ...formData, recipe: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  rows={5}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Крепость (1-3) *
                </label>
                <select
                  value={formData.strength}
                  onChange={(e) => setFormData({ ...formData, strength: parseInt(e.target.value) as 1 | 2 | 3 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                >
                  <option value={1}>1 - Слабоалкогольный</option>
                  <option value={2}>2 - Среднеалкогольный</option>
                  <option value={3}>3 - Крепкий</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3.5 sm:py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation min-h-[48px] text-base"
                >
                  {editingCocktail ? 'Сохранить' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3.5 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 active:bg-gray-400 transition-colors touch-manipulation min-h-[48px] text-base"
                >
                  Отмена
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
