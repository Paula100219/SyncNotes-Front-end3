import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { chatService, ChatStatus } from "../services/ChatService";

import { useAuth } from "../hooks/useAuth";

export type UiMessage = {
  id: string;
  userId: string;
  username: string;
  content: string;
  isMine: boolean;
  timestamp?: string;
};

export function useRoomChat(roomId: string, httpBaseUrl: string) {
  const { user, token } = useAuth();
  const [status, setStatus] = useState<ChatStatus>("Desconectado");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const recentRef = useRef<Map<string, number>>(new Map());
  const myId = user?.id || "";

  const onMessage = useCallback(
    (payload: any) => {
      const mid = String(payload.id ?? `${payload.userId}-${payload.timestamp}-${payload.content}`);
      if (seenIdsRef.current.has(mid)) return;
      const now = Date.now();
      const key = `${payload.userId}-${payload.content}`;
      const lastTime = recentRef.current.get(key);
      if (lastTime && now - lastTime < 5000) return; // evita duplicados por ventana de llegada (5 segundos)
      recentRef.current.set(key, now);
      seenIdsRef.current.add(mid);
      setMessages((prev) => [
        ...prev,
        {
          id: mid,
          userId: payload.userId,
          username: payload.username ?? "",
          content: String(payload.content ?? ""),
          isMine: payload.userId === myId,
          timestamp: payload.timestamp,
        },
      ]);
    },
    [myId]
  );

  useEffect(() => {
    if (!roomId) return;
    setMessages([]);
    seenIdsRef.current.clear();
    recentRef.current.clear();
    chatService.connect({
      httpBaseUrl: "http://localhost:8081",
      roomId,
      onMessage,
      onStatus: setStatus,
    });
    return () => {
      chatService.disconnect();
    };
  }, [roomId, onMessage]);

  const send = useCallback(
    async (text: string) => {
      const content = (text ?? "").trim();
      if (!content) return;
      chatService.sendMessage(content);
    },
    []
  );

  return useMemo(
    () => ({ status, messages, send }),
    [status, messages, send]
  );
}