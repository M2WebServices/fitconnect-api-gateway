import { CreateEventDto, EventDto } from "./event.dto";
import { EventRepository } from "./event.repository";
import { publishEventCreated } from "../../messaging/publisher";

export class EventService {
  private readonly repository: EventRepository;

  constructor(repository = new EventRepository()) {
    this.repository = repository;
  }

  async createEvent(data: CreateEventDto): Promise<EventDto> {
    const event = await this.repository.createEvent(data);
    const response = {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      groupId: event.groupId,
      createdAt: event.createdAt
    };

    void publishEventCreated({
      eventId: response.id,
      groupId: response.groupId,
      title: response.title,
      date: response.date.toISOString(),
      createdAt: response.createdAt.toISOString(),
    });

    return response;
  }

  async getEvent(id: string): Promise<EventDto> {
    const event = await this.repository.findById(id);
    if (!event) {
      throw new Error("EVENT_NOT_FOUND");
    }
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      groupId: event.groupId,
      createdAt: event.createdAt
    };
  }

  async listEventsByGroup(groupId: string): Promise<EventDto[]> {
    const events = await this.repository.listByGroup(groupId);
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      groupId: event.groupId,
      createdAt: event.createdAt
    }));
  }

  async listEventsByUser(userId: string): Promise<EventDto[]> {
    const events = await this.repository.listByUser(userId);
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      groupId: event.groupId,
      createdAt: event.createdAt
    }));
  }

  async updateEvent(
    id: string,
    data: { title?: string; description?: string | null; date?: Date }
  ): Promise<EventDto> {
    const updated = await this.repository.updateEvent(id, data);
    if (!updated) {
      throw new Error("EVENT_NOT_FOUND");
    }

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      date: updated.date,
      groupId: updated.groupId,
      createdAt: updated.createdAt
    };
  }

  async deleteEvent(id: string): Promise<boolean> {
    const deleted = await this.repository.deleteEvent(id);
    if (!deleted) {
      throw new Error("EVENT_NOT_FOUND");
    }
    return true;
  }
}
