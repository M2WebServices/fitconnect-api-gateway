import { Role } from '../../common/enums';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class AddMemberToGroupDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  groupId!: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}

export class RemoveMemberFromGroupDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  groupId!: string;
}

export class UpdateMemberRoleDto {
  @IsEnum(Role)
  @IsNotEmpty()
  role!: Role;
}
