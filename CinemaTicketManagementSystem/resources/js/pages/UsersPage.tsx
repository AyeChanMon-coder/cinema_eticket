import { FormEvent, useEffect, useState } from "react";
import api from "../api/axios";

interface User {
  userId: number;
  name: string;
  email: string;
  userType: number;
}

type UserForm = {
  name: string;
  email: string;
  password: string;
  userType: number;
};

const ITEMS_PER_PAGE = 5;

const UsersPage = () => {
  const currentUserType = Number(localStorage.getItem("admin_user_type"));
  const managedUserType = currentUserType === 3 ? 2 : 1;
  const managedRole = managedUserType === 2 ? "Admin" : "Customer";
  const emptyForm: UserForm = { name: "", email: "", password: "", userType: managedUserType };
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    try {
      const response = await api.get("/admin/users");
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch {
      setError(`Unable to load ${managedRole.toLowerCase()} users.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ([2, 3].includes(currentUserType)) void loadUsers();
    else setLoading(false);
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setIsFormOpen(true);
    setError("");
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: "", userType: user.userType });
    setIsFormOpen(true);
    setError("");
  };

  const closeForm = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setIsFormOpen(false);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const data = { ...form };
      if (editingUser && !data.password) delete (data as Partial<UserForm>).password;
      if (editingUser) await api.put(`/admin/users/${editingUser.userId}`, data);
      else await api.post("/admin/users", data);
      await loadUsers();
      closeForm();
    } catch {
      setError("Please check the user details and try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (user: User) => {
    if (!window.confirm(`Delete ${user.name}?`)) return;
    try {
      await api.delete(`/admin/users/${user.userId}`);
      setUsers((current) => current.filter((item) => item.userId !== user.userId));
    } catch {
      setError("Unable to delete this user.");
    }
  };

  if (![2, 3].includes(currentUserType)) {
    return <div className="page-container"><section className="card access-card"><p className="eyebrow">Access restricted</p><h1>Admin access required</h1><p>Only authorized staff can manage users.</p></section></div>;
  }

  const filteredUsers = users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const visibleUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="page-container">
      <div className="page-head"><div><p className="eyebrow">Access management</p><h1>Users</h1><p className="page-sub">Manage {managedRole.toLowerCase()} accounts.</p></div><button className="btn-primary" type="button" onClick={openCreate}>+ Add user</button></div>
      {error && <p className="tbl-state error">{error}</p>}
      <section className="card">
        <div className="tbl-toolbar"><input className="tbl-search" aria-label="Search users" placeholder="Search users..." value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} /><span className="tbl-count">{filteredUsers.length} users</span></div>
        {loading ? <p className="tbl-state">Loading users...</p> : <div className="tbl-wrap">
          <table className="tbl"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead><tbody>
            {visibleUsers.map((user) => <tr key={user.userId}><td><strong>{user.name}</strong></td><td>{user.email}</td><td><span className="badge">{user.userType === 2 ? "Admin" : "Customer"}</span></td><td><div className="tbl-actions"><button className="btn-sm btn-edit" type="button" onClick={() => openEdit(user)}>Edit</button><button className="btn-sm btn-del" type="button" onClick={() => void remove(user)}>Delete</button></div></td></tr>)}
          </tbody></table>
          {!loading && filteredUsers.length === 0 && <p className="tbl-empty">No users found.</p>}
          {filteredUsers.length > ITEMS_PER_PAGE && <div className="tbl-pagination"><button className="btn-sm" type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Previous</button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => <button key={page} className={`btn-sm${currentPage === page ? " active-page" : ""}`} type="button" onClick={() => setCurrentPage(page)}>{page}</button>)}<button className="btn-sm" type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Next</button></div>}
        </div>}
      </section>

      {isFormOpen && <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}><div className="modal"><div className="modal-head"><div><p className="eyebrow">Access management</p><h2>{editingUser ? "Edit user" : "Add user"}</h2></div><button className="modal-close" type="button" aria-label="Close" onClick={closeForm}>×</button></div><form onSubmit={submit}><div className="modal-field"><label htmlFor="user-name">Name</label><input id="user-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div><div className="modal-field"><label htmlFor="user-email">Email</label><input id="user-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></div><div className="modal-field"><label htmlFor="user-password">Password {editingUser && "(leave blank to keep current)"}</label><input id="user-password" type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required={!editingUser} /></div><div className="modal-field"><label htmlFor="user-type">Role</label><select id="user-type" value={form.userType} disabled><option value={managedUserType}>{managedRole}</option></select></div><div className="modal-actions"><button className="btn-secondary" type="button" onClick={closeForm}>Cancel</button><button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : editingUser ? "Save changes" : "Create user"}</button></div></form></div></div>}
    </div>
  );
};

export default UsersPage;
