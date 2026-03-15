import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Group } from '../group/group.entity';
import { Role } from '../../common/enums/role.enum';

@Entity('membership')
@Unique(['userId', 'groupId'])
@Index(['userId'])
@Index(['groupId'])
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  groupId!: string;

  @Column({
    type: 'varchar',
    default: Role.MEMBER,
  })
  role!: Role;

  @CreateDateColumn()
  joinedAt!: Date;

  @ManyToOne(() => User, (user) => user.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Group, (group) => group.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group!: Group;
}
