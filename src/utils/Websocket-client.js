// utils/WebSocketClient.js
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export class WebSocketClient {
  constructor({ serverUrl, onMessage, onConnect, onDisconnect }) {
    this.serverUrl = serverUrl;
    this.onMessage = onMessage;
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.client = null;
    this.subscription = null;
  }

  connect() {
    console.log('🧪 Activating STOMP client...');
    this.client = new Client({
      webSocketFactory: () => new SockJS(this.serverUrl),
      debug: (str) => console.log('[STOMP DEBUG]', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('✅ STOMP connected');
        this.onConnect?.();
      },
      onStompError: (frame) => {
        console.error('❌ STOMP Error:', frame.headers['message'], frame.body);
      },
      onWebSocketError: (event) => {
        console.error('❌ WebSocket Error:', event);
      },
      onWebSocketClose: () => {
        console.warn('🔌 WebSocket Closed');
        this.onDisconnect?.();
      },
    });
  
    this.client.activate();
  }
  

  subscribe(destination) {
    if (!this.client?.connected) {
      console.warn('⚠️ Cannot subscribe, client not connected');
      return;
    }

    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.subscription = this.client.subscribe(destination, (message) => {
      try {
        const body = JSON.parse(message.body);
        this.onMessage?.(body);
      } catch (e) {
        console.warn('Could not parse message body:', message.body);
        this.onMessage?.(message.body);
      }
    });

    console.log(`📩 Subscribed to: ${destination}`);
  }

  send(destination, payload) {
    if (this.client?.connected) {
      const body = typeof payload === 'object' ? JSON.stringify(payload) : payload;
      this.client.publish({ destination, body });
      console.log(`📤 Sent to ${destination}:`, payload);
    } else {
      console.warn('⚠️ Cannot send, not connected');
    }
  }

  disconnect() {
    this.subscription?.unsubscribe();
    this.client?.deactivate();
    console.log('🔌 Disconnected');
  }
}
