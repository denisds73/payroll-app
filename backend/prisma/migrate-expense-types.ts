import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting expense type migration...');

  // 1. Ensure 'Other' type exists (or get its ID)
  let otherType = await prisma.expenseType.findUnique({
    where: { name: 'Other' },
  });

  if (!otherType) {
    console.log('📝 Creating "Other" expense type...');
    otherType = await prisma.expenseType.create({
      data: { name: 'Other' },
    });
  }

  const otherTypeId = otherType.id;

  // 2. Find types to be removed
  const typesToRemove = await prisma.expenseType.findMany({
    where: {
      name: { in: ['Drinks', 'Site'] },
    },
  });

  if (typesToRemove.length === 0) {
    console.log('✅ No "Drinks" or "Site" types found. Nothing to migrate.');
    return;
  }

  const typeIdsToRemove = typesToRemove.map(t => t.id);
  const typeNamesToRemove = typesToRemove.map(t => t.name);

  console.log(`📦 Found types to migrate: ${typeNamesToRemove.join(', ')}`);

  // 3. Update all expenses with these types to 'Other'
  const updateResult = await prisma.expense.updateMany({
    where: {
      typeId: { in: typeIdsToRemove },
    },
    data: {
      typeId: otherTypeId,
    },
  });

  console.log(`✅ Updated ${updateResult.count} expenses to type "Other".`);

  // 4. Delete the old types
  const deleteResult = await prisma.expenseType.deleteMany({
    where: {
      id: { in: typeIdsToRemove },
    },
  });

  console.log(`🗑️ Deleted ${deleteResult.count} expense types.`);
  console.log('🎉 Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
