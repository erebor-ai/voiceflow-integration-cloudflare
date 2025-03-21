// scripts/delete-client.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function deleteClient() {
  const shopDomain = process.argv[2];
  
  if (!shopDomain) {
    console.error('Usage: node scripts/delete-client.js <shopDomain>');
    process.exit(1);
  }
  
  try {
    await prisma.client.delete({
      where: { shopDomain }
    });
    
    console.log(`Client deleted: ${shopDomain}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteClient();