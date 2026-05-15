"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PlayerLite = {
  id: string;
  firstName: string;
  lastName: string;
};

export default function RosterPlayersManager({
  rosterId,
  canWrite,
  allPlayers,
  members,
}: {
  rosterId: string;
  canWrite: boolean;
  allPlayers: PlayerLite[];
  members: PlayerLite[];
}) {
  const router = useRouter();
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [loading, setLoading] = useState(false);

  const memberIds = useMemo(() => new Set(members.map((player) => player.id)), [members]);
  const availablePlayers = useMemo(
    () => allPlayers.filter((player) => !memberIds.has(player.id)),
    [allPlayers, memberIds]
  );

  const addPlayer = async () => {
    if (!selectedPlayerId) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/rosters/${rosterId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: selectedPlayerId }),
      });

      if (!res.ok) {
        alert("Errore durante l'associazione del giocatore.");
        return;
      }

      setSelectedPlayerId("");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Errore di rete.");
    } finally {
      setLoading(false);
    }
  };

  const removePlayer = async (playerId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rosters/${rosterId}/players`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });

      if (!res.ok) {
        alert("Errore durante la rimozione del giocatore.");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Errore di rete.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {canWrite ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.5rem" }}>
          <select
            className="form-input"
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            disabled={loading || availablePlayers.length === 0}
          >
            <option value="">Aggiungi giocatore esistente</option>
            {availablePlayers.map((player) => (
              <option key={player.id} value={player.id}>
                {player.lastName} {player.firstName}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="primary-action-button"
            onClick={addPlayer}
            disabled={loading || !selectedPlayerId}
          >
            + Aggiungi
          </button>
        </div>
      ) : (
        <p className="text-muted text-sm">Modalita sola lettura: modifiche disabilitate.</p>
      )}

      {members.length === 0 ? (
        <p className="text-muted text-sm">Nessun giocatore in questa rosa.</p>
      ) : (
        <ul className="item-list">
          {members.map((member) => (
            <li key={member.id} className="list-item" style={{ padding: "0.75rem 1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                <span>{member.lastName} {member.firstName}</span>
                <button
                  type="button"
                  className="back-button"
                  onClick={() => removePlayer(member.id)}
                  disabled={loading || !canWrite}
                >
                  Rimuovi
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
