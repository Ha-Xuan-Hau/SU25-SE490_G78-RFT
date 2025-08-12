import { useEffect } from 'react';
import { simpleWebSocketService } from '@/services/websocket.service';
import { useQueryClient } from '@tanstack/react-query';

export const useWebSocketRefresh = (target: string, queryKeys: string[]) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const refreshHandler = () => {
      console.log(`🔄 WebSocket refresh triggered for: ${target}`);
      // Invalidate all specified query keys
      queryKeys.forEach(key => {
        console.log(`Invalidating queries with key: ${key}`);
        queryClient.invalidateQueries({ 
          queryKey: [key],
          exact: false // This will invalidate all queries that start with this key
        });
      });
      
      // Also try to refetch queries that are currently active
      queryClient.refetchQueries({
        type: 'active',
        stale: true
      });
    };

    // Register refresh handler
    simpleWebSocketService.onRefresh(target, refreshHandler);
    console.log(`📝 Registered WebSocket refresh handler for: ${target}`);

    // Cleanup on unmount
    return () => {
      console.log(`🗑️ Cleaning up WebSocket refresh handler for: ${target}`);
      simpleWebSocketService.offRefresh(target, refreshHandler);
    };
  }, [target, queryKeys.join(','), queryClient]); // Use join for stable dependency
};

// Specific hooks for different features
export const useWalletRefresh = () => {
  useWebSocketRefresh('wallet', ['wallet', 'wallet-transactions', 'user-wallet']);
};

export const useBookingRefresh = () => {
  useWebSocketRefresh('booking', ['bookings', 'user-bookings', 'provider-bookings']);
};

export const useVehicleRefresh = () => {
  useWebSocketRefresh('vehicle', ['vehicles', 'user-vehicles']);
};

export const useNotificationRefresh = () => {
  useWebSocketRefresh('notification', ['notifications', 'unread-count', 'unread-notifications']);
};
