import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const loadOrigins = (): string[] => {
  return (process.env.ORIGIN ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const isLocalhostOrigin = (origin: string): boolean => {
  try {
    const url = new URL(origin);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

const loadAppVersion = (): string => {
  try {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      version?: string;
    };
    return packageJson.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appLogger = new Logger('AppVersion');
  const corsLogger = new Logger('CORS');
  appLogger.log(`Version deployed: ${loadAppVersion()}`);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Aromas Armonia API')
    .setDescription('API documentation for Aromas Armonia backend services')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide a valid JWT access token',
      },
      'bearer',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const allowedOrigins = new Set(loadOrigins());
  const isProduction = process.env.NODE_ENV === 'production';

  corsLogger.log(
    `Allowed origins: ${Array.from(allowedOrigins).join(', ') || '(none configured)'}`,
  );

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      if (!isProduction && isLocalhostOrigin(origin)) {
        callback(null, true);
        return;
      }

      corsLogger.warn(`Blocked origin: ${origin}`);
      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
