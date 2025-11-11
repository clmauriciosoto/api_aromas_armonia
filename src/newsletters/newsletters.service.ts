import { Injectable } from '@nestjs/common';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Newsletter } from './entities/newsletter.entity';
import { Repository } from 'typeorm';

@Injectable()
export class NewslettersService {
  constructor(
    @InjectRepository(Newsletter)
    private readonly newsletterRepository: Repository<Newsletter>,
  ) {}
  async subscribe(createNewsletterDto: CreateNewsletterDto) {
    try {
      const existingNewsletter = await this.newsletterRepository.findOne({
        where: { email: createNewsletterDto.email },
      });
      if (existingNewsletter) {
        return { ok: true };
      }

      const newsletter = this.newsletterRepository.create(createNewsletterDto);
      await this.newsletterRepository.save(newsletter);
      return { ok: true };
    } catch (error) {
      console.error('Error checking existing newsletter:', error);
      return { ok: false };
    }
  }
}
