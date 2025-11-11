import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

const loadOrigin = () => {
  try {
    return process.env.ORIGIN!.split(',');
  } catch {
    throw new Error('ORIGIN variable is not set properly');
  }
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.enableCors({
    origin: loadOrigin(),
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
