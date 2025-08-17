FROM node:18
WORKDIR /apigateway
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 3005
CMD ["npm","run","dev"]