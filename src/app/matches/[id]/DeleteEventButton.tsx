"use client";

import { useRouter } from "next/navigation";

interface DeleteEventButtonProps {
  matchId: string;
  eventId: string;
  canWrite: boolean;
}

export default function DeleteEventButton({ matchId, eventId, canWrite }: DeleteEventButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!canWrite) {
      alert("Non hai i permessi per eliminare eventi.");
      return;
    }

    const confirmed = window.confirm("Eliminare questo evento?");
    if (!confirmed) return;

    const response = await fetch(`/api/matches/${matchId}/events/${eventId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      alert(data?.error || "Errore durante l'eliminazione dell'evento");
      return;
    }

    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={!canWrite}
      style={{
        marginLeft: "auto",
        border: "1px solid var(--danger)",
        borderRadius: "999px",
        padding: "0.25rem 0.75rem",
        color: "var(--danger)",
        fontWeight: 600,
      }}
    >
      Elimina
    </button>
  );
}
