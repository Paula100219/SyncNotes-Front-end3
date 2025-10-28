// Servicio WS por sala. No modifica axios ni el login existente.
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs.js';

/* eslint-disable no-unused-vars */
let stompClient = null;
let onMessageCallback = null;
let currentRoomId;
/* eslint-enable no-unused-vars */

export function connectWebSocket(roomId, onMessage) {
  if (stompClient && stompClient.connected) {
    disconnectWebSocket();
  }

  currentRoomId = roomId;
  onMessageCallback = onMessage;

  const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
  const socket = new SockJS(`${BASE}/ws`);
  stompClient = new Client({
    webSocketFactory: () => socket,
    onConnect: () => {
      console.log('Connected to WebSocket');
      stompClient.subscribe(`/topic/room/${roomId}`, (message) => {
        const body = JSON.parse(message.body);
        if (onMessageCallback) {
          onMessageCallback(body);
        }
      });
    },
    onStompError: (frame) => {
      console.error('STOMP error:', frame.headers['message']);
    },
    onWebSocketError: (error) => {
      console.error('WebSocket error:', error);
    },
  });

  stompClient.activate();
}

export function sendMessage(roomId, content) {
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: `/app/room/${roomId}/chat`,
      body: JSON.stringify({ content }),
    });
  } else {
    console.error('WebSocket not connected');
  }
}

export function disconnectWebSocket() {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
    currentRoomId = null;
    onMessageCallback = null;
  }
}