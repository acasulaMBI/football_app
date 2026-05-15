import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CallUpsForm from "./CallUpsForm";

export default async function CallUpsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const [match, players] = await Promise.all([
    prisma.match.findUnique({
      where: { id },
      include: { callUps: true }
    }),
    prisma.rosterPlayer.findMany({
      where: {
        roster: {
          matches: {
            some: {
              id,
            },
          },
        },
      },
      include: {
        player: true,
      },
      orderBy: {
        player: {
          lastName: "asc",
        },
      },
    })
  ]);

  if (!match) return <div className="page-container"><p>Partita non trovata</p></div>;

  // Create a map of playerId -> status
  const callUpMap = match.callUps.reduce((acc, curr) => {
    acc[curr.playerId] = curr.status;
    return acc;
  }, {} as Record<string, string>);

  const initialData = players.map(({ player }) => ({
    player,
    status: callUpMap[player.id] || "NOT_CALLED"
  }));

  return (
    <main className="page-container">
      <header className="page-header">
        <Link href={`/matches/${id}`} className="back-button">← Partita</Link>
        <h1>Convocazioni</h1>
        <div style={{ width: '60px' }}></div>
      </header>

      <section className="form-section">
        <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
          Seleziona lo stato per ciascun giocatore per la partita contro {match.opponent}.
        </p>
        <CallUpsForm matchId={id} initialData={initialData} />
      </section>
    </main>
  );
}
