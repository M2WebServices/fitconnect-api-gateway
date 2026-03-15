import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { MembershipRepository } from '../membership.repository';
import { UserService } from '../../user/services/user.service';
import { GroupService } from '../../group/services/group.service';
import { Membership } from '../membership.entity';
import { IMembership } from '../membership.interface';
import { Role } from '../../../common/enums/role.enum';

@Injectable()
export class MembershipService {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly userService: UserService,
    private readonly groupService: GroupService,
  ) {}

  /**
   * Ajoute un membre à un groupe
   */
  async addMemberToGroup(
    userId: string,
    groupId: string,
    role: Role = Role.MEMBER,
  ): Promise<IMembership> {
    if (!userId || !groupId) {
      throw new BadRequestException('userId and groupId are required');
    }

    // Vérifier que le groupe existe
    const groupExists = await this.groupService.groupExists(groupId);
    if (!groupExists) {
      throw new NotFoundException(`Groupe avec l'ID ${groupId} non trouvé`);
    }

    // Vérifier que l'utilisateur n'est pas déjà membre du groupe
    const existingMembership = await this.membershipRepository.findByUserAndGroup(
      userId,
      groupId,
    );
    if (existingMembership) {
      throw new ConflictException(
        `L'utilisateur ${userId} est déjà membre du groupe ${groupId}`,
      );
    }

    const membership = await this.membershipRepository.addMembership(
      userId,
      groupId,
      role,
    );
    return this.mapMembershipToInterface(membership);
  }

  /**
   * Vérifie si un utilisateur appartient à un groupe
   */
  async isUserInGroup(userId: string, groupId: string): Promise<boolean> {
    if (!userId || !groupId) {
      throw new BadRequestException('userId and groupId are required');
    }

    const membership = await this.membershipRepository.findByUserAndGroup(
      userId,
      groupId,
    );
    return !!membership;
  }

  /**
   * Récupère tous les membres d'un groupe
   */
  async getGroupMembers(groupId: string): Promise<IMembership[]> {
    if (!groupId) {
      throw new BadRequestException('groupId is required');
    }

    const groupExists = await this.groupService.groupExists(groupId);
    if (!groupExists) {
      throw new NotFoundException(`Groupe avec l'ID ${groupId} non trouvé`);
    }

    const memberships = await this.membershipRepository.findMembershipsByGroupId(groupId);
    return memberships.map((membership) => this.mapMembershipToInterface(membership));
  }

  /**
   * Récupère tous les groupes d'un utilisateur
   */
  async getUserGroups(userId: string): Promise<IMembership[]> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const memberships = await this.membershipRepository.findMembershipsByUserId(userId);
    return memberships.map((membership) => this.mapMembershipToInterface(membership));
  }

  /**
   * Vérifie si un utilisateur est admin d'un groupe
   */
  async isUserAdmin(userId: string, groupId: string): Promise<boolean> {
    if (!userId || !groupId) {
      throw new BadRequestException('userId and groupId are required');
    }

    const membership = await this.membershipRepository.findByUserAndGroup(
      userId,
      groupId,
    );
    return membership ? membership.role === Role.ADMIN : false;
  }

  /**
   * Récupère les admins d'un groupe
   */
  async getGroupAdmins(groupId: string): Promise<IMembership[]> {
    if (!groupId) {
      throw new BadRequestException('groupId is required');
    }

    const groupExists = await this.groupService.groupExists(groupId);
    if (!groupExists) {
      throw new NotFoundException(`Groupe avec l'ID ${groupId} non trouvé`);
    }

    const admins = await this.membershipRepository.findAdminsByGroupId(groupId);
    return admins.map((admin) => this.mapMembershipToInterface(admin));
  }

  /**
   * Met à jour le rôle d'un membre
   */
  async updateMemberRole(membershipId: string, role: Role): Promise<IMembership> {
    if (!membershipId || !role) {
      throw new BadRequestException('membershipId and role are required');
    }

    const membership = await this.membershipRepository.findById(membershipId);
    if (!membership) {
      throw new NotFoundException(`Membership avec l'ID ${membershipId} non trouvé`);
    }

    const updatedMembership = await this.membershipRepository.updateMembershipRole(
      membershipId,
      role,
    );
    return this.mapMembershipToInterface(updatedMembership ?? membership);
  }

  /**
   * Supprime un membre d'un groupe
   */
  async removeMemberFromGroup(userId: string, groupId: string): Promise<boolean> {
    if (!userId || !groupId) {
      throw new BadRequestException('userId and groupId are required');
    }

    const membership = await this.membershipRepository.findByUserAndGroup(
      userId,
      groupId,
    );
    if (!membership) {
      throw new NotFoundException(
        `L'utilisateur ${userId} n'est pas membre du groupe ${groupId}`,
      );
    }

    return this.membershipRepository.removeMembership(userId, groupId);
  }

  /**
   * Compte le nombre de membres dans un groupe
   */
  async countGroupMembers(groupId: string): Promise<number> {
    if (!groupId) {
      throw new BadRequestException('groupId is required');
    }

    return this.membershipRepository.countMembersByGroupId(groupId);
  }

  /**
   * Compte le nombre de groupes auxquels appartient un utilisateur
   */
  async countUserGroups(userId: string): Promise<number> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.membershipRepository.countGroupsByUserId(userId);
  }

  /**
   * Mappe une entité Membership vers l'interface IMembership
   */
  private mapMembershipToInterface(membership: Membership): IMembership {
    return {
      id: membership.id,
      userId: membership.userId,
      groupId: membership.groupId,
      role: membership.role,
      joinedAt: membership.joinedAt,
    };
  }
}
