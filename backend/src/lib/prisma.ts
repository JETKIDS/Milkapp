import path from 'path';
import dotenv from 'dotenv';
// Ensure .env is loaded before PrismaClient initialization
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;


