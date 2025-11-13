import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Plus, User, LogOut, Edit, Trash2 } from "lucide-react";
import logoPng from "../assets/logo.png";
import { searchUser } from "../services/Api";
import { useAuth } from "../hooks/useAuth";

// Helpers MINIMOS y SEGUROS (colócalos arriba del componente, en el mismo archivo):

const BASE = "http://localhost:8081"; // usa la MISMA base del login

const getToken = () => localStorage.getItem("token") || "";

const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

const forceLogout = () => {
  alert("Sesión inválida o token faltante/expirado. Vuelve a iniciar sesión.");
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("name");
  window.location.replace("/login");
};

const maybeForceLogout = async (res, url) => {
  if (res.status === 401) {
    forceLogout();
    return true;
  }
  if (res.status === 403 && url.includes("/api/auth/me")) {
    forceLogout();
    return true;
  }
  return false;
};

const getMyIdFromMe = async () => {
  const token = getToken();
  if (!token) throw new Error("No hay token de sesión.");

  const url = `${BASE}/api/auth/me`;
  const res = await fetch(url, { headers: authHeader() });

  if (await maybeForceLogout(res, url)) throw new Error("AUTH");

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "No se pudo obtener el usuario actual.");
  }

  const data = await res.json();
  const id = data?.user?.id || data?.id;
  if (!id) throw new Error("No se pudo resolver el ID del usuario.");
  return id;
};

const getInitialsFromLS = () => {
  const val =
    (localStorage.getItem("name") || localStorage.getItem("username") || "U")
      .toString()
      .trim();
  if (!val) return "U";
  const parts = val.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return val.slice(0, 2).toUpperCase();
};
const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #0d1117;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  z-index: 1000;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

const LogoImg = styled.img`
  width: 64px;
  height: 64px;
  object-fit: contain;
`;

const BrandText = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  position: relative;
`;

const Button = styled.button`
  background-color: ${({ $variant }) =>
    $variant === "primary" ? "#2388ff" : "transparent"};
  color: ${({ $variant }) => ($variant === "primary" ? "#fff" : "#c9d1d9")};
  border: none;
  padding: 0.45rem 1rem;
  border-radius: 0.6rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: background 0.2s ease, transform 0.1s ease;

  &:hover {
    background-color: ${({ $variant }) =>
      $variant === "primary" ? "#1f6feb" : "rgba(255,255,255,0.1)"};
    transform: translateY(-1px);
  }
`;

const IconButton = styled.button`
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #0d1117;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: scale(1.05);
    border-color: rgba(255, 255, 255, 0.6);
  }
`;

const AvatarTrigger = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  padding: 0;
  border: none;
  cursor: pointer;
`;

const AvatarInitials = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  color: #e5e7eb;
  background: #374151;
`;

// 🔹 Estilos del menú desplegable
const Dropdown = styled.ul`
  position: absolute;
  top: 100%;
  margin-top: 4px;
  right: 0;
  background: linear-gradient(145deg, rgba(17, 24, 39, 0.98), rgba(11, 15, 25, 0.98));
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  min-width: 200px;
  z-index: 999;
  animation: fadeIn 0.2s ease;
  overflow: hidden;
  list-style: none;
