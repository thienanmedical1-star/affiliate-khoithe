import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const order = await prisma.order.update({
      where: { id },
      data: { paymentStatus: 'UNPAID', paidAt: null, confirmedBy: null, commission: 0 },
    })
    await createAuditLog({ orderId: id, action: 'UNCONFIRM_PAYMENT', oldValue: 'PAID', newValue: 'UNPAID' })
    return NextResponse.json(order)
  } catch {
    return NextResponse.json({ error: 'Lỗi' }, { status: 500 })
  }
}
