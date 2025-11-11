import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { NewslettersService } from './newsletters.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';

@Controller('newsletters')
export class NewslettersController {
  constructor(private readonly newslettersService: NewslettersService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  async subscribe(@Body() createNewsletterDto: CreateNewsletterDto) {
    const resp = await this.newslettersService.subscribe(createNewsletterDto);
    return resp;
  }
}
