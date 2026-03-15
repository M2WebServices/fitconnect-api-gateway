import { EventRepository } from "../event/event.repository";
import { JoinEventDto, ParticipationDto } from "./participation.dto";
import { ParticipationRepository } from "./participation.repository";

export class ParticipationService {
  private readonly repository: ParticipationRepository;
  private readonly eventRepository: EventRepository;

  constructor(
    repository = new ParticipationRepository(),
    eventRepository = new EventRepository()
  ) {
    this.repository = repository;
    this.eventRepository = eventRepository;
  }

  async joinEvent(data: JoinEventDto): Promise<ParticipationDto> {
    const event = await this.eventRepository.findById(data.eventId);
    if (!event) {
      throw new Error("EVENT_NOT_FOUND");
    }
    const participation = await this.repository.joinEvent(data);
    return {
      id: participation.id,
      eventId: participation.eventId,
      userId: participation.userId,
      joinedAt: participation.joinedAt
    };
  }

  async listParticipants(eventId: string): Promise<ParticipationDto[]> {
    const participations = await this.repository.listByEvent(eventId);
    return participations.map((participation) => ({
      id: participation.id,
      eventId: participation.eventId,
      userId: participation.userId,
      joinedAt: participation.joinedAt
    }));
  }
}
