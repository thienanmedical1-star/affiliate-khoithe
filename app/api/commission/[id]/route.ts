import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const payment = await prisma.commissionPayment.findUnique({ where: { id } })
    if (!payment) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
    await prisma.commissionPayment.delete({ where: { id } })
    await createAuditLog({ action: 'DELETE_COMMISSION_PAYMENT', note: `Xóa chi trả ${payment.amount.toLocaleString('vi-VN')}đ` })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
