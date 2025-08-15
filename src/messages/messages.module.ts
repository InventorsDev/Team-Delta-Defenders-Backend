import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schemas/messages.schema';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { ConversationsModule } from '../conversations/conversation.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    ConversationsModule, // Import so we can inject service
  ],
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesService],
})
export class MessagesModule {}
