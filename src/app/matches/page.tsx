import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveRosterIdFromCookies } from "@/lib/activeRosterServer";
import { getCurrentUserPermissions } from "@/lib/authServer";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ tournamentId?: string }>;
}) {
  const { canWrite } = await getCurrentUserPermissions();
  const activeRosterId = await getActiveRosterIdFromCookies();
  const { tournamentId = "" } = await searchParams;

  const tournaments = activeRosterId
    ? await prisma.tournament.findMany({
        where: { rosterId: activeRosterId },
        orderBy: [{ season: "desc" }, { name: "asc" }],
      })
    : [];

  const matches = activeRosterId
    ? await prisma.match.findMany({
        where: {
          rosterId: activeRosterId,
          ...(tournamentId === ""
            ? {}
            : tournamentId === "friendly"
              ? { tournamentId: null }
              : { tournamentId }),
        },
        orderBy: { date: "asc" },
        include: { tournament: true },
      })
    : [];

  return (
    <main className="page-container">
      <header className="page-header">
        <Link href="/" className="back-button">← Home</Link>
        <h1>Partite</h1>
        {canWrite ? (
          <Link href="/matches/new" className="primary-action-button">+ Nuova</Link>
        ) : (
          <div style={{ width: "60px" }} />
        )}
      </header>

      <section className="list-section">
        {!activeRosterId ? (
          <div className="empty-state">
            <div className="empty-icon">🗂️</div>
            <p>Seleziona prima una rosa attiva dal menu in alto.</p>
          </div>
        ) : (
          <>
            <form method="GET" className="modern-form" style={{ marginBottom: "1rem", gap: "0.75rem" }}>
              <label htmlFor="tournamentId">Filtra per torneo</label>
              <select id="tournamentId" name="tournamentId" className="form-input" defaultValue={tournamentId}>
                <option value="">Tutti i tornei</option>
                <option value="friendly">Solo amichevoli</option>
                {tournaments.map((tournament) => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name} ({tournament.season})
                  </option>
                ))}
              </select>
              <button type="submit" className="primary-action-button">Applica filtro</button>
            </form>

            {matches.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">⚽</div>
                <p>Nessuna partita in programma.</p>
              </div>
            ) : (
              <ul className="item-list">
                {matches.map((match) => (
                  <li key={match.id} className="list-item">
                    <Link href={`/matches/${match.id}`} className="list-item-link">
                      <div className="item-avatar" style={{ backgroundColor: match.location === "HOME" ? "var(--primary)" : "var(--warning)" }}>
                        {match.location === "HOME" ? "C" : "T"}
                      </div>
                      <div className="item-details">
                        <h3 className="item-title">vs {match.opponent}</h3>
                        <span className="item-subtitle">
                          {new Date(match.date).toLocaleDateString("it-IT")} • {match.tournament?.name || "Amichevole"}
                        </span>
                      </div>
                      <div className="item-chevron">›</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </main>
  );
}
