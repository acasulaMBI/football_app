"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Tournament {
  id: string;
  name: string;
  season: string;
}

export default function NewMatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    fetch("/api/tournaments")
      .then(res => res.json())
      .then(data => setTournaments(data))
      .catch(err => console.error("Failed to load tournaments", err));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      date: formData.get("date"),
      opponent: formData.get("opponent"),
      location: formData.get("location"),
      duration: formData.get("duration"),
      tournamentId: formData.get("tournamentId") || null,
    };

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        router.push("/matches");
        router.refresh();
      } else {
        alert("Errore durante il salvataggio della partita.");
      }
    } catch (error) {
      console.error(error);
      alert("Errore di rete.");
    } finally {
      setLoading(false);
    }
  }

  // Set default date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <main className="page-container">
      <header className="page-header">
        <Link href="/matches" className="back-button">← Annulla</Link>
        <h1>Nuova Partita</h1>
        <div style={{ width: '60px' }}></div>
      </header>

      <section className="form-section">
        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-group">
            <label htmlFor="date">Data e Ora *</label>
            <input type="datetime-local" id="date" name="date" required className="form-input" defaultValue={`${today}T15:00`} />
          </div>

          <div className="form-group">
            <label htmlFor="opponent">Avversario *</label>
            <input type="text" id="opponent" name="opponent" required className="form-input" placeholder="Es. Real Madrid" />
          </div>

          <div className="form-group">
            <label htmlFor="location">Luogo *</label>
            <select id="location" name="location" className="form-input" defaultValue="HOME">
              <option value="HOME">Casa</option>
              <option value="AWAY">Trasferta</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="tournamentId">Torneo (Opzionale)</label>
            <select id="tournamentId" name="tournamentId" className="form-input" defaultValue="">
              <option value="">Nessuno (Amichevole)</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.season})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="duration">Durata (Minuti)</label>
            <input type="number" id="duration" name="duration" className="form-input" defaultValue={90} />
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Salvataggio..." : "Salva Partita"}
          </button>
        </form>
      </section>
    </main>
  );
}
