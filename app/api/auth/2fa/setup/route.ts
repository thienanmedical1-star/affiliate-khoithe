import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const secret = speakeasy.generateSecret({ name: `KhoiThe (${session.username})`, length: 32 })
  await prisma.user.update({
    where: { id: session.userId },
    data: { twoFactorSecret: secret.base32, twoFactorEnabled: false },
  })

  const qrCode = await QRCode.toDataURL(secret.otpauth_url!)
  return NextResponse.json({ qrCode, secret: secret.base32 })
}
