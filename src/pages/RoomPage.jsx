import React, { useState } from "react";

import ChatBox from "../components/ChatBox"; // ruta relativa según tu proyecto

export default function RoomPage({ roomId }) {

// Estado que controla si el chat está visible

const [showChat, setShowChat] = useState(false);

return (

<div className="room-page relative w-full h-full">

{/* --- Contenido actual de la sala (mantenerlo, no tocar) --- */}

<div className="room-content">

{/* deja aquí todo lo que ya tienes: header, lista de miembros, tareas, etc. */}

</div>

{/* --- Botón flotante para abrir chat (no cambia estilos existentes) --- */}

{!showChat && (

<button

onClick={() => setShowChat(true)}

style={{

position: "fixed",

bottom: "20px",

right: "20px",

background: "#2563EB",

color: "white",

border: "none",

borderRadius: "50%",

width: "60px",

height: "60px",

fontSize: "24px",

cursor: "pointer",

boxShadow: "0 4px 10px rgba(0,0,0,0.3)",

}}

>

💬

</button>

)}

{showChat && (

<div

style={{

position: "fixed",

bottom: "80px",

right: "20px",

zIndex: 1000,

}}

>

<ChatBox roomId={roomId} />

<button

onClick={() => setShowChat(false)}

style={{

position: "absolute",

top: "-12px",

right: "-12px",

background: "#EF4444",

color: "white",

border: "none",

borderRadius: "50%",

width: "28px",

height: "28px",

cursor: "pointer",

fontWeight: "bold",

}}

>

×

</button>

</div>

)}

</div>

);

}