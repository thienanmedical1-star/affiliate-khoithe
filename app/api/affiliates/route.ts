import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, hashPassword } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function GET() {
  try {
    const session = await requireAdmin()
    const affiliates = await prisma.user.findMany({
      where: { role: 'AFFILIATE' },
      include: {
        _count: { select: { customers: true, orders: true } },
        commissionPayments: true,
        orders: { where: { paymentStatus: 'PAID' } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(affiliates)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { username, password, name, email, affiliateCode, commission } = await req.json()
    const hashed = await hashPassword(password)
    const user = await prisma.user.create({
      data: { username, password: hashed, name, email, affiliateCode, commission: Number(commission), role: 'AFFILIATE' },
    })
    await createAuditLog({ action: 'CREATE_AFFILIATE', target: username, newValue: name })
    return NextResponse.json(user)
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Username hoặc mã affiliate đã tồn tại' }, { status: 400 })
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
