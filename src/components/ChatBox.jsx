import { useState, useEffect, useRef } from 'react';
import { createChatClient } from '../services/chatSocket';
import { getCurrentName } from '../services/helpers';

export default function ChatBox({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);
  const listRef = useRef(null);
  const recentSentRef = useRef(new Set());

  const makeSig = (roomId, content) => `${roomId}|${content.trim()}`;

  useEffect(() => {
    if (!roomId) return;
    console.log("roomId recibido en ChatBox:", roomId);
    const token = localStorage.getItem("auth_token");
    if (!token) {
      console.error(" No se encontró el token de autenticación");
      return;
    }

    async function fetchMessages() {
      try {
        const response = await fetch(`http://localhost:8081/api/rooms/${roomId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          console.log("Historial cargado:", data);
          //  Mantener estructura: enviados a la derecha, recibidos a la izquierda
          const userData = JSON.parse(atob(token.split(".")[1])); // decodifica el token
          const currentUsername = userData.username; // el backend guarda el username en el token
          setMessages(
            data.map((msg) => ({
              ...msg,
              isOwnMessage: msg.username === currentUsername, // diferencia visual
            }))
          );
        } else {
          console.error(" Error al cargar mensajes:", response.status);
        }
      } catch (error) {
        console.error(" Error al obtener mensajes:", error);
      }
    }

    fetchMessages();

    (async () => {
      clientRef.current = await createChatClient({
        roomId,
        onConnected: () => setConnected(true),
        onMessage: (payload) => {
          const content = payload?.data?.content ?? payload?.content ?? '';
          const sig = makeSig(roomId, content);
          if (recentSentRef.current.has(sig)) {
            recentSentRef.current.delete(sig);
            setMessages((prev) => prev.map(m => m.content === content && m.self && m.status === 'sending' ? {...m, status: 'sent'} : m));
          } else {
            const token = localStorage.getItem("auth_token");
            let currentUsername = "";
            if (token) {
              const decoded = JSON.parse(atob(token.split(".")[1]));
              currentUsername = decoded.username;
            }
            const sender = payload?.sender || "Equipo";
            const msg = {
              sender,
              content,
              ts: payload?.timestamp || Date.now(),
              self: sender === currentUsername,
              isOwnMessage: sender === currentUsername,
            };
            setMessages((prev) => [...prev, msg]);
          }
        },
        onError: () => setConnected(false),
      });
      clientRef.current.connect();
    })();
    return () => clientRef.current?.disconnect();
  }, [roomId]);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = (e) => {
    e.preventDefault();
    const msg = text.trim();
    if (!msg) return;
    try {
      clientRef.current?.client?.publish({
        destination: `/app/room/${roomId}/chat`,
        body: JSON.stringify({ content: msg }),
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      console.log("Mensaje enviado al backend:", msg);
    } catch (err) {
      console.error(" Error al publicar mensaje al backend:", err);
    }
    // Asegurar que los mensajes se guarden en la base de datos
    fetch(`http://localhost:8081/api/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ content: msg })
    }).catch(err => console.error('Error guardando mensaje:', err));
    const ts = Date.now();
    setMessages((prev) => [
      ...prev,
      { sender: getCurrentName() || 'Tú', content: msg, ts, self: true, status: 'sending', isOwnMessage: true },
    ]);
    recentSentRef.current.add(makeSig(roomId, msg));
    setTimeout(() => recentSentRef.current.delete(makeSig(roomId, msg)), 5000);
    setText('');
  };

  if (!roomId) {
    return (
      <aside
        className="chat-box"
        style={{
          width: '420px',
          minWidth: 320,
          maxWidth: 480,
          height: 'calc(100vh - 160px)',
          background: 'rgba(16, 24, 39, 0.7)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</div>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>Selecciona una sala para chatear</div>
          <div style={{ fontSize: '14px' }}>Abre una sala para unirte al chat del equipo</div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="chat-box"
      style={{
        width: '420px',
        minWidth: 320,
        maxWidth: 480,
        height: 'calc(100vh - 160px)',
        background: 'rgba(16, 24, 39, 0.7)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ color: '#E5E7EB', fontWeight: 800, fontSize: 20, margin: 0 }}>
          Chat del Equipo
        </h3>
        <div style={{ marginLeft: 'auto', opacity: 0.7, color: connected ? '#22C55E' : '#F59E0B' }}>
          {connected ? 'Conectado' : 'Conectando'}
        </div>

      </div>

      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 2px',
          gap: 8,
          display: 'grid',
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 32 }}>
            <div
              style={{
                width: 40,
                height: 40,
                margin: '0 auto 8px',
                borderRadius: 12,
                border: '2px solid #4B5563',
              }}
            />
            <div style={{ fontWeight: 600 }}>No hay mensajes todavía.</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              ¡Rompe el hielo y saluda al equipo!
            </div>
          </div>
        ) : (
           messages.map((m, i) => (
             <div
               key={i}
               className={`flex ${m.isOwnMessage ? "justify-end" : "justify-start"}`}
             >
               <div
                 className={`p-2 rounded-lg max-w-xs ${
                   m.isOwnMessage
                     ? "bg-blue-500 text-white"
                     : "bg-gray-200 text-gray-800"
                 }`}
               >
                 {!m.isOwnMessage && (
                   <div className="text-xs text-gray-500 mb-1">
                     {m.sender || 'Equipo'}
                   </div>
                 )}
                 <div className="whitespace-pre-wrap break-words">
                   {m.content}
                 </div>
                 {m.isOwnMessage && m.status === 'sending' && (
                   <div className="text-xs opacity-70 text-right mt-1">
                     ⏳ Enviando...
                   </div>
                 )}
                 {m.isOwnMessage && m.status === 'sent' && (
                   <div className="text-xs opacity-70 text-right mt-1">
                     ✓ Enviado
                   </div>
                 )}
               </div>
             </div>
           ))
        )}
      </div>

      <form onSubmit={send} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje..."
          style={{
            flex: 1,
            background: '#111827',
            color: '#E5E7EB',
            border: '1px solid #374151',
            borderRadius: 12,
            padding: '10px 12px',
            outline: 'none',
          }}
          disabled={!connected}
        />
        <button
          type="submit"
          title="Enviar"
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            border: 'none',
            background: '#2563EB',
            color: 'white',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            fontSize: 18,
          }}
        >
          ✈️
        </button>
      </form>
    </aside>
  );
}