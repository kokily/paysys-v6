import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import Cart from './Cart';
import Bill from './Bill';

@Entity()
class OrderItem extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  name!: string;

  @Column('text')
  divide!: string;

  @Column('text')
  native!: string;

  @Column('text')
  unit!: string;

  @Column()
  price!: number;

  @Column()
  count!: number;

  @Column()
  amount!: number;

  @Column('timestamptz')
  @CreateDateColumn()
  created_at!: Date;

  @Column('timestamptz')
  @UpdateDateColumn()
  updated_at!: Date;

  // Relations
  @Column()
  cart_id!: string;

  @ManyToOne(() => Cart, (cart) => cart.items, {
    onDelete: 'CASCADE',
  })
  cart!: Cart;

  @Column()
  bill_id!: string;

  @ManyToOne(() => Bill, (bill) => bill.items, {
    onDelete: 'CASCADE',
  })
  bill!: Bill;
}

export default OrderItem;
