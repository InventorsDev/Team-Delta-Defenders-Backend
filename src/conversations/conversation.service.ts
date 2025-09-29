import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation } from './schemas/conversation.schema';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Injectable()
export class ConversationService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,
  ) {}

  async create(
    createConversationDto: CreateConversationDto,
  ): Promise<Conversation> {
    const conversation = new this.conversationModel(createConversationDto);
    return conversation.save();
  }

  async findById(id: string): Promise<Conversation> {
    const conversation = await this.conversationModel
      .findById(id)
      .populate('participants', 'name email');
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  async findUserConversation(userId: string): Promise<Conversation[]> {
    return this.conversationModel
      .find({ participants: new Types.ObjectId(userId) })
      .populate('participants', 'name email')
      .exec();
  }

  async updateLastMessage(
    conversationId: string,
    messageId: string,
  ): Promise<Conversation> {
    const conversation = await this.conversationModel.findByIdAndUpdate(
      conversationId,
      { lastMessage: new Types.ObjectId(messageId) },
      { new: true },
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }
}
