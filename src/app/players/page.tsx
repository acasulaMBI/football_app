import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveRosterIdFromCookies } from "@/lib/activeRosterServer";
import { getCurrentUserPermissions } from "@/lib/authServer";
import { getPlayerRoleLabel } from "@/lib/playerRoleLabels";

// Server Component to fetch players
export default async function PlayersPage() {
  const { canWrite } = await getCurrentUserPermissions();
  const activeRosterId = await getActiveRosterIdFromCookies();

  const memberships = activeRosterId
    ? await prisma.rosterPlayer.findMany({
        where: { rosterId: activeRosterId },
        include: { player: true },
        orderBy: { player: { lastName: "asc" } },
      })
    : [];
  const players = memberships.map((membership) => membership.player);

  return (
    <main className="page-container">
      <header className="page-header">
        <Link href="/" className="back-button">← Home</Link>
        <h1>La Rosa</h1>
        {canWrite ? (
          <Link href="/players/new" className="primary-action-button">+ Aggiungi</Link>
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
        ) : players.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>Nessun giocatore in rosa.</p>
            <p className="text-sm text-muted">Aggiungi il tuo primo giocatore!</p>
          </div>
        ) : (
          <ul className="item-list">
            {players.map((player) => (
              <li key={player.id} className="list-item">
                <Link href={`/stats/players/${player.id}`} className="list-item-link">
                  <div className="item-avatar">
                    {player.number ? player.number : "?"}
                  </div>
                  <div className="item-details">
                    <h3 className="item-title">{player.lastName} {player.firstName}</h3>
                    <span className="item-subtitle">{getPlayerRoleLabel(player.role)}</span>
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
