import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import express, { Express, Request, Response } from 'express';

let cachedApp: Express;

async function createServer(): Promise<Express> {
  if (cachedApp) return cachedApp;

  const { AppModule } = await import('../backend-dist/app.module');

  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  const config = app.get(ConfigService);

  const origins = (config.get<string>('CORS_ORIGINS') ?? '*')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins.length === 1 && origins[0] === '*' ? true : origins,
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();
  cachedApp = server;
  return server;
}

export default async function handler(req: Request, res: Response) {
  const server = await createServer();
  return server(req, res);
}
