import { currentUserId, normalizeOwnerId, normalizeMemberId } from './helpers';

export type Role = "OWNER" | "EDITOR" | "VIEWER";

/**
 * Deriva el rol del usuario PARA ESTA sala usando los campos del backend:
 *  - RoomDto.owner : string
 *  - RoomDto.members : [{ user: { id: string }, role: 'OWNER'|'EDITOR'|'VIEWER' }]
 */
export function deriveRoleForRoom(
  currentUser?: CurrentUser,
  room?: RoomDto
): Role | undefined {
  if (!currentUser || !room) return 'VIEWER';

  const myId = currentUserId({ user: currentUser });

  if (!myId) return 'VIEWER';

  const ownerId = normalizeOwnerId(room);

   const ownerUsername = (room as any)?.ownerUsername || room?.owner?.username || room?.createdBy?.username;

   const isOwner = Boolean(myId && ownerId && String(myId) === String(ownerId)) || (currentUser?.username && currentUser.username === ownerUsername);

   if (isOwner) return 'OWNER';

   const isEditor = Array.isArray((room as any)?.members)
     ? (room as any).members.some((m: any) => {
         const memId = normalizeMemberId(m);
         const r = String(m?.role || "").toUpperCase().trim();
         return String(memId) === String(myId) && r === "EDITOR";
       })
     : false;

  if (isEditor) return 'EDITOR';

  return undefined;
}

/** Permisos de tareas: OWNER y EDITOR pueden crear/editar */

export const canCreateTask = (role?: Role) => role === "OWNER" || role === "EDITOR";

export const canEditTask   = canCreateTask;

/** Añadir miembros: por política mínima solo OWNER (si se desea incluir EDITOR, cambiar aquí a: role === 'OWNER' || role === 'EDITOR') */

export const canAddMember  = (role?: Role) => role === "OWNER";

export const canCreateWithFallback = (role?: Role, fallback: boolean) => {
  if (role !== undefined) {
    return canCreateTask(role);
  } else {
    return fallback;
  }
};

export const canEditWithFallback = (role?: Role, fallback: boolean) => {
  if (role !== undefined) {
    return canEditTask(role);
  } else {
    return fallback;
  }
};

// Regla clave: si roleComputed === undefined (loading) => NO bloquear (true)
export const canCreateUI = (role?: Role) => {
  if (role === undefined) return true;
  return role === "OWNER" || role === "EDITOR";
};

export const canEditUI = canCreateUI;

export const canAddMemberUI = (role?: Role) => {
  if (role === undefined) return true;
  return role === "OWNER"; // si editor puede, usar: || role === "EDITOR"
};

type RoomMember = { user: { id: string }; role: Role };

type RoomDto    = { owner?: string; members?: RoomMember[] };

type CurrentUser = { id?: string; _id?: string };