import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { sendNotification } from '@/lib/pusher'

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-webhook-secret')
    if (secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { customers } = await req.json()
    let added = 0
    let skipped = 0
    const errors: string[] = []

    for (const row of customers) {
      const { name, phone, email, affiliateCode, registeredAt } = row
      if (!phone) { errors.push(`Thiếu SĐT: ${name}`); continue }
      if (!affiliateCode) { errors.push(`Thiếu mã affiliate: ${name}`); continue }

      const affiliate = await prisma.user.findUnique({ where: { affiliateCode } })
      if (!affiliate) { errors.push(`Không tìm thấy affiliate: ${affiliateCode}`); continue }

      const existing = await prisma.customer.findFirst({ where: { phone } })
      if (existing) { skipped++; continue }

      const customer = await prisma.customer.create({
        data: {
          name, phone, email,
          affiliateId: affiliate.id,
          registeredAt: registeredAt ? new Date(registeredAt) : new Date(),
        },
      })

      await sendNotification(affiliate.id, {
        title: 'Khách hàng mới',
        message: `${name} vừa đăng ký`,
        type: 'customer',
      })

      // Notify admin
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
      for (const admin of admins) {
        await sendNotification(admin.id, {
          title: 'Khách mới từ Sheet',
          message: `${name} - ${affiliate.name}`,
          type: 'sync',
        })
      }

      added++
    }

    await createAuditLog({ action: 'SYNC_SHEET', newValue: `+${added} khách`, note: errors.join(', ') || undefined })

    return NextResponse.json({ added, skipped, errors })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
