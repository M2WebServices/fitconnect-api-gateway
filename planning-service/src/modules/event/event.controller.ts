import { EventService } from "./event.service";
import { CreateEventDto, EventDto } from "./event.dto";

export class EventController {
  private readonly service: EventService;

  constructor(service = new EventService()) {
    this.service = service;
  }

  createEvent(data: CreateEventDto): Promise<EventDto> {
    return this.service.createEvent(data);
  }

  getEvent(id: string): Promise<EventDto> {
    return this.service.getEvent(id);
  }

  listEventsByGroup(groupId: string): Promise<EventDto[]> {
    return this.service.listEventsByGroup(groupId);
  }
}
