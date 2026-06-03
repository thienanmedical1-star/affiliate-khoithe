import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const data = await req.json()
    if (data.price) data.price = Number(data.price)
    const pkg = await prisma.package.update({ where: { id }, data })
    return NextResponse.json(pkg)
  } catch {
    return NextResponse.json({ error: 'Lỗi' }, { status: 500 })
  }
}
