import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'Không thể xóa đơn đã thanh toán. Hãy hủy thanh toán trước.' }, { status: 400 })
    }
    await prisma.order.delete({ where: { id } })
    await createAuditLog({ orderId: id, action: 'DELETE_ORDER', note: 'Xóa đơn hàng' })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Lỗi' }, { status: 500 })
  }
}
