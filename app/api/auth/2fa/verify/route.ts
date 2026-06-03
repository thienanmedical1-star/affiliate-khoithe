import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import speakeasy from 'speakeasy'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { token } = await req.json()
  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user?.twoFactorSecret) return NextResponse.json({ error: 'No secret' }, { status: 400 })

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 1,
  })
  if (!verified) return NextResponse.json({ error: 'Mã không đúng' }, { status: 400 })

  await prisma.user.update({ where: { id: session.userId }, data: { twoFactorEnabled: true } })
  return NextResponse.json({ success: true })
}
