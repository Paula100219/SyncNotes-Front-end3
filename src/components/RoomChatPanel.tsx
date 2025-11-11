import React from "react";
import { Send } from "lucide-react";
import { useRoomChatPanel } from '../hooks/useRoomChatPanel';
import "./room-chat.css";

// ✅ Función para generar iniciales reales (ej: "Minato Garden" → "MG", "Pelusa Pérez" → "PP")
function getInitials(name?: string): string {
  if (!name) return "?";
  const clean = name.trim().replace(/\s+/g, " ");
  const parts = clean.split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function RoomChatPanel({ roomId }: { roomId: string }) {
  const { connected, messages, input, setInput, listRef, handleSend, auth, fmtTime, norm, lower } =
    useRoomChatPanel(roomId);

  // ✅ Datos del usuario autenticado (usa el nombre completo del perfil, no el username)
  const myId = [auth?.user?.id, auth?.user?.userId].map(norm).find(v => v);
  const myUser = [auth?.user?.username, auth?.user?.userName, auth?.user?.name].map(lower).find(v => v);
  const myFullName =
    auth?.user?.name ||
    auth?.user?.fullName ||
    auth?.user?.nombreCompleto ||
    auth?.user?.username ||
    auth?.user?.userName ||
    "";

  return (
    <section className="room-chat">
      {/* Estado conexión */}
      <div className="rc-head">
        <span className={`rc-dot ${connected ? "" : "off"}`} />
        <span>{connected ? "Conectado" : "Desconectado"}</span>
      </div>

      {/* Lista de mensajes (solo aquí hay scroll) */}
      <div className="rc-messages" ref={listRef}>
        {(!messages || messages.length === 0) && (
          <div className="rc-empty">
            No hay mensajes todavía. ¡Rompe el hielo y saluda al equipo!
          </div>
        )}

        {messages?.map((m: any) => {
          const msgId = norm(m.userId);
          const msgUser = lower(m.username);
          const isMe =
            (m as any)._fromMe === true ||
            (!!myId && myId === msgId) ||
            (!!myUser && myUser === msgUser);

          // ✅ Si soy yo, uso mi nombre completo (que sí tiene nombre y apellido)
          // Si es otro usuario, uso el que venga en el mensaje
          const senderName = isMe
            ? myFullName
            : m.name || m.fullName || m.nombreCompleto || m.username || "Invitado";

          const badgeText = getInitials(senderName);

          return (
            <div
              key={String(m.id ?? m.createdAt ?? `${m.username}-${Math.random()}`)}
              className={`rc-item ${isMe ? "me" : ""}`}
            >
              {!isMe && <div className="rc-avatar">{badgeText}</div>}
              <div className="rc-bubble">
                <div>{m.content}</div>
                <div className="rc-meta">
                  {!isMe && <span className="rc-name">{senderName}</span>}
                  <span>{fmtTime(m.createdAt)}</span>
                </div>
              </div>
              {isMe && <div className="rc-avatar">{badgeText}</div>}
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
        <button
          className="rc-btn"
          type="submit"
          disabled={!input?.trim() || !connected}
        >
          <Send size={16} />
        </button>
      </form>
    </section>
  );
}