import 'reflect-metadata';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { readApiPort, readCorsOrigins } from './env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  // Origin reflects by default (dev server port varies with autoPort);
  // set CORS_ORIGIN in production to lock it down. See env.ts.
  app.enableCors({ origin: readCorsOrigins(), credentials: true });
  // whitelist+forbidNonWhitelisted: an unexpected body field is a bug on the
  // caller's side, not something to silently drop. transform: true lets DTOs
  // receive already-coerced values (@Type()-style) instead of raw strings.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const port = readApiPort();
  await app.listen(port);
  console.log(`[api] MailForge API escuchando en http://localhost:${port}`);
}

bootstrap().catch((error: unknown) => {
  console.error('[api] fallo al arrancar', error);
  process.exitCode = 1;
});
