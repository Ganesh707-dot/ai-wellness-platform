import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ method?: string; url?: string }>();
    const started = Date.now();
    const method = req.method ?? 'GET';
    const url = req.url ?? '';

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - started;
        console.log(`[${method}] ${url} — ${ms}ms`);
      }),
    );
  }
}
