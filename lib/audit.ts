import { prisma } from './prisma'

export async function createAuditLog(data: {
  userId?: string
  customerId?: string
  orderId?: string
  action: string
  target?: string
  oldValue?: string
  newValue?: string
  note?: string
}) {
  await prisma.auditLog.create({ data })
}
