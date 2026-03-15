import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique
} from "typeorm";
import { EventEntity } from "../event/event.model";

@Entity({ name: "participation" })
@Unique(["eventId", "userId"])
export class ParticipationEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "event_id", type: "uuid" })
  eventId!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @CreateDateColumn({ name: "joined_at", type: "timestamp" })
  joinedAt!: Date;

  @ManyToOne(() => EventEntity, (event) => event.participants, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "event_id" })
  event!: EventEntity;
}
