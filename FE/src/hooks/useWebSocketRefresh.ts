import { useEffect } from 'react';
import { simpleWebSocketService } from '@/services/websocket.service';
import { useQueryClient } from '@tanstack/react-query';

export const useWebSocketRefresh = (target: string, queryKeys: string[]) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const refreshHandler = () => {
      console.log(`Refreshing data for: ${target}`);
      // Invalidate all specified query keys
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    };

    // Register refresh handler
    simpleWebSocketService.onRefresh(target, refreshHandler);

    // Cleanup on unmount
    return () => {
      simpleWebSocketService.offRefresh(target, refreshHandler);
    };
  }, [target, queryKeys, queryClient]);
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
  useWebSocketRefresh('notification', ['notifications', 'unread-count']);
};
