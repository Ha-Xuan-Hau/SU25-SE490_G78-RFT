// services/realtimeEventService.ts
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export type EventType =
    | "NOTIFICATION"
    | "DATA_UPDATE"
    | "STATUS_CHANGE"
    | "BOOKING_UPDATE"
    | "BOOKING_STATUS_CHANGE"
    | "PAYMENT_UPDATE"
    | "WALLET_UPDATE"
    | "VEHICLE_UPDATE"
    | "SYSTEM_ALERT"
    // Admin reload events
    | "ADMIN_RELOAD_DASHBOARD"
    | "ADMIN_RELOAD_VEHICLES_PENDING"
    | "ADMIN_RELOAD_WITHDRAWAL_REQUESTS"
    | "ADMIN_RELOAD_REPORTS"
    | "ADMIN_RELOAD_ALL"
    | "ADMIN_RELOAD_REPORT_DETAIL"
    | string;

export interface RealtimeEvent {
  eventType: EventType;
  payload: any;
  metadata?: Record<string, any>;
  timestamp: string;
}

export type EventHandler = (event: RealtimeEvent) => void;

class RealtimeEventService {
  private client: Client | null = null;
  private eventHandlers: Map<EventType, Set<EventHandler>> = new Map();
  private globalHandlers: Set<EventHandler> = new Set();
  private channelSubscriptions: Map<string, any> = new Map();
  private isConnecting = false;
  private currentUserId: string | null = null;
  private connectionPromise: Promise<void> | null = null;

  websocketUrl: string = process.env.NEXT_PUBLIC_WS_URL || "";

