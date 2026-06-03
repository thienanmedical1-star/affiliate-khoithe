import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      name: 'Người C',
      role: 'ADMIN',
    },
  })

  await prisma.package.createMany({
    data: [
      { name: 'Gói cơ bản', price: 10000000 },
      { name: 'Gói nâng cao', price: 15000000 },
      { name: 'Gói premium', price: 20000000 },
      { name: 'Gói đặc biệt', price: 30000000 },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Seed xong! Admin: admin / admin123')
}

main().finally(() => prisma.$disconnect())
