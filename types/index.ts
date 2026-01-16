export interface Ingredient {
  name: string
  amount: string
}

export interface Cocktail {
  id: string
  name: string
  photoUrl: string
  description: string
  ingredients: Ingredient[]
  recipe: string
  strength: 1 | 2 | 3
  createdAt: Date
  updatedAt: Date
}

export interface Order {
  id: string
  userId: string
  cocktailId: string
  cocktail: Cocktail
  status: 'В очереди' | 'В процессе' | 'Готов' | 'Отменен'
  createdAt: Date
  updatedAt: Date
}

export type OrderStatus = 'В очереди' | 'В процессе' | 'Готов' | 'Отменен'
