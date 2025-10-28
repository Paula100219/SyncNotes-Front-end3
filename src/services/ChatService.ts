import SockJS from "sockjs-client";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";

type Status = "Conectado" | "Desconectado";

type StatusCb = (s: Status) => void;

type MsgCb = (msg: any) => void;

class ChatService {

private client: Client | null = null;

private sub: StompSubscription | null = null;

private roomId: string | null = null;

private connected = false;

private static baseUrl(): string {

const base = (import.meta as any).env.VITE_API_URL || "http://localhost:8081";

return String(base).replace(/\/+$/, "");

}

private static jwt(): string {

let t =

localStorage.getItem("token") ||

sessionStorage.getItem("token") ||

"";

// normaliza: sin comillas y sin "Bearer "

t = t.replace(/^"|"$/g, "").replace(/^Bearer\s+/i, "");

return t;

}

  public connect({

    roomId,

    onMessage,

    onStatus

  }: {

    roomId: string;

    onMessage: MsgCb;

    onStatus?: StatusCb;

  }): void {

    if (this.sub && this.roomId === roomId) {

      console.warn("[WS] Ya suscrito a esta sala, ignorando.");

      return;

    }

    if (this.connected && this.roomId === roomId) return; // evita duplicados

const token = ChatService.jwt();

if (!token) {

console.error("[WS] Falta JWT en storage.");

onStatus?.("Desconectado");

return;

}

this.roomId = roomId;

// Desactiva cliente previo si lo hubiera

if (this.client) {

try { this.client.deactivate(); } catch {}

this.client = null;

}

const webSocketFactory = () => new SockJS(`${ChatService.baseUrl()}/ws`);

this.client = new Client({

webSocketFactory,

connectHeaders: { Authorization: `Bearer ${token}` },

debug: () => {},          // silencia logs

reconnectDelay: 5000,     // auto-reconexión

heartbeatOutgoing: 4000,

heartbeatIncoming: 4000,

onConnect: () => {

this.connected = true;

onStatus?.("Conectado");

// Limpia sub anterior

if (this.sub) {

try { this.sub.unsubscribe(); } catch {}

this.sub = null;

}

// Suscribirse a los eventos de la sala

this.sub = this.client!.subscribe(`/topic/room/${roomId}`, (msg: IMessage) => {

try {

const data = JSON.parse(msg.body);

onMessage?.(data);

} catch (e) {

console.error("[WS] Mensaje no JSON:", msg.body);

}

}

);

},

onStompError: (frame) => {

console.error("[WS] STOMP error:", frame.headers["message"], frame.body);

this.connected = false;

onStatus?.("Desconectado");

},

onWebSocketClose: () => {

this.connected = false;

onStatus?.("Desconectado");

}

});

this.client.activate();

}

public sendMessage(content: string): void {

if (!this.connected || !this.client || !this.roomId) return;

const body = JSON.stringify({ content });

this.client.publish({

destination: `/app/room/${this.roomId}/chat`,

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