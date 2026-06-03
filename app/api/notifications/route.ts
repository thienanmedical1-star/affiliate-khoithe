import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })
  return NextResponse.json(notifications)
}

export async function PUT() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.notification.updateMany({
    where: { userId: session.userId, isRead: false },
    data: { isRead: true },
  })
  return NextResponse.json({ success: true })
}
