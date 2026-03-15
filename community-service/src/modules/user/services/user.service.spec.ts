import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../services/user.service';
import { UserRepository } from '../user.repository';
import { CreateUserDto } from '../create-user.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let repository: UserRepository;

  const mockUser = {
    id: 'test-id',
    username: 'testuser',
    email: 'test@example.com',
    createdAt: new Date(),
    memberships: [],
  };

  const mockUserRepository = {
    createUser: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    findAll: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const createUserDto: CreateUserDto = {
        username: 'newuser',
        email: 'newuser@example.com',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.createUser.mockResolvedValue(mockUser);

      const result = await service.createUser(createUserDto);

      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
      });
      expect(mockUserRepository.createUser).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        username: 'newuser',
        email: 'test@example.com',
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.createUser(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getUserProfile('test-id');

      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.getUserProfile('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
