import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRepository } from '../user.repository';
import { CreateUserDto } from '../create-user.dto';
import { IUser } from '../user.interface';
import { User } from '../user.entity';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Crée un nouvel utilisateur
   * Vérifie l'unicité de l'email
   */
  async createUser(createUserDto: CreateUserDto): Promise<IUser> {
    // Idempotent sync path: if caller provides an ID and user already exists,
    // return existing user (and refresh profile fields if needed).
    if (createUserDto.id) {
      const existingById = await this.userRepository.findById(createUserDto.id);
      if (existingById) {
        const needsUpdate =
          existingById.email !== createUserDto.email ||
          existingById.username !== createUserDto.username;

        if (!needsUpdate) {
          return this.mapUserToInterface(existingById);
        }

        const existingEmail = await this.userRepository.findByEmail(createUserDto.email);
        if (existingEmail && existingEmail.id !== existingById.id) {
          throw new ConflictException(
            `Un utilisateur avec l'email ${createUserDto.email} existe déjà`,
          );
        }

        const existingUsername = await this.userRepository.findByUsername(
          createUserDto.username,
        );
        if (existingUsername && existingUsername.id !== existingById.id) {
          throw new ConflictException(
            `Un utilisateur avec le username ${createUserDto.username} existe déjà`,
          );
        }

        const updated = await this.userRepository.updateUser(existingById.id, {
          email: createUserDto.email,
          username: createUserDto.username,
        });

        return this.mapUserToInterface(updated ?? existingById);
      }
    }

    // Vérifier l'unicité de l'email
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException(
        `Un utilisateur avec l'email ${createUserDto.email} existe déjà`,
      );
    }

    // Vérifier l'unicité du username
    const existingUsername = await this.userRepository.findByUsername(
      createUserDto.username,
    );
    if (existingUsername) {
      throw new ConflictException(
        `Un utilisateur avec le username ${createUserDto.username} existe déjà`,
      );
    }

    const user = await this.userRepository.createUser(createUserDto);
    return this.mapUserToInterface(user);
  }

  /**
   * Récupère le profil d'un utilisateur par son ID
   */
  async getUserProfile(userId: string): Promise<IUser> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} non trouvé`);
    }

    return this.mapUserToInterface(user);
  }

  /**
   * Récupère un utilisateur par son email
   */
  async getUserByEmail(email: string): Promise<IUser | null> {
    if (!email) {
      throw new BadRequestException('email is required');
    }

    const user = await this.userRepository.findByEmail(email);
    return user ? this.mapUserToInterface(user) : null;
  }

  /**
   * Récupère un utilisateur par son username
   */
  async getUserByUsername(username: string): Promise<IUser | null> {
    if (!username) {
      throw new BadRequestException('username is required');
    }

    const user = await this.userRepository.findByUsername(username);
    return user ? this.mapUserToInterface(user) : null;
  }

  /**
   * Liste tous les utilisateurs
   */
  async listAllUsers(): Promise<IUser[]> {
    const users = await this.userRepository.findAll();
    return users.map((user) => this.mapUserToInterface(user));
  }

  /**
   * Vérifie si un utilisateur existe
   */
  async userExists(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    return !!user;
  }

  /**
   * Mappe une entité User vers l'interface IUser
   */
  private mapUserToInterface(user: User): IUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
