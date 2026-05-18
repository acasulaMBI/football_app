# Football Team Manager - Makefile

.PHONY: build up down restart logs shell db-push debug-up debug-down debug-logs db_reset dist help

help:
	@echo "Comandi disponibili:"
	@echo "  make build    - Costruisce l'immagine Docker"
	@echo "  make up       - Avvia i container in background"
	@echo "  make down     - Ferma e rimuove i container"
	@echo "  make restart  - Riavvia i container"
	@echo "  make ps       - Mostra lo stato dei container"
	@echo "  make logs     - Visualizza i log in tempo reale"
	@echo "  make shell    - Apre una shell interattiva nel container"
	@echo "  make db-push  - Sincronizza manualmente lo schema del database"
	@echo "  make dist     - Crea un zip con i file necessari per la produzione"
	@echo "  make debug-up - Avvia il container in modalita debug (porta 9229)"
	@echo "  make debug-down - Ferma il container di debug"
	@echo "  make debug-logs - Visualizza i log del container di debug"
	@echo "  make db_reset - Reset completo DB SQLite locale e riavvio stack debug"
	@echo "  make clean    - Rimuove container e volumi (ATTENZIONE: cancella i dati)"

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

ps:
	docker compose ps -a

logs:
	docker compose logs -f

shell:
	docker compose exec app sh

db-push:
	docker compose exec app npx prisma db push

dist:
	@set -e; \
	archive_path="$$(pwd)/dist/football-app-production.zip"; \
	tmpdir="$$(mktemp -d)"; \
	trap 'rm -rf "$$tmpdir"' EXIT; \
	mkdir -p dist; \
	cp Dockerfile docker-compose.yml entrypoint.sh package.json package-lock.json prisma.config.js next.config.ts postcss.config.mjs tsconfig.json next-env.d.ts "$$tmpdir"/; \
	cp -R prisma public src "$$tmpdir"/; \
	python3 -c 'import os, sys, zipfile; exec("""root = sys.argv[1]\narchive = sys.argv[2]\nwith zipfile.ZipFile(archive, \"w\", compression=zipfile.ZIP_DEFLATED) as zip_file:\n    for base, dirs, files in os.walk(root):\n        dirs[:] = [directory for directory in dirs if directory != \"__pycache__\"]\n        for name in files:\n            path = os.path.join(base, name)\n            zip_file.write(path, os.path.relpath(path, root))\n""")' "$$tmpdir" "$$archive_path"

debug-up:
	docker compose -f docker-compose.yml -f docker-compose.debug.yml up --build

debug-down:
	docker compose -f docker-compose.yml -f docker-compose.debug.yml down

debug-logs:
	docker compose -f docker-compose.yml -f docker-compose.debug.yml logs -f

db_reset:
	docker compose -f docker-compose.yml -f docker-compose.debug.yml down
	rm -f data/dev.db data/dev.db-journal
	docker compose -f docker-compose.yml -f docker-compose.debug.yml up --build

clean:
	docker compose down -v --rmi all
