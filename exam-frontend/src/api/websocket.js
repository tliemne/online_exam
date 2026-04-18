import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class WebSocketClient {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    // Map: destination -> callback (for re-subscribe on reconnect)
    this.pendingSubscriptions = new Map();
    // Map: destination -> stomp subscription object
    this.activeSubscriptions = new Map();
    this.reconnectDelay = 3000;
  }

  connect() {
    // If already connected, return immediately
    if (this.connected && this.stompClient) {
      return Promise.resolve();
    }

    // If client exists but disconnected, deactivate first
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }

    return new Promise((resolve, reject) => {
      try {
        const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:8081'
          : window.location.origin;

        const wsUrl = `${backendUrl}/ws`;
        const token = localStorage.getItem('token');

        this.stompClient = new Client({
          webSocketFactory: () => new SockJS(wsUrl),
          connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
          reconnectDelay: this.reconnectDelay,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          debug: () => {}, // suppress debug logs
          onConnect: () => {
            this.connected = true;
            // Re-subscribe all pending subscriptions after reconnect
            this.pendingSubscriptions.forEach((callback, destination) => {
              this._doSubscribe(destination, callback);
            });
            resolve();
          },
          onDisconnect: () => {
            this.connected = false;
            this.activeSubscriptions.clear();
          },
          onStompError: (frame) => {
            this.connected = false;
            reject(new Error(frame.headers?.message || 'STOMP error'));
          },
          onWebSocketError: () => {
            this.connected = false;
          }
        });

        this.stompClient.activate();
      } catch (error) {
        reject(error);
      }
    });
  }

  _doSubscribe(destination, callback) {
    if (!this.stompClient || !this.connected) return;
    try {
      const sub = this.stompClient.subscribe(destination, (message) => {
        try {
          callback(JSON.parse(message.body));
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      });
      this.activeSubscriptions.set(destination, sub);
    } catch (e) {
      console.error('Error subscribing to', destination, e);
    }
  }

  subscribe(destination, callback) {
    // Save for re-subscribe on reconnect
    this.pendingSubscriptions.set(destination, callback);
    if (this.connected) {
      this._doSubscribe(destination, callback);
    }
  }

  unsubscribe(destination) {
    this.pendingSubscriptions.delete(destination);
    const sub = this.activeSubscriptions.get(destination);
    if (sub) {
      sub.unsubscribe();
      this.activeSubscriptions.delete(destination);
    }
  }

  unsubscribeAll() {
    this.activeSubscriptions.forEach(sub => sub.unsubscribe());
    this.activeSubscriptions.clear();
    this.pendingSubscriptions.clear();
  }

  disconnect() {
    this.unsubscribeAll();
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    this.connected = false;
  }

  send(destination, body) {
    if (!this.connected || !this.stompClient) return;
    try {
      this.stompClient.publish({ destination, body: JSON.stringify(body) });
    } catch (e) {
      console.error('Error sending WebSocket message:', e);
    }
  }

  isConnected() {
    return this.connected;
  }
}

export default new WebSocketClient();
