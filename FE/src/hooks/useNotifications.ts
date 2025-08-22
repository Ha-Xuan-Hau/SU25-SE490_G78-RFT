import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRecoilState } from "recoil";
import { notificationApi, NotificationItem } from "@/apis/notification.api";
import { notificationState } from "@/recoils/notificationState";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { useEffect, useCallback, useRef } from "react";

export const useNotifications = () => {
  const [state, setState] = useRecoilState(notificationState);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Sử dụng ref để tránh stale closure
  const stateRef = useRef(state);
  stateRef.current = state;

  // Query cho unread count với polling 5 giây
  const { data: unreadCountData, error: unreadCountError } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const response = await notificationApi.getUnreadCount();
      return response.data;
    },
    //refetchInterval: 5000,
    enabled: isAuthenticated,
    staleTime: 0,
    // gcTime: 30000,
    // refetchOnWindowFocus: false,
    // refetchOnMount: false,
  });

  // Query cho danh sách notifications
  const {
    data: notificationsData,
    isLoading,
    refetch,
    error: notificationsError,
  } = useQuery({
    queryKey: ["notifications", "list", state.page],
    queryFn: async () => {
      const response = await notificationApi.getMyNotifications(state.page, 5);
      return response.data;
    },
    enabled: isAuthenticated && state.isDropdownOpen,
    staleTime: 30000,
    gcTime: 300000,
  });

  // SỬA LỖI: Sử dụng useCallback và dependency array chính xác
  const updateUnreadCount = useCallback(
    (newCount: number) => {
      setState((prev) => {
        if (prev.unreadCount !== newCount) {
          return { ...prev, unreadCount: newCount };
        }
        return prev; // Không update nếu giá trị không thay đổi
      });
    },
    [setState]
  );

  const updateNotifications = useCallback(
    (newData: any, currentPage: number) => {
      setState((prev) => {
        const newNotifications =
          currentPage === 0
            ? newData.content
            : [...prev.notifications, ...newData.content];

        // Chỉ update nếu có thay đổi thực sự
        if (
          JSON.stringify(prev.notifications) !==
            JSON.stringify(newNotifications) ||
          prev.hasMore !== !newData.last ||
          prev.isLoading !== false
        ) {
          return {
            ...prev,
            notifications: newNotifications,
            hasMore: !newData.last,
            isLoading: false,
          };
        }
        return prev;
      });
    },
    [setState]
  );

  const updateLoadingState = useCallback(
    (loading: boolean) => {
      setState((prev) => {
        if (prev.isLoading !== loading) {
          return { ...prev, isLoading: loading };
        }
        return prev;
      });
    },
    [setState]
  );

  // Effect để update unread count - SỬA LỖI
  useEffect(() => {
    if (
      unreadCountData &&
      unreadCountData.unreadCount !== stateRef.current.unreadCount
    ) {
      updateUnreadCount(unreadCountData.unreadCount);
    }
  }, [unreadCountData, updateUnreadCount]);

  // Effect để update notifications data - SỬA LỖI
  useEffect(() => {
    if (notificationsData) {
      updateNotifications(notificationsData, stateRef.current.page);
    }
  }, [notificationsData, updateNotifications]);

  // Effect để handle loading state - SỬA LỖI
  useEffect(() => {
    if (stateRef.current.isLoading !== isLoading) {
      updateLoadingState(isLoading);
    }
  }, [isLoading, updateLoadingState]);

  // Effect để handle error
  useEffect(() => {
    if (unreadCountError) {
      console.error("Error fetching unread count:", unreadCountError);
    }
  }, [unreadCountError]);

  useEffect(() => {
    if (notificationsError) {
      updateLoadingState(false);
      console.error("Error fetching notifications:", notificationsError);
    }
  }, [notificationsError, updateLoadingState]);

  // Mutation cho click notification
  const clickNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await notificationApi.clickNotification(notificationId);
      return response.data;
    },
    onSuccess: (data, notificationId) => {
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));

      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
    onError: (error) => {
      console.error("Error clicking notification:", error);
      toast.error("Có lỗi xảy ra khi xử lý thông báo");
    },
  });

  // Mutation cho mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((notif) => ({
          ...notif,
          isRead: true,
        })),
        unreadCount: 0,
      }));

      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
      // toast.success("Đã đánh dấu tất cả thông báo là đã đọc");
    },
    onError: (error) => {
      console.error("Error marking all as read:", error);
      // toast.error("Có lỗi xảy ra khi đánh dấu thông báo");
    },
  });

  // Functions - SỬA LỖI: Sử dụng useCallback
  const toggleDropdown = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isDropdownOpen: !prev.isDropdownOpen,
      page: !prev.isDropdownOpen ? 0 : prev.page,
    }));
  }, [setState]);

  const closeDropdown = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isDropdownOpen: false,
    }));
  }, [setState]);

  const loadMore = useCallback(() => {
    if (!stateRef.current.isLoading && stateRef.current.hasMore) {
      setState((prev) => ({
        ...prev,
        page: prev.page + 1,
      }));
    }
  }, [setState]);

  const openModal = useCallback(
    (notification: NotificationItem) => {
      setState((prev) => ({
        ...prev,
        selectedModalNotification: notification,
      }));
    },
    [setState]
  );

  const closeModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedModalNotification: null,
    }));
  }, [setState]);

  const refreshNotifications = useCallback(() => {
    setState((prev) => ({
      ...prev,
      page: 0,
      notifications: [],
    }));
    refetch();
  }, [setState, refetch]);

  return {
    ...state,
    isLoading,
    toggleDropdown,
    closeDropdown,
    loadMore,
    openModal,
    closeModal,
    refreshNotifications,
    clickNotification: clickNotificationMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    refetch,
  };
};
