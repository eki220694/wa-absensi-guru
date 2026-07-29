FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY shared/ ./shared/
COPY bot/ ./bot/

RUN npm install

WORKDIR /app/bot
CMD ["npm", "run", "start"]
