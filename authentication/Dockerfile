FROM node:18
WORKDIR /authentication
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 3003
CMD ["node", "authentication.js"]
