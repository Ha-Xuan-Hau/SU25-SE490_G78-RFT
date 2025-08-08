import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface SimpleWebSocketMessage {
  type: string;
  action: string; // 'refresh' | 'notify'
  target: string; // 'wallet' | 'booking' | 'notification' | 'vehicle'
  userId?: string;
  message?: string;
  data?: any;
}

type RefreshHandler = () => void;

class SimpleWebSocketService {
  private client: Client | null = null;
  private isConnected: boolean = false;
  private refreshHandlers: Map<string, RefreshHandler[]> = new Map();

  constructor() {
    this.setupClient();
  }

  private setupClient() {
    const socket = new SockJS(`${process.env.NEXT_PUBLIC_REACT_APP_BACKEND_URL}/ws`);
    
    this.client = new Client({
      webSocketFactory: () => socket as any,
      connectHeaders: {
        Authorization: this.getAuthToken(),
      },
      debug: (str: any) => console.log('WebSocket:', str),
      onConnect: () => {
        console.log('✅ WebSocket connected');
        this.isConnected = true;
        this.subscribeToChannels();
      },
      onDisconnect: () => {
        console.log('❌ WebSocket disconnected');
        this.isConnected = false;
      },
      onStompError: (frame: any) => {
        console.error('❌ WebSocket error:', frame);
        this.handleReconnect();
      }
    });
  }

  private getAuthToken(): string {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && token !== 'null' && token !== 'undefined') {
        // Remove quotes if they exist (fallback for old data)
        let cleanToken = token;
        if (token.startsWith('"') && token.endsWith('"')) {
          cleanToken = token.slice(1, -1);
        }
        console.log('🔐 WebSocket auth token:', cleanToken ? 'Token available' : 'No token');
        return `Bearer ${cleanToken}`;
      }
    }
    console.warn('⚠️ WebSocket: No valid auth token found');
    return '';
  }

  private getUserId(): string | null {
    if (typeof window !== 'undefined') {
      try {
        // Try different localStorage keys for user profile
        const profileKeys = ['profile', 'user_profile', 'userProfile'];
        let parsedProfile = null;
        
        for (const key of profileKeys) {
          const profile = localStorage.getItem(key);
          if (profile && profile !== 'null' && profile !== 'undefined') {
            try {
              parsedProfile = JSON.parse(profile);
              console.log(`✅ WebSocket found user profile in '${key}':`, parsedProfile);
              break;
            } catch (parseError) {
              console.warn(`Failed to parse profile from '${key}':`, parseError);
            }
          }
        }
        
        if (parsedProfile) {
          const userId = parsedProfile.id || parsedProfile.userId || parsedProfile.user_id;
          console.log('🔑 WebSocket user ID extracted:', userId);
          return userId;
        }
        
      } catch (error) {
        console.error('Error accessing localStorage for WebSocket:', error);
      }
    }
    console.warn('⚠️ WebSocket: No valid user profile found in localStorage');
    return null;
  }

  private subscribeToChannels() {
    if (!this.client || !this.isConnected) return;

    const userId = this.getUserId();
    if (!userId) return;

    // Subscribe to user-specific updates
    this.client.subscribe(`/user/${userId}/queue/refresh`, (message: IMessage) => {
      try {
        const wsMessage: SimpleWebSocketMessage = JSON.parse(message.body);
        this.handleRefresh(wsMessage);
      } catch (error) {
        console.error('Error parsing refresh message:', error);
      }
    });

    console.log(`🔔 WebSocket subscribed for user ${userId}`);
  }

  private handleRefresh(message: SimpleWebSocketMessage) {
    console.log('🔄 Refresh request:', JSON.stringify(message, null, 2));
    
    // Call all handlers for this target
    const handlers = this.refreshHandlers.get(message.target) || [];
    handlers.forEach(handler => {
      try {
        handler();
      } catch (error) {
        console.error(`❌ Error in refresh handler for ${message.target}:`, error);
      }
    });
  }

  private handleReconnect() {
    setTimeout(() => {
      console.log('🔄 Attempting to reconnect WebSocket...');
      this.connect();
    }, 3000);
  }

  // Public methods
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      // Wait a bit for auth token to be available
      const attemptConnection = () => {
        const token = this.getAuthToken();
        const userId = this.getUserId();
        
        if (!token || !userId) {
          console.log('⏳ WebSocket: Waiting for auth token and user profile...');
          setTimeout(attemptConnection, 1000);
          return;
        }

        if (!this.client) {
          this.setupClient();
        }

        const originalOnConnect = this.client!.onConnect;
        this.client!.onConnect = (frame: any) => {
          if (originalOnConnect) originalOnConnect(frame);
          resolve();
        };

        try {
          this.client!.activate();
        } catch (error) {
          console.error('❌ WebSocket connection error:', error);
          reject(error);
        }
      };

      attemptConnection();
    });
  }

  disconnect() {
    if (this.client && this.isConnected) {
      this.client.deactivate();
    }
  }

  // Register refresh handlers
  onRefresh(target: string, handler: RefreshHandler) {
    if (!this.refreshHandlers.has(target)) {
      this.refreshHandlers.set(target, []);
    }
    this.refreshHandlers.get(target)!.push(handler);
  }

  // Remove refresh handlers
  offRefresh(target: string, handler: RefreshHandler) {
    const handlers = this.refreshHandlers.get(target);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const simpleWebSocketService = new SimpleWebSocketService();
