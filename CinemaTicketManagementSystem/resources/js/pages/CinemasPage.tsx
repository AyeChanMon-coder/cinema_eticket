import { FormEvent, useEffect, useState } from "react";
import api from "../api/axios";

interface Cinema {
  cinemaId: number;
  name: string;
  location: string;
  rooms?: Array<Record<string, unknown>>;
}

type CinemaForm = Omit<Cinema, "cinemaId" | "rooms">;

const emptyForm: CinemaForm = { name: "", location: "" };
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
    setIsFormOpen(true);
    setError("");
  };

  const openEdit = (cinema: Cinema) => {
    setEditingCinema(cinema);
    setForm({ name: cinema.name, location: cinema.location });
    setIsFormOpen(true);
    setError("");
  };

  const closeForm = () => {
    setEditingCinema(null);
    setForm(emptyForm);
    setIsFormOpen(false);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingCinema) {
        await api.put(`/admin/cinemas/${editingCinema.cinemaId}`, form);
      } else {
        await api.post("/admin/cinemas", form);
      }
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
              <div className="modal-actions"><button className="btn-secondary" type="button" onClick={closeForm}>Cancel</button><button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : editingCinema ? "Save changes" : "Create cinema"}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CinemasPage;
