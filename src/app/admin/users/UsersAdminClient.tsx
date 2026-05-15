"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { USER_ROLE_LABELS_IT, USER_ROLES, type UserRole } from "@/lib/userRoles";

type UserItem = {
  id: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
};

export default function UsersAdminClient() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<UserRole>("VIEWER");
  const [password, setPassword] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/users");
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || "Impossibile caricare utenti");
      setLoading(false);
      return;
    }

    const data = (await res.json()) as UserItem[];
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setGeneratedPassword("");

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, firstName, lastName, role, password: password || undefined }),
    });

    const data = (await res.json().catch(() => null)) as
      | { user?: UserItem; generatedPassword?: string; error?: string }
      | null;

    if (!res.ok) {
      setError(data?.error || "Impossibile creare utente");
      setSaving(false);
      return;
    }

    if (data?.generatedPassword) {
      setGeneratedPassword(data.generatedPassword);
    }

    setUsername("");
    setEmail("");
    setFirstName("");
    setLastName("");
    setRole("VIEWER");
    setPassword("");
    await loadUsers();
    setSaving(false);
  };

  const handleRoleChange = async (id: string, nextRole: UserRole) => {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || "Impossibile aggiornare ruolo");
      setSaving(false);
      return;
    }

    await loadUsers();
    setSaving(false);
  };

  const handleResetPassword = async (id: string) => {
    const confirmReset = window.confirm("Resettare la password di questo utente?");
    if (!confirmReset) return;

    const newPassword = window.prompt("Inserisci la nuova password (minimo 8 caratteri):", "");
    if (newPassword === null) return;

    const trimmedPassword = newPassword.trim();
    if (trimmedPassword.length < 8) {
      setError("La nuova password deve avere almeno 8 caratteri");
      return;
    }

    setSaving(true);
    setError("");
    setGeneratedPassword("");

    const res = await fetch(`/api/admin/users/${id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: trimmedPassword }),
    });

    const data = (await res.json().catch(() => null)) as { error?: string } | null;

    if (!res.ok) {
      setError(data?.error || "Impossibile resettare password");
      setSaving(false);
      return;
    }

    setSaving(false);
  };

  return (
    <main className="page-container">
      <header className="page-header">
        <Link href="/" className="back-button">
          ← Home
        </Link>
        <h1>Admin Utenti</h1>
        <div style={{ width: "60px" }} />
      </header>

      <section className="list-section" style={{ display: "grid", gap: "1rem" }}>
        {error ? <p style={{ color: "var(--danger)", fontWeight: 600 }}>{error}</p> : null}
        {generatedPassword ? (
          <p style={{ color: "var(--warning)", fontWeight: 700 }}>
            Password generata: {generatedPassword}
          </p>
        ) : null}

        <form onSubmit={handleCreate} className="modern-form" style={{ gap: "0.75rem" }}>
          <h2>Nuovo utente</h2>
          <div className="form-group">
            <label htmlFor="username">Nome utente</label>
            <input id="username" className="form-input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <span className="item-subtitle">Opzionale</span>
          </div>
          <div className="form-group">
            <label htmlFor="firstName">Nome</label>
            <input id="firstName" className="form-input" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Cognome</label>
            <input id="lastName" className="form-input" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="role">Ruolo</label>
            <select id="role" className="form-input" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              {USER_ROLES.map((value) => (
                <option key={value} value={value}>
                  {USER_ROLE_LABELS_IT[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="password">Password (opzionale)</label>
            <input id="password" className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <span className="item-subtitle">Se vuota, il sistema genera una password temporanea.</span>
          </div>
          <button type="submit" className="submit-button" disabled={saving}>
            {saving ? "Salvataggio..." : "Crea utente"}
          </button>
        </form>

        <article className="modern-form" style={{ gap: "0.75rem" }}>
          <h2>Utenti</h2>
          {loading ? (
            <p>Caricamento...</p>
          ) : users.length === 0 ? (
            <p className="item-subtitle">Nessun utente.</p>
          ) : (
            <ul className="item-list">
              {users.map((user) => (
                <li key={user.id} className="list-item" style={{ padding: "0.85rem" }}>
                  <div style={{ display: "grid", gap: "0.6rem" }}>
                    <div>
                      <strong>{user.lastName} {user.firstName}</strong>
                      <div className="item-subtitle">@{user.username}</div>
                      <div className="item-subtitle">{user.email || "Nessuna email"}</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.5rem", alignItems: "center" }}>
                      <select
                        className="form-input"
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        disabled={saving}
                      >
                        {USER_ROLES.map((value) => (
                          <option key={value} value={value}>
                            {USER_ROLE_LABELS_IT[value]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="back-button"
                        onClick={() => handleResetPassword(user.id)}
                        disabled={saving}
                      >
                        Reset Password
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
