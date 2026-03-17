import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CreateGroupDto } from './create-group.dto';
import { IGroup } from './group.interface';
import { GroupService } from './services/group.service';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGroup(@Body() createGroupDto: CreateGroupDto): Promise<IGroup> {
    return this.groupService.createGroup(createGroupDto);
  }

  // gRPC Method
  @GrpcMethod('CommunityService', 'CreateGroup')
  async grpcCreateGroup(request: CreateGroupDto): Promise<IGroup> {
    return this.groupService.createGroup(request);
  }

  @GrpcMethod('CommunityService', 'GetGroup')
  async grpcGetGroup(request: { group_id?: string; groupId?: string }): Promise<IGroup> {
    const groupId = request.group_id || request.groupId || '';
    return this.groupService.getGroupById(groupId);
  }

  @GrpcMethod('CommunityService', 'GetUserGroups')
  async grpcGetUserGroups(request: { user_id?: string; userId?: string }): Promise<{ groups: IGroup[] }> {
    const userId = request.user_id || request.userId || '';
    const groups = await this.groupService.getGroupsForUser(userId);
    return { groups };
  }

  @GrpcMethod('CommunityService', 'SearchGroups')
  async grpcSearchGroups(request: { query: string }): Promise<{ groups: IGroup[] }> {
    const groups = await this.groupService.searchGroups(request.query);
    return { groups };
  }

  @GrpcMethod('CommunityService', 'UpdateGroup')
  async grpcUpdateGroup(request: {
    group_id?: string;
    groupId?: string;
    name?: string;
    description?: string;
    user_id?: string;
    userId?: string;
  }): Promise<IGroup> {
    void request.user_id;
    void request.userId;
    const groupId = request.group_id || request.groupId || '';
    return this.groupService.updateGroup(groupId, {
      name: request.name,
      description: request.description,
    });
  }

  @GrpcMethod('CommunityService', 'DeleteGroup')
  async grpcDeleteGroup(request: {
    group_id?: string;
    groupId?: string;
    user_id?: string;
    userId?: string;
  }): Promise<{ success: boolean }> {
    void request.user_id;
    void request.userId;
    const groupId = request.group_id || request.groupId || '';
    const success = await this.groupService.deleteGroup(groupId);
    return { success };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getGroup(@Param('id') id: string): Promise<IGroup> {
    return this.groupService.getGroupById(id);
  }

  @Get('name/:name')
  @HttpCode(HttpStatus.OK)
  async getGroupByName(@Param('name') name: string): Promise<IGroup | null> {
    return this.groupService.getGroupByName(name);
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  async getGroupsForUser(@Param('userId') userId: string): Promise<IGroup[]> {
    return this.groupService.getGroupsForUser(userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async listGroups(): Promise<IGroup[]> {
    return this.groupService.listAllGroups();
  }
}
