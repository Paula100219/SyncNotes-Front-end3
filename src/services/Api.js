import { HTTP_BASE } from "./base.js";
const API = HTTP_BASE;

export function makeUrl(path) {
  // path siempre debe comenzar con "/"
  return API + path;
}

// Guardar / obtener el token
export const setToken = (t) => localStorage.setItem("token", t);
export const getToken = () => localStorage.getItem("token");

// Guardar / obtener el username
export const setUsernameLS = (u) => localStorage.setItem("username", u);
export const getUsernameLS = () => localStorage.getItem("username");

// Helpers seguros
async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export function authHeaders(extra = {}) {
  const token = getToken();
  const headers = { ...extra };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

const handleAuthFailure = async (res, path) => {
  if (res.status === 401) {
    alert("Sesión inválida o token faltante/expirado. Vuelve a iniciar sesión.");
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("name");
    window.location.replace("/login");
    return true; // se manejó
  }
  if (res.status === 403 && path === "/api/auth/me") {
    alert("Sesión inválida o token faltante/expirado. Vuelve a iniciar sesión.");
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("name");
    window.location.replace("/login");
    return true; // se manejó
  }
  return false;
};

// 🔹 LOGIN: obtiene el token y lo guarda (lanza error legible en 401/403)
export async function login(username, password) {
  try {
    const r = await fetch(makeUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ username, password }),
    });

    const body = await safeJson(r);
    if (!r.ok) {
      const fallback = await safeText(r);
      let message = "Login failed";
      if (r.status === 401) message = "Credenciales inválidas.";
      else if (r.status === 403) message = "Acceso no autorizado (403).";
      else message = (body && (body.error || body.message)) || fallback || "Login failed";
      const err = new Error(message);
      err.status = r.status;
      err.data = body;
      throw err;
    }

    return body;
  } catch (err) {
    if (err.message === "Failed to fetch") {
      err.message = "No se pudo conectar con el servidor (revisa que el backend esté en 8081).";
    }
    throw err;
  }
}

// 🔹 GET genérico con autorización (Bearer)
export async function apiGet(path) {
  try {
    const r = await fetch(makeUrl(path), {
      headers: authHeaders(),
    });

    const body = await safeJson(r);
    if (!r.ok) {
      if (await handleAuthFailure(r, path)) return;
      const fallback = await safeText(r);
      let message = "Request failed";
      if (r.status === 401) message = "Credenciales inválidas.";
      else if (r.status === 403) message = "Acceso no autorizado (403).";
      else message = (body && (body.error || body.message)) || fallback || "Request failed";
      const err = new Error(message);
      err.status = r.status;
      err.data = body;
      throw err;
    }
    return body;
  } catch (err) {
    if (err.message === "Failed to fetch") {
      err.message = "No se pudo conectar con el servidor (revisa que el backend esté en 8081).";
    }
    throw err;
  }
}

// 🔹 POST genérico con autorización
async function apiPost(path, data) {
  try {
    const r = await fetch(makeUrl(path), {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data || {}),
    });
    const body = await safeJson(r);
    if (!r.ok) {
      if (await handleAuthFailure(r, path)) return;
      const fallback = await safeText(r);
      let message = "Request failed";
      if (r.status === 401) message = "Credenciales inválidas.";
      else if (r.status === 403) message = "Acceso no autorizado (403).";
      else message = (body && (body.error || body.message)) || fallback || "Request failed";
      const err = new Error(message);
      err.status = r.status;
      err.data = body;
      throw err;
    }
    return body;
  } catch (err) {
    if (err.message === "Failed to fetch") {
      err.message = "No se pudo conectar con el servidor (revisa que el backend esté en 8081).";
    }
    throw err;
  }
}

// 🔹 PUT genérico con autorización
async function apiPut(path, data) {
  try {
    const r = await fetch(makeUrl(path), {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data || {}),
    });
    const body = await safeJson(r);
    if (!r.ok) {
      if (await handleAuthFailure(r, path)) return;
      const fallback = await safeText(r);
      let message = "Request failed";
      if (r.status === 401) message = "Credenciales inválidas.";
      else if (r.status === 403) message = "Acceso no autorizado (403).";
      else message = (body && (body.error || body.message)) || fallback || "Request failed";
      const err = new Error(message);
      err.status = r.status;
      err.data = body;
      throw err;
    }
    return body;
  } catch (err) {
    if (err.message === "Failed to fetch") {
      err.message = "No se pudo conectar con el servidor (revisa que el backend esté en 8081).";
    }
    throw err;
  }
}

