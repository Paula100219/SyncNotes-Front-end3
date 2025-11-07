export interface ChangeHistoryDto {
  id?: string;
  userId?: string;
  userName?: string;
  action?: string;   // p.ej. CREAR_TAREA, ACTUALIZAR_TAREA, AGREGAR_MIEMBRO
  details?: string;  // texto libre que envía el backend
  createdAt: string; // fecha ISO o epoch
}

export async function fetchRoomHistory(roomId: string, token: string) {
  const res = await fetch(`/api/rooms/${roomId}/history`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Historial: ${res.status} ${txt}`);
  }
  return (await res.json()) as ChangeHistoryDto[];
}