import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Membership } from '../membership/membership.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  username!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Membership, (membership) => membership.user, { cascade: true })
  memberships!: Membership[];
}
