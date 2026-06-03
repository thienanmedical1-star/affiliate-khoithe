import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, requireAdmin } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'
import { sendNotification } from '@/lib/pusher'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const where = session.role === 'AFFILIATE' ? { affiliateId: session.userId } : {}
    const customers = await prisma.customer.findMany({
      where,
      include: { affiliate: { select: { name: true, affiliateCode: true } }, orders: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(customers)
  } catch {
    return NextResponse.json({ error: 'Lỗi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const data = await req.json()
    const customer = await prisma.customer.create({
      data: { ...data, registeredAt: new Date(data.registeredAt || Date.now()) },
      include: { affiliate: true },
    })
    await createAuditLog({ customerId: customer.id, action: 'CREATE_CUSTOMER', target: customer.name })
    await sendNotification(customer.affiliateId, {
      title: 'Khách hàng mới',
      message: `${customer.name} vừa được thêm vào danh sách của bạn`,
      type: 'customer',
    })
    return NextResponse.json(customer)
  } catch (e: any) {
    return NextResponse.json({ error: 'Lỗi: ' + e.message }, { status: 500 })
  }
}
