import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from './schemas/messages.schema';
import { ConversationService } from '../conversations/conversation.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
    private readonly conversationsService: ConversationService,
  ) {}

  async create(conversationId: string, senderId: string, content: string) {
    // Check conversation exists
    const conversation = await this.conversationsService.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Create new message
    const message = new this.messageModel({
      conversationId: new Types.ObjectId(conversationId), 
      sender: new Types.ObjectId(senderId),
      content,
    });

    const savedMessage = await message.save();

    // Update last message in conversation
    await this.conversationsService.updateLastMessage(
  conversationId,
  (savedMessage._id as Types.ObjectId).toString(), 
    );

    // Populate sender details
    return await savedMessage.populate('sender', 'name email');
  }

  async findMessagesByConversation(conversationId: string) {
    return this.messageModel
      .find({ conversation: new Types.ObjectId(conversationId) }) 
      .populate('sender', 'name email')
      .sort({ createdAt: 1 })
      .exec();
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only sender can delete
    if (!message.sender.equals(userId)) {  
      throw new ForbiddenException('You cannot delete this message');
    }

    await message.deleteOne();
    return { success: true };
  }
}
