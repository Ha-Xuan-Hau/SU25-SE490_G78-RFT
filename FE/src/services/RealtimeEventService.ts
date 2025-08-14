import { Client, IMessage } from '@stomp/stompjs';

export type EventType =
    | 'NOTIFICATION'
    | 'DATA_UPDATE'
    | 'STATUS_CHANGE'
    | 'BOOKING_UPDATE'
    | 'BOOKING_STATUS_CHANGE'
    | 'PAYMENT_UPDATE'
    | 'WALLET_UPDATE'
    | 'VEHICLE_UPDATE'
    | 'SYSTEM_ALERT'
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

    connect(userId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.client?.connected) {
                resolve();
                return;
            }

            if (this.isConnecting) {
                reject(new Error('Already connecting'));
                return;
            }

            this.isConnecting = true;

            this.client = new Client({
                brokerURL: `ws://localhost:8080/ws`,
                reconnectDelay: 5000,
                heartbeatIncoming: 30000,
                heartbeatOutgoing: 30000,
                onConnect: () => {
                    console.log('Realtime service connected');
                    this.isConnecting = false;

                    // Subscribe to user channel
                    this.client?.subscribe(`/topic/user/${userId}`, (message: IMessage) => {
                        this.handleMessage(JSON.parse(message.body));
                    });

                    // Subscribe to broadcast channel
                    this.client?.subscribe('/topic/broadcast', (message: IMessage) => {
                        this.handleMessage(JSON.parse(message.body));
                    });

                    resolve();
                },
                onDisconnect: () => {
                    console.log('Realtime service disconnected');
                    this.isConnecting = false;
                },
                onStompError: (frame) => {
                    console.error('STOMP error:', frame);
                    this.isConnecting = false;
                    reject(new Error(frame.headers['message']));
                },
            });

            this.client.activate();
        });
    }

    disconnect(): void {
        if (this.client?.connected) {
            this.client.deactivate();
        }
        this.client = null;
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
            console.error('Not connected');
            return () => {};
        }

        const subscription = this.client.subscribe(`/topic/channel/${channel}`, (message: IMessage) => {
            handler(JSON.parse(message.body));
        });

        return () => subscription.unsubscribe();
    }

    private handleMessage(event: RealtimeEvent) {
        const handlers = this.eventHandlers.get(event.eventType);
        if (handlers) {
            handlers.forEach(handler => handler(event));
        }

        this.globalHandlers.forEach(handler => handler(event));
    }

    isConnected(): boolean {
        return this.client?.connected || false;
    }
}

export default new RealtimeEventService();