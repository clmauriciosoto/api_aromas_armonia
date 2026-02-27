import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new UnauthorizedException('JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  /**
   * Validate JWT payload and ensure user is active
   * @param payload - JWT payload containing sub, email, role
   * @returns User object for request
   * @throws UnauthorizedException if user not found or inactive
   */
  async validate(payload: JwtPayload) {
    try {
      const admin = await this.usersService.findById(payload.sub);

      // Check if admin is still active
      if (!this.usersService.isAdminActive(admin)) {
        throw new UnauthorizedException('Admin is not active');
      }

      // Return user object that will be attached to request.user
      return {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}
