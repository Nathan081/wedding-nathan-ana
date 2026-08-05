# syntax = docker/dockerfile:1
 
# Adjust NODE_VERSION as desired
ARG NODE_VERSION=24.15.0
FROM node:${NODE_VERSION}-slim
 
WORKDIR /app
 
ENV NODE_ENV="production"
 
# Install node modules (no native build tools needed —
# express/mongodb/cors/dotenv are all pure JS)
COPY package-lock.json package.json ./
RUN npm ci --omit=dev
 
# Copy application code
COPY . .
 
EXPOSE 3000
CMD [ "npm", "run", "start" ]
 