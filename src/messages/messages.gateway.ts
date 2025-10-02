import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagesGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) throw new Error('No token provided');

      const payload = this.jwtService.verify(token);
      (client as any).user = payload;
      console.log(`Socket connected: ${payload.userId}`);
    } catch (err) {
      console.log('Invalid token, disconnecting...');
      client.disconnect();
    }
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    client.join(conversationId);
    client.emit('joinedConversation', conversationId);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { conversationId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user;
    if (!user) {
      client.emit('error', 'Unauthorized');
      return;
    }

    const message = await this.messagesService.create(
      data.conversationId,
      user.userId,
      data.content,
    );

    this.server.to(data.conversationId).emit('newMessage', message);
  }
}
