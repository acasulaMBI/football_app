# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copia i file necessari per le dipendenze
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.js ./

# Strumenti necessari per compilare dipendenze native come better-sqlite3 su Alpine
RUN apk add --no-cache python3 make g++

# Installa le dipendenze
RUN npm install

# Genera il Client Prisma
RUN npx prisma generate

# Copia il resto del codice e builda l'app
COPY . .

# Variabili d'ambiente per la build
ENV DATABASE_URL="file:./build-dummy.db"
ENV NODE_ENV=production

RUN npm run build

# Stage 2: Dev (debug remoto)
FROM node:20-alpine AS dev

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.js ./

RUN apk add --no-cache python3 make g++

RUN npm install

COPY . .

ENV NODE_ENV=development

EXPOSE 4000 9229

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "4000"]

# Stage 3: Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copia solo i file necessari dal builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.js ./prisma.config.js
COPY --from=builder /app/next.config.ts ./

# Crea la cartella per il database persistente
RUN mkdir -p /app/data && chown -R node:node /app/data

# Script di avvio per gestire il database
COPY entrypoint.sh /usr/bin/
RUN chmod +x /usr/bin/entrypoint.sh

USER node

EXPOSE 4000

ENTRYPOINT ["entrypoint.sh"]
