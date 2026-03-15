import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './create-user.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const entityData: Partial<User> = {
      username: createUserDto.username,
      email: createUserDto.email,
    };
    if (createUserDto.id && createUserDto.id.trim()) {
      entityData.id = createUserDto.id.trim();
    }
    const user = this.repository.create(entityData);
    return this.repository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['memberships'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
      relations: ['memberships'],
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.repository.findOne({
      where: { username },
      relations: ['memberships'],
    });
  }

  async findAll(): Promise<User[]> {
    return this.repository.find({
      relations: ['memberships'],
    });
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User | null> {
    await this.repository.update(id, updateData);
    return this.findById(id);
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
