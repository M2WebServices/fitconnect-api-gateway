import { Test, TestingModule } from '@nestjs/testing';
import { MembershipService } from '../services/membership.service';
import { MembershipRepository } from '../membership.repository';
import { UserService } from '../../user/services/user.service';
import { GroupService } from '../../group/services/group.service';
import { Role } from '../../../common/enums/role.enum';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('MembershipService', () => {
  let service: MembershipService;
  let repository: MembershipRepository;
  let userService: UserService;
  let groupService: GroupService;

  const mockMembership = {
    id: 'membership-id',
    userId: 'user-id',
    groupId: 'group-id',
    role: Role.MEMBER,
    joinedAt: new Date(),
    user: null,
    group: null,
  };

  const mockMembershipRepository = {
    addMembership: jest.fn(),
    findById: jest.fn(),
    findByUserAndGroup: jest.fn(),
    findMembershipsByUserId: jest.fn(),
    findMembershipsByGroupId: jest.fn(),
    findAdminsByGroupId: jest.fn(),
    updateMembershipRole: jest.fn(),
    removeMembership: jest.fn(),
    removeById: jest.fn(),
    countMembersByGroupId: jest.fn(),
    countGroupsByUserId: jest.fn(),
  };

  const mockUserService = {
    userExists: jest.fn(),
    getUserProfile: jest.fn(),
  };

  const mockGroupService = {
    groupExists: jest.fn(),
    getGroupById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipService,
        {
          provide: MembershipRepository,
          useValue: mockMembershipRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: GroupService,
          useValue: mockGroupService,
        },
      ],
    }).compile();

    service = module.get<MembershipService>(MembershipService);
    repository = module.get<MembershipRepository>(MembershipRepository);
    userService = module.get<UserService>(UserService);
    groupService = module.get<GroupService>(GroupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addMemberToGroup', () => {
    it('should add a member to a group successfully', async () => {
      mockUserService.userExists.mockResolvedValue(true);
      mockGroupService.groupExists.mockResolvedValue(true);
      mockMembershipRepository.findByUserAndGroup.mockResolvedValue(null);
      mockMembershipRepository.addMembership.mockResolvedValue(mockMembership);

      const result = await service.addMemberToGroup('user-id', 'group-id', Role.MEMBER);

      expect(result).toEqual({
        id: mockMembership.id,
        userId: mockMembership.userId,
        groupId: mockMembership.groupId,
        role: mockMembership.role,
        joinedAt: mockMembership.joinedAt,
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUserService.userExists.mockResolvedValue(false);

      await expect(service.addMemberToGroup('invalid-user', 'group-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if user is already a member', async () => {
      mockUserService.userExists.mockResolvedValue(true);
      mockGroupService.groupExists.mockResolvedValue(true);
      mockMembershipRepository.findByUserAndGroup.mockResolvedValue(mockMembership);

      await expect(service.addMemberToGroup('user-id', 'group-id')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('isUserInGroup', () => {
    it('should return true if user is in group', async () => {
      mockMembershipRepository.findByUserAndGroup.mockResolvedValue(mockMembership);

      const result = await service.isUserInGroup('user-id', 'group-id');

      expect(result).toBe(true);
    });

    it('should return false if user is not in group', async () => {
      mockMembershipRepository.findByUserAndGroup.mockResolvedValue(null);

      const result = await service.isUserInGroup('user-id', 'group-id');

      expect(result).toBe(false);
    });
  });

  describe('isUserAdmin', () => {
    it('should return true if user is admin', async () => {
      const adminMembership = { ...mockMembership, role: Role.ADMIN };
      mockMembershipRepository.findByUserAndGroup.mockResolvedValue(adminMembership);

      const result = await service.isUserAdmin('user-id', 'group-id');

      expect(result).toBe(true);
    });

    it('should return false if user is not admin', async () => {
      mockMembershipRepository.findByUserAndGroup.mockResolvedValue(mockMembership);

      const result = await service.isUserAdmin('user-id', 'group-id');

      expect(result).toBe(false);
    });
  });
});
