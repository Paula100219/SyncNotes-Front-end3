import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Trash2 } from "lucide-react";
import Navbar from "../components/Navbar";
import { getMe, getMyRooms, deleteRoom, createRoom } from "../services/api";
import "./dashboard.css";

const isValidMember = (m) => !!m && (typeof m === "string" || m.id || m.username || m.name);

const sanitizeMembers = (members = []) => members.filter(isValidMember);

export default function RoomsList() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [error, setError] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [openRoomModal, setOpenRoomModal] = useState(false);
  const [roomForm, setRoomForm] = useState({
    name: "",
    description: "",
  });
  const navigate = useNavigate();

  // Cargar usuario y salas
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getMe();
        setMe(data);
      } catch (e) {
        setError(e?.message || "No se pudo cargar tu información.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rooms = me?.rooms || [];

  // Confirmar eliminación de sala
  const confirmDeleteRoom = (room) => {
    setRoomToDelete(room);
    setOpenDeleteModal(true);
  };

  // Eliminar sala
  const handleDeleteRoom = async () => {
    try {
      await deleteRoom(roomToDelete.id);
      const updatedRooms = await getMyRooms();
      setMe((prev) => ({ ...prev, rooms: updatedRooms }));
      setOpenDeleteModal(false);
      setRoomToDelete(null);
    } catch (err) {
      alert(err.message || "No se pudo eliminar la sala");
    }
  };

  // Crear sala
  const handleRoomChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRoomForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const submitRoom = async (e) => {
    e.preventDefault();
    try {
      const newRoom = await createRoom(roomForm);
      navigate("/rooms/" + newRoom.id);
     } catch (err) {
       if (err.status === 401 || err.status === 403) {
         const deletedU = localStorage.getItem("username");
         if (deletedU) localStorage.setItem("__lastDeletedUsername", deletedU);
         localStorage.removeItem("token");
         localStorage.removeItem("username");
         window.location.replace("/login");
       } else {
         alert(err.message || "No se pudo crear la sala");
       }
    }
  };

  return (
    <div className="ns-root">
      <Navbar
        variant="dashboard"
        onCreateRoom={() => setOpenRoomModal(true)}
        onViewPublicRooms={() => alert("Próximamente")}
      />

      <main className="dash-main">
        <header className="dash-header">
          <h1 className="dash-title">Tu Espacio de Trabajo</h1>
        </header>

        {loading ? (
          <div className="dash-loading">Cargando…</div>
        ) : error ? (
          <div className="ns-alert ns-alert--err">{error}</div>
        ) : (
          <section className="dash-grid">
            {/* Salas */}
            <div className="dash-left">
              <h2 className="dash-section-title">Mis Salas</h2>
              <div className="rooms-grid">
                 {rooms.length === 0 ? (
                   <div className="room-empty">
                     <div className="room-empty-icon"><Users size={48} /></div>
                     <div className="room-empty-title">Aún no tienes salas.</div>
                     <div className="room-empty-sub">
                       ¡Crea una para empezar a colaborar!
                     </div>
                   </div>
                ) : (
                  rooms.map((r) => (
                    <div key={r.id} className="room-card">
                      <div className="room-title">{r.name}</div>
                       <div className="room-sub">
                         {sanitizeMembers(r.members || []).length} miembros
                       </div>
                      <div className="room-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => navigate(`/rooms/${r.id}`)}
                        >
                          Abrir sala
                        </button>
                         <button
                           className="btn-ghost"
                           onClick={() => confirmDeleteRoom(r)}
                         >
                           <Trash2 size={16} /> Eliminar
                         </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Panel vacío */}
            <aside className="dash-right">
              <h2 className="dash-section-title">Selecciona una sala</h2>
              <div className="tasks-empty">
                Haz clic en "Abrir sala" para ver detalles
              </div>
            </aside>
          </section>
        )}
      </main>

      {/* Modal Crear Sala */}
      {openRoomModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2 className="modal-title">Crear nueva sala</h2>
            <form onSubmit={submitRoom} className="modal-form">
              <label>
                Nombre:
                <input
                  type="text"
                  name="name"
                  value={roomForm.name}
                  onChange={handleRoomChange}
                  required
                />
              </label>

              <label>
                Descripción:
                <textarea
                  name="description"
                  value={roomForm.description}
                  onChange={handleRoomChange}
                  placeholder="(opcional)"
                />
              </label>



              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Crear Sala
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setOpenRoomModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar Sala */}
      {openDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2 className="modal-title">Eliminar sala</h2>
            <p style={{ textAlign: "center", color: "#a8b3c7", marginBottom: "14px" }}>
              ¿Seguro que quieres eliminar <strong>{roomToDelete?.name}</strong>?
            </p>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setOpenDeleteModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleDeleteRoom}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}