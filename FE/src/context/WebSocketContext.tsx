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
  const [connectionAttempted, setConnectionAttempted] = useState(false);

  useEffect(() => {
    // Prevent multiple connection attempts
    if (connectionAttempted) return;

    const initializeWebSocket = async () => {
      if (user && user.id) {
        try {
          console.log('Connecting WebSocket for user:', user.id);
          setConnectionAttempted(true);
          await simpleWebSocketService.connect();
          setIsConnected(true);
          console.log('WebSocket connected successfully');
        } catch (error) {
          console.error('WebSocket connection failed:', error);
          setIsConnected(false);
          
          // Retry after 5 seconds (only once)
          setTimeout(() => {
            setConnectionAttempted(false); // Allow retry
            initializeWebSocket();
          }, 5000);
        }
      }
    };

    if (user && user.id && !connectionAttempted) {
      initializeWebSocket();
    }

    return () => {
      // Clean up on unmount
      if (connectionAttempted) {
        console.log('Cleaning up WebSocket connection');
        simpleWebSocketService.disconnect();
        setIsConnected(false);
        setConnectionAttempted(false);
      }
    };
  }, [user?.id]); // Only depend on user.id

  // Monitor connection status with less frequent checks
  useEffect(() => {
    if (!connectionAttempted) return;

    const interval = setInterval(() => {
      const connectionStatus = simpleWebSocketService.getConnectionStatus();
      if (connectionStatus !== isConnected) {
        setIsConnected(connectionStatus);
        console.log('WebSocket status changed:', connectionStatus);
      }
    }, 5000); // Check every 5 seconds instead of 2

    return () => clearInterval(interval);
  }, [isConnected, connectionAttempted]);

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
