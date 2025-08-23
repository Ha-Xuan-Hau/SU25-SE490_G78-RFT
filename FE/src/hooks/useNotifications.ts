// hooks/useNotifications.ts
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

  // GIỮ NGUYÊN: Sử dụng ref để tránh stale closure
  const stateRef = useRef(state);
  stateRef.current = state;

  // SỬA ĐỔI: Thêm refetch function và thay đổi staleTime, gcTime
  const {
    data: unreadCountData,
    error: unreadCountError,
    refetch: refetchUnreadCount, // THÊM MỚI: Lấy refetch function
  } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const response = await notificationApi.getUnreadCount();
      return response.data;
    },
    refetchInterval: 5000, // GIỮ NGUYÊN: polling 5 giây
    enabled: isAuthenticated,
    staleTime: 0, // THAY ĐỔI: từ 0 sang 0 (giữ nguyên nhưng explicit)
    gcTime: 0, // THAY ĐỔI: từ 30000 sang 0
    refetchOnWindowFocus: true, // THAY ĐỔI: từ false sang true
    refetchOnMount: true, // THAY ĐỔI: từ false sang true
  });

  // SỬA ĐỔI: Thay đổi staleTime và gcTime
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
    staleTime: 0, // THAY ĐỔI: từ 30000 sang 0
    gcTime: 0, // THAY ĐỔI: từ 300000 sang 0
  });

  // GIỮ NGUYÊN: Các callback functions
  const updateUnreadCount = useCallback(
    (newCount: number) => {
      setState((prev) => {
        if (prev.unreadCount !== newCount) {
          return { ...prev, unreadCount: newCount };
        }
        return prev;
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

  // SỬA ĐỔI: Thêm console.log để debug
  useEffect(() => {
    if (
      unreadCountData &&
      unreadCountData.unreadCount !== stateRef.current.unreadCount
    ) {
      console.log(
        "Updating unread count from query:",
        unreadCountData.unreadCount
      ); // THÊM MỚI
      updateUnreadCount(unreadCountData.unreadCount);
    }
  }, [unreadCountData, updateUnreadCount]);

  // GIỮ NGUYÊN: Các effect khác
  useEffect(() => {
    if (notificationsData) {
      updateNotifications(notificationsData, stateRef.current.page);
    }
  }, [notificationsData, updateNotifications]);

  useEffect(() => {
    if (stateRef.current.isLoading !== isLoading) {
      updateLoadingState(isLoading);
    }
  }, [isLoading, updateLoadingState]);

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

  // SỬA ĐỔI: Thêm onMutate và cancel queries
  const clickNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await notificationApi.clickNotification(notificationId);
      return response.data;
    },
    onMutate: async (notificationId) => {
      // THÊM MỚI: onMutate
      // Optimistic update
      setState((prev) => {
        const notif = prev.notifications.find((n) => n.id === notificationId);
        if (!notif || notif.isRead) return prev;

        return {
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, prev.unreadCount - 1),
        };
      });

      // THÊM MỚI: Cancel queries
      await queryClient.cancelQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
    onSuccess: (data, notificationId) => {
      // SỬA ĐỔI: Không update state ở đây nữa, chỉ refetch
      refetchUnreadCount(); // THÊM MỚI: Refetch unread count
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
    onError: (error) => {
      console.error("Error clicking notification:", error);
      toast.error("Có lỗi xảy ra khi xử lý thông báo");
      // THÊM MỚI: Rollback nếu lỗi
      refetch();
      refetchUnreadCount();
    },
  });

  // SỬA ĐỔI: Thêm onMutate và cancel queries
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onMutate: async () => {
      // THÊM MỚI: onMutate
      // Optimistic update
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((notif) => ({
          ...notif,
          isRead: true,
        })),
        unreadCount: 0,
      }));

      // THÊM MỚI: Cancel queries
      await queryClient.cancelQueries({
        queryKey: ["notifications"],
      });
    },
    onSuccess: () => {
      // SỬA ĐỔI: Không update state ở đây nữa
      refetchUnreadCount(); // THÊM MỚI: Refetch unread count
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
      // GIỮ NGUYÊN: Comment toast
      // toast.success("Đã đánh dấu tất cả thông báo là đã đọc");
    },
    onError: (error) => {
      console.error("Error marking all as read:", error);
      // GIỮ NGUYÊN: Comment toast
      // toast.error("Có lỗi xảy ra khi đánh dấu thông báo");
    },
  });

  // GIỮ NGUYÊN: Tất cả functions callback
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
    refetchUnreadCount(); // THÊM MỚI: refetch unread count
  }, [setState, refetch, refetchUnreadCount]);

  // THÊM MỚI: Manual force update function
  const forceUpdateUnreadCount = useCallback(() => {
    refetchUnreadCount();
  }, [refetchUnreadCount]);

  // GIỮ NGUYÊN: Return object với thêm forceUpdateUnreadCount
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
    forceUpdateUnreadCount, // THÊM MỚI: Export để có thể gọi từ bên ngoài
  };
};
