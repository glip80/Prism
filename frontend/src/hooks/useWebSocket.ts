import { useEffect } from 'react';
import { socketClient } from '../services/websocket/socketClient';

export const useWebSocket = () => {
  useEffect(() => {
    socketClient.connect();

    return () => {
      socketClient.disconnect();
    };
  }, []);

  return socketClient;
};
