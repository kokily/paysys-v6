import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import OrderItem from './OrderItem';
import Cart from './Cart';
import User from './User';

@Entity()
class Bill extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  title!: string;

  @Column('text')
  hall!: string;

  @Column('text')
  etc!: string;

  @Column()
  total_amount!: number;

  @Column({ nullable: true })
  reserve!: number;

  @Column('timestamptz')
  @CreateDateColumn()
  created_at!: Date;

  @Column('timestamptz')
  @UpdateDateColumn()
  updated_at!: Date;

  // Relations
  @OneToMany(() => OrderItem, (orderItem) => orderItem.bill, {
    cascade: ['insert', 'update'],
  })
  items!: OrderItem[];

  @Column({ nullable: true })
  cart_id!: string;

  @OneToOne((type) => Cart, (cart) => cart.bill_id)
  cart!: Cart;

  @Column({ nullable: true })
  user_id!: string;

  @Column({ nullable: true })
  username!: string;

  @ManyToOne((type) => User, (user) => user.bills)
  user!: User;
}

export default Bill;