`;

const DropItem = styled.li`
  background: none;
  border: none;
  color: #e6eaf2;
  text-align: left;
  padding: 12px 16px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(22, 119, 255, 0.1);
    color: #1677ff;
    transform: translateX(2px);
  }

  &:first-child {
    border-top-left-radius: 14px;
    border-top-right-radius: 14px;
  }

  &:last-child {
    border-bottom-left-radius: 14px;
    border-bottom-right-radius: 14px;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #0d1117;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 20px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0,0,0,.45);
  transition: all 0.3s ease-in-out;
`;

export default function Navbar({
  onCreateRoom,
  toggleUserMenu,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [initials, setInitials] = useState(getInitialsFromLS());

  const safeToggleUserMenu = typeof toggleUserMenu === "function" ? toggleUserMenu : () => setMenuOpen(!menuOpen);

  // 🔹 Estados para actualizar usuario
  const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [form, setForm] = useState({ name: "", username: "" });

  // 🔹 Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    const deletedU = localStorage.getItem("username");
    if (deletedU) localStorage.setItem("__lastDeletedUsername", deletedU);
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("name");
    window.location.replace("/login");
  };

  const getCurrentUsername = () => {
    const ls = localStorage.getItem("username");
    if (ls) return ls;
    const t = localStorage.getItem("token");
    if (t) {
      try {
        const payload = JSON.parse(atob(t.split(".")[1]));
        return payload?.username || payload?.sub || null;
      } catch {
        // ignore
      }
    }
    return null;
  };

  const loadUserData = async () => {
    const uname = getCurrentUsername();
    if (!uname) { alert("No hay usuario en sesión."); return false; }
    try {
      setLoading(true);
      const data = await searchUser(uname);
      const u = data?.usuario;
      if (!u?.id) throw new Error("No se pudo resolver el ID del usuario.");
      setUserId(u.id);
      setForm({ name: u.name || "", username: u.username || "" });
      return true;
    } catch (e) {
      alert(e.message || "No se pudo cargar la información del usuario.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const openUpdateUser = async () => {
    const ok = await loadUserData();
    if (ok) setShowUpdateModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!userId) return alert("Falta el id del usuario.");
    const body = {
      name: (form.name ?? "").trim(),
      username: (form.username ?? "").trim(),
    };
    try {
      setLoading(true);
      const urlUpdate = `${BASE}/api/users/update-user/${userId}`;
      const resUp = await fetch(urlUpdate, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(body),
      });
      if (await maybeForceLogout(resUp, urlUpdate)) return;
      if (!resUp.ok) {
        const err = await resUp.json().catch(() => ({}));
        alert(err.error || "Error al actualizar usuario");
        return;
      }
      setShowUpdateModal(false);
      navigate("/dashboard", { replace: true });
      setInitials(getInitialsFromLS());
    } finally {
      setLoading(false);
    }
  };



  const handleDeleteUser = async () => {
    try {
      setLoading?.(true);
      // 1) ID desde /api/auth/me con Authorization (robusto ante cambios de username)
      const id = await getMyIdFromMe();
      // 2) DELETE con Authorization, sin body ni headers extra
      const url = `${BASE}/api/users/delete-user/${id}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: authHeader(),
      });
      // 3) Manejo de 401/403 centralizado
      if (await maybeForceLogout(res, url)) return;
      // 4) éxito o error específico del backend
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Error al eliminar usuario");
      }
      alert(data?.mensaje || "Usuario eliminado exitosamente");
      // 5) Limpiar sesión y redirigir al login (recarga)
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("name");
      window.location.replace("/login");
    } catch (e) {
      if (e.message !== "AUTH") {
        alert(e.message || "Error al eliminar usuario");
      }
    } finally {
      setLoading?.(false);
    }
  };

  if (user) {
    return (
      <>
        <Nav>
        <Left>
          <LogoImg src={logoPng} alt="logo" />
        </Left>

        <Right ref={menuRef}>
           <Button $variant="primary" onClick={onCreateRoom}>
             <Plus size={16} /> Crear nueva sala
           </Button>

            {/* 🔹 Avatar con menú desplegable */}
            <div style={{ position: "relative" }}>
              <AvatarTrigger
                type="button"
                onClick={safeToggleUserMenu}
                aria-label="Abrir menú de usuario"
              >
                 <AvatarInitials>{initials}</AvatarInitials>
              </AvatarTrigger>
               {menuOpen && (
                <Dropdown>
                   <DropItem className="dropdown-item" onClick={() => { setMenuOpen(false); setShowProfileModal(true); }}><User size={16} /> Perfil</DropItem>
                   <DropItem className="dropdown-item" onClick={handleLogout}><LogOut size={16} /> Cerrar sesión</DropItem>
                </Dropdown>
              )}
           </div>
        </Right>
      </Nav>

      {showUpdateModal && (
        <Modal onClick={() => setShowUpdateModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3>Actualizar usuario</h3>
            <form onSubmit={handleUpdateUser} className="ns-form-scope">
              <div>
                <label>Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label>Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div className="actions" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowUpdateModal(false)} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </ModalContent>
        </Modal>
      )}

      {showDeleteConfirmModal && (
        <Modal onClick={() => setShowDeleteConfirmModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3>Confirmar Eliminación</h3>
            <p style={{ margin: '1rem 0', textAlign: 'center' }}>
              ¿Seguro que deseas eliminar tu cuenta? Esta acción es irreversible.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button
                onClick={async () => { setShowDeleteConfirmModal(false); await handleDeleteUser(); }}
                disabled={loading}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                {loading ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </ModalContent>
        </Modal>
      )}

      {showProfileModal && (
        <Modal onClick={() => setShowProfileModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <Avatar style={{ width: '80px', height: '80px', fontSize: '2rem', margin: '0 auto 1rem' }}>
                {initials}
              </Avatar>
              <h3 style={{ color: '#e5e7eb', margin: '0 0 0.5rem 0' }}>
                {localStorage.getItem("name") || "Usuario"}
              </h3>
              <p style={{ color: '#9ca3af', margin: 0 }}>
                @{localStorage.getItem("username") || "username"}
              </p>
            </div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
               <Button
                 onClick={() => { setShowProfileModal(false); openUpdateUser(); }}
                 style={{
                   background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                   color: 'white',
                   border: 'none',
                   padding: '0.8rem 1.5rem',
                   borderRadius: '12px',
                   cursor: 'pointer',
                   fontWeight: '600',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   gap: '0.5rem',
                   boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
                   transition: 'all 0.3s ease',
                 }}
                 onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                 onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
               >
                 <Edit size={18} />
                 Actualizar usuario
               </Button>
               <Button
                 onClick={() => { setShowProfileModal(false); setShowDeleteConfirmModal(true); }}
                 style={{
                   background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                   color: 'white',
                   border: 'none',
                   padding: '0.8rem 1.5rem',
                   borderRadius: '12px',
                   cursor: 'pointer',
                   fontWeight: '600',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   gap: '0.5rem',
                   boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)',
                   transition: 'all 0.3s ease',
                 }}
                 onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                 onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
               >
                 <Trash2 size={18} />
                 Eliminar usuario
               </Button>
               <Button
                 onClick={() => { setShowProfileModal(false); handleLogout(); }}
                 style={{
                   background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                   color: 'white',
                   border: 'none',
                   padding: '0.8rem 1.5rem',
                   borderRadius: '12px',
                   cursor: 'pointer',
                   fontWeight: '600',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   gap: '0.5rem',
                   boxShadow: '0 4px 15px rgba(107, 114, 128, 0.3)',
                   transition: 'all 0.3s ease',
                 }}
                 onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                 onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
               >
                 <LogOut size={18} />
                 Cerrar sesión
               </Button>
             </div>
          </ModalContent>
        </Modal>
      )}

      </>
    );
  }

  // versión pública
  return (
    <Nav>
      <Left>
        <LogoImg src={logoPng} alt="logo" />
       
      </Left>
      <Right>
        <Link to="/register">
          <Button $variant="secondary">Registrarse</Button>
        </Link>
        <Link to="/login">
          <Button $variant="primary">Iniciar sesión</Button>
        </Link>
      </Right>
    </Nav>
  );
}
