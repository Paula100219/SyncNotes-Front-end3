// Panel de chat UI minimalista, no rompe estilos existentes.

// Usa hook para mensajes y envío.

import React, { useEffect, useRef, useState } from 'react';
import { useRoomChat } from '../../hooks/useRoomChat';

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

<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>

<div style={{ color: '#cbd5e1', fontWeight: 600 }}>Chat de la sala</div>

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

<div key={m.id} style={{

alignSelf: mine ? 'flex-end' : 'flex-start',

maxWidth: '70%',

background: mine ? '#3b82f6' : 'rgba(255,255,255,0.06)',

color: mine ? 'white' : '#e5e7eb',

padding: '8px 12px',

borderRadius: 12,

fontSize: 14

}}>

{!mine && (

<div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>

{m.username}

</div>

)}

<div>{m.content}</div>

</div>

);

})}

</div>

<form onSubmit={handleSend} style={{ display: 'flex', gap: 8, marginTop: 8 }}>

<input

value={text}

onChange={(e) => setText(e.target.value)}

placeholder="Escribe un mensaje"

style={{

flex: 1,

background: 'rgba(0,0,0,0.25)',

border: '1px solid rgba(255,255,255,0.06)',

color: '#e5e7eb',

borderRadius: 10,

padding: '10px 12px',

outline: 'none'

}}

/>

 <button

 type="submit"

 disabled={!connected}

 style={{

 background: '#3b82f6',

 color: 'white',

 border: 'none',

 borderRadius: 10,

 padding: '0 14px',

 cursor: connected ? 'pointer' : 'not-allowed',

 opacity: connected ? 1 : 0.6

 }}

 >

Enviar

</button>

</form>

</div>

);

}