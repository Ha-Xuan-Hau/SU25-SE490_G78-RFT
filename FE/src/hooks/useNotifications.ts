import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRecoilState } from "recoil";
import { notificationApi, NotificationItem } from "@/apis/notification.api";
import { notificationState } from "@/recoils/notificationState";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { useEffect, useCallback, useRef, useState } from "react";

export const useNotifications = () => {
  const [state, setState] = useRecoilState(notificationState);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // Force re-render trigger
  const [refreshKey, setRefreshKey] = useState(0);

  // Query cho unread count - QUAN TRỌNG: thêm refreshKey vào queryKey
  const { 
    data: unreadCountData, 
    error: unreadCountError, 
    refetch: refetchUnreadCount,
    isRefetching: isRefetchingUnread
  } = useQuery({
    queryKey: ["notifications", "unread-count", refreshKey], // Thêm refreshKey
    queryFn: async () => {
      const response = await notificationApi.getUnreadCount();
      console.log('📊 Fetched unread count:', response.data);
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 0,
    gcTime: 30000,
    refetchOnWindowFocus: false, // Tắt để tránh conflict
    refetchOnMount: true,
  });

  // Query cho danh sách notifications
  const {
    data: notificationsData,
    isLoading,
    refetch: refetchNotifications,
    error: notificationsError,
  } = useQuery({
    queryKey: ["notifications", "list", state.page, refreshKey], // Thêm refreshKey
    queryFn: async () => {
      const response = await notificationApi.getMyNotifications(state.page, 5);
      console.log('📋 Fetched notifications:', response.data);
      return response.data;
    },
    enabled: isAuthenticated && state.isDropdownOpen,
    staleTime: 0,
    gcTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Update unread count vào state - Simplified
  useEffect(() => {
    if (unreadCountData?.unreadCount !== undefined && !isRefetchingUnread) {
      const newCount = unreadCountData.unreadCount;
      console.log('🔔 Updating unread count to:', newCount);
      
      setState(prev => {
        // Chỉ update nếu thực sự khác
        if (prev.unreadCount !== newCount) {
          console.log('✅ State updated from', prev.unreadCount, 'to', newCount);
          return { ...prev, unreadCount: newCount };
        }
        return prev;
      });
    }
  }, [unreadCountData, isRefetchingUnread, setState]);

  // Update notifications list
  useEffect(() => {
    if (notificationsData && state.isDropdownOpen && !isLoading) {
      console.log('📋 Updating notifications list');
      setState(prev => {
        const newNotifications = state.page === 0 
          ? notificationsData.content 
          : [...prev.notifications, ...notificationsData.content];
        
        return {
          ...prev,
          notifications: newNotifications,
          hasMore: !notificationsData.last,
          isLoading: false,
        };
      });
    }
  }, [notificationsData, state.page, state.isDropdownOpen, isLoading, setState]);

  // Update loading state
  useEffect(() => {
    setState(prev => {
      if (prev.isLoading !== isLoading) {
        return { ...prev, isLoading };
      }
      return prev;
    });
  }, [isLoading, setState]);

  // WebSocket refresh handler - QUAN TRỌNG
  useEffect(() => {
    const handleWebSocketRefresh = () => {
      console.log('🚀 WebSocket notification refresh triggered');
      
      // Method 1: Force new query key to trigger refetch
      setRefreshKey(prev => prev + 1);
      
      // Method 2: Invalidate and refetch immediately
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
        exact: false,
        refetchType: 'all'
      });
      
      // Method 3: Direct refetch
      refetchUnreadCount();
      
      if (state.isDropdownOpen) {
        refetchNotifications();
      }
    };

    // Subscribe to cache updates
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated' && 
          event?.query?.queryKey?.[0] === 'notifications' &&
          event?.query?.queryKey?.[1] === 'unread-count') {
        
        const data = event.query.state.data as any;
        if (data?.unreadCount !== undefined) {
          console.log('📢 Cache updated with unread count:', data.unreadCount);
          
          // Force state update
          setState(prev => {
            if (prev.unreadCount !== data.unreadCount) {
              console.log('🔄 Forcing state update from cache');
              return { ...prev, unreadCount: data.unreadCount };
            }
            return prev;
          });
        }
      }
    });

    // Expose global refresh function for WebSocket
    (window as any).__refreshNotifications = handleWebSocketRefresh;

    return () => {
      unsubscribe();
      delete (window as any).__refreshNotifications;
    };
  }, [queryClient, refetchUnreadCount, refetchNotifications, state.isDropdownOpen, setState]);

  // Mutation cho click notification
  const clickNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await notificationApi.clickNotification(notificationId);
      return response.data;
    },
    onMutate: async (notificationId) => {
      // Optimistic update
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    },
    onSuccess: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
        refetchType: 'all'
      });
    },
    onError: (error, notificationId) => {
      console.error("Error clicking notification:", error);
      toast.error("Có lỗi xảy ra khi xử lý thông báo");
      
      // Revert optimistic update
      refetchUnreadCount();
      refetchNotifications();
    },
  });

  // Mutation cho mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onMutate: async () => {
      // Optimistic update
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notif => ({
          ...notif,
          isRead: true,
        })),
        unreadCount: 0,
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
        refetchType: 'all'
      });
    },
    onError: (error) => {
      console.error("Error marking all as read:", error);
      // Revert
      refetchUnreadCount();
      refetchNotifications();
    },
  });

  // Toggle dropdown với immediate refetch
  const toggleDropdown = useCallback(() => {
    const wasOpen = state.isDropdownOpen;
    
    setState(prev => ({
      ...prev,
      isDropdownOpen: !prev.isDropdownOpen,
      page: !prev.isDropdownOpen ? 0 : prev.page,
      notifications: !prev.isDropdownOpen ? [] : prev.notifications,
    }));

    // Refetch ngay khi mở
    if (!wasOpen) {
      console.log('📂 Opening dropdown, refetching...');
      Promise.all([
        refetchUnreadCount(),
        refetchNotifications()
      ]);
    }
  }, [state.isDropdownOpen, refetchNotifications, refetchUnreadCount, setState]);

  const closeDropdown = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDropdownOpen: false,
    }));
  }, [setState]);

  const loadMore = useCallback(() => {
    if (!state.isLoading && state.hasMore) {
      setState(prev => ({
        ...prev,
        page: prev.page + 1,
      }));
    }
  }, [state.isLoading, state.hasMore, setState]);

  const openModal = useCallback((notification: NotificationItem) => {
    setState(prev => ({
      ...prev,
      selectedModalNotification: notification,
    }));
  }, [setState]);

  const closeModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedModalNotification: null,
    }));
  }, [setState]);

  // Manual refresh với force key update
  const refreshNotifications = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
    
    // Force new queries
    setRefreshKey(prev => prev + 1);
    
    // Clear current state
    setState(prev => ({
      ...prev,
      page: 0,
      notifications: [],
    }));
    
    // Refetch all
    await Promise.all([
      refetchNotifications(),
      refetchUnreadCount()
    ]);
  }, [refetchNotifications, refetchUnreadCount, setState]);

  // Force refresh cho WebSocket - ENHANCED
  const forceRefresh = useCallback(async () => {
    console.log('⚡ Force refresh from WebSocket');
    
    // Increment key to force new query
    setRefreshKey(prev => prev + 1);
    
    // Invalidate all notification queries
    await queryClient.invalidateQueries({
      queryKey: ["notifications"],
      exact: false,
      refetchType: 'all'
    });
    
    // Direct refetch
    const promises = [refetchUnreadCount()];
    if (state.isDropdownOpen) {
      promises.push(refetchNotifications());
    }
    
    await Promise.all(promises);
  }, [queryClient, refetchUnreadCount, refetchNotifications, state.isDropdownOpen]);

  return {
    ...state,
    isLoading,
    toggleDropdown,
    closeDropdown,
    loadMore,
    openModal,
    closeModal,
    refreshNotifications,
    forceRefresh,
    clickNotification: clickNotificationMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    refetch: refetchNotifications,
    refetchUnreadCount, // Expose this
  };
};
