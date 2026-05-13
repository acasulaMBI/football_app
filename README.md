# Football App

Applicazione Next.js + Prisma per la gestione di tornei, partite e convocazioni.

## Prerequisiti

- Docker e Docker Compose installati sulla macchina remota
- VS Code con estensione Remote SSH (se lavori da locale verso host remoto)

## Avvio in produzione (container ottimizzato)

```bash
make build
make up
```

App disponibile su `http://<host-remoto>:4000`.

## Avvio in debug (consigliato in sviluppo remoto)

Questa modalita:
- usa il target `dev` del `Dockerfile`
- espone la porta debugger Node `9229`
- monta il codice nel container (`/app`) per hot reload

Avvio:

```bash
make debug-up
```

Log live:

```bash
make debug-logs
```

Stop:

```bash
make debug-down
```

## Debug da VS Code

Nel repository e presente una configurazione pronta:
- `.vscode/launch.json` -> `Attach Node (Docker remoto)`

Procedura:
1. Avvia `make debug-up`
2. Apri VS Code sullo stesso host remoto (o via Remote SSH)
3. Vai in Run and Debug
4. Esegui `Attach Node (Docker remoto)`

Breakpoint e sourcemap puntano a:
- locale: `${workspaceFolder}`
- remoto: `/app`

## Docker Compose usati

- `docker-compose.yml`: profilo standard (production)
- `docker-compose.debug.yml`: overlay debug (`target: dev`, porta `9229`)

## Database Prisma

Nel profilo debug viene eseguito automaticamente:

```bash
npx prisma db push --accept-data-loss
```

Il DB sqlite persiste nel volume `football-data-dev`.
