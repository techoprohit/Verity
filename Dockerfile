FROM node:22-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy application source
COPY . .

# Expose the application port
EXPOSE 8080

# Environment variables
ENV PORT=8080
ENV NODE_ENV=production
ENV DB_PATH=/data/verity.db

# Command to run the application
CMD ["npm", "start"]
