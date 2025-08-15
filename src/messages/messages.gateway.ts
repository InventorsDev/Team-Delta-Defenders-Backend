import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagesGateway {
  @WebSocketServer() server!: Server;

  constructor(private readonly messagesService: MessagesService) {}

  @SubscribeMessage('joinConversation')
  handleJoinConversation(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
    client.join(conversationId);
    client.emit('joinedConversation', conversationId);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { conversationId: string; senderId: string; content: string },
  ) {
    const message = await this.messagesService.create(
      data.conversationId,
      data.senderId,
      data.content,
    );

    this.server.to(data.conversationId).emit('newMessage', message);
  }
}
