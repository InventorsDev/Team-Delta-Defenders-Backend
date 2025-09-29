import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

interface JwtRequest extends Request {
  user: {
    userId: string;
    email?: string;
    role: string;
  };
}

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationController {
  constructor(private readonly conversationsService: ConversationService) {}

  // Create a new conversation
  @Post()
  async createConversation(@Body() dto: CreateConversationDto) {
    return this.conversationsService.create(dto);
  }

  // Get conversations for the current logged-in user
  @Get('my')
  async getUserConversations(@Req() req: JwtRequest) {
    return this.conversationsService.findUserConversation(req.user.userId);
  }

  // Get a single conversation by ID
  @Get(':id')
  async getConversationById(@Param('id') id: string) {
    return this.conversationsService.findById(id);
  }
}
