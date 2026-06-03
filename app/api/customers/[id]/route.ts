import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, getSession } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const data = await req.json()
    const old = await prisma.customer.findUnique({ where: { id } })
    const customer = await prisma.customer.update({ where: { id }, data })
    if (old?.status !== data.status) {
      await createAuditLog({
        customerId: id,
        action: 'UPDATE_STATUS',
        target: customer.name,
        oldValue: old?.status,
        newValue: data.status,
      })
    }
    return NextResponse.json(customer)
  } catch {
    return NextResponse.json({ error: 'Lỗi' }, { status: 500 })
  }
}
