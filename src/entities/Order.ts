import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { Cocktail } from './Cocktail'

export type OrderStatus = 'В очереди' | 'В процессе' | 'Готов' | 'Отменен'

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  @Index()
  userId!: string

  @Column('uuid')
  cocktailId!: string

  @ManyToOne(() => Cocktail, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'cocktailId' })
  cocktail!: Cocktail

  @Column({ type: 'varchar', length: 50, default: 'В очереди' })
  @Index()
  status!: string

  @Column({ type: 'bigint', nullable: true })
  telegramMessageId!: number | null

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
