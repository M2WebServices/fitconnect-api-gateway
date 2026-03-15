export type CreateEventDto = {
  title: string;
  description?: string | null;
  date: Date;
  groupId: string;
};

export type EventDto = {
  id: string;
  title: string;
  description?: string | null;
  date: Date;
  groupId: string;
  createdAt: Date;
};
