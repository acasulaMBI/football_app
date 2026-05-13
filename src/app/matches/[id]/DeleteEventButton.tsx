"use client";

import { useRouter } from "next/navigation";

interface DeleteEventButtonProps {
  matchId: string;
  eventId: string;
}

export default function DeleteEventButton({ matchId, eventId }: DeleteEventButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
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
