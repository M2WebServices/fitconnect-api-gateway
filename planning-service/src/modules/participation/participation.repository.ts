import { Repository } from "typeorm";
import { dataSource } from "../../config/database";
import { ParticipationEntity } from "./participation.model";
import { JoinEventDto } from "./participation.dto";

const isUniqueViolation = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }
  const anyError = error as { code?: string };
  return anyError.code === "23505";
};

export class ParticipationRepository {
  private readonly repo: Repository<ParticipationEntity>;

  constructor() {
    if (!dataSource.isInitialized) {
      throw new Error("Database not initialized");
    }
    this.repo = dataSource.getRepository(ParticipationEntity);
  }

  async joinEvent(data: JoinEventDto): Promise<ParticipationEntity> {
    try {
      const entity = this.repo.create({
        eventId: data.eventId,
        userId: data.userId
      });
      return await this.repo.save(entity);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new Error("ALREADY_JOINED");
      }
      throw error;
    }
  }

  async listByEvent(eventId: string): Promise<ParticipationEntity[]> {
    return this.repo.find({ where: { eventId }, order: { joinedAt: "ASC" } });
  }
}
