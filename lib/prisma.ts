import { PrismaClient } from '@prisma/client';
const globalDb=globalThis as unknown as {cenovedDb?:PrismaClient};
export const prisma=globalDb.cenovedDb??new PrismaClient();
if(process.env.NODE_ENV!=='production')globalDb.cenovedDb=prisma;