// 🔹 DELETE genérico con autorización
async function apiDelete(path) {
  try {
    const r = await fetch(makeUrl(path), {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!r.ok) {
      if (await handleAuthFailure(r, path)) return;
      const body = await safeJson(r);
      const fallback = await safeText(r);
      let message = "Request failed";
      if (r.status === 401) message = "Credenciales inválidas.";
      else if (r.status === 403) message = "Acceso no autorizado (403).";
      else message = (body && (body.error || body.message)) || fallback || "Request failed";
      const err = new Error(message);
      err.status = r.status;
      err.data = body;
      throw err;
    }
    return true;
  } catch (err) {
    if (err.message === "Failed to fetch") {
      err.message = "No se pudo conectar con el servidor (revisa que el backend esté en 8081).";
    }
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// ENDPOINTS DE TU BACKEND
// ─────────────────────────────────────────────────────────────

// Me: devuelve { user, rooms, tasks, message } desde /api/auth/me
export const getMe = () => apiGet("/api/auth/me");

// Rooms
export const fetchRooms = () => apiGet("/api/rooms");
export const getPublicRooms = () => apiGet("/api/rooms/public");
export const getMyRooms = () => apiGet("/api/rooms/my-rooms");

// ✅ Crear sala
export function createRoom({ name, description, isPublic }) {
  return apiPost("/api/rooms", {
    name,
    description: description || "",
    // si tu DTO usa "isPublic" o "privacy", ajusta el campo:
    isPublic: !!isPublic,
  });
}

// ✅ Obtener tareas de una sala (opcional si ya usas /me)
export function getRoomTasks(roomId, completed) {
  const q = typeof completed === "boolean" ? `?completed=${completed}` : "";
  return apiGet(`/api/rooms/${encodeURIComponent(roomId)}/tasks${q}`);
}

// ✅ Crear tarea
export function createTask(roomId, { title, description }) {
  return apiPost(`/api/rooms/${encodeURIComponent(roomId)}/tasks`, {
    title,
    description: description || "",
  });
}

// (opcionales) actualizar / eliminar tarea
export function updateTask(roomId, taskId, payload) {
  return apiPut(`/api/rooms/${roomId}/tasks/${taskId}`, payload);
}
export function deleteTask(roomId, taskId) {
  return apiDelete(`/api/rooms/${roomId}/tasks/${taskId}`);
}

// 🔹 REGISTER: crear usuario nuevo
export async function register(name, username, password) {
  try {
    const r = await fetch(makeUrl("/api/users/signup-user"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ name, username, password }),
    });

    const body = await safeJson(r);
    if (!r.ok) {
      const fallback = await safeText(r);
      let message = "Register failed";
      if (r.status === 401) message = "Credenciales inválidas.";
      else if (r.status === 403) message = "Acceso no autorizado (403).";
      else message = (body && (body.error || body.message)) || fallback || "Register failed";
      const err = new Error(message);
      err.status = r.status;
      err.data = body;
      throw err;
    }
    return body;
  } catch (err) {
    if (err.message === "Failed to fetch") {
      err.message = "No se pudo conectar con el servidor (revisa que el backend esté en 8081).";
    }
    throw err;
  }
}
// ✅ Eliminar sala
export function deleteRoom(roomId) {
  return apiDelete(`/api/rooms/${encodeURIComponent(roomId)}`);
}

// ✅ Obtener detalles de sala
export function getRoomDetails(roomId) {
  return apiGet(`/api/rooms/${encodeURIComponent(roomId)}`);
}

// ✅ Añadir miembro a sala
export function addMember(roomId, userId, role) {
  return apiPost(`/api/rooms/${encodeURIComponent(roomId)}/members`, { userId, role });
}

// ✅ Buscar usuario por username
export function searchUser(username) {
  return apiGet(`/api/users/searchUser/${encodeURIComponent(username)}`);
}

// ✅ Obtener usuario por username (para prellenar modal)
export async function getUserByUsername(username) {
  try {
    const r = await fetch(makeUrl(`/api/users/searchUser/${encodeURIComponent(username)}`), {
      headers: authHeaders(),
    });
    const body = await safeJson(r);
    if (!r.ok) {
      if (await handleAuthFailure(r)) return;
      const fallback = await safeText(r);
      let message = "Request failed";
      if (r.status === 401) message = "Credenciales inválidas.";
      else if (r.status === 403) message = "Acceso no autorizado (403).";
      else message = (body && (body.error || body.message)) || fallback || "Request failed";
      const err = new Error(message);
      err.status = r.status;
      err.data = body;
      throw err;
    }
    return body;
  } catch (err) {
    if (err.message === "Failed to fetch") {
      err.message = "No se pudo conectar con el servidor (revisa que el backend esté en 8081).";
    }
    throw err;
  }
}

// ✅ Actualizar rol de miembro
export function updateMemberRole(roomId, memberId, role) {
  return apiPut(`/api/rooms/${encodeURIComponent(roomId)}/members/${encodeURIComponent(memberId)}/role?role=${encodeURIComponent(role)}`);
}

// ✅ Unirse a sala pública
export function joinRoom(roomId) {
  return apiPost(`/api/rooms/${encodeURIComponent(roomId)}/join`);
}

// ✅ Obtener mensajes de sala
export function getRoomMessages(roomId) {
  return apiGet(`/api/rooms/${encodeURIComponent(roomId)}/messages`);
}

// ✅ Obtener historial de sala
export function getRoomHistory(roomId) {
  return apiGet(`/api/rooms/${encodeURIComponent(roomId)}/history`);
}

// ✅ Obtener usuarios activos en sala
export function getActiveUsers(roomId) {
  return apiGet(`/api/rooms/${encodeURIComponent(roomId)}/active-users`);
}



// ✅ Actualizar usuario (PUT) SOLO { name, username }
export async function updateUser(id, payload) {
  const result = await apiPut(`/api/users/update-user/${encodeURIComponent(id)}`, payload);
  // Sincronizar LS si cambió name/username
  if (payload.username) localStorage.setItem("username", payload.username);
  if (payload.name) localStorage.setItem("name", payload.name);
  return result;
}

// ✅ Eliminar usuario (DELETE)
export async function deleteUser(id) {
  const success = await apiDelete(`/api/users/delete-user/${encodeURIComponent(id)}`);
  if (success) {
    // Logout y redirect solo en éxito
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("name");
    window.location.replace("/login");
  }
  return success;
}


// 🔹 Logout: limpiar sesión y redirigir
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("name");
  window.location.replace("/login");
};

// 🔹 (opcional) test conexión
export async function getServerMessage() {
  try {
    const response = await apiGet("/api/message");
    return (response && response.message) || response;
  } catch (error) {
    console.error("Error al obtener mensaje del servidor:", error);
    return null;
  }
}