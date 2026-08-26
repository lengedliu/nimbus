# --- build/deps stage -------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
# No package-lock.json is committed (keeps the repo dependency-resolution
# flexible); npm install works fine here. Swap to `npm ci` if you commit one.
RUN npm install --omit=dev

# --- runtime stage -----------------------------------------------------------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY server.js ./
COPY src ./src
COPY public ./public

# Data (users/vaults/notes) lives here — mount a volume onto this path so it
# survives container rebuilds. See docker-compose.yml.
VOLUME ["/app/data"]

EXPOSE 8787

CMD ["node", "server.js"]
