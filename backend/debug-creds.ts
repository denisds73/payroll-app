
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'GOOGLE_DRIVE_CREDENTIALS' },
  });

  if (!setting) {
    console.log('No credentials found in DB.');
    return;
  }

  console.log('--- CREDENTIALS VAlUE ---');
  console.log(setting.value);
  console.log('-------------------------');

  try {
    const json = JSON.parse(setting.value);
    console.log('Parsed JSON keys:', Object.keys(json));
    
    if (json.web) console.log('Found "web" key (OAuth Web).');
    if (json.installed) console.log('Found "installed" key (OAuth Desktop).');
    if (json.type === 'service_account') console.log('Found "type: service_account" (WRONG TYPE).');
    
  } catch (e) {
    console.error('Invalid JSON:', e.message);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
