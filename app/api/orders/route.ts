import { NextResponse } from 'next/server'
import { getDataSource } from '@/src/data-source'
import { Order } from '@/src/entities/Order'
import { Cocktail } from '@/src/entities/Cocktail'
import { sendOrderToTelegram } from '@/lib/telegram'
import type { Ingredient } from '@/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const dataSource = await getDataSource()
    if (!dataSource.isInitialized) {
      throw new Error('DataSource is not initialized')
    }
    const orderRepository = dataSource.getRepository(Order)
    const orders = await orderRepository.find({
      where: { userId },
      relations: ['cocktail'],
      order: { createdAt: 'DESC' },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, cocktailId } = body

    if (!userId || !cocktailId) {
      return NextResponse.json(
        { error: 'userId and cocktailId are required' },
        { status: 400 }
      )
    }

    const dataSource = await getDataSource()
    const cocktailRepository = dataSource.getRepository(Cocktail)
    const orderRepository = dataSource.getRepository(Order)

    const cocktail = await cocktailRepository.findOne({ where: { id: cocktailId } })
    if (!cocktail) {
      return NextResponse.json(
        { error: 'Cocktail not found' },
        { status: 404 }
      )
    }

    const order = orderRepository.create({
      userId,
      cocktailId,
      status: 'В очереди',
    })

    const savedOrder = await orderRepository.save(order)
    const orderWithCocktail = await orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: ['cocktail'],
    })

    if (!orderWithCocktail) {
      return NextResponse.json(
        { error: 'Failed to fetch created order' },
        { status: 500 }
      )
    }

    const telegramResult = await sendOrderToTelegram(
      orderWithCocktail.id,
      userId,
      {
        ...cocktail,
        ingredients: cocktail.ingredients as unknown as Ingredient[],
        strength: cocktail.strength as 1 | 2 | 3,
      }
    )

    if (telegramResult.success && telegramResult.messageId) {
      orderWithCocktail.telegramMessageId = telegramResult.messageId
      await orderRepository.save(orderWithCocktail)
    }

    return NextResponse.json(orderWithCocktail, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
