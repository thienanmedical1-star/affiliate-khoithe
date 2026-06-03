import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, signToken, hashPassword } from '@/lib/auth'
import speakeasy from 'speakeasy'
import { createAuditLog } from '@/lib/audit'

export async function POST(req: NextRequest) {
  try {
    const { username, password, totpCode } = await req.json()

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Sai tên đăng nhập hoặc mật khẩu' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Sai tên đăng nhập hoặc mật khẩu' }, { status: 401 })
    }

    // 2FA check
    if (user.twoFactorEnabled) {
      if (!totpCode) {
        return NextResponse.json({ requiresTOTP: true }, { status: 200 })
      }
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: totpCode,
        window: 1,
      })
      if (!verified) {
        return NextResponse.json({ error: 'Mã xác thực không đúng' }, { status: 401 })
      }
    }

    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    })

    await createAuditLog({ userId: user.id, action: 'LOGIN', target: user.username })

    const res = NextResponse.json({ success: true, role: user.role, name: user.name })
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
