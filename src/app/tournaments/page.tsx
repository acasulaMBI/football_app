import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function TournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="page-container">
      <header className="page-header">
        <Link href="/" className="back-button">← Home</Link>
        <h1>Tornei</h1>
        <Link href="/tournaments/new" className="primary-action-button">+ Nuovo</Link>
      </header>

      <section className="list-section">
        {tournaments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <p>Nessun torneo creato.</p>
          </div>
        ) : (
          <ul className="item-list">
            {tournaments.map((t) => (
              <li key={t.id} className="list-item">
                <Link href={`/tournaments/${t.id}`} className="list-item-link">
                  <div className="item-avatar" style={{ backgroundColor: 'var(--warning)' }}>
                    T
                  </div>
                  <div className="item-details">
                    <h3 className="item-title">{t.name}</h3>
                    <span className="item-subtitle">Stagione {t.season}</span>
                  </div>
                  <div className="item-chevron">›</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
