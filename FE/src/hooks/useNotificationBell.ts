// hooks/useNotificationBell.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/apis/notification.api";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { simpleWebSocketService } from '@/services/websocket.service';

export const useNotificationBell = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [localUnreadCount, setLocalUnreadCount] = useState(0);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Query unread count
  const { data, refetch } = useQuery({
    queryKey: ["notifications", "unread-count", updateTrigger],
    queryFn: async () => {
      const response = await notificationApi.getUnreadCount();
      console.log('🔔 Bell Query: Fetched unread count:', response.data);
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 0,
    gcTime: 30000,
  });

  // Update local state when data changes
  useEffect(() => {
    if (data?.unreadCount !== undefined) {
      console.log('🔔 Bell: Updating local count to', data.unreadCount);
      setLocalUnreadCount(data.unreadCount);
    }
  }, [data]);

  // Subscribe to cache updates
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Check for 'updated' event type
      if (event?.type === 'updated' && 
          event?.query?.queryKey?.[0] === 'notifications' &&
          event?.query?.queryKey?.[1] === 'unread-count') {
        
        const updatedData = event.query.state.data as any;
        console.log('🔔 Bell: Cache updated with data:', updatedData);
        
        if (updatedData?.unreadCount !== undefined) {
          setLocalUnreadCount(updatedData.unreadCount);
          setUpdateTrigger(prev => prev + 1); // Force re-render
        }
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  // WebSocket handler - directly in this hook
  useEffect(() => {
    const handleWebSocketUpdate = async () => {
      console.log('🔔 Bell: WebSocket notification received');
      
      // Method 1: Direct refetch
      await refetch();
      
      // Method 2: Invalidate and refetch
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
        exact: false,
        refetchType: 'all'
      });
      
      // Method 3: Get fresh data from cache
      setTimeout(() => {
        const freshData = queryClient.getQueryData<any>(["notifications", "unread-count"]);
        console.log('🔔 Bell: Fresh data from cache:', freshData);
        if (freshData?.unreadCount !== undefined) {
          setLocalUnreadCount(freshData.unreadCount);
          setUpdateTrigger(prev => prev + 1);
        }
      }, 100);
    };

    simpleWebSocketService.onRefresh('notification', handleWebSocketUpdate);
    console.log('🔔 Bell: Registered WebSocket handler');

    return () => {
      simpleWebSocketService.offRefresh('notification', handleWebSocketUpdate);
    };
  }, [queryClient, refetch]);

  return {
    unreadCount: localUnreadCount,
    updateTrigger, // For debugging
  };
};
