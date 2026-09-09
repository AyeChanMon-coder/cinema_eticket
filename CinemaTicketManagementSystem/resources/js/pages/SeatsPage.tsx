import { FormEvent, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

interface Cinema { cinemaId: number; name: string; location: string; }
interface Room { roomId: number; name: string; cinemaId: number; }
interface Seat { seatId: number; seatNumber: string; isBooked: boolean; seatType: string; seatPrice: number; roomId: number; status?: number; }
interface SeatForm { seatNumber: string; seatType: string; seatPrice: number; }
interface RowForm { row: string; start: number; end: number; seatType: string; seatPrice: number; }

const emptyForm: SeatForm = { seatNumber: "", seatType: "Standard", seatPrice: 8000 };
const emptyRowForm: RowForm = { row: "A", start: 1, end: 10, seatType: "Standard", seatPrice: 8000 };

const SeatsPage = () => {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [cinemaId, setCinemaId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [form, setForm] = useState<SeatForm>(emptyForm);
  const [rowForm, setRowForm] = useState<RowForm>(emptyRowForm);
  const [formMode, setFormMode] = useState<"single" | "row">("single");
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadSeats = async () => {
    if (!roomId) { setSeats([]); return; }
    setLoading(true);
    try {
      const response = await api.get(`/rooms/${roomId}/seats`);
      setSeats(Array.isArray(response.data) ? response.data : []);
    } catch { setError("Unable to load seats."); } finally { setLoading(false); }
  };

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [cinemaResponse, roomResponse] = await Promise.all([api.get("/admin/cinemas"), api.get("/admin/rooms")]);
        setCinemas(Array.isArray(cinemaResponse.data) ? cinemaResponse.data : []);
        setRooms(Array.isArray(roomResponse.data) ? roomResponse.data : []);
      } catch { setError("Unable to load cinema and room options."); }
    };
    void loadOptions();
  }, []);

  useEffect(() => { void loadSeats(); }, [roomId]);

  const visibleRooms = rooms.filter((room) => String(room.cinemaId) === cinemaId);
  const selectedRoom = rooms.find((room) => String(room.roomId) === roomId);
  const rows = useMemo(() => [...new Set(seats.map((seat) => seat.seatNumber.match(/^[A-Za-z]+/)?.[0] ?? ""))], [seats]);
  const seatsByRow = (row: string) => seats.filter((seat) => seat.seatNumber.startsWith(row)).sort((a, b) => Number(a.seatNumber.replace(/\D/g, "")) - Number(b.seatNumber.replace(/\D/g, "")));

  const openCreate = () => { setEditingSeat(null); setForm(emptyForm); setRowForm(emptyRowForm); setFormMode("single"); setIsFormOpen(true); setError(""); };
  const openEdit = (seat: Seat) => { setEditingSeat(seat); setForm({ seatNumber: seat.seatNumber, seatType: seat.seatType, seatPrice: seat.seatPrice }); setFormMode("single"); setIsFormOpen(true); setError(""); };
  const closeForm = () => { setEditingSeat(null); setForm(emptyForm); setRowForm(emptyRowForm); setFormMode("single"); setIsFormOpen(false); };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roomId) return;
    setSaving(true); setError("");
    try {
      if (!editingSeat && formMode === "row") {
        const requestedSeats = Array.from({ length: rowForm.end - rowForm.start + 1 }, (_, index) => `${rowForm.row.trim().toUpperCase()}${rowForm.start + index}`);
        const existingNumbers = new Set(seats.map((seat) => seat.seatNumber.toUpperCase()));
        if (!rowForm.row.trim() || rowForm.end < rowForm.start || requestedSeats.some((seatNumber) => existingNumbers.has(seatNumber))) throw new Error("Duplicate or invalid seat range.");
        await Promise.all(requestedSeats.map((seatNumber) => api.post("/admin/seats", { seatNumber, seatType: rowForm.seatType, seatPrice: rowForm.seatPrice, roomId: Number(roomId), isBooked: false, status: 0 })));
        await loadSeats(); closeForm(); return;
      }
      const payload = { ...form, roomId: Number(roomId), isBooked: editingSeat?.isBooked ?? false, status: editingSeat?.status ?? 0 };
      if (editingSeat) await api.put(`/admin/seats/${editingSeat.seatId}`, payload);
      else if (seats.some((seat) => seat.seatNumber.toUpperCase() === form.seatNumber.toUpperCase())) throw new Error("Duplicate seat.");
      else await api.post("/admin/seats", payload);
      await loadSeats(); closeForm();
    } catch { setError("Seat number may already exist or the details are invalid."); } finally { setSaving(false); }
  };

  const remove = async (seat: Seat) => {
    if (!window.confirm(`Delete seat ${seat.seatNumber}?`)) return;
    try { await api.delete(`/admin/seats/${seat.seatId}`); setSeats((current) => current.filter((item) => item.seatId !== seat.seatId)); }
    catch { setError("Unable to delete this seat."); }
  };

  return (
    <div className="page-container">
      <div className="page-head"><div><p className="eyebrow">Cinema operations</p><h1>Seats</h1><p className="page-sub">Manage seats by cinema and room.</p></div>{roomId && <button className="btn-primary" type="button" onClick={openCreate}>+ Add seat</button>}</div>
      {error && <p className="tbl-state error">{error}</p>}
      <section className="card seat-admin-card">
        <div className="seat-filters"><div className="modal-field"><label htmlFor="seat-cinema">Cinema</label><select id="seat-cinema" value={cinemaId} onChange={(event) => { setCinemaId(event.target.value); setRoomId(""); }}><option value="">Select cinema</option>{cinemas.map((cinema) => <option value={cinema.cinemaId} key={cinema.cinemaId}>{cinema.name} · {cinema.location}</option>)}</select></div><div className="modal-field"><label htmlFor="seat-room">Room</label><select id="seat-room" value={roomId} disabled={!cinemaId} onChange={(event) => setRoomId(event.target.value)}><option value="">{cinemaId ? "Select room" : "Select cinema first"}</option>{visibleRooms.map((room) => <option value={room.roomId} key={room.roomId}>{room.name}</option>)}</select></div></div>
        {!roomId ? <p className="tbl-state">Select a cinema and room to view its seats.</p> : loading ? <p className="tbl-state">Loading seats...</p> : <><div className="seat-admin-head"><h2>{selectedRoom?.name} seat map</h2><span>{seats.length} seats</span></div><div className="seat-admin-map">{rows.map((row) => <div className="seat-admin-row" key={row}><strong>{row}</strong><div>{seatsByRow(row).map((seat) => <button className={`seat-admin-item${seat.isBooked ? " booked" : ""}`} type="button" key={seat.seatId} title={`${seat.seatNumber} · ${seat.seatType} · ${seat.seatPrice}`} onClick={() => openEdit(seat)}>{seat.seatNumber}<span /></button>)}</div></div>)}</div><div className="seat-admin-list">{seats.map((seat) => <div className="seat-admin-list-item" key={seat.seatId}><span><strong>{seat.seatNumber}</strong><small>{seat.seatType} · {seat.seatPrice}</small></span><span><button className="btn-sm btn-edit" type="button" onClick={() => openEdit(seat)}>Edit</button><button className="btn-sm btn-del" type="button" onClick={() => void remove(seat)}>Delete</button></span></div>)}</div></>}
      </section>
      {isFormOpen && <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}><div className="modal modal-sm"><div className="modal-head"><div><p className="eyebrow">Seat management</p><h2>{editingSeat ? "Edit seat" : "Add seat"}</h2></div><button className="modal-close" type="button" aria-label="Close" onClick={closeForm}>×</button></div>{!editingSeat && <div className="seat-mode-tabs"><button className={formMode === "single" ? "active" : ""} type="button" onClick={() => setFormMode("single")}>Single seat</button><button className={formMode === "row" ? "active" : ""} type="button" onClick={() => setFormMode("row")}>Whole row</button></div>}<form onSubmit={submit}>{formMode === "row" && !editingSeat ? <><div className="modal-grid"><div className="modal-field"><label htmlFor="seat-row">Row</label><input id="seat-row" maxLength={3} value={rowForm.row} onChange={(event) => setRowForm({ ...rowForm, row: event.target.value.toUpperCase() })} placeholder="A" required /></div><div className="modal-field"><label htmlFor="seat-start">Start</label><input id="seat-start" type="number" min="1" value={rowForm.start} onChange={(event) => setRowForm({ ...rowForm, start: Number(event.target.value) })} required /></div></div><div className="modal-field"><label htmlFor="seat-end">End</label><input id="seat-end" type="number" min={rowForm.start} value={rowForm.end} onChange={(event) => setRowForm({ ...rowForm, end: Number(event.target.value) })} required /></div><div className="modal-field"><label htmlFor="row-seat-type">Seat type</label><select id="row-seat-type" value={rowForm.seatType} onChange={(event) => setRowForm({ ...rowForm, seatType: event.target.value })}><option>Standard</option><option>Premium</option></select></div><div className="modal-field"><label htmlFor="row-seat-price">Seat price</label><input id="row-seat-price" type="number" min="0" value={rowForm.seatPrice} onChange={(event) => setRowForm({ ...rowForm, seatPrice: Number(event.target.value) })} required /></div></> : <><div className="modal-field"><label htmlFor="seat-number">Seat number</label><input id="seat-number" value={form.seatNumber} onChange={(event) => setForm({ ...form, seatNumber: event.target.value.toUpperCase() })} placeholder="e.g. A1" required /></div><div className="modal-field"><label htmlFor="seat-type">Seat type</label><select id="seat-type" value={form.seatType} onChange={(event) => setForm({ ...form, seatType: event.target.value })}><option>Standard</option><option>Premium</option></select></div><div className="modal-field"><label htmlFor="seat-price">Seat price</label><input id="seat-price" type="number" min="0" value={form.seatPrice} onChange={(event) => setForm({ ...form, seatPrice: Number(event.target.value) })} required /></div></>}<div className="modal-actions"><button className="btn-secondary" type="button" onClick={closeForm}>Cancel</button><button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : formMode === "row" && !editingSeat ? "Create row" : "Save seat"}</button></div></form></div></div>}
    </div>
  );
};

export default SeatsPage;
