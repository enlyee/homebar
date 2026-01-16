import { NextResponse } from 'next/server'
import { getDataSource } from '@/src/data-source'
import { Order } from '@/src/entities/Order'
import {
  updateOrderMessage,
  deleteOrderMessage,
  sendOrderCompletionNotification,
} from '@/lib/telegram'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      )
    }

    const validStatuses = ['В очереди', 'В процессе', 'Готов', 'Отменен']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const dataSource = await getDataSource()
    const orderRepository = dataSource.getRepository(Order)
    
    const order = await orderRepository.findOne({
      where: { id },
      relations: ['cocktail'],
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    order.status = status as any
    const updatedOrder = await orderRepository.save(order)

    if (updatedOrder.telegramMessageId) {
      if (status === 'Готов' || status === 'Отменен') {
        await deleteOrderMessage(updatedOrder.telegramMessageId)
        await sendOrderCompletionNotification(
          updatedOrder.userId,
          updatedOrder.cocktail.name,
          status as 'Готов' | 'Отменен'
        )
        updatedOrder.telegramMessageId = null
        await orderRepository.save(updatedOrder)
      } else {
        await updateOrderMessage(
          updatedOrder.id,
          updatedOrder.telegramMessageId,
          updatedOrder.userId,
          {
            ...updatedOrder.cocktail,
            ingredients: updatedOrder.cocktail.ingredients as any,
            strength: updatedOrder.cocktail.strength as 1 | 2 | 3,
          },
          status
        )
      }
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order status via webhook:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const dataSource = await getDataSource()
    const orderRepository = dataSource.getRepository(Order)

    const order = await orderRepository.findOne({
      where: { id },
      relations: ['cocktail'],
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.status !== 'В очереди') {
      return NextResponse.json(
        { error: 'Only orders with status "В очереди" can be cancelled' },
        { status: 400 }
      )
    }

    order.status = 'Отменен' as any
    const updatedOrder = await orderRepository.save(order)

    if (updatedOrder.telegramMessageId) {
      await deleteOrderMessage(updatedOrder.telegramMessageId)
      await sendOrderCompletionNotification(
        updatedOrder.userId,
        updatedOrder.cocktail.name,
        'Отменен'
      )
      updatedOrder.telegramMessageId = null
      await orderRepository.save(updatedOrder)
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    )
  }
}
