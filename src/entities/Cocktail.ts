import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export interface Ingredient {
  name: string
  amount: string
}

@Entity('cocktails')
export class Cocktail {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  name!: string

  @Column()
  photoUrl!: string

  @Column('text')
  description!: string

  @Column('jsonb')
  ingredients!: Ingredient[]

  @Column('text')
  recipe!: string

  @Column('int')
  strength!: 1 | 2 | 3

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

}
