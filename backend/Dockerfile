FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .
RUN mkdir -p uploads && chown -R node:node /app

ENV NODE_ENV=production
USER node
EXPOSE 8000

CMD ["npm", "run", "start:prod"]
