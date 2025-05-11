# filepath: /Users/nelson/VSCodeProjects/proposta-didatica-backend/Dockerfile
FROM node:20

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

RUN npm prune --omit=dev

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/app.js"]