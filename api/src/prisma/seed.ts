import { prisma } from '../config/db.js';
import { seedDefaults } from '../services/seed.service.js';

async function main() {
  console.log('🌱 Starting idempotent database seeding...');
  const { categoriesCount, paymentMethodsCount } = await seedDefaults(prisma);
  console.log(`✅ Seeded ${categoriesCount} system categories and ${paymentMethodsCount} payment methods.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
