"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewTournamentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      season: formData.get("season"),
    };

    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        router.push("/tournaments");
        router.refresh();
      } else {
        alert("Errore durante il salvataggio del torneo.");
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
        <Link href="/tournaments" className="back-button">← Annulla</Link>
        <h1>Nuovo Torneo</h1>
        <div style={{ width: '60px' }}></div>
      </header>

      <section className="form-section">
        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-group">
            <label htmlFor="name">Nome Torneo *</label>
            <input type="text" id="name" name="name" required className="form-input" placeholder="Es. Campionato Provinciale" />
          </div>

          <div className="form-group">
            <label htmlFor="season">Stagione *</label>
            <input type="text" id="season" name="season" required className="form-input" placeholder="Es. 2026/2027" />
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Salvataggio..." : "Salva Torneo"}
          </button>
        </form>
      </section>
    </main>
  );
}
