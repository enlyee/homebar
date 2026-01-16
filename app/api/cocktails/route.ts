import { NextResponse } from 'next/server'
import { getDataSource } from '@/src/data-source'
import { Cocktail } from '@/src/entities/Cocktail'

export async function GET() {
  try {
    const dataSource = await getDataSource()
    const cocktailRepository = dataSource.getRepository(Cocktail)
    const cocktails = await cocktailRepository.find({
      order: { createdAt: 'DESC' },
    })
    return NextResponse.json(cocktails)
  } catch (error) {
    console.error('Error fetching cocktails:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cocktails' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, photoUrl, description, ingredients, recipe, strength } = body

    if (!name || !photoUrl || !description || !ingredients || !recipe || !strength) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (strength < 1 || strength > 3) {
      return NextResponse.json(
        { error: 'Strength must be between 1 and 3' },
        { status: 400 }
      )
    }

    const dataSource = await getDataSource()
    if (!dataSource.isInitialized) {
      throw new Error('DataSource is not initialized')
    }
    const cocktailRepository = dataSource.getRepository(Cocktail)
    
    const cocktail = cocktailRepository.create({
      name,
      photoUrl,
      description,
      ingredients,
      recipe,
      strength,
    })

    const savedCocktail = await cocktailRepository.save(cocktail)
    return NextResponse.json(savedCocktail, { status: 201 })
  } catch (error: any) {
    console.error('Error creating cocktail:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to create cocktail', details: error?.message },
      { status: 500 }
    )
  }
}
