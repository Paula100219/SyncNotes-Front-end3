import { useEffect, useRef, useState } from "react";
import { chatService } from "../services/ChatService";
import { useAuth } from '@/hooks/useAuth';
import "./room-chat.css";



const initialsOf = (name: string = '') =>
 name.trim().split(/\s+/).slice(0,2).map(s => s[0]?.toUpperCase() || '').join('');

const fmtTime = (d: string | Date) => {
  if (!d) return '';
  const x = typeof d === 'string' ? new Date(d) : d;
  if (!(x instanceof Date) || isNaN(x.getTime())) return '';
  return x.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const norm = (s?: string) => (s ?? "").trim().toLowerCase();
const sameId = (a?: any, b?: any) => String(a ?? "") === String(b ?? "");
const sameUser = (a?: string, b?: string) => norm(a) === norm(b);

const currentUserId = () =>
  [auth?.user?.id, auth?.user?.userId, auth?.user?.ID, (auth as any)?.userId]
    .filter((v) => v !== undefined && v !== null)
    .map((v) => v.toString().trim())[0];

const currentUsername = () =>
  [auth?.user?.username, auth?.user?.userName, auth?.user?.name, (auth as any)?.username]
    .filter((v) => v !== undefined && v !== null)
    .map((v) => v.toString().trim().toLowerCase())[0];

const msgKey = (m: any) => {
  const bucket = Math.round(new Date(m.createdAt ?? 0).getTime() / 3000);
  return [norm(m.username), norm(m.content), bucket].join('|');
};



const currentIdentity = (auth: any) => {
  const id = [auth?.user?.id, auth?.user?.userId, (auth as any)?.userId].map(v => (v ?? '').toString().trim()).find(v => v !== '');
  const username = [auth?.user?.username, auth?.user?.userName, auth?.user?.name, (auth as any)?.username].map(v => (v ?? '').toString().trim().toLowerCase()).find(v => v !== '');
  return { id, username };
};

export default function RoomChatPanel({ roomId }: { roomId: string }) {
  const auth = useAuth();
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const mounted = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const recentRef = useRef<Map<string, number>>(new Map());
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    mounted.current = true;
    chatService.connect({
      roomId,
      onStatus: (s) => setConnected(s === "Conectado"),
        onMessage: (incoming) => {
            // 1) Aceptar tanto el "sobre" {type,payload} como el mensaje plano
            const raw = incoming?.payload ? incoming.payload : incoming;
            if (!mounted.current) return;
            // 2) Normalización segura de campos (sin cambiar tu paleta ni UI)
            const username =
              (raw.username ?? raw.userName ?? raw.name ?? raw.senderUsername ?? raw.authorUsername ?? raw.senderName ?? '').toString().trim();
            const userId =
              (raw.userId ?? raw.userID ?? raw.authorId ?? raw.senderId ?? raw.idUser ?? '').toString().trim();
            const content = (raw.content ?? raw.text ?? '').toString();
            const createdAt = raw.createdAt ?? raw.timestamp ?? new Date().toISOString();
            // Si viene vacío (por error de BE), no intentamos pintar
            if (!content) return;
            const m = {
              id: raw.id ?? raw.messageId ?? `${username}-${createdAt}`,
              userId,
              username,
              content,
              createdAt,
            };
            // 3) DEDUPE
            // Solo por ID si existe
            const idKey = (m.id ? `id:${String(m.id)}` : null);
            if (idKey) {
              if (seenIdsRef.current.has(idKey)) return;
              seenIdsRef.current.add(idKey);
            }
            // Marcar como mío si el username coincide
            const { id: myId, username: myUser } = currentIdentity(auth);
            if (sameUser(myUser, m.username)) {
              (m as any)._fromMe = true;
            }

            setMessages((prev) => [...(prev ?? []), m]);
          },
    });
    return () => {
      mounted.current = false;
      chatService.disconnect();
    };
  }, [roomId]);

  // autoscroll suave cuando llegan mensajes
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);



  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !connected) return;
    chatService.sendMessage(text);
    setInput("");
  };

  return (
<section className="room-chat">
{/* Estado conexión */}
<div className="rc-head">
<span className={`rc-dot ${connected ? '' : 'off'}`} />
<span>{connected ? 'Conectado' : 'Desconectado'}</span>
</div>
{/* Lista de mensajes (solo aquí hay scroll) */}
<div className="rc-messages" ref={listRef}>
{(!messages || messages.length === 0) && (
<div className="rc-empty">
No hay mensajes todavía. ¡Rompe el hielo y saluda al equipo!
</div>
)}
  {messages?.map((m: any) => {
    const { id: myId, username: myUser } = currentIdentity(auth);
    const msgId = (m.userId ?? '').toString().trim();
    const msgUser = (m.username ?? '').toString().trim().toLowerCase();
    const isMe =
      (m as any)._fromMe === true ||
      (!!myId && myId === msgId) ||
      (!!myUser && myUser === msgUser);
    return (
    <div key={String(m.id ?? m.createdAt ?? `${m.username}-${Math.random()}`)} className={`rc-item ${isMe ? 'me' : ''}`}>
    {!isMe && <div className="rc-avatar">{(m.username ?? '?').slice(0,2).toUpperCase()}</div>}
    <div className="rc-bubble">
    <div>{m.content}</div>
    <div className="rc-meta">
    {!isMe && <span className="rc-name">{m.username}</span>}
    <span>{fmtTime(m.createdAt)}</span>
    </div>
    </div>
    {isMe && <div className="rc-avatar">{(auth?.user?.username ?? '?').slice(0,2).toUpperCase()}</div>}
    </div>
    );
    })}
</div>
{/* Input fijo abajo */}
<form className="rc-inputbar" onSubmit={handleSend}>
<input
className="rc-input"
type="text"
placeholder="Escribe un mensaje"
value={input}
onChange={(e) => setInput(e.target.value)}
/>
<button className="rc-btn" type="submit" disabled={!input?.trim() || !connected}>
Enviar
</button>
</form>
</section>
);
}