FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/build ./build

# The application listens on this port in SSE mode
ENV PORT=3000
EXPOSE 3000

CMD ["node", "build/index.js"]
