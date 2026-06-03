import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const packages = await prisma.package.findMany({ orderBy: { price: 'asc' } })
  return NextResponse.json(packages)
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { name, price } = await req.json()
    const pkg = await prisma.package.create({ data: { name, price: Number(price) } })
    return NextResponse.json(pkg)
  } catch {
    return NextResponse.json({ error: 'Lỗi' }, { status: 500 })
  }
}
