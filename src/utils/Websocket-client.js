import { Client } from '@stomp/stompjs';

export class WebSocketClient {
    constructor(serverUrl, topicEndpoint, onMessageCallback) {
      this.serverUrl = serverUrl;
      this.topicEndpoint = topicEndpoint;
      this.onMessageCallback = onMessageCallback;
      this.client = null;
      this.subscription = null;
    }

  connect() {
    // Create a new STOMP client
    this.client = new Client({
      brokerURL: this.serverUrl,
      debug: function (str) {
        console.log('STOMP Debug: ' + str);
      },
      reconnectDelay: 5000, // Attempt to reconnect after 5 seconds
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    // Setup connection event handlers
    this.client.onConnect = (frame) => {
      console.log('Connected to WebSocket server');
      
      // Subscribe to the topic
      this.subscription = this.client.subscribe(this.topicEndpoint, (message) => {
        // Parse the message body (usually JSON)
        let messageBody;
        try {
          messageBody = JSON.parse(message.body);
        } catch (e) {
          messageBody = message.body;
        }
        
        // Call the callback with the parsed message
        this.onMessageCallback(messageBody);
      });
      
      console.log(`Subscribed to topic: ${this.topicEndpoint}`);
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP Error:', frame.headers['message']);
      console.error('Additional details:', frame.body);
    };

    this.client.onWebSocketError = (event) => {
      console.error('WebSocket Error:', event);
    };

    // Start the connection
    this.client.activate();
  }

  disconnect() {
    if (this.client && this.client.connected) {
      // Unsubscribe from the topic
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
      
      // Disconnect from the server
      this.client.deactivate();
      console.log('Disconnected from WebSocket server');
    }
  }

  // Method to send a message to a specific destination
  sendMessage(destination, message) {
    if (this.client && this.client.connected) {
      this.client.publish({
        destination: destination,
        body: typeof message === 'object' ? JSON.stringify(message) : message
      });
      console.log(`Message sent to ${destination}`);
    } else {
      console.error('Cannot send message: Not connected to WebSocket server');
    }
  }
}