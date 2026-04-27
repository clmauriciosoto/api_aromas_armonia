import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { existsSync } from 'fs';
import { join } from 'path';
import { MailService } from './mail.service';

const sourceTemplatesDir = join(process.cwd(), 'src', 'mail', 'templates');
const distTemplatesDir = join(__dirname, 'templates');
const templatesDir = existsSync(sourceTemplatesDir)
  ? sourceTemplatesDir
  : distTemplatesDir;

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
          port: Number(process.env.MAIL_PORT ?? 587),
          secure: process.env.MAIL_SECURE === 'true',
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASSWORD,
          },
        },
        defaults: {
          from: `"${process.env.MAIL_FROM_NAME ?? 'Aromas de Armonía'}" <${process.env.MAIL_FROM_ADDRESS}>`,
        },
        template: {
          dir: templatesDir,
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
