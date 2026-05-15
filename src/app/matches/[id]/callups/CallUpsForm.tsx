"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getPlayerRoleLabel } from "@/lib/playerRoleLabels";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface CallUpData {
  player: Player;
  status: string;
}

export default function CallUpsForm({
  matchId,
  initialData,
  canWrite,
}: {
  matchId: string;
  initialData: CallUpData[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [callUps, setCallUps] = useState<CallUpData[]>(initialData);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = (playerId: string, status: string) => {
    setCallUps(prev => prev.map(c => c.player.id === playerId ? { ...c, status } : c));
  };

  const handleSave = async () => {
    if (!canWrite) {
      alert("Non hai i permessi per modificare le convocazioni.");
      return;
    }

    setLoading(true);
    try {
      // Save all sequentially (or Promise.all)
      await Promise.all(callUps.map(c => 
        fetch(`/api/matches/${matchId}/callups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: c.player.id, status: c.status })
        })
      ));
      
      router.push(`/matches/${matchId}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Errore durante il salvataggio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-form">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {callUps.map(({ player, status }) => (
          <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: '600' }}>{player.lastName} {player.firstName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{getPlayerRoleLabel(player.role)}</div>
            </div>
            <select 
              value={status} 
              onChange={(e) => handleStatusChange(player.id, e.target.value)}
              className="form-input"
              style={{ padding: '0.5rem', minWidth: '120px' }}
              disabled={!canWrite}
            >
              <option value="NOT_CALLED">Non Convocato</option>
              <option value="BENCH">Panchina</option>
              <option value="STARTER">Titolare</option>
            </select>
          </div>
        ))}
      </div>
      
      {canWrite ? (
        <button onClick={handleSave} className="submit-button" disabled={loading}>
          {loading ? "Salvataggio..." : "Salva Convocazioni"}
        </button>
      ) : (
        <p className="text-muted">Modalita sola lettura: non puoi modificare le convocazioni.</p>
      )}
    </div>
  );
}
