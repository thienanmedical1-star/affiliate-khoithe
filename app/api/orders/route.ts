import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, getSession } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const where = session.role === 'AFFILIATE' ? { affiliateId: session.userId } : {}
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        affiliate: { select: { name: true, affiliateCode: true } },
        package: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders)
  } catch {
    return NextResponse.json({ error: 'Lỗi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const { customerId, packageId, price, customPrice, customPriceNote } = await req.json()

    const customer = await prisma.customer.findUnique({ where: { id: customerId }, include: { affiliate: true } })
    if (!customer) return NextResponse.json({ error: 'Không tìm thấy khách' }, { status: 404 })

    const commissionRate = customer.affiliate.commission
    const finalPrice = Number(price)
    const commission = finalPrice * (commissionRate / 100)

    const order = await prisma.order.create({
      data: {
        customerId,
        affiliateId: customer.affiliateId,
        packageId: packageId || null,
        price: finalPrice,
        customPrice: !!customPrice,
        customPriceNote,
        commission,
        commissionRate,
        paymentStatus: 'UNPAID',
      },
      include: { customer: true, package: true, affiliate: true },
    })

    await createAuditLog({
      orderId: order.id,
      customerId,
      action: 'CREATE_ORDER',
      target: order.id,
      newValue: `${finalPrice} - ${commissionRate}%`,
    })

    return NextResponse.json(order)
  } catch (e: any) {
    return NextResponse.json({ error: 'Lỗi: ' + e.message }, { status: 500 })
  }
}
