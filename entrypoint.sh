#!/bin/sh

# Sincronizza lo schema del database all'avvio
echo "Sincronizzazione database Prisma..."
npx prisma db push --accept-data-loss

# Avvia l'applicazione Next.js
echo "Avvio applicazione..."
npm start
