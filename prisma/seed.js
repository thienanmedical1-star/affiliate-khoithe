const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Check if admin exists
  const existing = await prisma.user.findUnique({ where: { username: 'admin' } })
  if (existing) { console.log('Admin already exists'); return }

  const adminPassword = await bcrypt.hash('admin123', 12)
  await prisma.user.create({
    data: {
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
  console.log('Seed done! admin / admin123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
