import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('auth_table')
export class Auth {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, type: 'varchar', nullable: false })
  username: string;

  @Column({ nullable: false, type: 'varchar' })
  password: string;

  @Column({ type: 'varchar', nullable: false })
  role: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToOne(() => User, (user) => user.auth)
  user?: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
