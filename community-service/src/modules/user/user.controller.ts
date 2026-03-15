import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from './services/user.service';
import { CreateUserDto } from './create-user.dto';
import { IUser } from './user.interface';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto): Promise<IUser> {
    return this.userService.createUser(createUserDto);
  }

  // gRPC Method
  @GrpcMethod('CommunityService', 'CreateUser')
  async grpcCreateUser(
    request: CreateUserDto,
  ): Promise<IUser> {
    return this.userService.createUser(request);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getUser(@Param('id') id: string): Promise<IUser> {
    return this.userService.getUserProfile(id);
  }

  // gRPC Method
  @GrpcMethod('CommunityService', 'GetUser')
  async grpcGetUser(request: { id: string }): Promise<IUser> {
    return this.userService.getUserProfile(request.id);
  }

  @Get('email/:email')
  @HttpCode(HttpStatus.OK)
  async getUserByEmail(@Param('email') email: string): Promise<IUser | null> {
    return this.userService.getUserByEmail(email);
  }

  @Get('username/:username')
  @HttpCode(HttpStatus.OK)
  async getUserByUsername(@Param('username') username: string): Promise<IUser | null> {
    return this.userService.getUserByUsername(username);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async listUsers(): Promise<IUser[]> {
    return this.userService.listAllUsers();
  }
}
