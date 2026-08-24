import 'reflect-metadata';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readApiPort, readCorsOrigins } from './env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  // Origin reflects by default (dev server port varies with autoPort);
  // set CORS_ORIGIN in production to lock it down. See env.ts.
  app.enableCors({ origin: readCorsOrigins(), credentials: true });

  const port = readApiPort();
  await app.listen(port);
  console.log(`[api] MailForge API escuchando en http://localhost:${port}`);
}

bootstrap().catch((error: unknown) => {
  console.error('[api] fallo al arrancar', error);
  process.exitCode = 1;
});
