import { Controller, Post, Get, Delete, Body, Req, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
async createMessage(
  @Req() req: Request,
  @Body() dto: CreateMessageDto,
) {
  if (!req.user) throw new UnauthorizedException();
  const senderId = (req.user as any).userId;
  return this.messagesService.create(dto.conversationId, senderId, dto.content);
}

  @Get(':conversationId')
  async getMessages(@Param('conversationId') conversationId: string) {
    return this.messagesService.findMessagesByConversation(conversationId);
  }

  @Delete(':id')
  async deleteMessage(@Req() req: Request, @Param('id') messageId: string) {
    if (!req.user) throw new UnauthorizedException();
    return this.messagesService.deleteMessage(messageId, (req.user as any).userId);
  }
}
