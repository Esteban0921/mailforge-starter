import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readApiPort } from './env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Same-origin policy is relaxed for the local Next.js dev server.
  // Restrict to the real web origin before any public deployment.
  app.enableCors({ origin: true, credentials: true });

  const port = readApiPort();
  await app.listen(port);
  console.log(`[api] MailForge API escuchando en http://localhost:${port}`);
}

void bootstrap();
