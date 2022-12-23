FROM node:16.17.0-alpine3.15

WORKDIR /app

COPY package.json ./
COPY weeklyBasicNetStatsRecorder.js ./
COPY .env ./

WORKDIR /app/externalFunctions
COPY externalFunctions/*.js ./

WORKDIR /app
RUN npm install --omit=dev && npm cache clean --force
CMD node /app/weeklyBasicNetStatsRecorder.js
