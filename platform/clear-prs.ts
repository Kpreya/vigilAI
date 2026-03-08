import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old mocked Pull Requests...');
  const result = await prisma.pullRequest.deleteMany({});
  console.log(`Deleted ${result.count} malformed Pull Requests.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
