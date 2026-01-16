'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import ReactCrop, { type Crop, makeAspectCrop, centerCrop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import type { Cocktail, Ingredient } from '@/types'

function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('No 2d context')
  }

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
    crop.height * scaleY,
  )
}

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
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file')
  
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
    setUploadMethod('file')
    setIsModalOpen(true)
  }

  const openEditModal = (cocktail: Cocktail) => {
    setEditingCocktail(cocktail)
    setFormData({
      name: cocktail.name,
      photoUrl: cocktail.photoUrl,
      description: cocktail.description,
      ingredients: cocktail.ingredients as Ingredient[],
      recipe: cocktail.recipe,
      strength: cocktail.strength,
    })
    setUploadMethod(cocktail.photoUrl.startsWith('/uploads/') ? 'file' : 'url')
    setShowCrop(false)
    setImgSrc('')
    setCrop(undefined)
    setCompletedCrop(undefined)
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

  const handleIngredientChange = (index: number, field: 'name' | 'amount', value: string) => {
    const newIngredients = [...formData.ingredients]
    newIngredients[index][field] = value
    setFormData({ ...formData, ingredients: newIngredients })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.photoUrl || !formData.description || !formData.recipe) {
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
                <div className="relative w-full h-48">
                  <Image
                    src={cocktail.photoUrl}
                    alt={cocktail.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    unoptimized={cocktail.photoUrl.startsWith('/uploads/')}
                    onError={(e) => {
                      console.error('Image load error:', cocktail.photoUrl)
                      e.currentTarget.src = '/placeholder.svg'
                    }}
                  />
                </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Фотография *
                </label>
                
                {/* Переключатель метода загрузки */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setUploadMethod('file')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px] ${
                      uploadMethod === 'file'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📁 Загрузить файл
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMethod('url')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px] ${
                      uploadMethod === 'url'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    🔗 По ссылке
                  </button>
                </div>

                {uploadMethod === 'file' ? (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return

                        console.log('File selected:', file.name)

                        const reader = new FileReader()
                        reader.onerror = () => {
                          console.error('Error reading file')
                          alert('Ошибка при чтении файла')
                        }
                        reader.onload = () => {
                          const result = reader.result as string
                          console.log('File read, setting imgSrc and showCrop')
                          setImgSrc(result)
                          setShowCrop(true)
                          setFormData({ ...formData, photoUrl: '' })
                        }
                        reader.readAsDataURL(file)
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                      disabled={isUploading}
                    />
                    
                    {showCrop && imgSrc && (
                      <div className="mt-4 space-y-3">
                        <p className="text-sm font-medium text-gray-700">Select crop area (4:3 ratio):</p>
                        <div className="relative w-full overflow-auto bg-gray-100 rounded-lg p-2 max-h-[500px]">
                          {imgSrc && (
                            <ReactCrop
                              crop={crop}
                              onChange={(_, percentCrop) => {
                                setCrop(percentCrop)
                              }}
                              onComplete={(c) => {
                                console.log('Crop completed:', c)
                                setCompletedCrop(c)
                              }}
                              aspect={800 / 600}
                              minWidth={200}
                              minHeight={150}
                              className="max-w-full"
                            >
                              <img
                                ref={imgRef}
                                alt="Crop me"
                                src={imgSrc}
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '400px',
                                  display: 'block'
                                }}
                                onLoad={(e) => {
                                  console.log('Image loaded:', e.currentTarget.width, e.currentTarget.height)
                                  const { width, height } = e.currentTarget
                                  const initialCrop = makeAspectCrop(
                                    {
                                      unit: '%',
                                      width: 90,
                                    },
                                    800 / 600,
                                    width,
                                    height
                                  )
                                  const centeredCrop = centerCrop(initialCrop, width, height)
                                  console.log('Setting initial crop:', centeredCrop)
                                  setCrop(centeredCrop)
                                }}
                                onError={(e) => {
                                  console.error('Image load error:', e)
                                  alert('Ошибка при загрузке изображения')
                                }}
                              />
                            </ReactCrop>
                          )}
                        </div>
                        {completedCrop && (
                          <div className="space-y-2">
                            <canvas
                              ref={previewCanvasRef}
                              style={{
                                display: 'none',
                              }}
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!imgRef.current || !previewCanvasRef.current || !completedCrop) {
                                    console.error('Missing refs or crop')
                                    return
                                  }

                                  console.log('Applying crop:', completedCrop)
                                  canvasPreview(
                                    imgRef.current,
                                    previewCanvasRef.current,
                                    completedCrop
                                  )

                                  previewCanvasRef.current.toBlob(async (blob) => {
                                    if (!blob) {
                                      console.error('Failed to create blob')
                                      return
                                    }

                                    setIsUploading(true)
                                    try {
                                      const uploadFormData = new FormData()
                                      uploadFormData.append('file', blob, 'cropped-image.webp')

                                      const response = await fetch('/api/upload', {
                                        method: 'POST',
                                        body: uploadFormData,
                                      })

                                      const data = await response.json()

                                      if (data.success) {
                                        console.log('Upload successful:', data.url)
                                        setFormData({ ...formData, photoUrl: data.url })
                                        setShowCrop(false)
                                        setImgSrc('')
                                        setCrop(undefined)
                                        setCompletedCrop(undefined)
                                      } else {
                                        alert(data.error || 'Ошибка при загрузке изображения')
                                      }
                                    } catch (error) {
                                      console.error('Error uploading file:', error)
                                      alert('Ошибка при загрузке изображения')
                                    } finally {
                                      setIsUploading(false)
                                    }
                                  }, 'image/webp', 0.85)
                                }}
                                disabled={isUploading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                              >
                                {isUploading ? 'Загрузка...' : '✅ Применить обрезку'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCrop(false)
                                  setImgSrc('')
                                  setCrop(undefined)
                                  setCompletedCrop(undefined)
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 active:bg-gray-400 transition-colors min-h-[44px]"
                              >
                                Отмена
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {isUploading && (
                      <p className="mt-2 text-sm text-gray-500">Загрузка и обработка изображения...</p>
                    )}
                    {formData.photoUrl && !isUploading && !showCrop && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Предпросмотр:</p>
                        <img
                          src={formData.photoUrl}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg border border-gray-300"
                          onError={(e) => {
                            console.error('Preview image error')
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={formData.photoUrl}
                      onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px] mb-2"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!formData.photoUrl) {
                          alert('Enter image URL')
                          return
                        }

                        try {
                          const response = await fetch(formData.photoUrl)
                          const blob = await response.blob()
                          const reader = new FileReader()
                          reader.onload = () => {
                            const result = reader.result as string
                            setImgSrc(result)
                            setShowCrop(true)
                            setFormData({ ...formData, photoUrl: '' })
                          }
                          reader.readAsDataURL(blob)
                        } catch (error) {
                          console.error('Error loading image from URL:', error)
                          alert('Ошибка при загрузке изображения по URL')
                        }
                      }}
                      disabled={isUploading || !formData.photoUrl}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] mb-2"
                    >
                      📥 Загрузить для обрезки
                    </button>
                    
                    {/* Компонент обрезки для URL */}
                    {showCrop && imgSrc && uploadMethod === 'url' && (
                      <div className="mt-4 space-y-3">
                        <p className="text-sm font-medium text-gray-700">Выберите область для обрезки:</p>
                        <div className="relative max-w-full overflow-auto bg-gray-100 rounded-lg p-2">
                          <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={800 / 600}
                            minWidth={200}
                            minHeight={150}
                          >
                            <img
                              ref={imgRef}
                              alt="Crop me"
                              src={imgSrc}
                              style={{ maxWidth: '100%', maxHeight: '400px' }}
                              onLoad={(e) => {
                                const { width, height } = e.currentTarget
                                const crop = makeAspectCrop(
                                  {
                                    unit: '%',
                                    width: 90,
                                  },
                                  800 / 600,
                                  width,
                                  height
                                )
                                setCrop(centerCrop(crop, width, height))
                              }}
                            />
                          </ReactCrop>
                        </div>
                        {completedCrop && (
                          <div className="space-y-2">
                            <canvas
                              ref={previewCanvasRef}
                              style={{
                                display: 'none',
                              }}
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!imgRef.current || !previewCanvasRef.current || !completedCrop) {
                                    return
                                  }

                                  canvasPreview(
                                    imgRef.current,
                                    previewCanvasRef.current,
                                    completedCrop
                                  )

                                  previewCanvasRef.current.toBlob(async (blob) => {
                                    if (!blob) return

                                    setIsUploading(true)
                                    try {
                                      const uploadFormData = new FormData()
                                      uploadFormData.append('file', blob, 'cropped-image.webp')

                                      const response = await fetch('/api/upload', {
                                        method: 'POST',
                                        body: uploadFormData,
                                      })

                                      const data = await response.json()

                                      if (data.success) {
                                        setFormData({ ...formData, photoUrl: data.url })
                                        setShowCrop(false)
                                        setImgSrc('')
                                        setCrop(undefined)
                                        setCompletedCrop(undefined)
                                        alert('Image uploaded and processed successfully!')
                                      } else {
                                        alert(data.error || 'Error uploading image')
                                      }
                                    } catch (error) {
                                      console.error('Error uploading file:', error)
                                      alert('Error uploading image')
                                    } finally {
                                      setIsUploading(false)
                                    }
                                  }, 'image/webp', 0.85)
                                }}
                                disabled={isUploading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                              >
                                {isUploading ? 'Загрузка...' : '✅ Применить обрезку'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCrop(false)
                                  setImgSrc('')
                                  setCrop(undefined)
                                  setCompletedCrop(undefined)
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 active:bg-gray-400 transition-colors min-h-[44px]"
                              >
                                Отмена
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {isUploading && (
                      <p className="mt-2 text-sm text-gray-500">Загрузка и обработка изображения...</p>
                    )}
                    {formData.photoUrl && !isUploading && !showCrop && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Обработанное изображение:</p>
                        <img
                          src={formData.photoUrl}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg border border-gray-300"
                        />
                      </div>
                    )}
                  </div>
                )}
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
