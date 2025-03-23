import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = (DATABASE_URL?: string) => {
  if (!DATABASE_URL) {
    console.error("DATABASE_URL is undefined");
    // Handle this scenario appropriately - perhaps return a mock client or throw an error
  }
  
  return new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());
};

export default prisma;