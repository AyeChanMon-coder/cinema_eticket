import { FormEvent, useEffect, useState } from "react";
import api from "../api/axios";

interface Cinema {
  cinemaId: number;
  name: string;
  location: string;
  rooms?: Room[];
}

type CinemaForm = Omit<Cinema, "cinemaId" | "rooms">;

interface Room {
  roomId: number;
  name: string;
  cinemaId: number;
}

interface RoomForm {
  roomId?: number;
  name: string;
}

const emptyForm: CinemaForm = { name: "", location: "" };
const emptyRoom: RoomForm = { name: "" };
const ITEMS_PER_PAGE = 5;

const CinemasPage = () => {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [form, setForm] = useState<CinemaForm>(emptyForm);
  const [editingCinema, setEditingCinema] = useState<Cinema | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [roomForms, setRoomForms] = useState<RoomForm[]>([]);

  const loadCinemas = async () => {
    try {
      const response = await api.get("/admin/cinemas");
      setCinemas(Array.isArray(response.data) ? response.data : []);
    } catch {
      setError("Unable to load cinemas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCinemas();
  }, []);

  const openCreate = () => {
    setEditingCinema(null);
    setForm(emptyForm);
    setRoomForms([]);
    setIsFormOpen(true);
    setError("");
  };

  const openEdit = (cinema: Cinema) => {
    setEditingCinema(cinema);
    setForm({ name: cinema.name, location: cinema.location });
    setRoomForms((cinema.rooms ?? []).map((room) => ({ roomId: room.roomId, name: room.name })));
    setIsFormOpen(true);
    setError("");
  };

  const closeForm = () => {
    setEditingCinema(null);
    setForm(emptyForm);
    setRoomForms([]);
    setIsFormOpen(false);
  };

  const updateRoom = (index: number, name: string) => {
    setRoomForms((current) => current.map((room, roomIndex) => roomIndex === index ? { ...room, name } : room));
  };

  const addRoom = () => setRoomForms((current) => [...current, { ...emptyRoom }]);

  const removeRoom = (index: number) => setRoomForms((current) => current.filter((_, roomIndex) => roomIndex !== index));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      let cinemaId = editingCinema?.cinemaId;
      if (editingCinema) {
        await api.put(`/admin/cinemas/${editingCinema.cinemaId}`, form);
      } else {
        const response = await api.post("/admin/cinemas", form);
        cinemaId = response.data.cinemaId;
      }
      if (!cinemaId) throw new Error("Cinema was not saved.");
      const originalRoomIds = new Set((editingCinema?.rooms ?? []).map((room) => room.roomId));
      const submittedRoomIds = new Set(roomForms.filter((room) => room.roomId).map((room) => room.roomId));
      await Promise.all([...originalRoomIds].filter((roomId) => !submittedRoomIds.has(roomId)).map((roomId) => api.delete(`/admin/rooms/${roomId}`)));
      await Promise.all(roomForms.map((room) => room.roomId ? api.put(`/admin/rooms/${room.roomId}`, { name: room.name, cinemaId }) : api.post("/admin/rooms", { name: room.name, cinemaId })));
      await loadCinemas();
      closeForm();
    } catch {
      setError("Please check the cinema details and try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (cinema: Cinema) => {
    if (!window.confirm(`Delete ${cinema.name}?`)) return;

    try {
      await api.delete(`/admin/cinemas/${cinema.cinemaId}`);
      setCinemas((current) => current.filter((item) => item.cinemaId !== cinema.cinemaId));
    } catch {
      setError("Unable to delete this cinema. Remove its rooms and showtimes first if needed.");
    }
  };

  const filteredCinemas = cinemas.filter((cinema) =>
    `${cinema.name} ${cinema.location}`.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filteredCinemas.length / ITEMS_PER_PAGE));
  const visibleCinemas = filteredCinemas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="page-container">
      <div className="page-head">
        <div>
          <p className="eyebrow">Cinema management</p>
          <h1>Cinemas</h1>
          <p className="page-sub">Create, update, and manage cinema locations and halls.</p>
        </div>
        <button className="btn-primary" type="button" onClick={openCreate}>+ Add cinema</button>
      </div>

      {error && <p className="tbl-state error">{error}</p>}
      <section className="card">
        <div className="tbl-toolbar">
          <input className="tbl-search" aria-label="Search cinemas" placeholder="Search cinemas..." value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} />
          <span className="tbl-count">{filteredCinemas.length} cinemas</span>
        </div>
        {loading ? <p className="tbl-state">Loading cinemas...</p> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Cinema</th><th>Location</th><th>Rooms</th><th>Actions</th></tr></thead>
              <tbody>
                {visibleCinemas.map((cinema) => (
                  <tr key={cinema.cinemaId}>
                    <td><strong>{cinema.name}</strong></td>
                    <td><span className="badge">{cinema.location}</span></td>
                    <td>{cinema.rooms?.length ?? 0} rooms</td>
                    <td><div className="tbl-actions"><button className="btn-sm btn-edit" type="button" onClick={() => openEdit(cinema)}>Edit</button><button className="btn-sm btn-del" type="button" onClick={() => void remove(cinema)}>Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredCinemas.length === 0 && <p className="tbl-empty">No cinemas found.</p>}
            {filteredCinemas.length > ITEMS_PER_PAGE && (
              <div className="tbl-pagination">
                <button className="btn-sm" type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Previous</button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button key={page} className={`btn-sm${currentPage === page ? " active-page" : ""}`} type="button" onClick={() => setCurrentPage(page)}>{page}</button>
                ))}
                <button className="btn-sm" type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Next</button>
              </div>
            )}
          </div>
        )}
      </section>

      {isFormOpen && (
        <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
          <div className="modal">
            <div className="modal-head"><div><p className="eyebrow">Cinema management</p><h2>{editingCinema ? "Edit cinema" : "Add cinema"}</h2></div><button className="modal-close" type="button" aria-label="Close" onClick={closeForm}>×</button></div>
            <form onSubmit={submit}>
              <div className="modal-field"><label htmlFor="cinema-name">Cinema name</label><input id="cinema-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Mega Cineplex" required /></div>
              <div className="modal-field"><label htmlFor="cinema-location">Location</label><input id="cinema-location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="e.g. Yangon" required /></div>
              <div className="room-form-section"><div className="room-form-head"><label>Rooms</label><button className="btn-sm" type="button" onClick={addRoom}>+ Add room</button></div>{roomForms.length === 0 && <small className="field-help">Add the rooms available at this cinema.</small>}{roomForms.map((room, index) => <div className="room-form-row" key={room.roomId ?? `new-${index}`}><input aria-label={`Room ${index + 1} name`} value={room.name} onChange={(event) => updateRoom(index, event.target.value)} placeholder={`Room ${index + 1} name`} required /><button className="room-remove" type="button" aria-label={`Remove room ${index + 1}`} onClick={() => removeRoom(index)}>×</button></div>)}</div>
              <div className="modal-actions"><button className="btn-secondary" type="button" onClick={closeForm}>Cancel</button><button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : editingCinema ? "Save changes" : "Create cinema"}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CinemasPage;
