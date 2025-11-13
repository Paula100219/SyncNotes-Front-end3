// Panel de chat UI minimalista, no rompe estilos existentes.

// Usa hook para mensajes y envío.

import React, { useEffect, useRef, useState } from 'react';
import { useRoomChat } from '../../hooks/useRoomChat';
import { Send } from 'lucide-react';

// Helpers seguros
const safeToLower = (str) => str?.toLowerCase() || '';

export default function ChatPanel({ roomId, token, currentUsername }) {
  const { messages, connected, sendMessage } = useRoomChat(roomId, token);

  const [text, setText] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    // auto scroll
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

const handleSend = (e) => {
  e.preventDefault();
  const val = text.trim();
  if (!val) return;
  sendMessage(val);
  setText('');
};

return (

<div className="room-chat">

 <div className="rc-head">

 <div style={{ color: '#cbd5e1', fontWeight: 600 }}>Chat de la sala</div>

 <div className={`rc-dot ${connected ? '' : 'off'}`}></div>

 <div style={{ color: '#a3a3a3', fontSize: 12 }}>

   {connected ? 'Conectado' : 'Conectando...'}

 </div>

 </div>

<div

ref={listRef}

className="rc-messages"

>

 {messages.map((m) => {

  const mine = safeToLower(m?.username) === safeToLower(currentUsername);

 return (

 <div key={m.id} className={`rc-item ${mine ? 'me' : ''}`}>

 {!mine && (

 <div className="rc-avatar">

 {(m.username?.charAt(0)?.toUpperCase() || 'U') === '?' ? 'U' : (m.username?.charAt(0)?.toUpperCase() || 'U')}

 </div>

 )}

 {mine && (

 <div className="rc-bubble">

 <div>{m.content}</div>

 <div className="rc-meta">

 <span className="rc-name">{m.username}</span>

 <span>{!isNaN(new Date(m.timestamp).getTime()) ? new Date(m.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}</span>

 </div>

 </div>

 )}

 {!mine && (

 <div className="rc-bubble">

 <div className="rc-meta">

 <span className="rc-name">{m.username}</span>

 <span>{!isNaN(new Date(m.timestamp).getTime()) ? new Date(m.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}</span>

 </div>

 <div>{m.content}</div>

 </div>

 )}

 {mine && (

 <div className="rc-avatar">

 {(m.username?.charAt(0)?.toUpperCase() || 'U') === '?' ? 'U' : (m.username?.charAt(0)?.toUpperCase() || 'U')}

 </div>

 )}

 </div>

 );

 })}

</div>

 <form onSubmit={handleSend} className="rc-inputbar">

 <input

 className="rc-input"

 value={text}

 onChange={(e) => setText(e.target.value)}

 placeholder="Escribe un mensaje"

 />

 <button

 className="rc-btn"

 type="submit"

 disabled={!connected}

 >

 Enviar

 </button>

 </form>

</div>

);

}