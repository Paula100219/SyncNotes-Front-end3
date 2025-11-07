import { useEffect, useMemo, useState } from "react";
import { fetchRoomHistory, ChangeHistoryDto } from "@/api/history";

function initials(name?: string) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] + (parts[1]?.[0] || "")).toUpperCase();
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "--:--";
    return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--:--";
  }
}

function actionToPhrase(action?: string, details?: string) {
  const a = (action || "").toLowerCase();
  const d = details || "";

  if (a.includes("create") && a.includes("task")) return `Creó la tarea: ${d}`;
  if (a.includes("update") && a.includes("task")) return `Actualizó la tarea: ${d}`;
  if (a.includes("delete") && a.includes("task")) return `Eliminó la tarea: ${d}`;
  if (a.includes("complete") && a.includes("task")) return `Marcó como completada: ${d}`;
  if (a.includes("add") && a.includes("member")) return `Agregó al miembro: ${d}`;
  if (a.includes("remove") && a.includes("member")) return `Removió al miembro: ${d}`;
  if (a.includes("change") && a.includes("role")) return `Cambió el rol de: ${d}`;
  if (a.includes("create") && a.includes("room")) return `Creó la sala: ${d}`;
  if (a.includes("update") && a.includes("room")) return `Actualizó la sala: ${d}`;

  // Fallback
  return d || (action ? `Acción: ${action}` : "Evento registrado");
}

function actionTag(action?: string) {
  const a = (action || "").toLowerCase();
  if (a.includes("create")) return { label: "Creó", className: "badge-success" };
  if (a.includes("update") || a.includes("edit")) return { label: "Editó", className: "badge-info" };
  if (a.includes("delete") || a.includes("remove")) return { label: "Eliminó", className: "badge-danger" };
  if (a.includes("add") || a.includes("member")) return { label: "Agregó", className: "badge-warning" };
  if (a.includes("complete")) return { label: "Completó", className: "badge-success" };
  return { label: "Evento", className: "badge-neutral" };
}

function resolveUserName(it: ChangeHistoryDto, userDirectory: Record<string, string>, currentUserId?: string) {
  const fromDto = (it as any).user?.username || it.userName?.trim();
  if (fromDto) return fromDto;
  const id =
    (it as any).userId ||
    (it as any).user?.id ||
    (it as any).user?._id ||
    "";
  if (id && userDirectory[String(id)]) return userDirectory[String(id)];
  if (currentUserId && String(id) === String(currentUserId)) return "Tú";
  return "Usuario desconocido";
}

type Props = {
  roomId: string;
  authToken: string;
  userDirectory?: Record<string, string>;
  currentUserId?: string;
};

export default function HistoryPanel({
  roomId,
  authToken,
  userDirectory = {},
  currentUserId = ""
}: Props) {
  const [items, setItems] = useState<ChangeHistoryDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchRoomHistory(roomId, authToken)
      .then((data) => mounted && setItems(data))
      .catch((e) => mounted && setError(e.message));
    return () => { mounted = false; };
  }, [roomId, authToken]);

  const groups = useMemo(() => {
    const map = new Map<string, ChangeHistoryDto[]>();
    (items || []).forEach((it) => {
      const key = formatDate(it.createdAt);
      const arr = map.get(key) || [];
      arr.push(it);
      map.set(key, arr);
    });
    return Array.from(map.entries());
  }, [items]);

  if (error) return <div className="panel-body"><p className="text-danger">Error al cargar el historial: {error}</p></div>;
  if (items === null) return (
    <div className="panel-body">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-row"></div>
      ))}
    </div>
  );
  if (items.length === 0) return <div className="panel-body"><p className="text-muted">No hay eventos registrados en esta sala.</p></div>;

  return (
    <div className="panel-body history-body">
      {groups.map(([date, dayItems]) => (
        <div key={date} className="history-group">
          <div className="history-date">{date}</div>
          <ul className="history-list">
             {dayItems.map((it, i) => {
               const time = formatTime(it.createdAt);
               const tag = actionTag(it.action);
               const phrase = actionToPhrase(it.action, it.details);
                const displayName = resolveUserName(it, userDirectory, currentUserId);
               return (
                 <li key={i} className="history-item">
                   <div className="avatar">{initials(displayName)}</div>
                   <div className="history-content">
                     <div className="history-line">
                       <span className="user">{displayName}</span>
                       <span className={`badge ${tag.className}`}>{tag.label}</span>
                       <span className="time">{time}</span>
                     </div>
                     <div className="history-details">{phrase}</div>
                   </div>
                 </li>
               );
             })}
          </ul>
        </div>
      ))}
    </div>
  );
}