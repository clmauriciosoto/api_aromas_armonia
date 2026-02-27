import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([Admin])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
