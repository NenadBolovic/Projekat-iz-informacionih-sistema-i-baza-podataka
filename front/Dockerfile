# Use the official Node.js image
FROM node:18

WORKDIR /front

COPY package.json package-lock.json ./

RUN npm install

COPY . .
# Expose React app on port 3000
EXPOSE 3000  
# Start the React app using react-scripts
CMD ["npm", "start"]  
