import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, hashPassword } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const data = await req.json()
    if (data.password) data.password = await hashPassword(data.password)
    else delete data.password
    if (data.commission) data.commission = Number(data.commission)
    const user = await prisma.user.update({ where: { id }, data })
    await createAuditLog({ action: 'UPDATE_AFFILIATE', target: id })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Lỗi' }, { status: 500 })
  }
}
