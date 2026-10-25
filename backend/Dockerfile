FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Ensure data directory exists
RUN mkdir -p /app/data

EXPOSE 5000

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/health').then(r=>{if(r.ok)process.exit(0);else process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
