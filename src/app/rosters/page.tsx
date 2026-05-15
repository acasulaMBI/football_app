import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RosterPlayersManager from "./RosterPlayersManager";

export default async function RostersPage() {
  const [rosters, players] = await Promise.all([
    prisma.roster.findMany({
      orderBy: { name: "asc" },
      include: {
        players: {
          include: {
            player: true,
          },
          orderBy: {
            player: { lastName: "asc" },
          },
        },
      },
    }),
    prisma.player.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  return (
    <main className="page-container">
      <header className="page-header">
        <Link href="/" className="back-button">← Home</Link>
        <h1>Rose</h1>
        <div style={{ width: "60px" }} />
      </header>

      <section className="list-section" style={{ display: "grid", gap: "1rem" }}>
        {rosters.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🗂️</div>
            <p>Nessuna rosa disponibile.</p>
            <p className="text-sm text-muted">Creane una dal menu in alto.</p>
          </div>
        ) : (
          rosters.map((roster) => (
            <article key={roster.id} className="modern-form" style={{ gap: "0.75rem" }}>
              <h2>{roster.name}</h2>
              <p className="item-subtitle">{roster.players.length} giocatori associati</p>
              <RosterPlayersManager
                rosterId={roster.id}
                allPlayers={players.map((player) => ({
                  id: player.id,
                  firstName: player.firstName,
                  lastName: player.lastName,
                }))}
                members={roster.players.map((membership) => ({
                  id: membership.player.id,
                  firstName: membership.player.firstName,
                  lastName: membership.player.lastName,
                }))}
              />
            </article>
          ))
        )}
      </section>
    </main>
  );
}
