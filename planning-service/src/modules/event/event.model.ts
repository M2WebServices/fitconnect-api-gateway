import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn
} from "typeorm";
import { ParticipationEntity } from "../participation/participation.model";

@Entity({ name: "event" })
export class EventEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "timestamp" })
  date!: Date;

  @Column({ name: "group_id", type: "uuid" })
  groupId!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @OneToMany(() => ParticipationEntity, (participation) => participation.event)
  participants!: ParticipationEntity[];
}
