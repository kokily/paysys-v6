import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import OrderItem from './OrderItem';
import User from './User';

@Entity()
class Cart extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'boolean', default: false })
  deleted!: boolean;

  @Column({ type: 'boolean', default: false })
  completed!: boolean;

  @Column('timestamptz')
  @CreateDateColumn()
  created_at!: Date;

  @Column('timestamptz')
  @UpdateDateColumn()
  updated_at!: Date;

  // Relations
  @OneToMany(() => OrderItem, (orderItem) => orderItem.cart, {
    cascade: ['insert', 'update'],
  })
  items!: OrderItem[];

  @Column({ nullable: true })
  user_id!: string;

  @ManyToOne((type) => User, (user) => user.carts)
  user!: User;

  @Column({ nullable: true })
  bill_id!: string;
}

export default Cart;
