FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install

RUN rm -f .npmrc && \
    npm config set registry https://registry.npmjs.org/ && \
    npm install @prisma/adapter-mysql2 mysql2

COPY . .

# PAKSA ENGINE KE LIBRARY (RUST)
ENV PRISMA_CLIENT_ENGINE_TYPE=library
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=library

RUN rm -f prisma.config.ts 

RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "dev"]