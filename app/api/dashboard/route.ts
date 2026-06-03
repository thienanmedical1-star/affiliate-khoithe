import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (session.role === 'ADMIN') {
    const [customers, orders, affiliates, payments] = await Promise.all([
      prisma.customer.count(),
      prisma.order.findMany({ include: { affiliate: { select: { name: true, affiliateCode: true } } } }),
      prisma.user.findMany({
        where: { role: 'AFFILIATE' },
        include: {
          orders: true,
          customers: true,
          commissionPayments: true,
        },
      }),
      prisma.commissionPayment.findMany(),
    ])

    const totalRevenue = orders.filter(o => o.paymentStatus === 'PAID').reduce((s, o) => s + o.price, 0)
    const totalCommission = orders.filter(o => o.paymentStatus === 'PAID').reduce((s, o) => s + o.commission, 0)
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0)

    return NextResponse.json({
      totalCustomers: customers,
      totalOrders: orders.length,
      paidOrders: orders.filter(o => o.paymentStatus === 'PAID').length,
      unpaidOrders: orders.filter(o => o.paymentStatus === 'UNPAID').length,
      totalRevenue,
      totalCommission,
      totalPaid,
      remaining: totalCommission - totalPaid,
      affiliates: affiliates.map(a => ({
        id: a.id,
        name: a.name,
        affiliateCode: a.affiliateCode,
        commission: a.commission,
        totalCustomers: a.customers.length,
        paidOrders: a.orders.filter(o => o.paymentStatus === 'PAID').length,
        revenue: a.orders.filter(o => o.paymentStatus === 'PAID').reduce((s, o) => s + o.price, 0),
        totalCommission: a.orders.filter(o => o.paymentStatus === 'PAID').reduce((s, o) => s + o.commission, 0),
        paidCommission: a.commissionPayments.reduce((s, p) => s + p.amount, 0),
      })),
    })
  }

  // Affiliate dashboard
  const [customers, orders, payments] = await Promise.all([
    prisma.customer.findMany({ where: { affiliateId: session.userId } }),
    prisma.order.findMany({ where: { affiliateId: session.userId }, include: { customer: true, package: true } }),
    prisma.commissionPayment.findMany({ where: { affiliateId: session.userId } }),
  ])

  const affiliate = await prisma.user.findUnique({ where: { id: session.userId } })
  const paidOrders = orders.filter(o => o.paymentStatus === 'PAID')
  const totalRevenue = paidOrders.reduce((s, o) => s + o.price, 0)
  const totalCommission = paidOrders.reduce((s, o) => s + o.commission, 0)
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)

  return NextResponse.json({
    name: session.name,
    commissionRate: affiliate?.commission,
    totalCustomers: customers.length,
    paidOrders: paidOrders.length,
    unpaidOrders: orders.filter(o => o.paymentStatus === 'UNPAID').length,
    totalRevenue,
    totalCommission,
    totalPaid,
    remaining: totalCommission - totalPaid,
    orders,
  })
}
