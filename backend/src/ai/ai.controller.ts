import { Body, Controller, Get, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  status() {
    return this.aiService.status();
  }

  @Post('chat')
  chat(@Body() dto: ChatRequestDto) {
    return this.aiService.chat(dto);
  }
}
