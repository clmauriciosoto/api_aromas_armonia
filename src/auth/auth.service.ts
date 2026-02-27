import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { Admin, AdminRole } from '../users/entities/admin.entity';

interface AuthTokensResponse {
  access_token: string;
  refresh_token: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: AdminRole;
}

interface RefreshJwtPayload extends JwtPayload {
  tokenId: string;
  tokenVersion: number;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private isJwtPayload(payload: unknown): payload is JwtPayload {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const maybePayload = payload as Record<string, unknown>;

    return (
      typeof maybePayload.sub === 'string' &&
      typeof maybePayload.email === 'string' &&
      Object.values(AdminRole).includes(maybePayload.role as AdminRole)
    );
  }

  private isRefreshJwtPayload(payload: unknown): payload is RefreshJwtPayload {
    if (!this.isJwtPayload(payload)) {
      return false;
    }

    const maybePayload = payload as unknown as Record<string, unknown>;
    return (
      typeof maybePayload.tokenId === 'string' &&
      typeof maybePayload.tokenVersion === 'number' &&
      Number.isInteger(maybePayload.tokenVersion) &&
      maybePayload.tokenVersion >= 1
    );
  }

  private isRefreshTokenAdmin(
    admin: unknown,
  ): admin is Admin & { refreshToken: string | null } {
    if (!admin || typeof admin !== 'object') {
      return false;
    }

    const maybeAdmin = admin as Record<string, unknown>;

    return (
      typeof maybeAdmin.id === 'string' &&
      typeof maybeAdmin.email === 'string' &&
      Object.values(AdminRole).includes(maybeAdmin.role as AdminRole) &&
      typeof maybeAdmin.isActive === 'boolean' &&
      typeof maybeAdmin.refreshTokenVersion === 'number' &&
      (typeof maybeAdmin.refreshToken === 'string' ||
        maybeAdmin.refreshToken === null)
    );
  }

  private getRefreshTokenVersion(admin: Admin): number {
    const maybeAdmin = admin as unknown as { refreshTokenVersion?: unknown };

    if (
      typeof maybeAdmin.refreshTokenVersion !== 'number' ||
      !Number.isInteger(maybeAdmin.refreshTokenVersion) ||
      maybeAdmin.refreshTokenVersion < 0
    ) {
      throw new UnauthorizedException('Invalid admin refresh token state');
    }

    return maybeAdmin.refreshTokenVersion;
  }

  /**
   * Login admin with email and password
   * @param loginDto - Login credentials
   * @returns Access token and token details
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(loginDto: LoginDto): Promise<AuthTokensResponse> {
    try {
      const { email, password } = loginDto;

      // Find admin by email
      const admin = await this.usersService.findByEmail(email);

      if (!admin) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Check if admin is active
      if (!this.usersService.isAdminActive(admin)) {
        throw new UnauthorizedException('This admin account is not active');
      }

      // Validate password
      const isPasswordValid = await this.usersService.validatePassword(
        password,
        admin.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const currentTokenVersion = this.getRefreshTokenVersion(admin);
      const nextTokenVersion = currentTokenVersion + 1;
      const tokens = await this.generateTokens(admin, nextTokenVersion);
      const refreshTokenHash = await bcrypt.hash(tokens.refresh_token, 10);
      await this.usersService.setRefreshTokenSession(
        admin.id,
        refreshTokenHash,
        nextTokenVersion,
      );

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error during login');
    }
  }

  /**
   * Generate JWT access and refresh tokens
   * @param admin - Admin entity
   * @returns Signed token pair
   */
  private async generateTokens(
    admin: Admin,
    tokenVersion: number,
  ): Promise<AuthTokensResponse> {
    try {
      const accessSecret = this.configService.get<string>('JWT_SECRET');
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET');

      if (!accessSecret || !refreshSecret) {
        throw new InternalServerErrorException(
          'JWT secrets are not configured',
        );
      }

      const payload: JwtPayload = {
        sub: admin.id,
        email: admin.email,
        role: admin.role,
      };

      const refreshPayload: RefreshJwtPayload = {
        ...payload,
        tokenId: randomUUID(),
        tokenVersion,
      };

      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload, {
          secret: accessSecret,
          expiresIn: '1h',
        }),
        this.jwtService.signAsync(refreshPayload, {
          secret: refreshSecret,
          expiresIn: '7d',
        }),
      ]);

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    } catch (error: unknown) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to generate auth tokens', {
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Get admin profile from JWT payload
   * @param admin - Admin object from request (populated by JwtStrategy)
   * @returns Admin profile data
   * @throws UnauthorizedException if admin not found
   */
  getProfile(
    admin: Partial<Admin>,
  ): Promise<{ id: string; email: string; role: AdminRole }> {
    try {
      if (!admin || !admin.id || !admin.email || !admin.role) {
        throw new UnauthorizedException('Admin not found in token');
      }

      return Promise.resolve({
        id: admin.id,
        email: admin.email,
        role: admin.role,
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error retrieving profile');
    }
  }

  /**
   * Validate refresh token, rotate token pair, and return fresh credentials
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokensResponse> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!refreshSecret) {
      throw new InternalServerErrorException(
        'JWT_REFRESH_SECRET is not configured',
      );
    }

    let decodedPayload: unknown;

    try {
      decodedPayload = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!this.isRefreshJwtPayload(decodedPayload)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = decodedPayload;

    let admin: Admin & { refreshToken: string | null };

    try {
      const adminCandidate: unknown =
        await this.usersService.findByIdWithRefreshToken(payload.sub);

      if (!this.isRefreshTokenAdmin(adminCandidate)) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      admin = adminCandidate;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!this.usersService.isAdminActive(admin)) {
      throw new UnauthorizedException('Admin account is not active');
    }

    const currentTokenVersion = this.getRefreshTokenVersion(admin);

    if (payload.tokenVersion !== currentTokenVersion) {
      throw new UnauthorizedException('Refresh token has already been rotated');
    }

    if (!admin.refreshToken) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      admin.refreshToken,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const nextTokenVersion = currentTokenVersion + 1;
    const newTokens = await this.generateTokens(admin, nextTokenVersion);
    const newRefreshTokenHash = await bcrypt.hash(newTokens.refresh_token, 10);
    const rotated = await this.usersService.rotateRefreshTokenSession(
      admin.id,
      currentTokenVersion,
      newRefreshTokenHash,
      nextTokenVersion,
    );

    if (!rotated) {
      throw new UnauthorizedException('Refresh token has already been used');
    }

    return newTokens;
  }
}
