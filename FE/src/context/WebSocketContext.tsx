import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { simpleWebSocketService } from '@/services/websocket.service';
import { useUserState } from '@/recoils/user.state';

interface SimpleWebSocketContextType {
  isConnected: boolean;
}

const SimpleWebSocketContext = createContext<SimpleWebSocketContextType | null>(null);

interface SimpleWebSocketProviderProps {
  children: ReactNode;
}

export const SimpleWebSocketProvider: React.FC<SimpleWebSocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [user] = useUserState();

  useEffect(() => {
    const initializeWebSocket = async () => {
      if (user && user.id) {
        try {
          console.log('Connecting WebSocket...');
          await simpleWebSocketService.connect();
          setIsConnected(true);
          console.log('WebSocket connected');
        } catch (error) {
          console.error('WebSocket connection failed:', error);
          setIsConnected(false);
          
          // Retry after 5 seconds
          setTimeout(() => {
            initializeWebSocket();
          }, 5000);
        }
      }
    };

    if (user && user.id) {
      initializeWebSocket();
    }

    return () => {
      simpleWebSocketService.disconnect();
      setIsConnected(false);
    };
  }, [user]);

  // Monitor connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const connectionStatus = simpleWebSocketService.getConnectionStatus();
      if (connectionStatus !== isConnected) {
        setIsConnected(connectionStatus);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const contextValue: SimpleWebSocketContextType = {
    isConnected,
  };

  return (
    <SimpleWebSocketContext.Provider value={contextValue}>
      {children}
    </SimpleWebSocketContext.Provider>
  );
};

export const useSimpleWebSocket = (): SimpleWebSocketContextType => {
  const context = useContext(SimpleWebSocketContext);
  if (!context) {
    throw new Error('useSimpleWebSocket must be used within a SimpleWebSocketProvider');
  }
  return context;
};
