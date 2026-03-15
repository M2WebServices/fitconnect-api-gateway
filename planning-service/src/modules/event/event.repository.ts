import { Repository } from "typeorm";
import { dataSource } from "../../config/database";
import { EventEntity } from "./event.model";
import { CreateEventDto } from "./event.dto";

export class EventRepository {
  private readonly repo: Repository<EventEntity>;

  constructor() {
    if (!dataSource.isInitialized) {
      throw new Error("Database not initialized");
    }
    this.repo = dataSource.getRepository(EventEntity);
  }

  async createEvent(data: CreateEventDto): Promise<EventEntity> {
    const entity = this.repo.create({
      title: data.title,
      description: data.description ?? null,
      date: data.date,
      groupId: data.groupId
    });
    return this.repo.save(entity);
  }

  async findById(id: string): Promise<EventEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async listByGroup(groupId: string): Promise<EventEntity[]> {
    return this.repo.find({ where: { groupId }, order: { date: "DESC" } });
  }

  async listByUser(userId: string): Promise<EventEntity[]> {
    return this.repo
      .createQueryBuilder("event")
      .innerJoin("participation", "p", "p.event_id = event.id")
      .where("p.user_id = :userId", { userId })
      .orderBy("event.date", "DESC")
      .getMany();
  }

  async updateEvent(
    id: string,
    data: { title?: string; description?: string | null; date?: Date }
  ): Promise<EventEntity | null> {
    const entity = await this.findById(id);
    if (!entity) {
      return null;
    }

    entity.title = data.title ?? entity.title;
    entity.description = data.description ?? entity.description;
    entity.date = data.date ?? entity.date;
    return this.repo.save(entity);
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await this.repo.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
