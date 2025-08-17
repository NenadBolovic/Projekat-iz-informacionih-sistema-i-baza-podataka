FROM node:16
WORKDIR /formsquestionsapp
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3006
CMD ["npm","run","dev"]