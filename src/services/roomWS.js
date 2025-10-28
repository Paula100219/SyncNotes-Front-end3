import SockJS from "sockjs-client/dist/sockjs.js";
import { Client } from "@stomp/stompjs";
import { HTTP_BASE, httpBaseToWsBase } from "./base.js";

const WS_BASE = httpBaseToWsBase(HTTP_BASE); // ej: http://localhost:8081

class RoomWS {
  constructor() {
    this.client = null;
    this.sub = null;
    this.connected = false;
    this.currentRoom = null;
    this.onMessage = () => {};
    this.onStatus = () => {};
  }

  connect({ token, roomId, onMessage, onStatus }) {
    this.disconnect(); // limpieza por si acaso
    this.onMessage = onMessage || (() => {});
    this.onStatus = onStatus || (() => {});
    this.currentRoom = roomId;
    this.client = new Client({
      // SockJS endpoint del backend
      webSocketFactory: () => new SockJS(`${WS_BASE}/ws`),
      // No reconectar agresivo para no interferir con nada existente
      reconnectDelay: 3000,
      debug: () => {},
      beforeConnect: () => {
        // Nada intrusivo aquí
      },
      onConnect: () => {
        this.connected = true;
        this.onStatus('connected');
        // Suscribir a la sala
        const dest = `/topic/room/${roomId}`;
        this.sub = this.client.subscribe(dest, (frame) => {
          try {
            const body = JSON.parse(frame.body);
            if (body?.type === 'CHAT_MESSAGE') {
              this.onMessage(body.payload);
            }
          } catch {
            // ignore
          }
        });
      },
      onStompError: () => {
        this.onStatus('error');
      },
      onWebSocketClose: () => {
        this.connected = false;
        this.onStatus('disconnected');
      },
    });
    // Header con JWT (no tocamos la forma en que el proyecto guarda el token; aquí lo recibimos por prop)
    this.client.connectHeaders = {
      Authorization: `Bearer ${token}`,
    };
    this.client.activate();
  }

  sendMessage(content) {
    if (!this.connected || !this.currentRoom) return;
    const dest = `/app/room/${this.currentRoom}/chat`;
    this.client.publish({
      destination: dest,
      body: JSON.stringify({ content }),
    });
  }

  disconnect() {
    try {
      if (this.sub) this.sub.unsubscribe();
      if (this.client?.active) this.client.deactivate();
    } catch {
      // ignore
    }
    this.sub = null;
    this.client = null;
    this.connected = false;
    this.currentRoom = null;
    this.onMessage = () => {};
    this.onStatus = () => {};
  }
}

export const roomWS = new RoomWS();