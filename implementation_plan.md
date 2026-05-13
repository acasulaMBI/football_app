# Football Team Management App - Implementation Plan

Questa è la proposta per l'architettura e l'implementazione dell'applicazione web per la gestione della squadra di calcio, progettata per essere "mobile-first" e flessibile per futuri cambi di database.

## Architettura e Stack Tecnologico

- **Framework:** Next.js (React). Ci permette di sviluppare sia il frontend (la web app mobile-first) sia le API di backend in un unico progetto.
- **Database & ORM:** SQLite con **Prisma ORM**. Prisma è la scelta ideale perché ci consente di usare SQLite inizialmente (come richiesto) e passare a PostgreSQL o MySQL in futuro semplicemente cambiando una riga di configurazione e la stringa di connessione.
- **Styling:** CSS puro (Vanilla CSS / CSS Modules) per avere il massimo controllo sul design e garantire un look premium e reattivo per i dispositivi mobili, seguendo le best practices moderne (Glassmorphism, Dark mode, animazioni fluide).

## Schema del Database (Prisma)

Lo schema sarà progettato per supportare tutte le entità richieste:

1. **Player (Rosa):** Nome, Cognome, Ruolo, Numero, Data di nascita.
2. **Tournament (Tornei):** Nome, Stagione.
3. **Match (Partite):** Data, Avversario, Luogo (Casa/Trasferta), ID Torneo, Durata totale prevista (es. 90 min).
4. **CallUp (Convocazioni):** Relazione molti-a-molti tra `Player` e `Match`. Include lo stato (Convocato, Titolare, Panchina).
5. **MatchEvent (Eventi Partita - Gol, Cambi, Cartellini):**
   - Riferimento al `Match` e al `Player` principale (chi segna o chi entra).
   - Tipo di evento: `GOAL`, `SUBSTITUTION`, `YELLOW_CARD`, `RED_CARD`.
   - Dettaglio per i goal: `RIGHT_FOOT`, `LEFT_FOOT`, `HEADER`, `PENALTY`, `FREE_KICK`, `OTHER`.
   - **Assist**: Riferimento opzionale a un altro `Player` che ha fornito l'assist per il `GOAL`.
   - **Sostituzione**: In caso di `SUBSTITUTION`, il `Player` principale è chi entra (`subIn`), e ci sarà un riferimento a un altro `Player` che è chi esce (`subOut`).
   - Minuto dell'evento.

## Prospetto delle API

Next.js ci permette di creare un set di API RESTful (sotto `/api/`) che la web app consumerà:
- `GET /api/players`, `POST /api/players`
- `GET /api/tournaments`, `POST /api/tournaments`
- `GET /api/matches`, `POST /api/matches`
- `GET /api/matches/[id]` (per recuperare i dettagli di una partita, convocati ed eventi)
- `POST /api/matches/[id]/events` (per inserire gol, cambi, ecc.)

## UI / UX (Mobile First)

Il design sarà moderno, orientato principalmente all'uso da smartphone (visto che l'app verrà usata spesso a bordo campo o in spogliatoio):
- **Dashboard:** Riepilogo prossima partita e statistiche principali.
- **Rosa:** Lista giocatori con statistiche (minuti giocati, gol).
- **Gestione Partita (Live):** Un'interfaccia dedicata e veloce per inserire eventi in tempo reale durante il match (Cronometro, bottoni rapidi per cambi e gol).

> [!IMPORTANT]
> **User Review Required**
> 1. Sei d'accordo con l'utilizzo di **Next.js** e **Prisma ORM**? È la soluzione standard per applicazioni moderne e garantisce la portabilità del database richiesta.
> 2. Per i ruoli dei giocatori e i tipi di eventi/goal ho previsto delle enumerazioni di base. C'è qualche dettaglio specifico che vorresti aggiungere fin da subito?

Una volta approvato il piano, procederò con l'inizializzazione del progetto Next.js e la configurazione del database SQLite.
