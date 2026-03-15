import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Group } from './group.entity';
import { CreateGroupDto } from './create-group.dto';

@Injectable()
export class GroupRepository {
  constructor(
    @InjectRepository(Group)
    private readonly repository: Repository<Group>,
  ) {}

  async createGroup(createGroupDto: CreateGroupDto): Promise<Group> {
    const group = this.repository.create(createGroupDto);
    return this.repository.save(group);
  }

  async findById(id: string): Promise<Group | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['memberships'],
    });
  }

  async findByName(name: string): Promise<Group | null> {
    return this.repository.findOne({
      where: { name },
      relations: ['memberships'],
    });
  }

  async findAll(): Promise<Group[]> {
    return this.repository.find({
      relations: ['memberships'],
    });
  }

  async searchByName(query: string): Promise<Group[]> {
    return this.repository.find({
      where: { name: ILike(`%${query}%`) },
      relations: ['memberships'],
      order: { createdAt: 'DESC' },
      take: 25,
    });
  }

  async updateGroup(id: string, updateData: Partial<Group>): Promise<Group | null> {
    await this.repository.update(id, updateData);
    return this.findById(id);
  }

  async deleteGroup(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0 ;
  }
}
