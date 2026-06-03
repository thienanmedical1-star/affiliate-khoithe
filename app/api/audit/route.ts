import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const where = session.role === 'AFFILIATE' ? { userId: session.userId } : {}
  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(logs)
}
