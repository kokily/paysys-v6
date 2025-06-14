import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import Cart from './Cart';
import Bill from './Bill';

@Entity()
class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  username!: string;

  @Column('text')
  password!: string;

  @Column('boolean')
  admin!: boolean;

  @Column('timestamptz')
  @CreateDateColumn()
  created_at!: Date;

  @Column('timestamptz')
  @UpdateDateColumn()
  updated_at!: Date;

  // Relations
  @OneToMany((type) => Cart, (cart) => cart.user_id)
  carts!: Cart[];

  @OneToMany((type) => Bill, (bill) => bill.user_id)
  bills!: Bill[];

  // Method
  serialize() {
    const { password, ...rest } = this;
    return rest;
  }
}

export default User;
