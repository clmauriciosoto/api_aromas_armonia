import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['https://aromasdearmonia.cl', 'https://www.aromasdearmonia.cl'],
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
