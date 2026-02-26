import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: { in: ['GOOGLE_DRIVE_CREDENTIALS', 'GOOGLE_DRIVE_TOKEN', 'BACKUP_FOLDER_ID'] }
    }
  });
  console.log(settings.map(s => s.key));
}
main().catch(console.error).finally(() => prisma.$disconnect());
