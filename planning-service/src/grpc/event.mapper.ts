import { EventDto } from "../modules/event/event.dto";
import { ParticipationDto } from "../modules/participation/participation.dto";

type ProtoTimestamp = { seconds: number; nanos: number };

export const toTimestamp = (date: Date): ProtoTimestamp => {
  const millis = date.getTime();
  return {
    seconds: Math.floor(millis / 1000),
    nanos: (millis % 1000) * 1_000_000
  };
};

export const fromTimestamp = (value?: { seconds?: number | string; nanos?: number }) => {
  if (!value || value.seconds === undefined || value.seconds === null) {
    return new Date(0);
  }
  const seconds = Number(value.seconds);
  const nanos = value.nanos ?? 0;
  return new Date(seconds * 1000 + Math.floor(nanos / 1_000_000));
};

export const toEventResponse = (event: EventDto) => ({
  id: event.id,
  title: event.title,
  description: event.description ?? "",
  date: toTimestamp(event.date),
  groupId: event.groupId,
  createdAt: toTimestamp(event.createdAt)
});

export const toParticipantResponse = (participant: ParticipationDto) => ({
  userId: participant.userId,
  joinedAt: toTimestamp(participant.joinedAt)
});
