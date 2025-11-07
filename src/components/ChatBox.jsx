import { useState, useEffect, useRef } from 'react';
import { createChatClient } from '../services/chatSocket';
import { getCurrentName } from '../services/helpers';

export default function ChatBox({ roomId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const clientRef = useRef(null);
  const listRef = useRef(null);
  const recentSentRef = useRef(new Set());

  const token = localStorage.getItem("auth_token");
  let currentUsername = "";
  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      currentUsername = decoded.sub || decoded.username;
    } catch {}
  }

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
           setMessages(
             data.map((msg) => ({
               ...msg,
               username: msg.username?.trim().toLowerCase(),
               sender: msg.username?.trim().toLowerCase(),
               isOwnMessage: msg.username?.trim().toLowerCase() === currentUsername, // diferencia visual
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
           console.log("[WS] payload recibido:", payload);
           const content = payload?.data?.content ?? payload?.payload?.content ?? payload?.content ?? '';
           const sig = makeSig(roomId, content);
           if (recentSentRef.current.has(sig)) {
             recentSentRef.current.delete(sig);
             setMessages((prev) => prev.map(m => m.content === content && m.self && m.status === 'sending' ? {...m, status: 'sent'} : m));
           } else {
             const username = payload?.data?.username?.trim().toLowerCase() || payload?.payload?.username?.trim().toLowerCase() || "equipo";
             const msg = {
               sender: username,
               content,
               ts: payload?.timestamp || Date.now(),
               username,
               self: username.trim().toLowerCase() === currentUsername.trim().toLowerCase(),
               isOwnMessage: username.trim().toLowerCase() === currentUsername.trim().toLowerCase(),
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
      console.log("Mensaje enviado al backend (WS):", msg);
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
      { sender: currentUsername, content: msg, ts, self: true, status: 'sending', isOwnMessage: true, username: currentUsername },
    ]);
    recentSentRef.current.add(makeSig(roomId, msg));
    setTimeout(() => recentSentRef.current.delete(makeSig(roomId, msg)), 6000);
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
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontWeight: 800, color: '#E5E7EB' }}>Chat del Equipo</div>
          <button
            onClick={() => onClose && onClose()}
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: "none",
              color: "#E5E7EB",
              fontSize: 18,
              cursor: "pointer"
            }}
            aria-label="Cerrar chat"
          >
            ×
          </button>
        </div>

         <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
           <button onClick={() => setIsChatVisible(!isChatVisible)} style={{ marginBottom: '10px', padding: '5px 10px', background: '#374151', color: '#E5E7EB', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
             {isChatVisible ? 'Ocultar Chat' : 'Mostrar Chat'}
           </button>

           <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
             {isChatVisible && (
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
          <div>
            {messages.map((msg, index) => {
              const isOwnMessage = msg.isOwnMessage;
              return (
                <div
                  key={index}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-2`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-2xl shadow-md ${
                      isOwnMessage
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-700 text-white rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs opacity-70 text-right">{msg.username}</p>
                  </div>
                </div>
              );
            })}
          </div>
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
    </div>
  </aside>
);

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
       )}
     </aside>
   );
 }