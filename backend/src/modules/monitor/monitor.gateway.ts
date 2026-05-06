import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { MonitorService } from './monitor.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/monitor',
})
export class MonitorGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MonitorGateway.name);

  constructor(private monitorService: MonitorService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.monitorService.unsubscribeAll(client.id);
  }

  @SubscribeMessage('subscribe:program')
  async handleSubscribeProgram(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { programId: string; filters?: any },
  ) {
    try {
      const room = `program:${data.programId}`;
      await client.join(room);
      
      this.monitorService.addSubscription(client.id, data.programId, data.filters);
      
      // Send initial data
      const recentTx = await this.monitorService.getRecentTransactions(data.programId, 10);
      client.emit('initial:transactions', recentTx);
      
      this.logger.log(`Client ${client.id} subscribed to program ${data.programId}`);
      
      return { success: true, room };
    } catch (error) {
      this.logger.error('Error subscribing to program:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('unsubscribe:program')
  async handleUnsubscribeProgram(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { programId: string },
  ) {
    const room = `program:${data.programId}`;
    await client.leave(room);
    
    this.monitorService.removeSubscription(client.id, data.programId);
    
    this.logger.log(`Client ${client.id} unsubscribed from program ${data.programId}`);
    
    return { success: true };
  }

  // Broadcast new transaction to subscribers
  async broadcastTransaction(programId: string, transaction: any) {
    const room = `program:${programId}`;
    this.server.to(room).emit('transaction:new', transaction);
  }

  // Broadcast alert to subscribers
  async broadcastAlert(programId: string, alert: any) {
    const room = `program:${programId}`;
    this.server.to(room).emit('alert:triggered', alert);
  }
}
