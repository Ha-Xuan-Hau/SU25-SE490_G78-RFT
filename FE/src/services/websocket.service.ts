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
    // Try different endpoints
    const endpoints = [
      `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/ws`,
      `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/ws/public`,
      `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/websocket`,
      `${process.env.NEXT_PUBLIC_API_URL}/ws`
    ];
    
    // Start with first endpoint
    const wsUrl = endpoints[0];
    console.log('🔌 Trying WebSocket endpoint:', wsUrl);
    
    const socket = new SockJS(wsUrl);
    
    this.client = new Client({
      webSocketFactory: () => socket as any,
      // Tạm thời disable auth để test connection
      // connectHeaders: {
      //   'Authorization': this.getAuthToken(),
      //   'X-Authorization': this.getAuthToken()
      // },
      debug: (str: any) => console.log('WebSocket:', str),
      onConnect: () => {
        console.log('✅ WebSocket connected (no auth)');
        this.isConnected = true;
        // Chỉ subscribe khi có user ID
        const userId = this.getUserId();
        if (userId) {
          this.subscribeToChannels();
        } else {
          console.warn('⚠️ No user ID, skipping channel subscription');
        }
      },
      onDisconnect: () => {
        console.log('❌ WebSocket disconnected');
        this.isConnected = false;
      },
      onStompError: (frame: any) => {
        console.error('❌ WebSocket STOMP error:', frame);
        this.handleReconnect();
      },
      onWebSocketError: (error: any) => {
        console.error('❌ WebSocket connection error:', error);
        // Try alternative endpoint
        this.tryAlternativeEndpoint();
      }
    });
  }

  private tryAlternativeEndpoint() {
    console.log('🔄 Trying alternative WebSocket endpoints...');
    
    // List of possible endpoints
    const endpoints = [
      `${process.env.NEXT_PUBLIC_API_URL}/ws`, 
      `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/ws/public`,
      `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/websocket`
    ];
    
    // Try each endpoint
    for (const endpoint of endpoints) {
      try {
        console.log('🔌 Trying:', endpoint);
        const socket = new SockJS(endpoint);
        
        // Test connection
        socket.onopen = () => {
          console.log('✅ Alternative endpoint works:', endpoint);
          // Update client with working endpoint
          this.client = new Client({
            webSocketFactory: () => socket as any,
            debug: (str: any) => console.log('WebSocket:', str),
            onConnect: () => {
              console.log('✅ WebSocket connected via alternative endpoint');
              this.isConnected = true;
              const userId = this.getUserId();
              if (userId) {
                this.subscribeToChannels();
              }
            }
          });
          this.client.activate();
          return;
        };
        
        socket.onerror = (error) => {
          console.warn('❌ Alternative endpoint failed:', endpoint, error);
        };
        
      } catch (error) {
        console.warn('❌ Failed to try endpoint:', endpoint, error);
      }
    }
    });
  }

  private getAuthToken(): string {
    if (typeof window !== 'undefined') {
      // Try multiple possible token keys
      const tokenKeys = ['access_token', 'token', 'authToken'];
      
      for (const key of tokenKeys) {
        const token = localStorage.getItem(key);
        if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
          try {
            // Try to parse JSON first
            const parsedToken = JSON.parse(token);
            if (parsedToken && typeof parsedToken === 'string') {
              console.log('🔐 WebSocket auth token found from', key);
              return `Bearer ${parsedToken}`;
            }
          } catch (error) {
            // If JSON parsing fails, try direct token
            let cleanToken = token;
            if (token.startsWith('"') && token.endsWith('"')) {
              cleanToken = token.slice(1, -1);
            }
            if (cleanToken.trim() !== '') {
              console.log('🔐 WebSocket auth token found (direct) from', key);
              return `Bearer ${cleanToken}`;
            }
          }
        }
      }
    }
    console.warn('⚠️ WebSocket: No valid auth token found in localStorage');
    return '';
  }

  private getUserId(): string | null {
    if (typeof window !== 'undefined') {
      try {
        const profile = localStorage.getItem('user_profile');
        if (profile && profile !== 'null' && profile !== 'undefined') {
          try {
            const parsedProfile = JSON.parse(profile);
            const userId = parsedProfile.id || parsedProfile.userId || parsedProfile.user_id;
            console.log('🔑 WebSocket user ID extracted:', userId);
            return userId ? String(userId) : null;
          } catch (parseError) {
            console.warn('Failed to parse user profile:', parseError);
          }
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

    this.client.subscribe(`/user/${userId}/queue/refresh`, (message: IMessage) => {
      try {
        console.log('📨 Raw WebSocket message received:', message.body);
        const wsMessage: SimpleWebSocketMessage = JSON.parse(message.body);
        console.log('📋 Parsed WebSocket message:', wsMessage);
        this.handleRefresh(wsMessage);
      } catch (error) {
        console.error('Error parsing refresh message:', error);
      }
    });

    console.log(`🔔 WebSocket subscribed for user ${userId}`);
  }

  private handleRefresh(message: SimpleWebSocketMessage) {
    console.log('🔄 WebSocket refresh received:', JSON.stringify(message, null, 2));
    
    const handlers = this.refreshHandlers.get(message.target) || [];
    console.log(`📋 Found ${handlers.length} handlers for target: ${message.target}`);
    
    handlers.forEach(handler => {
      try {
        handler();
        console.log(`✅ Handler executed successfully for: ${message.target}`);
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

      // Always try to connect, even without token
      console.log('🔌 Attempting WebSocket connection...');
      
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
    });
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.isConnected = false;
    }
  }

  onRefresh(target: string, handler: RefreshHandler) {
    if (!this.refreshHandlers.has(target)) {
      this.refreshHandlers.set(target, []);
    }
    this.refreshHandlers.get(target)!.push(handler);
    console.log(`✅ Registered handler for ${target}`);
  }

  offRefresh(target: string, handler: RefreshHandler) {
    const handlers = this.refreshHandlers.get(target);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        console.log(`❌ Unregistered handler for ${target}`);
      }
    }
  }

  // Methods needed by other files
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  reconnectWithToken() {
    console.log('🔑 Reconnecting with new token from localStorage');
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }
}

export const simpleWebSocketService = new SimpleWebSocketService();

// Expose for debugging
if (typeof window !== 'undefined') {
  (window as any).wsService = simpleWebSocketService;
  console.log('💡 WebSocket service available as window.wsService');
}
