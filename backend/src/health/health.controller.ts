import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async check() {
    let database: 'connected' | 'error' | 'not_configured' = 'not_configured';
    let databaseError: string | undefined;

    const databaseUrl = this.config.get<string>('DATABASE_URL');
    if (databaseUrl) {
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        database = 'connected';
      } catch (error) {
        database = 'error';
        databaseError = error instanceof Error ? error.message : 'Unknown database error';
      }
    }

    const groqConfigured = Boolean(this.config.get<string>('GROQ_API_KEY'));

    return {
      status: database === 'connected' ? 'ok' : 'degraded',
      service: 'veridian-clinical-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database,
      databaseError,
      liveLlm: groqConfigured,
      groqModel: this.config.get<string>('GROQ_MODEL') ?? 'llama-3.3-70b-versatile',
    };
  }
}
