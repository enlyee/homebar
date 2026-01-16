import { NextResponse } from 'next/server'
import { getDataSource } from '@/src/data-source'
import { Cocktail } from '@/src/entities/Cocktail'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const dataSource = await getDataSource()
    const cocktailRepository = dataSource.getRepository(Cocktail)
    const cocktail = await cocktailRepository.findOne({ where: { id } })

    if (!cocktail) {
      return NextResponse.json(
        { error: 'Cocktail not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(cocktail)
  } catch (error) {
    console.error('Error fetching cocktail:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cocktail' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, photoUrl, description, ingredients, recipe, strength } = body

    const dataSource = await getDataSource()
    const cocktailRepository = dataSource.getRepository(Cocktail)

    const cocktail = await cocktailRepository.findOne({ where: { id } })
    if (!cocktail) {
      return NextResponse.json(
        { error: 'Cocktail not found' },
        { status: 404 }
      )
    }

    if (name) cocktail.name = name
    if (photoUrl) cocktail.photoUrl = photoUrl
    if (description) cocktail.description = description
    if (ingredients) cocktail.ingredients = ingredients
    if (recipe) cocktail.recipe = recipe
    if (strength !== undefined) cocktail.strength = strength

    const updatedCocktail = await cocktailRepository.save(cocktail)
    return NextResponse.json(updatedCocktail)
  } catch (error) {
    console.error('Error updating cocktail:', error)
    return NextResponse.json(
      { error: 'Failed to update cocktail' },
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
    const cocktailRepository = dataSource.getRepository(Cocktail)

    await cocktailRepository.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cocktail:', error)
    return NextResponse.json(
      { error: 'Failed to delete cocktail' },
      { status: 500 }
    )
  }
}
