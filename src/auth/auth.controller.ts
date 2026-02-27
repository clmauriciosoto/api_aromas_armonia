import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { AdminRole } from '../users/entities/admin.entity';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: AdminRole;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Admin login endpoint
   * @route POST /auth/login
   * @param loginDto - Email and password
   * @returns Access token and token details
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    return this.authService.login(loginDto);
  }

  /**
   * Get authenticated admin profile
   * @route GET /auth/profile
   * @requires JwtAuthGuard, RolesGuard with ADMIN role
   * @returns Admin profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN)
  async getProfile(
    @Request() request: AuthenticatedRequest,
  ): Promise<{
    id: string;
    email: string;
    role: AdminRole;
  }> {
    return this.authService.getProfile(request.user);
  }

  /**
   * Refresh token endpoint (structure for future implementation)
   * @route POST /auth/refresh
   * @returns New access token
   */
  @Post('refresh')
  async refreshToken(
    @Body() dto: RefreshTokenDto,
  ): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    return this.authService.refreshTokens(dto.refresh_token);
  }
}
