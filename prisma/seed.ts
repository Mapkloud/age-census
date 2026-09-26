import { PrismaClient } from "@prisma/client";
import { CENSUS_KEYS, CENSUS_VERSION } from "../src/modules/census";

const prisma = new PrismaClient();

async function main() {
  await prisma.questionSet.upsert({
    where: { version: CENSUS_VERSION },
    update: { keys: [...CENSUS_KEYS] },
    create: { version: CENSUS_VERSION, keys: [...CENSUS_KEYS] },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
