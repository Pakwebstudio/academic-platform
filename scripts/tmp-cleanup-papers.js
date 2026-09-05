const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function cleanup() {
  const result = await prisma.researchPaper.deleteMany({
    where: { title: { startsWith: "Pagination Test Paper" } },
  });
  console.log(JSON.stringify({ deleted: result.count }));
}
cleanup()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });