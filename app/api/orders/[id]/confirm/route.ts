import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'
import { sendNotification } from '@/lib/pusher'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const order = await prisma.order.update({
      where: { id },
      data: { paymentStatus: 'PAID', paidAt: new Date(), confirmedBy: session.name },
      include: { customer: true, affiliate: true, package: true },
    })

    await createAuditLog({
      orderId: id,
      action: 'CONFIRM_PAYMENT',
      oldValue: 'UNPAID',
      newValue: 'PAID',
      note: `Hoa hồng: ${order.commission.toLocaleString('vi-VN')}đ`,
    })

    await sendNotification(order.affiliateId, {
      title: 'Thanh toán xác nhận',
      message: `Khách ${order.customer.name} đã thanh toán. Hoa hồng của bạn: ${order.commission.toLocaleString('vi-VN')}đ`,
      type: 'payment',
    })

    return NextResponse.json(order)
  } catch {
    return NextResponse.json({ error: 'Lỗi' }, { status: 500 })
  }
}
