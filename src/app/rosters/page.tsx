import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RosterPlayersManager from "./RosterPlayersManager";
import { getCurrentUserPermissions } from "@/lib/authServer";

export default async function RostersPage() {
  const { user, canWrite } = await getCurrentUserPermissions();

  const rosters = await prisma.roster.findMany({
    where:
      user?.role === "ADMIN"
        ? undefined
        : {
            OR: [{ ownerId: user?.id || "" }, { ownerId: null }],
          },
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
  });

  const rosterIds = rosters.map((roster) => roster.id);

  const players = await prisma.player.findMany({
    where:
      user?.role === "ADMIN"
        ? undefined
        : {
            rosters: {
              some: {
                rosterId: { in: rosterIds.length > 0 ? rosterIds : ["__none__"] },
              },
            },
          },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

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
                canWrite={canWrite}
                allPlayers={players.map((player) => ({
                  id: player.id,
                  firstName: player.firstName,
                  lastName: player.lastName,
                  role: player.role,
                  number: player.number,
                  dateOfBirth: player.dateOfBirth ? player.dateOfBirth.toISOString() : null,
                }))}
                members={roster.players.map((membership) => ({
                  id: membership.player.id,
                  firstName: membership.player.firstName,
                  lastName: membership.player.lastName,
                  role: membership.player.role,
                  number: membership.player.number,
                  dateOfBirth: membership.player.dateOfBirth ? membership.player.dateOfBirth.toISOString() : null,
                }))}
              />
            </article>
          ))
        )}
      </section>
    </main>
  );
}
