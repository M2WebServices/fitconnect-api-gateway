import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { MembershipService } from './services/membership.service';
import {
  AddMemberToGroupDto,
  RemoveMemberFromGroupDto,
  UpdateMemberRoleDto,
} from './membership.dto';
import { IMembership } from './membership.interface';

@Controller('memberships')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Post('add-member')
  @HttpCode(HttpStatus.CREATED)
  async addMemberToGroup(@Body() addMemberDto: AddMemberToGroupDto): Promise<IMembership> {
    return this.membershipService.addMemberToGroup(
      addMemberDto.userId,
      addMemberDto.groupId,
      addMemberDto.role,
    );
  }

  // gRPC Method
  @GrpcMethod('CommunityService', 'AddMemberToGroup')
  async grpcAddMemberToGroup(request: {
    user_id: string;
    group_id: string;
    role?: string;
  }): Promise<IMembership> {
    return this.membershipService.addMemberToGroup(
      request.user_id,
      request.group_id,
      request.role as any,
    );
  }

  @Delete('remove-member')
  @HttpCode(HttpStatus.OK)
  async removeMemberFromGroup(
    @Body() removeMemberDto: RemoveMemberFromGroupDto,
  ): Promise<{ success: boolean }> {
    await this.membershipService.removeMemberFromGroup(
      removeMemberDto.userId,
      removeMemberDto.groupId,
    );
    return { success: true };
  }

  @GrpcMethod('CommunityService', 'RemoveMemberFromGroup')
  async grpcRemoveMemberFromGroup(request: {
    user_id: string;
    group_id: string;
  }): Promise<{ success: boolean }> {
    const success = await this.membershipService.removeMemberFromGroup(
      request.user_id,
      request.group_id,
    );
    return { success };
  }

  @Get('check')
  @HttpCode(HttpStatus.OK)
  async checkUserInGroup(
    @Query('userId') userId: string,
    @Query('groupId') groupId: string,
  ): Promise<{ isInGroup: boolean }> {
    const isInGroup = await this.membershipService.isUserInGroup(userId, groupId);
    return { isInGroup };
  }

  // gRPC Method
  @GrpcMethod('CommunityService', 'IsUserInGroup')
  async grpcIsUserInGroup(request: {
    user_id: string;
    group_id: string;
  }): Promise<{ is_in_group: boolean }> {
    const isInGroup = await this.membershipService.isUserInGroup(
      request.user_id,
      request.group_id,
    );
    return { is_in_group: isInGroup };
  }

  @Get('check-admin')
  @HttpCode(HttpStatus.OK)
  async checkUserAdmin(
    @Query('userId') userId: string,
    @Query('groupId') groupId: string,
  ): Promise<{ isAdmin: boolean }> {
    const isAdmin = await this.membershipService.isUserAdmin(userId, groupId);
    return { isAdmin };
  }

  // gRPC Method
  @GrpcMethod('CommunityService', 'IsAdmin')
  async grpcIsAdmin(request: {
    user_id: string;
    group_id: string;
  }): Promise<{ is_admin: boolean }> {
    const isAdmin = await this.membershipService.isUserAdmin(
      request.user_id,
      request.group_id,
    );
    return { is_admin: isAdmin };
  }

  @Get('group/:groupId/members')
  @HttpCode(HttpStatus.OK)
  async getGroupMembers(@Param('groupId') groupId: string): Promise<IMembership[]> {
    return this.membershipService.getGroupMembers(groupId);
  }

  // gRPC Method
  @GrpcMethod('CommunityService', 'GetGroupMembers')
  async grpcGetGroupMembers(request: {
    group_id: string;
  }): Promise<{ members: IMembership[] }> {
    const members = await this.membershipService.getGroupMembers(request.group_id);
    return { members };
  }

  @Get('group/:groupId/admins')
  @HttpCode(HttpStatus.OK)
  async getGroupAdmins(@Param('groupId') groupId: string): Promise<IMembership[]> {
    return this.membershipService.getGroupAdmins(groupId);
  }

  @Get('group/:groupId/count')
  @HttpCode(HttpStatus.OK)
  async countGroupMembers(@Param('groupId') groupId: string): Promise<{ count: number }> {
    const count = await this.membershipService.countGroupMembers(groupId);
    return { count };
  }

  @Get('user/:userId/groups')
  @HttpCode(HttpStatus.OK)
  async getUserGroups(@Param('userId') userId: string): Promise<IMembership[]> {
    return this.membershipService.getUserGroups(userId);
  }

  @Get('user/:userId/count')
  @HttpCode(HttpStatus.OK)
  async countUserGroups(@Param('userId') userId: string): Promise<{ count: number }> {
    const count = await this.membershipService.countUserGroups(userId);
    return { count };
  }

  @Patch(':id/role')
  @HttpCode(HttpStatus.OK)
  async updateMemberRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateMemberRoleDto,
  ): Promise<IMembership> {
    return this.membershipService.updateMemberRole(id, updateRoleDto.role);
  }
}
