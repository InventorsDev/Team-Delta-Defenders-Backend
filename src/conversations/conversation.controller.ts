import { Controller, Get, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConversationsService } from './conversation.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findUserConversations(@Req() req: Request) {
    if (!req.user) throw new Error('User not found in request');
    return this.conversationsService.findUserConversations(req.user.userId);
  }
}
