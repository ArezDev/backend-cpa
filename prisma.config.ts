import { defineConfig } from 'prisma/config'
import 'dotenv/config'

const databaseUrl = process.env.DATABASE_URL as string;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
})