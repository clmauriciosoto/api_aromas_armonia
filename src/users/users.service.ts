import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Admin, AdminRole } from './entities/admin.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
  ) {}

  /**
   * Create a new admin user with hashed password
   * @param email - Email address of the admin
   * @param password - Plain text password (will be hashed)
   * @returns Created admin entity (without password)
   * @throws BadRequestException if email already exists
   */
  async createAdmin(email: string, password: string): Promise<Admin> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }

    // Check if admin already exists
    const existingAdmin = await this.adminRepository.findOne({
      where: { email },
    });
    if (existingAdmin) {
      throw new BadRequestException('Email already exists');
    }

    try {
      // Hash password with bcrypt (10 salt rounds for production)
      const hashedPassword = await bcrypt.hash(password, 10);

      const admin = this.adminRepository.create({
        email,
        password: hashedPassword,
        role: AdminRole.ADMIN,
        isActive: true,
      });

      const savedAdmin = await this.adminRepository.save(admin);

      // Return admin without password
      return this.sanitizeAdmin(savedAdmin);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error creating admin user');
    }
  }

  /**
   * Find admin by email
   * @param email - Email address to search for
   * @returns Admin entity or null if not found
   */
  async findByEmail(email: string): Promise<Admin | null> {
    try {
      const admin = await this.adminRepository.findOne({
        where: { email },
      });
      return admin || null;
    } catch (error) {
      throw new InternalServerErrorException('Error finding admin by email');
    }
  }

  /**
   * Find admin by ID
   * @param id - Admin ID
   * @returns Admin entity or null if not found
   * @throws NotFoundException if admin not found
   */
  async findById(id: string): Promise<Admin> {
    try {
      const admin = await this.adminRepository.findOne({
        where: { id },
      });

      if (!admin) {
        throw new NotFoundException(`Admin with ID ${id} not found`);
      }

      return this.sanitizeAdmin(admin);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error finding admin by ID');
    }
  }

  /**
   * Find admin by ID including hashed refresh token
   * @param id - Admin ID
   * @returns Admin entity with refreshToken selected
   * @throws NotFoundException if admin not found
   */
  async findByIdWithRefreshToken(id: string): Promise<Admin> {
    try {
      const admin = await this.adminRepository
        .createQueryBuilder('admin')
        .addSelect('admin.refreshToken')
        .where('admin.id = :id', { id })
        .getOne();

      if (!admin) {
        throw new NotFoundException(`Admin with ID ${id} not found`);
      }

      return admin;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error finding admin refresh token',
      );
    }
  }

  /**
   * Persist hashed refresh token for an admin
   * @param adminId - Admin ID
   * @param refreshTokenHash - bcrypt-hashed refresh token
   */
  async updateRefreshTokenHash(
    adminId: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    try {
      await this.adminRepository.update({ id: adminId }, {
        refreshToken: refreshTokenHash,
      });
    } catch (error) {
      throw new InternalServerErrorException('Error updating refresh token');
    }
  }

  /**
   * Set the current refresh session (hash + version)
   */
  async setRefreshTokenSession(
    adminId: string,
    refreshTokenHash: string | null,
    refreshTokenVersion: number,
  ): Promise<void> {
    try {
      await this.adminRepository.update(
        { id: adminId },
        {
          refreshToken: refreshTokenHash,
          refreshTokenVersion,
        },
      );
    } catch {
      throw new InternalServerErrorException('Error setting refresh session');
    }
  }

  /**
   * Rotate refresh session atomically. Returns false when token version was already rotated.
   */
  async rotateRefreshTokenSession(
    adminId: string,
    expectedVersion: number,
    newRefreshTokenHash: string,
    newVersion: number,
  ): Promise<boolean> {
    try {
      const result = await this.adminRepository
        .createQueryBuilder()
        .update(Admin)
        .set({
          refreshToken: newRefreshTokenHash,
          refreshTokenVersion: newVersion,
        })
        .where('id = :adminId', { adminId })
        .andWhere('refreshTokenVersion = :expectedVersion', {
          expectedVersion,
        })
        .execute();

      return (result.affected ?? 0) === 1;
    } catch {
      throw new InternalServerErrorException('Error rotating refresh session');
    }
  }

  /**
   * Validate admin password
   * @param plainPassword - Plain text password from user input
   * @param hashedPassword - Hashed password from database
   * @returns true if passwords match, false otherwise
   */
  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw new InternalServerErrorException('Error validating password');
    }
  }

  /**
   * Remove sensitive information from admin entity
   * @param admin - Admin entity
   * @returns Admin entity without password
   */
  private sanitizeAdmin(admin: Admin): Admin {
    const { password, refreshToken, ...adminWithoutPassword } = admin;
    return adminWithoutPassword as Admin;
  }

  /**
   * Check if admin is active
   * @param admin - Admin entity
   * @returns true if admin is active
   */
  isAdminActive(admin: Admin): boolean {
    return admin.isActive && admin.role === AdminRole.ADMIN;
  }
}
