import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from './schemas/messages.schema';
import { ConversationsService } from '../conversations/conversation.service';


@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    private conversationsService: ConversationsService,
  ) {}

  async create(conversationId: string, senderId: string, content: string) {
    // Verify conversation exists
    const conversation = await this.conversationsService.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const message = new this.messageModel({
      conversationId: new Types.ObjectId(conversationId),
      sender: new Types.ObjectId(senderId),
      content,
    });

    return message.save();
  }

  async findMessagesByConversation(conversationId: string) {
    return this.messageModel
      .find({ conversationId })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 })
      .exec();
  }
}
