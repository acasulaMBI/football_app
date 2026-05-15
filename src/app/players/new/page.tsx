"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ACTIVE_ROSTER_COOKIE } from "@/lib/activeRoster";

export default function NewPlayerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasActiveRoster, setHasActiveRoster] = useState(false);
  const [canWrite, setCanWrite] = useState(false);

  useEffect(() => {
    const hasRosterCookie = document.cookie
      .split("; ")
      .some((cookie) => cookie.startsWith(`${ACTIVE_ROSTER_COOKIE}=`));
    setHasActiveRoster(hasRosterCookie);

    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("unauthorized"))))
      .then((data: { user: { role: string } }) => {
        const allowed = data.user.role === "ADMIN" || data.user.role === "EDITOR";
        setCanWrite(allowed);
        if (!allowed) {
          router.push("/players");
        }
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hasActiveRoster || !canWrite) {
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      role: formData.get("role"),
      number: formData.get("number"),
      dateOfBirth: formData.get("dateOfBirth"),
    };

    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        router.push("/players");
        router.refresh();
      } else {
        alert("Errore durante il salvataggio.");
      }
    } catch (error) {
      console.error(error);
      alert("Errore di rete.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-container">
      <header className="page-header">
        <Link href="/players" className="back-button">← Annulla</Link>
        <h1>Nuovo Giocatore</h1>
        <div style={{ width: "60px" }} />
      </header>

      <section className="form-section">
        {!hasActiveRoster ? (
          <div className="empty-state">
            <div className="empty-icon">🗂️</div>
            <p>Seleziona prima una rosa attiva dal menu in alto.</p>
          </div>
        ) : !canWrite ? (
          <div className="empty-state">
            <div className="empty-icon">🔒</div>
            <p>Non hai i permessi per creare giocatori.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-group">
              <label htmlFor="firstName">Nome *</label>
              <input type="text" id="firstName" name="firstName" required className="form-input" />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Cognome *</label>
              <input type="text" id="lastName" name="lastName" required className="form-input" />
            </div>

            <div className="form-group">
              <label htmlFor="role">Ruolo</label>
              <select id="role" name="role" className="form-input" defaultValue="UNKNOWN">
                <option value="UNKNOWN">Sconosciuto</option>
                <option value="GOALKEEPER">Portiere</option>
                <option value="DEFENDER">Difensore</option>
                <option value="MIDFIELDER">Centrocampista</option>
                <option value="FORWARD">Attaccante</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="number">Numero di Maglia</label>
              <input type="number" id="number" name="number" min="1" max="99" className="form-input" />
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Data di Nascita</label>
              <input type="date" id="dateOfBirth" name="dateOfBirth" className="form-input" />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Salvataggio..." : "Salva Giocatore"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
