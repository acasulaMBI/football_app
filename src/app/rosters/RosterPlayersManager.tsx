"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PlayerLite = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  number: number | null;
  dateOfBirth: string | null;
};

const PLAYER_ROLE_OPTIONS = [
  { value: "UNKNOWN", label: "Sconosciuto" },
  { value: "GOALKEEPER", label: "Portiere" },
  { value: "DEFENDER", label: "Difensore" },
  { value: "MIDFIELDER", label: "Centrocampista" },
  { value: "FORWARD", label: "Attaccante" },
] as const;

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
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    role: "UNKNOWN",
    number: "",
    dateOfBirth: "",
  });
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

  const startEdit = (player: PlayerLite) => {
    setEditingPlayerId(player.id);
    setEditForm({
      firstName: player.firstName,
      lastName: player.lastName,
      role: player.role || "UNKNOWN",
      number: player.number !== null ? String(player.number) : "",
      dateOfBirth: player.dateOfBirth ? player.dateOfBirth.slice(0, 10) : "",
    });
  };

  const cancelEdit = () => {
    setEditingPlayerId(null);
    setEditForm({
      firstName: "",
      lastName: "",
      role: "UNKNOWN",
      number: "",
      dateOfBirth: "",
    });
  };

  const updatePlayer = async () => {
    if (!editingPlayerId) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/players/${editingPlayerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editForm.firstName.trim(),
          lastName: editForm.lastName.trim(),
          role: editForm.role,
          number: editForm.number.trim() ? editForm.number : null,
          dateOfBirth: editForm.dateOfBirth || null,
        }),
      });

      if (!res.ok) {
        alert("Errore durante la modifica del giocatore.");
        return;
      }

      cancelEdit();
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
                {canWrite ? (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="back-button"
                      onClick={() => startEdit(member)}
                      disabled={loading}
                    >
                      Modifica
                    </button>
                    <button
                      type="button"
                      className="back-button"
                      onClick={() => removePlayer(member.id)}
                      disabled={loading}
                    >
                      Rimuovi
                    </button>
                  </div>
                ) : null}
              </div>

              {editingPlayerId === member.id ? (
                <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.75rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <input
                      className="form-input"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Nome"
                      disabled={loading}
                    />
                    <input
                      className="form-input"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Cognome"
                      disabled={loading}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                    <select
                      className="form-input"
                      value={editForm.role}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                      disabled={loading}
                    >
                      {PLAYER_ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <input
                      className="form-input"
                      type="number"
                      min={1}
                      max={99}
                      value={editForm.number}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, number: e.target.value }))}
                      placeholder="Numero"
                      disabled={loading}
                    />

                    <input
                      className="form-input"
                      type="date"
                      value={editForm.dateOfBirth}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                      disabled={loading}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="back-button"
                      onClick={cancelEdit}
                      disabled={loading}
                    >
                      Annulla
                    </button>
                    <button
                      type="button"
                      className="primary-action-button"
                      onClick={updatePlayer}
                      disabled={
                        loading ||
                        !editForm.firstName.trim() ||
                        !editForm.lastName.trim()
                      }
                    >
                      Salva
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
