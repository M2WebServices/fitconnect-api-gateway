import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { GroupRepository } from '../group.repository';
import { CreateGroupDto } from '../create-group.dto';
import { Group } from '../group.entity';
import { IGroup } from '../group.interface';
import { MembershipRepository } from '../../membership/membership.repository';

@Injectable()
export class GroupService {
  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly membershipRepository: MembershipRepository,
  ) {}

  /**
   * Crée un nouveau groupe
   */
  async createGroup(createGroupDto: CreateGroupDto): Promise<IGroup> {
    // Vérifier l'unicité du nom du groupe
    const existingGroup = await this.groupRepository.findByName(createGroupDto.name);
    if (existingGroup) {
      throw new ConflictException(`Un groupe avec le nom ${createGroupDto.name} existe déjà`);
    }

    const group = await this.groupRepository.createGroup(createGroupDto);
    return this.mapGroupToInterface(group);
  }

  /**
   * Récupère un groupe par son ID
   */
  async getGroupById(groupId: string): Promise<IGroup> {
    if (!groupId) {
      throw new BadRequestException('groupId is required');
    }

    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundException(`Groupe avec l'ID ${groupId} non trouvé`);
    }

    return this.mapGroupToInterface(group);
  }

  /**
   * Récupère un groupe par son nom
   */
  async getGroupByName(name: string): Promise<IGroup | null> {
    if (!name) {
      throw new BadRequestException('name is required');
    }

    const group = await this.groupRepository.findByName(name);
    return group ? this.mapGroupToInterface(group) : null;
  }

  async searchGroups(query: string): Promise<IGroup[]> {
    if (!query?.trim()) {
      return [];
    }

    const groups = await this.groupRepository.searchByName(query.trim());
    return groups.map((group) => this.mapGroupToInterface(group));
  }

  /**
   * Liste tous les groupes
   */
  async listAllGroups(): Promise<IGroup[]> {
    const groups = await this.groupRepository.findAll();
    return groups.map((group) => this.mapGroupToInterface(group));
  }

  /**
   * Liste les groupes auxquels un utilisateur appartient
   * Cette méthode est implémentée via le service Membership
   * mais peut être utile ici pour une vue d'ensemble
   */
  async getGroupsForUser(userId: string): Promise<IGroup[]> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const memberships = await this.membershipRepository.findMembershipsByUserId(userId);
    const groupIds = Array.from(
      new Set(memberships.map((membership) => membership.groupId).filter(Boolean)),
    );

    if (groupIds.length === 0) {
      return [];
    }

    const groups = await this.groupRepository.findByIds(groupIds);
    return groups.map((group) => this.mapGroupToInterface(group));
  }

  /**
   * Vérifie si un groupe existe
   */
  async groupExists(groupId: string): Promise<boolean> {
    const group = await this.groupRepository.findById(groupId);
    return !!group;
  }

  async updateGroup(
    groupId: string,
    updateData: { name?: string; description?: string }
  ): Promise<IGroup> {
    if (!groupId) {
      throw new BadRequestException('groupId is required');
    }

    const existing = await this.groupRepository.findById(groupId);
    if (!existing) {
      throw new NotFoundException(`Groupe avec l'ID ${groupId} non trouvé`);
    }

    const nextName = updateData.name?.trim();
    if (nextName && nextName !== existing.name) {
      const duplicate = await this.groupRepository.findByName(nextName);
      if (duplicate && duplicate.id !== groupId) {
        throw new ConflictException(`Un groupe avec le nom ${nextName} existe déjà`);
      }
    }

    const updated = await this.groupRepository.updateGroup(groupId, {
      name: nextName ?? existing.name,
      description: updateData.description ?? existing.description,
    });

    if (!updated) {
      throw new NotFoundException(`Groupe avec l'ID ${groupId} non trouvé`);
    }

    return this.mapGroupToInterface(updated);
  }

  async deleteGroup(groupId: string): Promise<boolean> {
    if (!groupId) {
      throw new BadRequestException('groupId is required');
    }

    const exists = await this.groupRepository.findById(groupId);
    if (!exists) {
      throw new NotFoundException(`Groupe avec l'ID ${groupId} non trouvé`);
    }

    return this.groupRepository.deleteGroup(groupId);
  }

  /**
   * Mappe une entité Group vers l'interface IGroup
   */
  private mapGroupToInterface(group: Group): IGroup {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      createdAt: group.createdAt,
    };
  }
}
