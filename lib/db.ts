import { PrismaClient } from "@/lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

function createPrismaClient() {
  const connectionString = process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NON_POOLING
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter } as never)
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
