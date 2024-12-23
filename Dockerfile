FROM node:18-alpine

WORKDIR /app

COPY package.json .
COPY urls.json .
COPY app.js .
COPY public/ public/

RUN npm install

EXPOSE 3000

CMD ["node", "app.js"] 