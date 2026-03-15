import { Role } from "../../common/enums";

export interface IMembership {
  id: string;
  userId: string;
  groupId: string;
  role: Role;
  joinedAt: Date;
}
