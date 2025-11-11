import { Module } from '@nestjs/common';
import { NewslettersService } from './newsletters.service';
import { NewslettersController } from './newsletters.controller';
import { Newsletter } from './entities/newsletter.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Newsletter])],
  controllers: [NewslettersController],
  providers: [NewslettersService],
})
export class NewslettersModule {}
