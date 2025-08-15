import { Controller, Post, Get, Body, Req, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  createMessage(@Req() req: Request, @Body() dto: { conversationId: string; content: string }) {
    if (!req.user) throw new UnauthorizedException();
    return this.messagesService.create(dto.conversationId, req.user.userId, dto.content);
  }

  @Get(':conversationId')
  getMessages(@Param('conversationId') conversationId: string) {
    return this.messagesService.findMessagesByConversation(conversationId);
  }
}
