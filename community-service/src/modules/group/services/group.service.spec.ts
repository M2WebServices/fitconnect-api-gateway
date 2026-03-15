import { Test, TestingModule } from '@nestjs/testing';
import { GroupService } from '../services/group.service';
import { GroupRepository } from '../group.repository';
import { CreateGroupDto } from '../create-group.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('GroupService', () => {
  let service: GroupService;
  let repository: GroupRepository;

  const mockGroup = {
    id: 'group-id',
    name: 'Fitness Club',
    description: 'A fitness community',
    createdAt: new Date(),
    memberships: [],
  };

  const mockGroupRepository = {
    createGroup: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    findAll: jest.fn(),
    updateGroup: jest.fn(),
    deleteGroup: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        {
          provide: GroupRepository,
          useValue: mockGroupRepository,
        },
      ],
    }).compile();

    service = module.get<GroupService>(GroupService);
    repository = module.get<GroupRepository>(GroupRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createGroup', () => {
    it('should create a group successfully', async () => {
      const createGroupDto: CreateGroupDto = {
        name: 'New Group',
        description: 'New group description',
      };

      mockGroupRepository.findByName.mockResolvedValue(null);
      mockGroupRepository.createGroup.mockResolvedValue(mockGroup);

      const result = await service.createGroup(createGroupDto);

      expect(result).toEqual({
        id: mockGroup.id,
        name: mockGroup.name,
        description: mockGroup.description,
        createdAt: mockGroup.createdAt,
      });
      expect(mockGroupRepository.createGroup).toHaveBeenCalledWith(createGroupDto);
    });

    it('should throw ConflictException if group name already exists', async () => {
      const createGroupDto: CreateGroupDto = {
        name: 'Fitness Club',
      };

      mockGroupRepository.findByName.mockResolvedValue(mockGroup);

      await expect(service.createGroup(createGroupDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('getGroupById', () => {
    it('should return a group by id', async () => {
      mockGroupRepository.findById.mockResolvedValue(mockGroup);

      const result = await service.getGroupById('group-id');

      expect(result).toEqual({
        id: mockGroup.id,
        name: mockGroup.name,
        description: mockGroup.description,
        createdAt: mockGroup.createdAt,
      });
    });

    it('should throw NotFoundException if group not found', async () => {
      mockGroupRepository.findById.mockResolvedValue(null);

      await expect(service.getGroupById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
