import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from './membership.entity';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class MembershipRepository {
  constructor(
    @InjectRepository(Membership)
    private readonly repository: Repository<Membership>,
  ) {}

  async addMembership(
    userId: string,
    groupId: string,
    role: Role = Role.MEMBER,
  ): Promise<Membership> {
    const membership = this.repository.create({
      userId,
      groupId,
      role,
    });
    return this.repository.save(membership);
  }

  async findById(id: string): Promise<Membership | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['user', 'group'],
    });
  }

  async findByUserAndGroup(userId: string, groupId: string): Promise<Membership | null> {
    return this.repository.findOne({
      where: { userId, groupId },
      relations: ['user', 'group'],
    });
  }

  async findMembershipsByUserId(userId: string): Promise<Membership[]> {
    return this.repository.find({
      where: { userId },
      relations: ['user', 'group'],
    });
  }

  async findMembershipsByGroupId(groupId: string): Promise<Membership[]> {
    return this.repository.find({
      where: { groupId },
      relations: ['user', 'group'],
    });
  }

  async findAdminsByGroupId(groupId: string): Promise<Membership[]> {
    return this.repository.find({
      where: { groupId, role: Role.ADMIN },
      relations: ['user', 'group'],
    });
  }

  async updateMembershipRole(id: string, role: Role): Promise<Membership | null> {
    await this.repository.update(id, { role });
    return this.findById(id);
  }

  async removeMembership(userId: string, groupId: string): Promise<boolean> {
    const result = await this.repository.delete({ userId, groupId });
    return (result.affected ?? 0) > 0;
  }

  async removeById(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async countMembersByGroupId(groupId: string): Promise<number> {
    return this.repository.count({ where: { groupId } });
  }

  async countGroupsByUserId(userId: string): Promise<number> {
    return this.repository.count({ where: { userId } });
  }
}
