import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../stores/authStore';

class SocketClient {
  private socket: Socket | null = null;
  private url = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

  connect() {
    if (this.socket?.connected) return;

    const token = useAuthStore.getState().token;
    
    this.socket = io(this.url, {
      auth: { token },
      autoConnect: true,
      transports: ['websocket']
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToLayout(layoutId: string) {
    this.socket?.emit('subscribe:layout', layoutId);
  }

  unsubscribeFromLayout(layoutId: string) {
    this.socket?.emit('unsubscribe:layout', layoutId);
  }

  subscribeToWidget(widgetId: string) {
    this.socket?.emit('subscribe:widget', widgetId);
  }
  
  unsubscribeFromWidget(widgetId: string) {
    this.socket?.emit('unsubscribe:widget', widgetId);
  }

  onLayoutUpdate(callback: (data: any) => void) {
    this.socket?.on('layout:updated', callback);
  }
  
  offLayoutUpdate(callback: (data: any) => void) {
    this.socket?.off('layout:updated', callback);
  }

  onWidgetDataUpdate(callback: (data: any) => void) {
    this.socket?.on('widget:data:updated', callback);
  }
  
  offWidgetDataUpdate(callback: (data: any) => void) {
    this.socket?.off('widget:data:updated', callback);
  }
}

export const socketClient = new SocketClient();
