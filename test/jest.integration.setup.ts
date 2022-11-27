import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv'

dotenv.config({
  path: ".env.test"
})

// clear database tables

beforeEach(async () => {
  const prisma = new PrismaClient()

  await prisma.$queryRaw`TRUNCATE TABLE "People" CASCADE`
  await prisma.$queryRaw`TRUNCATE TABLE "Account" CASCADE`
});