import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from './entities/admin.entity';
import { UsersService } from './users.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UpdateAdminStatusDto } from './dto/update-admin-status.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('admin-users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN)
@ApiBearerAuth('bearer')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAllAdmins();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateAdminDto) {
    return this.usersService.createAdmin(dto.email, dto.password);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAdminDto,
  ) {
    return this.usersService.updateAdmin(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAdminStatusDto,
  ) {
    return this.usersService.setAdminStatus(id, dto.isActive);
  }

  @Patch(':id/password')
  async changePassword(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.usersService.changeAdminPassword(
      id,
      dto.currentPassword,
      dto.newPassword,
    );

    return { message: 'Password updated successfully' };
  }
}
