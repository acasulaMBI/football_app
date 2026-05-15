"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bootstrapMode, setBootstrapMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error || "Accesso non riuscito");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Errore di rete durante il login");
    } finally {
      setLoading(false);
    }
  };

  const handleBootstrap = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, firstName, lastName }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error || "Bootstrap admin non riuscito");
        return;
      }

      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!loginResponse.ok) {
        setError("Admin creato, ma login automatico fallito");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Errore di rete durante il bootstrap");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-container" style={{ justifyContent: "center", padding: "1rem" }}>
      <section className="modern-form" style={{ maxWidth: "420px", width: "100%", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center" }}>Accesso</h1>
        <p className="item-subtitle" style={{ textAlign: "center" }}>
          Accedi con il tuo utente per continuare.
        </p>

        {error ? (
          <p style={{ color: "var(--danger)", fontWeight: 600 }}>{error}</p>
        ) : null}

        {!bootstrapMode ? (
          <form onSubmit={handleLogin} className="modern-form" style={{ padding: 0, border: "none", boxShadow: "none", gap: "1rem" }}>
            <div className="form-group">
              <label htmlFor="username">Nome utente</label>
              <input
                id="username"
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Accesso..." : "Entra"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleBootstrap} className="modern-form" style={{ padding: 0, border: "none", boxShadow: "none", gap: "1rem" }}>
            <p className="item-subtitle">Bootstrap primo admin (solo se non esistono utenti).</p>
            <div className="form-group">
              <label htmlFor="firstName">Nome</label>
              <input
                id="firstName"
                type="text"
                className="form-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Cognome</label>
              <input
                id="lastName"
                type="text"
                className="form-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="bootstrapUsername">Nome utente</label>
              <input
                id="bootstrapUsername"
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="bootstrapEmail">Email</label>
              <input
                id="bootstrapEmail"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <span className="item-subtitle">Opzionale</span>
            </div>
            <div className="form-group">
              <label htmlFor="bootstrapPassword">Password (min 8)</label>
              <input
                id="bootstrapPassword"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Creazione..." : "Crea Admin"}
            </button>
          </form>
        )}

        <button
          type="button"
          className="back-button"
          onClick={() => setBootstrapMode((prev) => !prev)}
          style={{ alignSelf: "center" }}
        >
          {bootstrapMode ? "Torna al login" : "Primo avvio? Crea admin"}
        </button>
      </section>
    </main>
  );
}
