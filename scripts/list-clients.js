// scripts/list-clients.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listClients() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { shopDomain: 'asc' }
    });
    
    console.log('\nCurrent clients:');
    if (clients.length === 0) {
      console.log('No clients found.');
    } else {
      clients.forEach(client => {
        console.log(`- ${client.shopDomain}: ${client.voiceflowApiKey.substring(0, 6)}...`);
      });
    }
  } catch (error) {
    console.error('Error listing clients:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listClients();