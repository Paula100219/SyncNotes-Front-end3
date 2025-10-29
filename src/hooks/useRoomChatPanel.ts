import { useEffect, useRef, useState } from "react";
import ChatService from '@/services/ChatService';
import { useAuth } from './useAuth';
import { getRoomMessages } from '@/services/Api';

const makeSig = (roomId: string, content: string) => `${roomId}:${content.trim().toLowerCase()}`;

const initialsOf = (name: string = '') =>
  name.trim().split(/\s+/).slice(0,2).map(s => s[0]?.toUpperCase() || '').join('');

const fmtTime = (v: unknown): string => {
  if (!v) return "";
  const d = typeof v === "string" || typeof v === "number" ? new Date(v) : (v as Date);
  if (Number.isNaN(d.getTime?.())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const norm = (v?: any) => (v ?? "").toString().trim();
const lower = (v?: any) => norm(v).toLowerCase();
const rcKey = (m: any) => `rc:${lower(m.username)}|${norm(m.content)}`;

const currentIdentity = (auth: any) => {
  const id = [auth?.user?.id, auth?.user?.userId, (auth as any)?.userId].map(v => (v ?? '').toString().trim()).find(v => v !== '');
  const username = [auth?.user?.username, auth?.user?.userName, auth?.user?.name, (auth as any)?.username].map(v => (v ?? '').toString().trim().toLowerCase()).find(v => v !== '');
  return { id, username };
};

export function useRoomChatPanel(roomId: string) {
  const auth = useAuth();
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const mounted = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const recentRef = useRef<Map<string, number>>(new Map());
  const seenIdsRef = useRef<Set<string>>(new Set());
  const recentSentRef = useRef<Set<string>>(new Set());

  const seenRecently = (recentRef: Map<string, number>, key: string, windowMs = 1200) => {
    const now = Date.now();
    const last = recentRef.get(key) ?? 0;
    if (now - last < windowMs) return true;
    recentRef.set(key, now);
    return false;
  };

  const onMessage = (incoming: any) => {
    try {
      const raw = incoming?.payload ? incoming.payload : incoming;
      const m = {
        id: raw.id ?? raw.messageId ?? undefined,
        roomId: raw.roomId ?? roomId,
        userId: norm(raw.userId ?? raw.userID ?? raw.authorId ?? raw.senderId ?? raw.idUser),
        username: norm(raw.username ?? raw.userName ?? raw.name ?? raw.senderUsername ?? raw.authorUsername ?? raw.senderName),
        content: norm(raw.content ?? raw.text),
        createdAt: raw.createdAt ?? raw.timestamp ?? new Date().toISOString(),
      };
      if (!m.content) return;
      // DEDUPE por id o por ventana de llegada (usa recentRef.current!)
      if (m.id) {
        const key = `id:${String(m.id)}`;
        if (seenIdsRef.current.has(key)) return;
        seenIdsRef.current.add(key);
      } else {
        const key = rcKey(m);
        if (seenRecently(recentRef.current, key, 1200)) return;
      }
      // marcar mío por firma local
      (m as any)._fromMe = recentSentRef.current.has(makeSig(roomId, m.content));
      setMessages(prev => [...(prev ?? []), m]);
    } catch (err) {
      console.error("WS onMessage parse error:", err, incoming);
    }
  };

  useEffect(() => {
    let unsub: (() => void) | null = null;
    ChatService.connect(roomId, auth.token, (payload) => {
      onMessage(payload);
    }).then((cleanup) => {
      setConnected(true);
      unsub = cleanup ?? null;
    }).catch(() => setConnected(false));
    return () => {
      setConnected(false);
      try { unsub && unsub(); } catch {}
    };
  }, [roomId, auth.token]);

  // Load message history when entering room
  useEffect(() => {
    if (!roomId || !auth.token) return;

    const fetchMessageHistory = async () => {
      try {
        const messages = await getRoomMessages(roomId);
        console.log("Historial cargado:", messages);

        // Get current user identity for message ownership
        const { id: currentUserId, username: currentUsername } = currentIdentity(auth);

        // Transform messages to match the expected format
        const transformedMessages = messages.map((msg: any) => {
          const messageUserId = norm(msg.userId ?? msg.userID ?? msg.authorId ?? msg.senderId ?? msg.idUser);
          const messageUsername = norm(msg.username ?? msg.userName ?? msg.name ?? msg.senderUsername ?? msg.authorUsername ?? msg.senderName);

          // Mark as from current user if it matches
          const isFromMe = (messageUserId && messageUserId === currentUserId) ||
                          (messageUsername && messageUsername === currentUsername);

          return {
            id: msg.id ?? msg.messageId ?? undefined,
            roomId: msg.roomId ?? roomId,
            userId: messageUserId,
            username: messageUsername,
            content: norm(msg.content ?? msg.text),
            createdAt: msg.createdAt ?? msg.timestamp ?? new Date().toISOString(),
            _fromMe: isFromMe,
          };
        });

        setMessages(transformedMessages);
      } catch (error) {
        console.error("Error al cargar historial de mensajes:", error);
      }
    };

    fetchMessageHistory();
  }, [roomId, auth.token]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !connected) return;
    const sig = makeSig(roomId, text);
    recentSentRef.current.add(sig);
    setTimeout(() => recentSentRef.current.delete(sig), 5000);
    ChatService.send(roomId, text);
    setInput("");
  };

  return {
    connected,
    messages,
    input,
    setInput,
    listRef,
    handleSend,
    auth,
    fmtTime,
    norm,
    lower,
  };
}