  connect(userId: string): Promise<void> {
    // Nếu đã connected với cùng userId
    if (this.client?.connected && this.currentUserId === userId) {
      console.log("Already connected for user:", userId);
      return Promise.resolve();
    }

    // Nếu đang connecting, return promise hiện tại
    if (this.isConnecting && this.connectionPromise) {
      console.log("Connection in progress, returning existing promise");
      return this.connectionPromise;
    }

    // Nếu connected với userId khác, disconnect trước
    if (this.client?.connected && this.currentUserId !== userId) {
      console.log("Different user, disconnecting first");
      this.disconnect();
    }

    this.isConnecting = true;
    this.currentUserId = userId;

    this.connectionPromise = new Promise((resolve, reject) => {
      console.log("Creating new WebSocket connection for user:", userId);

      this.client = new Client({
        webSocketFactory: () => {
          return new SockJS(this.websocketUrl);
        },

        connectHeaders: {
          userId: userId,
        },

        debug: function (str) {
          if (process.env.NODE_ENV === 'development') {
            console.log("[STOMP]", str);
          }
        },

        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        onConnect: (frame) => {
          console.log("✅ WebSocket Connected:", frame);
          this.isConnecting = false;
          this.connectionPromise = null;

          // Subscribe to user channel
          this.client?.subscribe(
              `/topic/user/${userId}`,
              (message: IMessage) => {
                console.log("📨 Received user message:", message.body);
                try {
                  const event = JSON.parse(message.body);
                  this.handleMessage(event);
                } catch (error) {
                  console.error("Error parsing user message:", error);
                }
              }
          );
          console.log(`✅ Subscribed to /topic/user/${userId}`);

          // Subscribe to broadcast channel
          this.client?.subscribe("/topic/broadcast", (message: IMessage) => {
            console.log("📢 Received broadcast message:", message.body);
            try {
              const event = JSON.parse(message.body);
              this.handleMessage(event);
            } catch (error) {
              console.error("Error parsing broadcast message:", error);
            }
          });
          console.log("✅ Subscribed to /topic/broadcast");

          resolve();
        },

        onDisconnect: (frame) => {
          console.log("❌ WebSocket Disconnected:", frame);
          this.isConnecting = false;
          this.connectionPromise = null;
          this.currentUserId = null;
          this.channelSubscriptions.clear();
        },

        onStompError: (frame) => {
          console.error("❌ STOMP error:", frame);
          this.isConnecting = false;
          this.connectionPromise = null;
          this.currentUserId = null;
          reject(
              new Error(frame.headers["message"] || "STOMP connection error")
          );
        },

        onWebSocketError: (event) => {
          console.error("❌ WebSocket error:", event);
        },

        onWebSocketClose: (event) => {
          console.log("🔌 WebSocket closed:", event);
        },
      });

      try {
        this.client.activate();
        console.log("🚀 WebSocket client activated");
      } catch (error) {
        console.error("Failed to activate WebSocket client:", error);
        this.isConnecting = false;
        this.connectionPromise = null;
        this.currentUserId = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  disconnect(): void {
    if (this.client?.connected) {
      try {
        // Unsubscribe all channel subscriptions
        this.channelSubscriptions.forEach((subscription) => {
          try {
            subscription.unsubscribe();
          } catch (error) {
            console.error("Error unsubscribing:", error);
          }
        });

        this.client.deactivate();
        console.log("🔌 WebSocket disconnected");
      } catch (error) {
        console.error("Error during disconnect:", error);
      }
    }
    this.client = null;
    this.currentUserId = null;
    this.connectionPromise = null;
    this.isConnecting = false;
    this.eventHandlers.clear();
    this.globalHandlers.clear();
    this.channelSubscriptions.clear();
  }

  on(eventType: EventType, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    console.log(`📎 Registered handler for ${eventType}`);

    return () => {
      this.eventHandlers.get(eventType)?.delete(handler);
      console.log(`📎 Unregistered handler for ${eventType}`);
    };
  }

  onAny(handler: EventHandler): () => void {
    this.globalHandlers.add(handler);
    return () => {
      this.globalHandlers.delete(handler);
    };
  }

  subscribeToChannel(channel: string, handler: EventHandler): () => void {
    if (!this.client?.connected) {
      console.error("Cannot subscribe to channel: Not connected");
      // Retry subscription after connection
      const checkConnection = setInterval(() => {
        if (this.client?.connected) {
          clearInterval(checkConnection);
          this.subscribeToChannel(channel, handler);
        }
      }, 1000);

      return () => {
        clearInterval(checkConnection);
      };
    }

    // Check if already subscribed
    if (this.channelSubscriptions.has(channel)) {
      console.log(`Already subscribed to channel: ${channel}`);
      return () => {
        this.unsubscribeFromChannel(channel);
      };
    }

    const subscription = this.client.subscribe(
        `/topic/channel/${channel}`,
        (message: IMessage) => {
          console.log(`📡 Received message on channel ${channel}:`, message.body);
          try {
            const event = JSON.parse(message.body);
            handler(event);
            // Also trigger general event handlers
            this.handleMessage(event);
          } catch (error) {
            console.error(`Error parsing channel message on ${channel}:`, error);
          }
        }
    );

    this.channelSubscriptions.set(channel, subscription);
    console.log(`✅ Subscribed to channel: ${channel}`);

    return () => {
      this.unsubscribeFromChannel(channel);
    };
  }

  private unsubscribeFromChannel(channel: string): void {
    const subscription = this.channelSubscriptions.get(channel);
    if (subscription) {
      try {
        subscription.unsubscribe();
        this.channelSubscriptions.delete(channel);
        console.log(`❌ Unsubscribed from channel: ${channel}`);
      } catch (error) {
        console.error(`Error unsubscribing from channel ${channel}:`, error);
      }
    }
  }

  private handleMessage(event: RealtimeEvent) {
    console.log("🔔 Handling event:", {
      type: event.eventType,
      payload: event.payload,
      timestamp: new Date().toISOString(),
    });

    // Log specific cho NOTIFICATION events
    if (
        event.eventType === "NOTIFICATION" ||
        event.eventType === "NOTIFICATION_READ" ||
        event.eventType === "NOTIFICATION_ALL_READ"
    ) {
      console.log("📬 Notification event received:", event);
    }

    // Log specific cho ADMIN events
    if (event.eventType.startsWith("ADMIN_RELOAD")) {
      console.log("🔄 Admin reload event received:", event);
    }

    // Call specific handlers
    const handlers = this.eventHandlers.get(event.eventType);
    if (handlers) {
      console.log(`Found ${handlers.size} handlers for ${event.eventType}`);
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${event.eventType}:`, error);
        }
      });
    } else {
      console.log(`No handlers registered for ${event.eventType}`);
    }

    // Call global handlers
    if (this.globalHandlers.size > 0) {
      console.log(`Calling ${this.globalHandlers.size} global handlers`);
      this.globalHandlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error("Error in global handler:", error);
        }
      });
    }
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  // Helper methods for debugging
  getActiveEventTypes(): string[] {
    return Array.from(this.eventHandlers.keys());
  }

  getActiveChannels(): string[] {
    return Array.from(this.channelSubscriptions.keys());
  }
}

// Export singleton instance
const realtimeEventService = new RealtimeEventService();

// Export for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).realtimeEventService = realtimeEventService;
}

export default realtimeEventService;
