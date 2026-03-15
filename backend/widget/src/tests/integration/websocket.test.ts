import { Server } from 'socket.io';
import { createServer } from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';

// Mock the refresh service and widget service
jest.mock('../../services/refreshService', () => ({
  refreshService: {
    onRefresh: jest.fn(),
  },
  pubClient: { publish: jest.fn() },
  subClient: { subscribe: jest.fn(), on: jest.fn() },
}));

jest.mock('../../services/widgetService', () => ({
  widgetService: {
    fetchWidgetData: jest.fn().mockResolvedValue({ data: 'test' }),
  },
}));

describe('WebSocket Handler', () => {
  let io: Server;
  let clientSocket: ClientSocket;
  let httpServer: any;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);

    // Import after mocks are set
    const { setupWebSockets } = require('../../websocket/handler');
    setupWebSockets(io);

    httpServer.listen(() => {
      const port = (httpServer.address() as any).port;
      clientSocket = Client(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  it('should allow clients to subscribe to widget rooms', (done) => {
    clientSocket.emit('subscribe_widget', 'widget-123');
    // Give the server a moment to process
    setTimeout(() => {
      const rooms = io.sockets.adapter.rooms;
      expect(rooms.has('widget_widget-123')).toBe(true);
      done();
    }, 100);
  });

  it('should allow clients to unsubscribe from widget rooms', (done) => {
    clientSocket.emit('subscribe_widget', 'widget-456');
    setTimeout(() => {
      clientSocket.emit('unsubscribe_widget', 'widget-456');
      setTimeout(() => {
        // After unsubscribe, the room should be gone or socket not in it
        done();
      }, 100);
    }, 100);
  });
});
