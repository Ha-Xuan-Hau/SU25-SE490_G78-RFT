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
  private isConnecting = false;
  private currentUserId: string | null = null;
  private connectionPromise: Promise<void> | null = null;

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
        // SỬA: Dùng SockJS thay vì WebSocket thuần
        webSocketFactory: () => {
          return new SockJS("http://localhost:8080/ws");
        },

        connectHeaders: {
          userId: userId,
        },

        debug: function (str) {
          console.log("[STOMP]", str);
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
  }

  on(eventType: EventType, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    return () => {
      this.eventHandlers.get(eventType)?.delete(handler);
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
      console.error("Not connected");
      return () => {};
    }

    const subscription = this.client.subscribe(
      `/topic/channel/${channel}`,
      (message: IMessage) => {
        try {
          handler(JSON.parse(message.body));
        } catch (error) {
          console.error("Error parsing channel message:", error);
        }
      }
    );

    return () => subscription.unsubscribe();
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

    const handlers = this.eventHandlers.get(event.eventType);
    if (handlers) {
      console.log(`Found ${handlers.size} handlers for ${event.eventType}`);
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error("Error in event handler:", error);
        }
      });
    }

    this.globalHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error("Error in global handler:", error);
      }
    });
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

export default new RealtimeEventService();
