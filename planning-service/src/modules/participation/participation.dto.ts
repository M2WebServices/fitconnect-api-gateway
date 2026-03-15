export type JoinEventDto = {
  eventId: string;
  userId: string;
};

export type ParticipationDto = {
  id: string;
  eventId: string;
  userId: string;
  joinedAt: Date;
};
