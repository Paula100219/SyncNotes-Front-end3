import SockJS from "sockjs-client";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";

type Status = "Conectado" | "Desconectado";

type StatusCb = (s: Status) => void;

type MsgCb = (msg: any) => void;

export class ChatService {

private client: Client | null = null;

private sub: StompSubscription | null = null;

private roomId: string | null = null;

private connected = false;

private static baseUrl(): string {

const base = (import.meta as any).env.VITE_API_URL || "http://localhost:8081";

return String(base).replace(/\/+$/, "");

}

static get(): ChatService {

return chatService;

}

  public async connect(roomId: string, token: string, onMessage: MsgCb): Promise<() => void> {

    return new Promise((resolve, reject) => {

      if (this.sub && this.roomId === roomId) {

        console.warn("[WS] Ya suscrito a esta sala, ignorando.");

        resolve(() => {});

        return;

      }

      if (this.connected && this.roomId === roomId) {

        resolve(() => {});

        return;

      }

      this.roomId = roomId;

      if (this.client) {

        try { this.client.deactivate(); } catch {}

        this.client = null;

      }

      const webSocketFactory = () => new SockJS(`${ChatService.baseUrl()}/ws`);

      this.client = new Client({

        webSocketFactory,

        connectHeaders: { Authorization: `Bearer ${token}` },

        debug: () => {},

        reconnectDelay: 5000,

        heartbeatOutgoing: 4000,

        heartbeatIncoming: 4000,

        onConnect: () => {

          this.connected = true;

          if (this.sub) {

            try { this.sub.unsubscribe(); } catch {}

            this.sub = null;

          }

          this.sub = this.client!.subscribe(`/topic/room/${roomId}`, (msg: IMessage) => {

            try {

              const data = JSON.parse(msg.body);

              onMessage(data);

            } catch (e) {

              console.error("[WS] Mensaje no JSON:", msg.body);

            }

          });

          resolve(() => {

            this.disconnect();

          });

        },

        onStompError: (frame) => {

          console.error("[WS] STOMP error:", frame.headers["message"], frame.body);

          this.connected = false;

          reject(new Error("STOMP error"));

        },

        onWebSocketClose: () => {

          this.connected = false;

          reject(new Error("WebSocket closed"));

        }

      });

      this.client.activate();

    });

  }

  public send(roomId: string, content: string): void {

    if (!this.connected || !this.client) return;

    const body = JSON.stringify({ content });

    this.client.publish({

      destination: `/app/room/${roomId}/chat`,

      body

    });

  }

public disconnect(): void {

try {

if (this.sub) this.sub.unsubscribe();

if (this.client) {

this.client.deactivate();

}

} catch {}

this.sub = null;

this.client = null;

this.connected = false;

this.roomId = null;

}

}

export const chatService = new ChatService();

export default chatService;