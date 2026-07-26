FROM node:22-alpine

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev
COPY backend/models ./models
COPY backend/services ./services

WORKDIR /app/mcp-server
COPY mcp-server/package.json mcp-server/package-lock.json ./
RUN npm ci --omit=dev
COPY mcp-server/src ./src

RUN chown -R node:node /app
ENV NODE_ENV=production
USER node
EXPOSE 8001

CMD ["npm", "run", "start:http"]
