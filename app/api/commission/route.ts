import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, getSession } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'
import { sendNotification } from '@/lib/pusher'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const where = session.role === 'AFFILIATE' ? { affiliateId: session.userId } : {}
  const payments = await prisma.commissionPayment.findMany({
    where,
    include: { affiliate: { select: { name: true } } },
    orderBy: { paidAt: 'desc' },
  })
  return NextResponse.json(payments)
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { affiliateId, amount, note } = await req.json()
    const payment = await prisma.commissionPayment.create({
      data: { affiliateId, amount: Number(amount), note },
      include: { affiliate: true },
    })
    await createAuditLog({ action: 'PAY_COMMISSION', target: affiliateId, newValue: String(amount), note })
    await sendNotification(affiliateId, {
      title: 'Hoa hồng đã được trả',
      message: `Bạn vừa nhận được ${Number(amount).toLocaleString('vi-VN')}đ hoa hồng`,
      type: 'commission',
    })
    return NextResponse.json(payment)
  } catch {
    return NextResponse.json({ error: 'Lỗi' }, { status: 500 })
  }
}
